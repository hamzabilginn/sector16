# Sector 16 — Mobil yayın

Paket / bundle ID: `com.webdehasi.sector16`. Sürüm: 1.5.0. Android ilk versionCode: 1.
Destek: hazarkal333@gmail.com.

## Neden Capacitor?

Mevcut Three.js oyunu için Capacitor 8 seçildi: oyun kodu ve varlıkları uygulamaya paketlenir; dokunma, titreşim, yön ve uygulama yaşam döngüsü yerel Android/iOS kabuğuna bağlanır. Sunucu yalnızca çevrimiçi maçları yürütür. `server.url` ile uzak web sayfası yüklenmez. Bu tam bir Unity/Unreal veya Swift/Kotlin oyun motoru dönüşümü değildir; böyle bir dönüşüm mevcut oyunun yeniden yazılmasını gerektirir. Gerçek cihaz performansı WebView, GPU ve ağ kalitesine bağlıdır.

Kaynaklar: [Capacitor](https://capacitorjs.com/docs), [Capacitor yapılandırması](https://capacitorjs.com/docs/config).

## Google Play

1. Play Console'da yeni oyun oluşturun; uygulama adı Sector 16, kategori Aksiyon. Kimlik/doğrulama ve geliştirici iletişim alanlarına kendi gerçek yayıncı bilgilerinizi girin.
2. İlk AAB'yi önce dahili teste yükleyin ve Play App Signing'i etkinleştirin. Bu projedeki anahtar yükleme anahtarıdır. `release-secrets` klasörünü güvenli yedekleyin; Git'e yüklemeyin. Güncellemeler aynı paket adı ve artan versionCode kullanmalıdır.
3. Veri güvenliği, hedef kitle, içerik derecelendirmesi ve gizlilik URL'sini doldurun. Silahlı çatışma ve ölüm efektlerini derecelendirme anketinde doğru beyan edin; çocuklara yönelik olarak tanıtmayın. Nihai derecelendirmeyi mağaza anketi belirler.
4. Reklam yok, uygulama içi gerçek para satın alımı yok, hesap açma yok. Oyun internet bağlantısı ister. İnceleme için giriş şifresi gerekmez: oyuncu adı yazıp hızlı oynama veya botsuz/botlu oda oluşturma kullanılabilir.
5. Yeni kişisel geliştirici hesabınız test şartına tabi ise en az 12 test kullanıcısı ile kesintisiz 14 günlük kapalı test ve ardından üretim erişimi başvurusu gerekir. Dahili test bu koşulun yerini tutmaz.
6. Ön lansman raporunu inceleyin; telefon ve tabletlerde kontrol/performans testlerini tamamlayın. Sonrasında üretim incelemesine gönderin. AAB'nin teknik olarak geçerli olması mağaza kabulünü garanti etmez.

API 36 hedeflenmiştir: [Google Play API şartı](https://developer.android.com/google/play/requirements/target-sdk).
[Test şartları](https://support.google.com/googleplay/android-developer/answer/14151465).
[16 KB sayfa desteği](https://developer.android.com/guide/practices/page-sizes).

## Gizlilik / veri güvenliği hazırlığı

Yayınlanacak sayfa: `https://sector16.18.185.7.35.sslip.io/privacy.html` (canlı erişimini yayın öncesi doğrulayın).
Oyuncu adı ve oda adı kullanıcı tarafından girilir, diğer oyunculara görünür. Maç konumu/skoru sunucuya aktarılır. IP adresi bağlantı güvenliği için sunucuda işlenir. İsim ve cihaz tercihleri yerelde saklanır. Reklam/analiz SDK'sı veya kalıcı hesap sistemi yoktur. Destek e-postası gönderilirse e-posta sağlayıcısı da talebi işler.

Veri güvenliği beyanını yalnızca “veri toplanmıyor” olarak işaretlemeyin: kullanıcı tarafından girilen ad/oda içeriği ve oyun etkinliği ağdan iletilir. Play Console'daki ilgili veri kategorileri, geçici işleme, hizmet sağlayıcı istisnaları ve zorunlu/isteğe bağlı alanları gerçek sunucu kayıt politikanızla karşılaştırın. AWS/ters vekil günlüklerine ek kayıt eklenirse politika ve beyanları güncelleyin. Yayıncı adı olarak kullanıcıdan resmi ad alınmadığı için hukuki kimlik uydurulmadı; mağazadaki doğrulanmış bilgilerle eşleştirin.
[Google kullanıcı verisi politikası](https://support.google.com/googleplay/android-developer/answer/10144311).

## Git ve Codemagic

Kaynak arşivinin içeriğini Git deposunun köküne koyun. `codemagic.yaml`, `package.json`, `android` ve `ios` aynı kökte bulunmalı. `node_modules`, `www`, yerel SDK yolu, derlemeler ve anahtarlar Git dışındadır. Git deposu: https://github.com/hamzabilginn/sector16.

Android için Codemagic Team settings → Code signing identities → Android keystores alanına `sector16-upload.jks` yükleyin. Reference name: `sector16_upload`. Şifre ve alias değerleri ayrı `release-secrets/signing.json` dosyasındadır. `android-release` akışı AAB/APK üretir; mağazaya otomatik göndermez.

iOS için Apple Developer üyeliği ve `com.webdehasi.sector16` App ID / App Store Connect kaydı gerekir. Codemagic'e bu uygulama için Apple Distribution sertifikası ve App Store provisioning profile ekleyin. Bunları Apple API entegrasyonu üzerinden de oluşturabilirsiniz. `ios-release` akışı Swift Package Manager kullanır; CocoaPods gerekmez. Güncel Xcode 26+ seçilir. `ios-upload` akışı için Codemagic Apple API entegrasyonunu `sector16_app_store` adıyla ekleyin. Bu akış IPA dosyasını App Store Connect’e yükler; mağaza veya beta incelemesini otomatik başlatmaz. İmzalı IPA üretildikten sonra TestFlight'ta gerçek iPhone/iPad testleri yapın ve App Store'a kendiniz gönderin. Windows üzerinde iOS derlemesi veya cihaz testi yapılmış sayılmaz.

[Codemagic iOS imzalama](https://docs.codemagic.io/yaml-code-signing/signing-ios/), [iOS derleme](https://docs.codemagic.io/yaml-quick-start/building-a-native-ios-app/), [Apple inceleme kuralları](https://developer.apple.com/app-store/review/guidelines/).

## Yerel derleme

Node 22+ (tercihen 24), JDK 21, Android SDK 36 gerekir. `npm ci`, `npm test`, `npm run sync:mobile` çalıştırın. Android SDK yolunu Git dışı `android/local.properties` dosyasına yazın. `SECTOR16_KEYSTORE`, `SECTOR16_STORE_PASSWORD`, `SECTOR16_KEY_PASSWORD`, `SECTOR16_KEY_ALIAS` ortam değişkenlerini güvenli olarak sağlayın. `android/gradlew -p android bundleRelease assembleRelease` çalıştırın. `BUILD_NUMBER` sonraki yayınlarda önceki koddan büyük olmalıdır.

Sunucu alan adı değişirse HTTPS adresiyle `SECTOR16_SERVER_URL` tanımlayıp yeniden derleyin. AWS anahtarları mobil uygulamada kullanılmaz.
