# Sector 16 native mobil istemci

Unity projesi `unity-client`, çalışma dalı `codex/unity-crossplay-client`.
Editör `6000.6.2f1`, Input System `1.20.0`, uGUI `2.6.0`.
Bu bilgisayarda proje ve Unity D: üzerindedir. `scripts/unity-on-d.ps1`, başlattığı işlemin geçici dosyalarını ve paket önbelleğini de D: üzerinde tutar.

## Mobil görünüm ve kontroller

Lobi; oyuncu adı, hızlı oynama, oda oluşturma, antrenman ve kaydırılabilen canlı oda listesini içerir. Web oyununun kendi üreticilerinden yedi harita, iki takım karakteri, dokuz silah, 182 geometri, 121 malzeme ve 25 doku aktarılır. Stil mevcut web oyununun stilidir; fotoğraf gerçekliğinde bir varlık paketi değildir.

Haritalar static batching kullanır. Karakter ve silah parçaları hareket eden eklemler korunarak aynı malzemeye göre birleştirilir ve mesh/malzeme önbelleğine alınır. Yürüyüş, eğilme, silah salınımı, geri tepme, şarjör/kol hareketi, yakın nişan, AWP 4×/8× dürbünü, sis ve yönlü gölge çizimi bulunur. Sesler yerelde sentezlenen küçük kliplerdir: kendi ve uzaktaki atış, adım, doldurma, isabet, hasar ve patlama.

Kullanıcının isteğiyle mobil **zıpla/eğil düğmeleri kaldırıldı**. Ortak sunucu fiziği ve masaüstü klavye kısayolları korunur.

- Sol joystick: basılı tutup sürükleyerek hareket; dış kenara itilince koşma. Build 22, görünür joystick panelinin dokunmaları almamasını giderir.
- Sağ: ateş ve nişan. Ateş parmağıyla sürükleyerek kamera da çevrilebilir.
- Cephane göstergesine dokunma: doldurma. Şarjör boşalınca yedek mermi varsa otomatik doldurma istenir.
- Silah adına dokunma: eldeki silahlar arasında geçiş.
- Sol üst para / **Satın Al**: alışveriş. Menü ve Teçhizat panelinde de bulunur. Sunucu yalnızca oyuncu kendi üssündeyken izin verir.
- Sol alt **Teçhizat**: patlayıcı, sis ve flaş bombası, sağlık kiti, alışveriş, skor; kullanıldıktan sonra kapanır. Her bomba türünün sunucudan gelen kendi envanteri kullanılır.
- Bomba kurma/imha kontrolü yalnızca ilgili modda görünür.
- **Menü → Oyun Ayarları**: hassasiyet, ses, görüş açısı, Dengeli/Performans grafikleri. Performans gölgeleri ve MSAA'yı kapatır. Gerçek cihazda FPS ölçümü yapılmadı.

Joystick, kamera ve ateş ayrı pointer kimliklerini tutar. Ölüm, menü, odak kaybı ve ekran değişiminde tutulmuş girdiler temizlenir. iOS güvenli alanı ve iki yatay yön desteklenir; arayüz kullanılabilir genişliğe göre ölçeklenir. Tarayıcı zoom hareketi bulunmaz.

Barlow / Barlow Condensed Google Fonts kaynaklarından alınmıştır; SIL Open Font License dosyaları `Assets/Resources/Fonts` içindedir. `@napi-rs/canvas` yalnızca geliştirme sırasında art üretimi için kullanılır. Uygulama çalışma sırasında görsel veya font indirmez.

## Ortak çevrimiçi oyun

Mevcut Node sunucusunun `/ws` protokolü ve `com.webdehasi.sector16` bundle kimliği korunur. Hareket, çarpışma, silah ve hasar sunucuyla uyumludur; sunucu onayında bekleyen hareketler yeniden uygulanır. Z ekseni yalnızca Unity çizimine çevrilir.

Canlı sunucunun son doğrulanan sürümü 2.1.0, bu dalın web kaynağı 2.2.0'dır. Canlı yedekteki mevcut altı haritanın çarpışma kutuları, silahlar ve hareket simülasyonu bu kaynaklarla eşleşir. Ek `depot` haritası 2.2.0'a aittir; istemci sunucunun sunduğu odalara bağlanır.

