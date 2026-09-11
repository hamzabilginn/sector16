# Sector 16 v1.1 — Haritalar, silahlar ve oyun türleri

## Oynama

Sayfayı bir kez yenile. Oda oluştururken harita ve oyun türünü seç.

- **Doklar:** Mevcut liman haritası.
- **Buz Arenası:** Iceworld düzeninden esinlenen dört bloklu buz arenası.
- **Çöl Geçidi:** Dust 2'nin koridor fikrinden esinlenen bağımsız çöl haritası. Orijinal Dust 2 dosyası veya birebir rekonstrüksiyon değildir.

### Rekabetçi

Rütbe sistemi yoktur. Ölen oyuncu raund sonuna kadar ölü kalır ve sonraki raundda yeniden doğar. Raund ortasında odaya katılan oyuncu da sonraki raundu bekler.

2 saniye hazırlık, 90 saniye mücadele; 7 raund kazanan takım maç galibidir. Raund, bir takım elendiğinde veya süre bittiğinde sonuçlanır. Süre bittiğinde hayatta daha fazla oyuncusu olan takım kazanır; eşit sayıda canlı oyuncu varsa beraberlik olur. Bu sürümde bomba kurma/çözme yoktur.

**B**: satın al. **1**: ana silah. **2**: tabanca. **Sağ tık**: nişan/dürbün.

| Silah/teçhizat | Fiyat |
|---|---:|
| Glock 18 | Başlangıç silahı |
| Desert Eagle | $700 |
| MP5 | $1500 |
| M3 | $1700 |
| AK-47 | $2700 |
| M4A1 | $3100 |
| AWP | $4750 |
| Kevlar + kask | $650 |

Başlangıç $800; öldürme +$300; galibiyet +$3250; ardışık kayıplara göre +$1400–3400; beraberlik +$1900. En fazla $16000 tutulur. Bir ana silah ve bir tabanca taşınabilir. Hayatta kalan oyuncu silah/zırhını korur, ölen oyuncu tabancayla döner. Satın alma, envanter, hasar ve ödüller sunucuda kontrol edilir.

### Bayrak Kapmaca

Rakibin bayrağını kendi üssüne getir. Sayı kazanmak için kendi bayrağının üssünde olması gerekir. Ölünce veya odadan ayrılınca taşınan bayrak düşer. Takım arkadaşı düşen kendi bayrağına dokunarak geri getirebilir. Dokunulmayan bayrak 20 saniyede otomatik döner. Ölümden 2 saniye sonra yeniden doğulur. 5 bayrak hedefi; süre dolduğunda daha fazla bayrak getiren takım kazanır.

### Takım Savaşı

Mevcut 50 öldürme hedefi ve 2 saniyede yeniden doğma davranışı korunur.

## Kontroller

Yerelde fizik, harita erişilebilirliği, 3D harita oluşturma, envanter ve ekonomi, şifreli odalar, WebSocket güncellemeleri, gerçek öldürme ve sonraki raunda kadar yeniden doğmama testleri geçti. Bayrak alma, taşıma, düşürme, geri dönme ve sayı kuralları test edildi. Görsel tarayıcı otomasyonu ve büyük oyuncu yükü testi yapılmadı.

Canlı HTTPS sunucusunda yeni oyun dosyalarının yayımlanan sürümle aynı olduğu doğrulandı. Oda listesinin WebSocket üzerinden güncellenmesi ve tam raund döngüsüyle alışveriş kısıtlaması, ödül, sonraki raunddaki satın alma ve harita/mod ayrımı testleri de geçti.


### Üste alışveriş güncellemesi
Takım Savaşı ve Bayrak Kapmaca’da yeniden doğma 2 saniyedir. Rekabetçide sonraki raund beklenir. Tüm modlarda, hayattayken kendi üssündeki renkli alanda B ile süre sınırı olmadan silah/zırh alınabilir; yeterli para gerekir. Başlangıç parası tüm modlarda $800.

Raund hazırlığı, raundlar arası geçiş ve maç sonu bekleme 2 saniyeye indirildi. Alışveriş hazırlık süresine bağlı değildir; kendi üssündeyken yapılır.
