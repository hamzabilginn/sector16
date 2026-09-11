# 1.5.0 mobil doğrulama

- Node oyun testleri: 15/15 geçti; AWS hazırlık dizininde de 15/15 geçti.
- Masaüstü tarayıcı kontrolü: takım seçimi, 7 şarjör animasyonu, ölüm/vuruş efektleri, bomba arayüzü, serbest izleyici geçti.
- Dokunmatik tarayıcı: eşzamanlı hareket/ateş/nişan, iptal edilen dokunma, duraklatmada giriş sıfırlama ve dikey ekran taşma kontrolü geçti.
- Android: JDK 21 + Gradle 8.14.3 ile bundleRelease/assembleRelease başarılı. API 36, minimum API 24, paket com.webdehasi.sector16, versionCode 1.
- AAB imza doğrulaması başarılı. Yükleme sertifikası Android için beklendiği gibi kendinden imzalıdır.
- Bundletool 1.18.3 validate başarılı; manifestte debug açık değil, açık metin HTTP kapalı, yedekleme kapalı.
- AAB içinde .so yok. Yerel oyun JS/CSS ve gizlilik sayfası paket içinde; anahtar/.env dosyaları yok.
- AWS v1.5.0 yayında. Android ve iOS origin bağlantıları başarılı, tanımsız origin reddediliyor. Canlı mobil dosyalar kaynakla aynı.
- Android emülatöre release APK kurulumu ve AWS oda listesinin yüklenmesi doğrulandı. Yazılımsal GPU emülatörü grafik hataları verdi; bu test fiziksel cihaz performans onayı değildir.
- iOS projesi ve Codemagic akışı hazır; bu Windows bilgisayarda Xcode/IPA veya gerçek iPhone testi yapılmadı.
- Üretim npm bağımlılıkları AWS kurulumunda 0 güvenlik açığı raporladı. Geliştirme aracında Capacitor CLI → xcode → uuid zincirinde 3 moderate npm audit kaydı var; bu CLI bağımlılıkları AAB'ye veya üretim sunucusu kurulumuna dahil değil. Zorla major sürüm değiştirilmedi.

Mağaza incelemesi, geliştirici hesabı gereklilikleri ve gerçek cihaz testleri ayrıca tamamlanmalıdır.
