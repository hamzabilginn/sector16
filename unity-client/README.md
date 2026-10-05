# Sector 16 native mobil istemci

Unity projesi `unity-client`, çalışma dalı `codex/unity-crossplay-client`.
Editör `6000.6.2f1`, Input System `1.20.0`, uGUI `2.6.0`.
Bu bilgisayarda proje ve Unity D: üzerindedir. `scripts/unity-on-d.ps1`, başlattığı işlemin geçici dosyalarını ve paket önbelleğini de D: üzerinde tutar.

## Mobil görünüm ve kontroller

Lobi; oyuncu adı, hızlı oynama, oda oluşturma, antrenman ve kaydırılabilen canlı oda listesini içerir. Web oyununun kendi üreticilerinden yedi harita, iki takım karakteri, dokuz silah, 182 geometri, 121 malzeme ve 25 doku aktarılır. Stil mevcut web oyununun stilidir; fotoğraf gerçekliğinde bir varlık paketi değildir.

Haritalar static batching kullanır. Karakter ve silah parçaları hareket eden eklemler korunarak aynı malzemeye göre birleştirilir ve mesh/malzeme önbelleğine alınır. Yürüyüş, eğilme, silah salınımı, geri tepme, şarjör/kol hareketi, yakın nişan, AWP 4×/8× dürbünü, sis ve yönlü gölge çizimi bulunur. Sesler yerelde sentezlenen küçük kliplerdir: kendi ve uzaktaki atış, adım, doldurma, isabet, hasar ve patlama.

Kullanıcının isteğiyle mobil **zıpla/eğil düğmeleri kaldırıldı**. Ortak sunucu fiziği ve masaüstü klavye kısayolları korunur.

- Sol joystick: hareket; dış kenara itilince koşma.
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
- Unity kontrol testi: JSON, koordinat/nişan, bağımsız ateş/kamera parmakları, pointer sahipliği, sıfırlama, ölüm, duraklatma, tek seferlik HUD doldurma, silah değiştirme, bıçak/menü kısıtları.
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
powershell -NoProfile -File scripts/unity-on-d.ps1 -Mode Windows -Version 1.1 -BuildNumber 21
```

Windows çıktısı `artifacts/unity-windows/Sector16.exe`. Yanındaki `Sector16_Data`, `UnityPlayer.dll` ve diğer dosyalar birlikte tutulmalıdır. Yerel ortak oyun testi için `--sector16-server http://127.0.0.1:3000` argümanını kullan; web oyuncusunu da aynı Node sunucusuna bağla.

Editörü açmak için `powershell -NoProfile -File scripts/unity-on-d.ps1 -Mode Editor`. `Preview` internet bağlantısı kurmaz, fiziksel cihazı taklit etmez ve yayın için ekran görüntüsü üretmez.

## App Store güncellemesi

App Store'da kullanıcı ekranındaki sürüm 1.0, en yüksek build 19 idi. İlk görsel prototip 1.1 (20) olarak dışa aktarılmıştı; kullanıcı onun Codemagic derlemesini iptal etti. Yeniden tasarlanan istemci için **1.1 (21)** ayrıldı. Başka bir yükleme yapıldıysa sonraki derlemede kullanılmamış daha yüksek build seçilmelidir.

```powershell
powershell -NoProfile -File scripts/unity-on-d.ps1 -Mode IOS -Version 1.1 -BuildNumber 21
powershell -NoProfile -File scripts/package-unity-ios.ps1
```

Çıktı `build/unity-ios`, arşiv `artifacts/sector16-unity-ios.zip`. `sector16-export.json` bundle/sürüm/build, kontrol sonucu ve `presentationRevision` içerir. Paketleme ve Codemagic önceki görsel prototipi reddeder; eski bağlantıyla yanlış istemci derlenmez.

1. Güncel arşiv için özel depoda geçerli HTTPS indirme bağlantısı hazırlanır; bağlantı Git'e yazılmaz.
2. Codemagic `unity_export` grubundaki secret `UNITY_IOS_EXPORT_URL` yeni bağlantıyla güncellenir. Eski build 20 bağlantısı kullanılamaz.
3. Dal `codex/unity-crossplay-client`, iş akışı **Sector 16 Native Unity - exported Xcode project** seçilir.
4. Codemagic Apple entegrasyonu ile Xcode çıktısını imzalar ve App Store Connect'e yükler; otomatik App Review başlatmaz.
5. TestFlight ile fiziksel iPhone/iPad ve gerçek web oyuncusuyla oynanış doğrulanır; sonra güncelleme incelemeye gönderilir.

Bu dal canlı web sunucusuna dağıtılmaz. Yerel iOS dışa aktarımı imzalı IPA, TestFlight yüklemesi veya Apple onayı anlamına gelmez.
