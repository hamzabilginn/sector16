# Sector 16 v1.4 — taktik güncelleme

## Botlar
Hücum, sol kanat, sağ kanat, destek ve savunma rolleri. Ayrı karar zamanları, engeller etrafında rota bulma, kişisel alan, farklı doğuş noktaları, savunmacılarda çömelme, farklı bekleme/ateş davranışları. Rol skor tablosunda görünür. Bomba modunda taşıma, kurma, imha; bayrak modunda hedefe yönelme desteği.

## Serbest izleyici
Rekabetçi ve Bomba Kurma modlarında öldükten sonra fareyi kilitleyerek WASD ile dolaş; SPACE yüksel, CTRL/C alçal, SHIFT hızlan. Kamera duvarlardan geçebilir. Ölü oyuncunun konumu, hasarı veya maç durumu değişmez. Yeni raundda normal kameraya dönülür.

## El bombası
G: bir el bombası at. Her doğuşta bir adet. 2,2 saniyelik süre, yer/duvar sekmesi, menzile ve engellere göre sunucu hasarı. Takım arkadaşına hasar vermez; atan oyuncuya hasar verebilir.

## Bomba Kurma modu
Özel oda menüsünden Bomba Kurma'yı seç veya Çöl Geçidi / Bomba Kurma odasına gir.
- Turuncu saldırır, mavi savunur.
- Turuncu takımdan bir oyuncu bomba taşır; mümkünse insan oyuncu seçilir.
- A veya B alanında hareketsiz durup E'yi 3 saniye basılı tutarak kur.
- Kurulan bomba 40 saniyede patlar. Mavi takım yakınında E'yi 7 saniye basılı tutarak imha eder.
- Hareket veya E'yi bırakmak ilerlemeyi sıfırlar. Taşıyıcı ölür/ayrılırsa bomba düşer; turuncu oyuncu yaklaşarak alır.
- Bomba kurulduktan sonra saldıranlar ölse bile raund devam eder. Kurulmamış bomba için süre dolarsa mavi kazanır.
- 7 raund hedefi; mevcut satın alma sistemi geçerlidir.

## Görsel iyileştirmeler
Daha doğal çömelme, hafif nefes alma hareketi, el bombası ve bomba cihazı modelleri, A/B alan işaretleri, patlama ışığı ve dağılan toz parçacıkları. Mevcut eklemli karakterler ve şarjör animasyonları korunur.

## Kontrol
Node.js 22+: npm ci / npm test / npm start.
15 test: bomba süreleri/iptaller, düşürme/alma, el bombası çarpışmaları ve engellenen patlama hasarı, üç haritada rota erişimi, farklı bot hareketleri, izleyici sınırları, gerçek WebSocket oda ve el bombası akışı. Edge/WebGL: bomba göstergesi, gövdeyi hareket ettirmeyen serbest kamera, karakterler, 7 silahın doldurma hareketi ve ölüm efektleri.
