# Sector 16 native istemci — 5 Ekim 2026

Unity projesi: `D:\Codex\Sector16-audit-20260922\github\unity-client`.
Dal: `codex/unity-crossplay-client`. GitHub `ed6b74a` (2.2.0) yerel çalışmaya alındı; canlı sunucu bu tarihte hâlâ 2.1.0 bildiriyor.

## Hazırlanan uygulama kodu

Oyun, Unity kamera/mesh/UI/dokunma sistemleriyle çizilir. Mevcut Node sunucusunun `/ws` protokolü kullanılır. Oda listesi, hızlı katılma, şifreli oda, özel oda, antrenman, hareket/nişan/ateş, yeniden doldurma, silah değiştirme, dürbün, zıplama, eğilme, koşma, bomba kurma/imha, el bombası, sağlık kiti, alışveriş, skor ve raund izleme kodu mevcut.

Yedi haritanın 471 çarpışma kutusu ve dokuz silah `shared/` kaynaklarından aktarılır. Oyuncu hareketi Unity fizik motoruyla değiştirilmez: sunucunun hareket kodunun C# karşılığı kullanılır; sunucu onayı geldiğinde bekleyen girdiler tekrar uygulanır. Z ekseni yalnızca çizim sırasında Unity koordinatına çevrilir.

Joystick, kamera ve ateş ayrı pointer kimliklerini tutar. Ateş düğmesinden sürükleyerek nişan alınabilir. Duraklatma, ölüm, odak kaybı ve ekran değişiminde kontrol durumu temizlenir. Dürbün AWP'de 4×/8×; diğer silahlarda yakın nişan ve varsa 2× eklenti kullanır. iOS safe area ve iki yatay yön desteklenir. Bu native ekranda tarayıcı yakınlaştırma hareketi bulunmaz.

Görseller mevcut geometrinin basit karşılıklarıdır. Tam görsel/animasyon/ses eşliği ve mobil performans ayarı bitmiş değildir. Kodun bulunması, Unity'de bütün özelliklerin oynanarak doğrulandığı anlamına gelmez.

## Doğrulananlar

- 35 referans hareket senaryosu, 280 kontrol noktası: C# ve JavaScript tüm hareket alanlarında `1e-8` toleransı içinde eşleşir.
- İki C# WebSocket istemcisi, ayrı yerel sunucuda aynı odaya katılır; birbirini, sunucunun onayladığı hareketi ve ateşi görür; ayrılma doğrulanır. Bu test Unity sahnesi veya gerçek tarayıcı ile fiziksel cihaz testi değildir.
- C# 9 sözdizimi kontrolü geçti. Unity API derlemesi ayrıca gerekli.
- Güncel kaynakların 45 oyun testi geçti; mevcut Capacitor mobil paket oluşturuldu; tarayıcı dokunma testleri geçti.
- Codemagic YAML resmi JSON şemasıyla doğrulandı. Native iş akışı çalıştırılmadı.

## Şu anki engel

Bu bilgisayarda Unity CLI ve Personal lisans kaydı var, ancak `6000.6.2f1` editör klasörü boş. Unity kurucusu ve Unity CLI ile kurulum `INSTALL_ERROR` / çıkış kodu 2 verdi. Bu yüzden native sahne derlemesi, `NativeChecks.Run`, Windows oyun paketi ve iOS dışa aktarımı henüz çalıştırılamadı. MSI arşiv çıkarma teşhis komutu otomatik onay denetimi tarafından engellendi; alternatif bir arşiv aracı kurulmadı.

Unity Hub'dan editör kurulumunu tamamlamak veya çalışan başka bir editörün yolunu belirlemek gerekir. Editör ve iOS Build Support kurulduğunda sıradaki işlem aşağıdaki kontrollerdir.

## Yerel çalışma

Repo kökünden:

```powershell
npm run export:unity
npm run check:unity-core
```

Unity Hub'da bu klasörü proje olarak ekle. Editör sürümü `6000.6.2f1`, Input System `1.14.2`. Editörde `Sector 16 > Prepare native project` seçeneği boş giriş sahnesi ve uygulama ayarlarını oluşturur. Play ile native uygulama başlar. Girdi sistemi değişikliği için Unity yeniden başlatma isterse yeniden başlat.

Editör kurulumu tamamlandıktan sonra kontrol:

```powershell
$sector16Editor='D:\unity\6000.6.2f1\Editor\Unity.exe'
& $sector16Editor -batchmode -quit -projectPath "$PWD\unity-client" -executeMethod Sector16.Editor.NativeChecks.Run -logFile "$PWD\artifacts\unity-checks.log"
```

Windows önizlemesi için `SECTOR16_VERSION` ve `SECTOR16_BUILD_NUMBER` ayarla, ardından `Sector16.Editor.NativeBuild.Windows` metodunu çalıştır. Çıktı `artifacts/unity-windows/Sector16.exe` olur. Yerel sunucuya karşı test etmek için oyuna `--sector16-server http://127.0.0.1:3000` argümanı ver; aynı sunucuyu webde açıp diğer oyuncuyla katıl.

## Mevcut App Store uygulamasına güncelleme

Bundle kimliği `com.webdehasi.sector16` olarak korunur. Yeni bir Apple uygulama kaydı açılmaz. Sürüm ve yapı numarasını mevcut App Store/TestFlight kayıtlarından kontrol ederek daha yeni ve kullanılmamış değerleri seç.

1. Editörde iOS Build Support kurulu olmalı. `SECTOR16_VERSION` ve `SECTOR16_BUILD_NUMBER` ile `Sector16.Editor.NativeBuild.IOS` çalıştır. Unity kontrolü ve başarılı build sonrası `build/unity-ios` ve `sector16-export.json` oluşur.
2. Repo kökünden `pwsh -File scripts/package-unity-ios.ps1` çalıştır. Çıktı `artifacts/sector16-unity-ios.zip` olur.
3. Kendi özel dosya depolamanda bu arşiv için Codemagic build süresince geçerli HTTPS indirme bağlantısı oluştur. Bağlantıyı Git'e yazma. Codemagic'te `unity_export` grubunda secret `UNITY_IOS_EXPORT_URL` olarak tanımla.
4. `ios-unity-export-upload` iş akışını seç. Bu akış mevcut `KiraClubs` Apple entegrasyonu ile Unity Xcode projesini imzalar ve App Store Connect'e yükler. Otomatik beta incelemesi veya App Store incelemesi başlatmaz.
5. TestFlight'ta gerçek iPhone/iPad ve web oyuncusuyla aynı odada oynanışı doğrula. Sonra App Store güncellemesini incelemeye gönder.

Bu akış Unity dışa aktarımını yerelde yapar; Codemagic yalnızca Xcode çıktısını derler. Codemagic üzerinde Unity editörünü çalıştıran alternatif yol ayrıca uygun Unity CI lisansını gerektirir: [Codemagic Unity kılavuzu](https://docs.codemagic.io/yaml-quick-start/building-a-unity-app/).

Canlı sunucuya bu dal dağıtılmadı; iOS paketi App Store Connect'e yüklenmedi. Görsel/animasyon eşliği, fiziksel cihaz performansı ve dokunma yerleşimi ölçümleri tamamlanmadan bu proje yayın sürümü sayılmaz.