## Doğrulama

- 45 JavaScript oyun testi geçti.
- C# hareket karşılaştırması: 35 senaryo, 280 kontrol noktası, bütün hareket alanları `1e-8` toleransında eşleşti.
- İki C# WebSocket istemcisi ayrı yerel Node sunucusunda aynı oda, ortak durum, sunucunun onayladığı hareket/ateş ve ayrılma testlerini geçti.
- Unity kontrol testi: JSON, koordinat/nişan, HUD üzerinden gerçek UI raycast ile joystick'e ulaşma, dört yönde sürüklemenin sunucu girdisine dönüşmesi, bırakınca durma, bağımsız ateş/kamera parmakları, pointer sahipliği, sıfırlama, ölüm, duraklatma, tek seferlik HUD doldurma, silah değiştirme, bıçak/menü kısıtları. Joystick raycast testi düzeltmeden önce başarısız olur.
- Unity kamera/UI çizimiyle telefon ve iPad oranlarında lobi, oyun, Teçhizat, satın alma, ayarlar, yakın nişan ve dürbün görüntüleri üretildi ve görsel olarak kontrol edildi.
- Art üretimi tekrar çalıştırılınca aynı JSON özeti oluşur.

`artifacts/native-preview` gerçek Unity çizimleridir fakat **çevrimdışı örnek oda/oyuncu verisi** kullanır. Gerçek çevrimiçi maç veya fiziksel iPhone testinin kanıtı değildir. Windows ve iOS dışa aktarım logları `artifacts/unity-windows.log`, `artifacts/unity-ios.log` dosyalarıdır; başarı ilgili logda doğrulanır.

Fiziksel iPhone/iPad dokunma, ses, ısınma/FPS ve gerçek web oyuncusuyla aynı odada oynanış testi yayın öncesinde yapılmalıdır. Protokol testi fiziksel cihaz testinin yerine geçmez.

## Çalıştırma ve derleme

Repo kökünden:

```powershell
npm ci
npm run export:unity
npm run export:unity-art
npm run check:unity-core
powershell -NoProfile -File scripts/unity-on-d.ps1 -Mode Preview
powershell -NoProfile -File scripts/unity-on-d.ps1 -Mode Windows -Version 1.1 -BuildNumber 22
```

Windows çıktısı `artifacts/unity-windows/Sector16.exe`. Yanındaki `Sector16_Data`, `UnityPlayer.dll` ve diğer dosyalar birlikte tutulmalıdır. Yerel ortak oyun testi için `--sector16-server http://127.0.0.1:3000` argümanını kullan; web oyuncusunu da aynı Node sunucusuna bağla.

Editörü açmak için `powershell -NoProfile -File scripts/unity-on-d.ps1 -Mode Editor`. `Preview` internet bağlantısı kurmaz, fiziksel cihazı taklit etmez ve yayın için ekran görüntüsü üretmez.

## App Store güncellemesi

App Store'da kullanıcı ekranındaki sürüm 1.0 idi. Yeniden tasarlanan **1.1 (21)** App Store Connect'e yüklendi ve kullanıcı incelemeye gönderdi. Fiziksel mobil testte joystick'in dokunmaları almadığı bildirildi. Bu düzeltme için **1.1 (22)** ayrıldı. Başka bir yükleme yapıldıysa sonraki derlemede kullanılmamış daha yüksek build seçilmelidir.

```powershell
powershell -NoProfile -File scripts/unity-on-d.ps1 -Mode IOS -Version 1.1 -BuildNumber 22
powershell -NoProfile -File scripts/package-unity-ios.ps1
```

Çıktı `build/unity-ios`, arşiv `artifacts/sector16-unity-ios.zip`. `sector16-export.json` bundle/sürüm/build, kontrol sonucu ve `presentationRevision` içerir. Paketleme ve Codemagic joystick düzeltmesini içermeyen önceki dışa aktarımları reddeder; eski bağlantıyla yanlış istemci derlenmez.

