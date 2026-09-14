# Sector 16 — Android, iOS ve Web

Three.js/WebGL oyun motoru, Capacitor 8 native Android/iOS kabuğu ve Node.js/WebSocket maç sunucusu.
Oyun dosyaları uygulamanın içinde paketlidir; maçlar AWS sunucusuna bağlanır. Paket kimliği: `com.webdehasi.sector16`.

## Codemagic ile iOS

1. Bu repoyu Codemagic'e bağlayın; kökteki `codemagic.yaml` otomatik bulunur.
2. Apple Developer / App Store Connect'te `com.webdehasi.sector16` uygulama kaydını oluşturun.
3. Codemagic Code signing identities bölümüne bu kimliğe ait Apple Distribution sertifikası ve App Store provisioning profile ekleyin.
4. Yalnızca IPA üretmek için `ios-release` seçin. App Store Connect'e yüklemek için Apple API anahtarını Codemagic Team integrations'a `sector16_app_store` adıyla ekleyip `ios-upload` seçin. `.p8` dosyasını Git'e koymayın.
5. App Store Connect'te yüklenen yapıyı TestFlight'ta test edin. Mağaza bilgileri ve aşağıdaki eksikler tamamlandıktan sonra incelemeye kendiniz gönderin. Akış otomatik olarak mağaza incelemesi başlatmaz.

**Mevcut sürümün mağaza kabulü doğrulanmış değildir.** iOS henüz Xcode/gerçek cihazda test edilmedi. Herkese görünen oyuncu ve oda adları için moderasyon eksikleri var. [Yayın öncesi durum](STORE-READINESS.md) ve [yayın kılavuzu](MOBILE-RELEASE.md) okunmalıdır.

## Dosyalar

- `android/`, `ios/`: native projeler; `mobile/`: Capacitor köprüsü.
- `dist/`, `shared/`: oyun istemcisi ve ortak kod; `server/`: maç sunucusu.
- `releases/v1.5.0/`: daha önce doğrulanan Android AAB ve test APK'si.
- `UPDATE-1.6.md`: yönlü ses, takım işaretleri, antrenman ve maç istatistikleri sürüm notları.
- `releases/v1.6.0/sector16-1.6.0-play.aab`: Play Store için imzalı 1.6.0 paketi (versionCode 16).
- `store/`: simge, tanıtım görseli ve oyun ekran görüntüleri.
- `MOBILE-VALIDATION.md`: test kapsamı ve sınırları.

## Geliştirme

Node 22+ (tercihen 24): `npm ci`, `npm test`, `npm run build:mobile`.
Android için JDK 21 ve SDK 36; iOS için güncel Xcode gerekir. `npx cap sync android` veya `npx cap sync ios` ile varlıkları kopyalayın.
Canlı oyun: https://sector16.18.185.7.35.sslip.io
Gizlilik: https://sector16.18.185.7.35.sslip.io/privacy.html
Destek: hazarkal333@gmail.com

---

# Sector 16 — v1.4

Tarayıcı üzerinden oynanan özgün bir çok oyunculu FPS. Canlı oyun:

https://sector16.18.185.7.35.sslip.io

## 1.4 yenilikleri

Farklı rollere ve rotalara sahip botlar; ölüm sonrası serbest izleyici; G ile el bombası; Bomba Kurma modunda A/B alanları ve E ile kurma/imha. Ayrıntılı kontroller UPDATE-1.4.md dosyasındadır.

## 1.3 yenilikleri

Lobide takım seçimi ve ESC menüsünde takım değiştirme; eklemli, kamuflajlı oyuncular; sunucu süresine bağlı şarjör/fişek doldurma animasyonları. Ayrıntılar UPDATE-1.3.md dosyasındadır.

## 1.2 yenilikleri

Oda oluştururken bot sayısını 0 ile oyuncu sınırının bir eksiği arasında girebilirsin (16 kişilik odada en fazla 15 bot). 0 botsuz oyun açar. Botlar insan oyunculara yer açar, boşalan yerlere seçilen sayıya kadar geri gelir. Kolay / Orta / Zor seçimi tepki süresi, nişan hatası, ateş mesafesi ve yana hareketi değiştirir.

