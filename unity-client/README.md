# Sector 16 native istemci — 5 Ekim 2026

Unity projesi: `D:\Codex\Sector16-audit-20260922\github\unity-client`.
Dal: `codex/unity-crossplay-client`. GitHub `ed6b74a` (2.2.0) yerel çalışmaya alındı; canlı sunucu bu tarihte hâlâ 2.1.0 bildiriyor.

Çalışma `codex/unity-crossplay-client` dalında tutulur. Bu bilgisayardaki bozuk Git Credential Manager yerine D: üzerinde resmi taşınabilir sürüm kullanılır; GitHub erişimi kullanıcı tarafından yetkilendirildi. Ana dala birleştirme ve canlı dağıtım ayrıca yapılmalıdır.

## Hazırlanan uygulama kodu

Oyun, Unity kamera/mesh/UI/dokunma sistemleriyle çizilir. Mevcut Node sunucusunun `/ws` protokolü kullanılır. Oda listesi, hızlı katılma, şifreli oda, özel oda, antrenman, hareket/nişan/ateş, yeniden doldurma, silah değiştirme, dürbün, zıplama, eğilme, koşma, bomba kurma/imha, el bombası, sağlık kiti, alışveriş, skor ve raund izleme kodu mevcut.

Yedi haritanın 471 çarpışma kutusu ve dokuz silah `shared/` kaynaklarından aktarılır. Oyuncu hareketi Unity fizik motoruyla değiştirilmez: sunucunun hareket kodunun C# karşılığı kullanılır; sunucu onayı geldiğinde bekleyen girdiler tekrar uygulanır. Z ekseni yalnızca çizim sırasında Unity koordinatına çevrilir.

Joystick, kamera ve ateş ayrı pointer kimliklerini tutar. Ateş düğmesinden sürükleyerek nişan alınabilir. Duraklatma, ölüm, odak kaybı ve ekran değişiminde kontrol durumu temizlenir. Dürbün AWP'de 4×/8×; diğer silahlarda yakın nişan ve varsa 2× eklenti kullanır. iOS safe area ve iki yatay yön desteklenir. Bu native ekranda tarayıcı yakınlaştırma hareketi bulunmaz.

Görseller mevcut geometrinin basit karşılıklarıdır. Tam görsel/animasyon/ses eşliği ve mobil performans ayarı bitmiş değildir. Kodun bulunması, Unity'de bütün özelliklerin oynanarak doğrulandığı anlamına gelmez.

## Doğrulananlar

- 35 referans hareket senaryosu, 280 kontrol noktası: C# ve JavaScript tüm hareket alanlarında `1e-8` toleransı içinde eşleşir.
- İki C# WebSocket istemcisi, ayrı yerel sunucuda aynı odaya katılır; birbirini, sunucunun onayladığı hareketi ve ateşi görür; ayrılma doğrulanır. Bu test Unity sahnesi veya gerçek tarayıcı ile fiziksel cihaz testi değildir.
- Canlı 2.1.0 kaynak yedeğiyle karşılaştırmada mevcut altı haritanın çarpışma kutuları, silah tanımları ve hareket simülasyonu güncel kaynaklarla eşleşir. Yeni `depot` haritası 2.2.0 kaynaklarına aittir; canlı sunucunun sunduğu oda/haritalar kullanılır.
- C# 9 sözdizimi kontrolü ve Unity `6000.6.2f1` API derlemesi geçti.
- Unity `NativeChecks.Run` geçti: JSON, harita/silah verileri, koordinat/nişan dönüşümü, aynı anda ateş ve kamera parmakları, pointer sahipliği, sıfırlama, ölüm ve duraklatma.
- Windows native paketi oluşturuldu: `artifacts/unity-windows/Sector16.exe`. Sürüm `2.2.0`, build `1` yalnızca bu yerel önizleme içindir.
- Unity iOS Xcode dışa aktarımı tamamlandı: `build/unity-ios`, sürüm `1.1`, build `20`, aynı bundle kimliği. Kullanıcının App Store Connect ekranında yayımlanmış sürüm `1.0`, en yüksek TestFlight build'i `19` idi. Dışa aktarım kontrol testlerinden geçti; arşivin 4.995 girdisi ve indirme erişimi doğrulandı. Bu, imzalı IPA derlemesi veya fiziksel cihaz testi değildir.
- Güncel kaynakların 45 oyun testi geçti; mevcut Capacitor mobil paket oluşturuldu; tarayıcı dokunma testleri geçti.
- Codemagic YAML resmi JSON şemasıyla doğrulandı. Native iş akışı çalıştırılmadı.

## Unity kurulumu ve kalan doğrulamalar

Unity `6000.6.2f1`, `D:\unity\6000.6.2f1\Editor\Unity.exe` yoluna başarıyla kuruldu (kurulum çıkış kodu 0). iOS Build Support da aynı editöre kuruldu. C: üzerinde yaklaşık 3,7 GB boş alan vardı; yükseltilmiş kurulum işleminin `TEMP` ve `TMP` klasörlerini D: sürücüsüne yönlendirmek kurulumun tamamlanmasını sağladı. Windows'un genel geçici dosya ayarları değiştirilmedi.

