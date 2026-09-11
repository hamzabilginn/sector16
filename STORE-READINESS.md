# Mağaza öncesi durum — 11 Eylül 2026

## Native mi?

Capacitor 8 ile native Android/iOS projeleri oluşturuldu. Oyun Three.js/WebGL ile sistem WebView'ında çalışır. Dolayısıyla mimari hibrittir; oyun Swift/Kotlin veya Unity ile yeniden yazılmadı. Yerel oyun dosyaları, dokunmatik kontroller, titreşim ve uygulama yaşam döngüsü entegrasyonu vardır. Uzak web sitesini `server.url` üzerinden yükleyen bir kabuk kullanılmaz.

## Hazır olanlar

İmzalı Android AAB, API 36 hedefi, yerel oyun varlıkları, HTTPS/WSS sunucu, gizlilik sayfası ve destek adresi, Codemagic Android/iOS akışları hazır. Android AAB Bundletool ve imza kontrollerinden geçti. Oyun testleri ve tarayıcı çoklu dokunma testleri geçti. Bu kontroller mağaza kabul belgesi değildir.

## İncelemeye göndermeden tamamlanması gerekenler

- **Kullanıcı içeriği:** oyuncu adı ve oda adı herkese gösteriliyor. Sunucu uzunluk/doğrulama sınırlarına sahip; uygunsuz içerik filtresi, uygulama içi raporlama ve kötüye kullanan kullanıcıyı engelleme mekanizmaları henüz yok. Yalnızca destek e-postası bulunuyor. Apple 1.2 ve Google Play UGC kuralları açısından önemli bir eksik/risk. Filtre, rapor, engelleme ve raporları işleme süreci tamamlanmalı; alternatif ürün kararı olarak serbest metin kaldırılıp sistem tarafından atanmış adlar kullanılabilir. Bu repo yüklemesi sırasında oyun davranışı değiştirilmedi.
- **iOS çalışırlığı:** Windows üzerinde IPA veya iPhone/iPad testi yapılmadı. Codemagic imzalı derlemesinden sonra TestFlight'ta gerçek cihazda çoklu dokunma, maç, arka plan/geri dönüş, ağ kesintisi, performans ve ısınma test edilmeli. Emülatör grafik sorunları nedeniyle fiziksel Android performansı da onaylanmış değil.
- **Mağaza beyanları:** gerçek yayıncı kimliği, gizlilik/veri güvenliği beyanları, hedef kitle ve silahlı çatışma içeriğine uygun yaş derecelendirme anketleri tamamlanmalı. Oyunda gerçek para satın alımı ve reklam SDK'sı yok.
- **Hesap şartları:** Apple üyeliği/sertifikaları ve Play Console'un ilgili hesap için istediği test ve doğrulamalar tamamlanmalı.

**Sonuç:** Teknoloji seçimi tek başına kabul veya ret garantisi vermez. Mevcut sürümü “kurallara bütünüyle uygun, incelemeye kesin hazır” olarak nitelemiyoruz. Özellikle kullanıcı içeriği ve iOS cihaz testi tamamlanmadan doğrudan mağaza incelemesine göndermek önerilmez.

## Resmi kaynaklar

- [Apple App Review Guidelines: 1.2 kullanıcı içeriği, 2.1 tamamlanmış uygulama, 4.2 işlevsellik](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play kullanıcı içeriği politikası](https://support.google.com/googleplay/android-developer/answer/9876937)
- [Google Play spam / WebView politikası](https://support.google.com/googleplay/android-developer/answer/9899034)
- [Codemagic iOS imzalama](https://docs.codemagic.io/yaml-code-signing/signing-ios/)
- [Codemagic App Store Connect yükleme](https://docs.codemagic.io/yaml-publishing/app-store-connect/)
