# Sector 16 — 1.2 doğrulama ve çalıştırma

## Eklenenler
- Bot sayısı: 0–15; oda kapasitesinde kurucu için bir yer ayrılır.
- Kolay / Orta / Zor: tepki, nişan hatası, menzil, ateş aralığı davranışı ve yana hareket.
- Oyuncular geldikçe botlar kapasiteye göre azalır; ayrılınca geri gelir.
- Vuruşta karakter sarsılması, isabet parçacıkları ve oyuncu kamerasında kısa tepki.
- Uzaktaki karakterlerin ateşinde geri tepme.
- Ölümde karakterin düşüp kaybolması; kendi ölümünde alçalan kamera ve solan görüntü.
- Efektler oda çıkışında ve yeniden doğuşta temizlenir.

## Çalıştırma
Node.js 22 veya üstü ile sector16 klasöründe:

```sh
npm ci
npm test
npm start
```

Tarayıcı: http://127.0.0.1:3000

Bot ayarları Özel oda kur menüsündedir. 0 botsuz oyun demektir. Oda içindeyken değiştirme bu sürümün kapsamında değildir.

## Doğrulama
10 Eylül 2026: Node.js 24.19.0 ile 6 test geçti. Bunlar sunucu doğrulamasını, botların kapasiteyi aşmamasını, tepki sürelerini, gerçek hasar fonksiyonunun isabet/ölüm olaylarını ve canlı WebSocket ile oda giriş/çıkışlarını kapsar. Raund, takım savaşı ve bayrak kapmaca odaları kontrol edildi.

Yerel Edge headless / WebGL kontrolü: oda ayarları, kapasite değişiminde sayı sınırı, oda oluşturma, üç botun yüklenmesi, efekt oluşturma/temizleme ve oda çıkışı geçti. JavaScript sayfa hatası alınmadı. Efekt testi test ortamında olay enjekte eder; uzun süreli oynanış veya çok cihazlı yük testi değildir.

İsteğe bağlı tarayıcı kontrolü: Playwright kurulu bir ortamda `node scripts/browser-check.mjs`. PLAYWRIGHT_PATH ile mevcut Playwright paketinin konumu verilebilir. Edge gerektirir.

AWS / canlı sunucuya dağıtım yapılmadı. Bu paket yerel geliştirme çıktısıdır.
