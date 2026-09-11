# Sector 16 v1.3

- Lobide Mavi / Turuncu / Otomatik takım seçimi; özel oda, hızlı oyun ve oda katılımında uygulanır.
- ESC menüsünde Takım değiştir. İnsan takım kapasitesi sunucuda kontrol edilir; botlar dengelenir.
- Takım savaşı ve bayrak kapmacada takım değiştirme ekipmanı sıfırlar ve 2 saniye yeniden doğuş bekletir; değişiklikler arasında 30 saniye vardır.
- Rekabetçide takım değiştirme hazırlık aşamasındadır; maç sırasında ilk katılımda lobi tercihi uygulanır.
- Eklemli yürüyüş, kamuflaj, kask, gözlük, yelek, cepler, dizlik ve eldivenli yeni taktik oyuncu modelleri.
- Tüfek/tabancalarda şarjörü çıkarma, yeni şarjörü yerleştirme ve mekanizmayı kurma hareketleri; destek eli hareketi takip eder.
- Pompalıda fişek yerleştirme ve pompalama hareketi. Animasyonlar sunucu doldurma süresine bağlıdır; erken mermi kazandırmaz.

Node.js 22+: npm ci, npm test, npm start.

Doğrulama: 8 test; gerçek WebSocket üzerinde takım tercihi/değişimi, bot dengesi, bekleme kuralları, ateş sonrası doldurma süresi ve cephane yenilenmesi. Edge/WebGL ile takım arayüzü, modeller, tüm 7 silah için şarjör hareketi ve sıfırlanması, ölüm efektleri kontrol edildi; sayfa hatası yok.

Modeller özgün prosedürel 3D modellerdir; fotogerçekçi taranmış modeller değildir.
