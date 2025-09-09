# Hiragana Quiz

Basit bir konsol tabanlı Hiragana öğrenme / pekiştirme aracı. Spaced repetition mantığını temel alarak yanlış cevaplanan karakterleri aynı oturumda tekrar sorar.

## Özellikler
- 46 temel Hiragana karakteri
- Rastgele soru sırası
- Doğru / yanlış anlık geri bildirim
- Yanlış cevapları tekrar sorma kuyruğu
- İlerlemeyi `progress.json` dosyasına kaydetme
- Oturum sonunda istatistik gösterimi
- Renkli çıktı (desteklendiği ortamlarda)
 - Web arayüzü (modern tasarım)
 - Sıralı Öğrenme Modu (mastery based): Her karakter için varsayılan 6 doğru cevap gerek, yanlışta ilerleme sayacı artmaz, doğru olunca mastery artar. Bir karakter yeterli seviyeye geldiğinde havuzdan çıkar ve bir sonraki karakter açılır.
 - Mastered (tamamlanan) karakterler için karışık quiz modu.
https://hiraganalab.netlify.app/