İlk gerçek derleme, eski Input System paketinin artık kaldırılmış Unity API'lerini kullandığını gösterdi. Editörün kendi paket manifestinde belirtilen minimum/released `1.20.0` ve yerleşik uGUI `2.6.0` sürümleriyle derleme geçti. Unity tarafından üretilen `.meta`, sahne, proje ayarları ve paket kilidi kaynaklarla birlikte tutulur.

Windows önizlemesini otomatik başlatıp yerel sunucuda yapılacak ek çalışma kontrolü otomatik onay denetimi tarafından engellendi; denetim ayrıntılı neden vermedi. Önizleme oynanarak doğrulanmadı. Gerçek iPhone/iPad testi ve gerçek web oyuncusuyla aynı odada oynanış doğrulaması ayrıca gerekiyor.

## Yerel çalışma

Repo kökünden:

```powershell
npm run export:unity
npm run check:unity-core
```

Unity Hub'da bu klasörü proje olarak ekle. Editör sürümü `6000.6.2f1`, Input System `1.20.0`. Giriş sahnesi ve uygulama ayarları oluşturuldu. Play ile native uygulama başlar.

Repo kökünden editörü açmak veya kontrolleri çalıştırmak için aşağıdaki yardımcı script geçici dosyaları ve paket önbelleğini yalnızca başlattığı işlem için D: üzerinde tutar:

```powershell
powershell -NoProfile -File scripts/unity-on-d.ps1 -Mode Editor
powershell -NoProfile -File scripts/unity-on-d.ps1 -Mode Check
```

Windows önizlemesini tekrar oluşturmak için `powershell -NoProfile -File scripts/unity-on-d.ps1 -Mode Windows -Version 2.2.0 -BuildNumber 1` çalıştır. Çıktı `artifacts/unity-windows/Sector16.exe` olur. Yerel sunucuya karşı test etmek için oyuna `--sector16-server http://127.0.0.1:3000` argümanı ver; aynı sunucuyu webde açıp diğer oyuncuyla katıl.

## Mevcut App Store uygulamasına güncelleme

Bundle kimliği `com.webdehasi.sector16` olarak korunur. Yeni bir Apple uygulama kaydı açılmaz. Sürüm ve yapı numarasını mevcut App Store/TestFlight kayıtlarından kontrol ederek daha yeni ve kullanılmamış değerleri seç.

1. Hazırlanan güncelleme için `powershell -NoProfile -File scripts/unity-on-d.ps1 -Mode IOS -Version 1.1 -BuildNumber 20` kullanıldı. Sonraki yüklemelerde App Store/TestFlight'ta kullanılmamış build numarası seç. Unity kontrolü ve başarılı build sonrası `build/unity-ios` ve `sector16-export.json` oluşur.
2. Repo kökünden `powershell -NoProfile -File scripts/package-unity-ios.ps1` çalıştır. Çıktı `artifacts/sector16-unity-ios.zip` olur; script bundle kimliğini, kontrolleri ve Info.plist sürüm eşleşmesini denetler.
3. Kendi özel dosya depolamanda bu arşiv için Codemagic build süresince geçerli HTTPS indirme bağlantısı oluştur. Bağlantıyı Git'e yazma. Codemagic'te `unity_export` grubunda secret `UNITY_IOS_EXPORT_URL` olarak tanımla.
4. `ios-unity-export-upload` iş akışını seç. Bu akış mevcut `KiraClubs` Apple entegrasyonu ile Unity Xcode projesini imzalar ve App Store Connect'e yükler. Otomatik beta incelemesi veya App Store incelemesi başlatmaz.
5. TestFlight'ta gerçek iPhone/iPad ve web oyuncusuyla aynı odada oynanışı doğrula. Sonra App Store güncellemesini incelemeye gönder.

5 Ekim'de hazırlanan arşiv: 220.803.606 bayt, SHA-256 `2369ed6c379ea8a1cbf2253fe190b01c9dd67e09b5af597ae1f9482d36f17500`. Frankfurt'taki özel S3 arşiv deposunda şifreli olarak tutulur; `unity-ios/` nesneleri yedi gün sonra silinir. HTTPS indirme bağlantısı 24 saat geçerlidir ve Git dışında saklanır. Bağlantının süresi dolarsa yeni bağlantı oluşturup Codemagic secret değerini güncelle.

Bu akış Unity dışa aktarımını yerelde yapar; Codemagic yalnızca Xcode çıktısını derler. Codemagic üzerinde Unity editörünü çalıştıran alternatif yol ayrıca uygun Unity CI lisansını gerektirir: [Codemagic Unity kılavuzu](https://docs.codemagic.io/yaml-quick-start/building-a-unity-app/).

Canlı sunucuya bu dal dağıtılmadı; iOS paketi App Store Connect'e yüklenmedi. Görsel/animasyon eşliği, fiziksel cihaz performansı ve dokunma yerleşimi ölçümleri tamamlanmadan bu proje yayın sürümü sayılmaz.
