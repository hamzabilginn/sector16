"""Validate the native AAB, then sign it with Codemagic's existing upload key."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import struct
import subprocess
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
import zipfile

BUNDLETOOL_URL = 'https://github.com/google/bundletool/releases/download/1.18.3/bundletool-all-1.18.3.jar'
BUNDLETOOL_SHA256 = 'a099cfa1543f55593bc2ed16a70a7c67fe54b1747bb7301f37fdfd6d91028e29'
REVISION = 'mobile-joystick-fix-20261005'
ANDROID = '{http://schemas.android.com/apk/res/android}'


def download(url, destination):
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme != 'https' or not parsed.netloc or parsed.username or parsed.password:
        raise SystemExit('Set secret UNITY_ANDROID_EXPORT_URL in the unity_export group to the private Android export HTTPS URL.')
    try:
        with urllib.request.urlopen(url, timeout=120) as response, destination.open('wb') as output:
            shutil.copyfileobj(response, output)
    except urllib.error.HTTPError as error:
        raise SystemExit(f'Download failed with HTTP {error.code}. Refresh the export link if it has expired.') from None
    except (OSError, urllib.error.URLError):
        raise SystemExit('Download failed. Check the connection and the export link.') from None


def checksum(path):
    digest = hashlib.sha256()
    with path.open('rb') as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def unpack(archive, target):
    expected = {'sector16-export.json', 'sector16-unsigned.aab'}
    with zipfile.ZipFile(archive) as source:
        names = source.namelist()
        if len(names) != 2 or set(names) != expected:
            raise SystemExit('Expected only the unsigned native AAB and its export metadata.')
        for name in names:
            member = source.getinfo(name)
            if member.file_size > 2_000_000_000 or (name.endswith('.json') and member.file_size > 16384):
                raise SystemExit('Unexpected export size.')
            with source.open(member) as data, (target / name).open('wb') as output:
                shutil.copyfileobj(data, output)


def bundletool_validate(bundle, tool, java):
    result = subprocess.run([java, '-jar', str(tool), 'validate', '--bundle', str(bundle)], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    if result.returncode:
        raise SystemExit(result.stdout.strip() or 'bundletool validation failed.')


def validate(bundle, info, tool, java):
    if info.get('platform') != 'Android' or info.get('bundleIdentifier') != 'com.webdehasi.sector16':
        raise SystemExit('This is not a Sector 16 Android export.')
    if not info.get('controlChecksPassed') or info.get('presentationRevision') != REVISION:
        raise SystemExit('This export is missing the verified mobile joystick fix.')
    if info.get('minimumApi') != 26 or info.get('targetApi') != 36:
        raise SystemExit('Expected minimum API 26 and target API 36.')
    if checksum(bundle) != info.get('sha256'):
        raise SystemExit('Android bundle checksum does not match its export metadata.')
    with zipfile.ZipFile(bundle) as archive:
        if any(re.match(r'(?i)^META-INF/(MANIFEST\.MF|[^/]+\.(SF|RSA|DSA|EC)|SIG-[^/]+)$', n) for n in archive.namelist()):
            raise SystemExit('Expected an unsigned bundle before applying the Play upload signature.')
        for abi in ('arm64-v8a', 'armeabi-v7a'):
            for library in ('libil2cpp.so', 'libunity.so'):
                if f'base/lib/{abi}/{library}' not in archive.namelist():
                    raise SystemExit(f'Native library is missing: {abi}/{library}.')
        # Google Play requires 16 KB-compatible native libraries on 64-bit devices.
        for name in archive.namelist():
            if name.startswith('base/lib/arm64-v8a/') and name.endswith('.so'):
                data = archive.read(name)
                if data[:6] != b'\x7fELF\x02\x01':
                    raise SystemExit(f'Invalid ARM64 ELF library: {name}.')
                table = struct.unpack_from('<Q', data, 32)[0]
                size, count = struct.unpack_from('<HH', data, 54)
                for index in range(count):
                    kind, _, offset, address, _, _, _, alignment = struct.unpack_from('<IIQQQQQQ', data, table + size * index)
                    if kind == 1 and (alignment < 16384 or (address - offset) % 16384):
                        raise SystemExit(f'Library does not support 16 KB pages: {name}.')
    bundletool_validate(bundle, tool, java)
    manifest = subprocess.check_output([java, '-jar', str(tool), 'dump', 'manifest', '--bundle', str(bundle), '--module', 'base'], text=True)
    root = ET.fromstring(manifest)
    sdk = root.find('uses-sdk')
    application = root.find('application')
    if root.get('package') != info['bundleIdentifier'] or root.get(ANDROID + 'versionName') != info['version'] or root.get(ANDROID + 'versionCode') != str(info['build']):
        raise SystemExit('The compiled bundle package/version differs from its metadata.')
    if sdk is None or sdk.get(ANDROID + 'minSdkVersion') != '26' or sdk.get(ANDROID + 'targetSdkVersion') != '36':
        raise SystemExit('The compiled bundle SDK levels are incorrect.')
    if application is None or application.get(ANDROID + 'debuggable', 'false') != 'false':
        raise SystemExit('A release bundle is required; debuggable builds cannot be uploaded.')
    if not any(p.get(ANDROID + 'name') == 'android.permission.INTERNET' for p in root.findall('uses-permission')):
        raise SystemExit('Internet permission is required for crossplay.')
    print(f"Verified native Android {info['version']} ({info['build']}), mobile controls, both ARM architectures and 16 KB libraries.", flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive', help='Existing export ZIP, for local validation.')
    parser.add_argument('--target', default='build/unity-android')
    parser.add_argument('--bundletool')
    parser.add_argument('--java', default='java')
    parser.add_argument('--validate-only', action='store_true')
    args = parser.parse_args()
    target = Path(args.target).resolve()
    target.mkdir(parents=True, exist_ok=True)
    archive = Path(args.archive) if args.archive else target / 'native-export.zip'
    if not args.archive:
        download(os.environ.get('UNITY_ANDROID_EXPORT_URL', ''), archive)
    unpack(archive, target)
    info = json.loads((target / 'sector16-export.json').read_text(encoding='utf-8-sig'))
    tool = Path(args.bundletool) if args.bundletool else target / 'bundletool.jar'
    if not args.bundletool:
        download(BUNDLETOOL_URL, tool)
    if checksum(tool) != BUNDLETOOL_SHA256:
        raise SystemExit('bundletool checksum does not match the pinned official release.')
    bundle = target / 'sector16-unsigned.aab'
    validate(bundle, info, tool, args.java)
    if args.validate_only:
        return
    required = ('CM_KEYSTORE_PATH', 'CM_KEYSTORE_PASSWORD', 'CM_KEY_PASSWORD', 'CM_KEY_ALIAS')
    if any(not os.environ.get(key) for key in required):
        raise SystemExit('The existing sector16_upload keystore and its passwords must be available in Codemagic.')
    output = target / f"sector16-native-{info['version']}-{info['build']}.aab"
    shutil.copyfile(bundle, output)
    signer = str(Path(args.java).with_name('jarsigner.exe' if os.name == 'nt' else 'jarsigner')) if args.java != 'java' else 'jarsigner'
    # Passwords are read from environment variables, never command arguments or files.
    subprocess.run([signer, '-keystore', os.environ['CM_KEYSTORE_PATH'], '-storepass:env', 'CM_KEYSTORE_PASSWORD', '-keypass:env', 'CM_KEY_PASSWORD', '-digestalg', 'SHA-256', str(output), os.environ['CM_KEY_ALIAS']], check=True)
    result = subprocess.check_output([signer, '-verify', '-certs', str(output)], text=True, env={**os.environ, 'LC_ALL': 'C'})
    if 'jar verified.' not in result:
        raise SystemExit('Upload signature verification failed.')
    bundletool_validate(output, tool, args.java)
    print(f'Signed Android App Bundle is ready: {output.name}')


if __name__ == '__main__':
    main()