İsabetlerde karakter sarsılması ve parçacıklar; ateşte geri tepme; ölümde yere düşüp kaybolan karakter ve oyuncunun kamerasında düşme / solma efekti bulunur.

## Oynama

Masaüstü Chrome, Edge veya Firefox ile aç. Oyuncu adını yaz; **Hızlı oyna** ile açık odaya gir veya **Özel oda kur** ile kendi odanı oluştur. Oda şifresi boşsa herkes katılabilir. Şifre varsa katılan herkes şifreyi girmelidir. Oda menüsünden davet bağlantısını kopyalayabilirsin; şifre bağlantıya eklenmez.

Oda kurarken **Doklar**, **Buz Arenası (Iceworld esintili)** veya **Çöl Geçidi (Dust 2 esintili)** seçilebilir. Yeni haritalar bağımsız uyarlamalardır; orijinal CS harita dosyaları değildir. **Rekabetçi** modu 2 saniye hazırlık ve 90 saniye mücadele içerir. 7 raund kazanan galip olur. Başlangıç parası $800; öldürme $300, galibiyet $3250, kayıp $1400–3400, beraberlik $1900 verir. B ile alışveriş menüsünü aç. Hayatta kalanlar ekipmanı korur; ölenler sonraki raundda tabancayla doğar. Maça raund ortasında girenler sonraki raundu bekler.

Silahlar: Glock 18, Desert Eagle, AK-47, M4A1, AWP, MP5 ve M3. 1 ana silah + 1 tabanca taşınır. Kevlar/kask $650, AWP sağ tıkla dürbün, M3 saçma atışı kullanır. Silah görselleri özgün basitleştirilmiş 3D modellerdir. Bu sürümde bomba kurma/çözme yoktur; raund modu takım elemesidir.

**Oyuna gir** düğmesi fareyi oyun alanına kilitler. ESC ile menüyü açabilirsin. Maç menü açıkken de devam eder.

| Tuş | İşlev |
|---|---|
| W A S D | Hareket |
| Fare | Bakış |
| Sol tık | Ateş |
| Sağ tık | Nişan |
| R | Şarjör değiştir |
| 1 / 2 | Ana silah / tabanca |
| B | Raund başında silah satın al |
| Space | Zıpla |
| Shift | Koş |
| Ctrl / C | Eğil |
| Tab | Skor tablosu |
| ESC | Oda menüsü |

## Oyun türleri

- **Rekabetçi:** Ölen oyuncu raund bitene kadar geri doğmaz. 2 saniye hazırlık, 90 saniye mücadele; 7 raund galibiyeti. Rütbe sistemi yoktur.
- **Bayrak Kapmaca:** Rakibin bayrağını kendi üssüne getir. Kendi bayrağın da üssünde olmalı. Ölünce bayrağı düşürürsün; takım arkadaşı geri alabilir, 20 saniyede otomatik geri döner. Ölümden 2 saniye sonra yeniden doğarsın. 5 bayrak hedefi.
- **Takım Savaşı:** 50 öldürme hedefi, 2 saniyede yeniden doğma.

## Bu sürüm

- Özgün Doklar haritası, iki takım, 50 skor hedefi; 5 / 8 / 15 dakikalık maçlar.
- 2 / 8 / 12 / 16 kişilik açık ve şifreli odalar, davet bağlantıları.
- İsteğe bağlı botlar; oyuncular geldikçe botlar yer açar.
- İvmeli hareket, çapraz hareket hız sınırlaması, zıplama, koşma, eğilme, nişan, geri tepme, hareket doğruluğu, yedi silah ve şarjör sistemi.
- Sunucuda hareket/hasar/mermi/maç yönetimi, engel ve kafa vuruşu hesabı, sınırlı gecikme telafisi; istemcide hareket tahmini ve rakip hareketlerini yumuşatma.
- Skor tablosu, takım radarı, öldürme bildirimleri, sesler, grafik ve fare ayarları.
- Son oyuncu ayrıldıktan iki dakika sonra özel odalar kapanır. Maçlar ve odalar bellektedir; sunucu yeniden başladığında sıfırlanır. Oyuncu adı hesap değildir; kalıcı üyelik ve sıralama bu sürümde yoktur.
- Masaüstü klavye/fare oyunu; dokunmatik oyun kontrolleri yoktur. CS veya CS2 oyun dosyaları kullanılmaz. Bu, oynanabilir bağımsız ilk sürümdür; CS2 ile özellik veya üretim ölçeği eşitliği iddiası taşımaz.

