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

## Kurulum
Python 3.8+ yeterlidir. Ek bağımlılık yok.

## Kullanım
```bash
python hiragana_quiz.py        # Normal kullanım
python hiragana_quiz.py --reset  # İlerlemeyi sıfırla
python hiragana_quiz.py --list   # Kalan karakterleri listele
```

Soru sırasında çıkmak için `q` yazın.

## Örnek
```
Hiragana Quiz'e Hoş Geldiniz!
İlerleme: 0/46 karakter öğrenildi.
Çıkmak için 'q' yazın. Başlayalım!
あ = a
Doğru!
İlerleme: 1/46 karakter öğrenildi.
...
```

## Geliştirme Fikirleri
- Günlük hedef & hatırlatma
- Katakana modu
- Basit kelime kartları (ör: ねこ = neko)
- Sesli telaffuz (mp3/ogg)
- Web tabanlı arayüz (Flask/FastAPI + frontend)

## İlerleme Dosyası Yapısı (`progress.json`)
```json
{
  "learned": ["あ", "い"],
  "to_review": ["う", "え", "お", "か", "き", "..."],
  "attempts": {
    "あ": {"correct": 1, "incorrect": 0}
  },
  "stats": {"total_correct": 10, "total_incorrect": 3},
  "version": 1
}
```

## Lisans
MIT (opsiyonel olarak eklenebilir).
