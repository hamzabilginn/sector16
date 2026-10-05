# Mobil dokunma düzeltmesi — 23 Eylül 2026

Başlangıç: GitHub `5e2e4f9`; canlı v2.1.0 kaynaklarıyla karşılaştırılmış yerel kopya.
Güncel dal: `codex/unity-crossplay-client`. Bu belge ilk Capacitor düzeltmesini anlatır; native istemci ve güncel doğrulama durumu için [unity-client/README.md](unity-client/README.md) dosyasına bak.

## Değişiklikler

- Oyun sırasında tüm sayfa için tarayıcı hareket sınırı: iki parmakla yakınlaştırma ve çift dokunma koruması; Safari gesture olayları da kapsanır. Duraklatılmış menülerde normal kaydırma ve yakınlaştırma korunur.
- Dokunma iptali, pencere odağı kaybı, sayfadan çıkış ve ekran boyutu değişiminde tutulan kontroller ve pointer capture temizlenir.
- Ölümde nişan sıfırlanır; gizlenen veya pasifleşen ateş, zıplama, eğilme ve kurma/imha kontrolleri basılı kalmaz.
- Skor tablosu veya dialog açıkken mobil hareket kontrolleri kapatılır; kapatıldıktan sonra yeniden etkinleşir.
- Form alanları iOS odak yakınlaştırmasını önlemek için en az 16px yazı kullanır.
- npm'de bulunmayan `native-run@2.1.0` kilidi geçerli kayıt bilgileriyle yeniden oluşturuldu. Codemagic `npm ci` kullanır ve kurulum/test hatasında durur.

## Yerelde doğrulananlar

- `npm ci --include=dev --ignore-scripts`: başarılı.
- `npm test`: 41/41 başarılı; ayrı yerel sunucu kullanılır.
- `npm run build:mobile`: başarılı; `www/` içinde paketlenmiş oyun oluşur.
- `scripts/mobile-gestures-check.mjs`: Edge mobil emülasyonunda eşzamanlı hareket/ateş/nişan, iptal, ölüm, gizlenen kontroller, blur/resize/pagehide, pinch ölçeği ve devam etme.
- `scripts/mobile-check.mjs`: gerçek yerel oyun akışı, silah değiştirme, çoklu dokunma, duraklatma, yatay/dikey görünüm ve izleyici hareketi.

Tarayıcı testlerini çalıştırmak için Playwright gerekir. Bu bilgisayarda repo dışında kurulu:

```powershell
$env:PLAYWRIGHT_PATH='D:\Codex\mobile-test-tools\node_modules\playwright'
New-Item -ItemType Directory -Force artifacts | Out-Null
node scripts/mobile-gestures-check.mjs
node scripts/mobile-check.mjs
```

Hareket yönetiminin tarayıcı davranışı: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action

## Yayın öncesi kalanlar

Bu değişiklik gerçek iPhone/iPad'de henüz test edilmedi ve Windows üzerinde imzalı IPA üretilmedi. Tarayıcı emülasyonu fiziksel cihaz testi değildir. TestFlight'ta çift dokunma, aynı anda üç parmak kullanımı, arka plana alma, ekran dönüşü, ağ kesintisi ve masaüstü oyuncusuyla aynı odada oynama doğrulanmalı.

Burada anlatılan dokunma düzeltmeleri Capacitor istemcisine aittir. Aynı dalda ayrıca Unity native istemci prototipi hazırlandı; iOS 1.1 (20) Xcode dışa aktarımı oluşturuldu. Native istemcinin gerçek cihazda oynanış kontrolü henüz tamamlanmadı. Canlı sunucu değiştirilmedi. Sunucu adresi, bundle kimliği ve WebSocket oyun protokolü korunur.

## Native istemci ve sonraki doğrulama

Unity istemcisi mevcut Node/WebSocket sunucusunun oda katılım mesajlarını ve sıralı `input` paketlerini kullanır. Sunucu oda, hareket, hasar ve maç sonucunda yetkili kalır.

Önce aynı yerel odada bir web ve bir Unity istemcisinin konum, atış, ölüm ve yeniden doğma uyumu doğrulanmalı. Unity hareket tahmini ve sunucu düzeltmesi mevcut `shared/` kurallarıyla eşleşmeli; harita çarpışmaları ve koordinatlar da birebir taşınmalı. Ardından dokunmatik kamera, joystick, silah animasyonları, performans ve iOS yaşam döngüsü ele alınmalı.

Native iOS dışa aktarımı yerel Unity editöründe yapılır. Codemagic `ios-unity-export-upload` iş akışı, `unity_export` grubundaki secret `UNITY_IOS_EXPORT_URL` üzerinden bu arşivi indirir ve Xcode ile imzalı IPA oluşturur. Güncelleme aynı `com.webdehasi.sector16` kimliği ve Apple kaydıyla, sürüm 1.1/build 20 olarak hazırlandı. Sonraki yüklemelerde kullanılmamış build numarası seçilmelidir.