## Yerel çalışma

Node.js 22 veya üzeri gerekir.

```sh
npm ci
npm run vendor
npm start
```

http://127.0.0.1:3000

```sh
npm test
```

`TEST_URL` ortam değişkeniyle ağ testleri başka bir sunucuya yönlendirilebilir. Bu testler geçici odalar kurar ve sonunda bağlantıları kapatır.

## AWS kurulumu

- Bölge: eu-central-1 / Frankfurt
- Sunucu: i-0531084280980dde2, Sector16-Game-Server
- Tip: t3.micro; standart CPU kredileri, 8 GB şifreli gp3 disk
- IP: 18.185.7.35
- Güvenlik grubu: sg-09ce4640c7b4b14e3; dışarıya yalnız TCP 80 ve 443 açık
- HTTPS: Caddy, otomatik sertifika yenileme
- Oyun: `/opt/sector16/current`, `sector16.service`, yalnız `127.0.0.1:3000`
- Yönetim: AWS Systems Manager. SSH portu açılmadı.
- Yeniden başlatma ve hata sonrası servisler otomatik başlar.
- Mevcut Alphapeptit ve GridShift sunucuları değiştirilmedi.

AWS ücretsiz planı 9 Eylül 2026 kontrolünde aktifti: 107,94 USD kalan kredi, 23 Şubat 2027 bitiş tarihi. Hesaptaki tüm sunucular ortak krediyi tüketir; bu tutar altı aylık çalışma garantisi değildir. Bu işlem ücretli plana geçiş yapmadı. Kota veya performans testiyle 16 oyuncu kapasitesi doğrulanmadı; yük arttıkça kullanım ve gecikme izlenmelidir.

IP, EC2 stop/start işlemiyle değişebilir; normal işletim sistemi yeniden başlatmasında korunur. IP değişirse DNS adı ve `/etc/caddy/Caddyfile` güncellenmelidir. Kalıcı alan adınız bağlanabilir. SSLIP alan adı üçüncü taraf DNS hizmetine bağlıdır.

SSM üzerinden servis kontrolleri:

```sh
systemctl status sector16 caddy
journalctl -u sector16 -n 100 --no-pager
curl http://127.0.0.1:3000/api/health
```

Yayın betiği: `deploy/bootstrap.sh <hostname> <archive.tar.gz>`. Betik bu uygulamaya ait dizin ve servisleri yönetir. Kaynak kodda AWS anahtarı bulunmaz. Sohbette paylaşılan AWS erişim anahtarının IAM üzerinden yenilenmesi önerilir; sunucuda oyun bu anahtarı kullanmaz.

## Doğrulama kapsamı

Fizik, duvar çarpışmaları, çapraz hız, zıplama, ışın/engel/kafa hesabı; HTTP istemci dosyaları ve CSP; yanlış şifre, dolu oda, ayrılan oyuncunun yerinin açılması; iki ağ istemcisinde hareket, gerçek vurma/öldürme/skor ve yeniden doğma testleri. HTTPS sertifikası ve canlı WebSocket bağlantısı da kontrol edilir.

Tarayıcıda görsel ve fare etkileşimi otomasyonu yapılmadı. İsteğe bağlı WebMCP oda listeleme desteği, destekleyen tarayıcı bağlamı olmadığı için doğrulanmadı; normal oyun akışı bundan bağımsızdır.

Three.js ve ws MIT lisanslıdır; Three.js lisansı `dist/vendor/THREE-LICENSE.txt` dosyasındadır.


### Üste alışveriş güncellemesi
Takım Savaşı ve Bayrak Kapmaca’da yeniden doğma 2 saniyedir. Rekabetçide sonraki raund beklenir. Tüm modlarda, hayattayken kendi üssündeki renkli alanda B ile süre sınırı olmadan silah/zırh alınabilir; yeterli para gerekir. Başlangıç parası tüm modlarda $800.

Raund hazırlığı, raundlar arası geçiş ve maç sonu bekleme 2 saniyeye indirildi. Alışveriş hazırlık süresine bağlı değildir; kendi üssündeyken yapılır.