1. Güncel arşiv için özel depoda geçerli HTTPS indirme bağlantısı hazırlanır; bağlantı Git'e yazılmaz.
2. Codemagic `unity_export` grubundaki secret `UNITY_IOS_EXPORT_URL` yeni bağlantıyla güncellenir. Önceki build 21 bağlantısı kullanılamaz.
3. Dal `codex/unity-crossplay-client`, iş akışı **Sector 16 Native Unity - exported Xcode project** seçilir.
4. Codemagic Apple entegrasyonu ile Xcode çıktısını imzalar ve App Store Connect'e yükler; otomatik App Review başlatmaz.
5. TestFlight ile fiziksel iPhone/iPad ve gerçek web oyuncusuyla oynanış doğrulanır; sonra güncelleme incelemeye gönderilir.

Bu dal canlı web sunucusuna dağıtılmaz. Yerel iOS dışa aktarımı imzalı IPA, TestFlight yüklemesi veya Apple onayı anlamına gelmez.

## Google Play güncellemesi

Play Console'da mevcut üretim paketi **1.5.0 (version code 1)** görünüyordu. Aynı Unity istemcisi, mobil arayüz ve joystick düzeltmesi Android için **1.6.0 (23)** olarak hazırlanır. Paket kimliği `com.webdehasi.sector16` korunur; yeni uygulama kaydı açılmaz. Başka bir kanalda daha yüksek kod kullanıldıysa kullanılmamış daha yüksek bir kod gerekir.

Unity 6.6 Android Build Support, SDK/API 36, NDK r27c ve OpenJDK 17 modülleri gerekir. Android 8/API 26 ve üzeri, ARMv7 + ARM64, IL2CPP ve ETC2 seçilir. Önceki web paketi API 24 destekliyordu; yeni Unity paketinin minimumu 26'dır. Kod, paket verisi ve Gradle/Bee önbelleği D: üzerinde tutulur.

```powershell
powershell -NoProfile -File scripts/unity-on-d.ps1 -Mode Android -Version 1.6.0 -BuildNumber 23
powershell -NoProfile -File scripts/package-unity-android.ps1
```

Unity `artifacts/unity-android/Sector16.aab` ve kontrol sonucunu içeren metadata üretir. Paketleme, yerel JAR imzasını kaldırır; uygulama içeriği değişmez. `artifacts/sector16-unity-android.zip` yalnızca imzasız AAB ve SHA-256 içeren metadata taşır. Google Play'e bu imzasız dosya yüklenmez.

1. ZIP özel depoya yüklenir. HTTPS bağlantısı, Codemagic `unity_export` grubuna **secret `UNITY_ANDROID_EXPORT_URL`** olarak eklenir; `UNITY_IOS_EXPORT_URL` ayrı kalır.
2. Dal **codex/unity-crossplay-client**, iş akışı **Sector 16 Native Unity - Android AAB** seçilir. **Sector 16 Android AAB** önceki Capacitor istemcisini derler.
3. Yeni iş akışı ZIP'i doğrular; gerçek AAB manifestinde paket, sürüm, SDK düzeyleri, release modu ve internet iznini kontrol eder. ARMv7/ARM64 native kitaplıkları ve ARM64 16 KB ELF hizalaması da doğrulanır. Resmi bundletool 1.18.3 SHA-256 ile sabitlenir.
4. Codemagic mevcut **sector16_upload** anahtarını kullanır. Anahtar ve parolalar repo/arşive eklenmez; JAR imzalama aracı parolaları ortam değişkenlerinden okur. Unity lisansı bu imzalama adımı için gerekmez.
5. Codemagic Artifacts'tan **sector16-native-1.6.0-23.aab** indirilir. Fiziksel Android cihazında hareket, çoklu dokunma ve gerçek web/iOS oyuncusuyla aynı oda doğrulanır.
6. Mevcut Play Console uygulamasında üretim güncellemesine bu AAB yüklenir. Sürüm adı **1.6.0**, Türkçe sürüm notları girilir; sonraki ekranda hatalar giderilip Yayın özeti üzerinden incelemeye gönderilir. Eski **1 (1.5.0)** paketini “Dahil et” seçmek yeni native güncellemeyi yüklemez.

Bu iş akışı Google Play'e otomatik yayın yapmaz. Yerel paket ve imza kontrolleri fiziksel Android oynanış testi veya Google onayı anlamına gelmez.
