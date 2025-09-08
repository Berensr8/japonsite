#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Hiragana Öğrenme Quiz Programı

Özellikler:
- 46 temel Hiragana karakteri desteklenir.
- Rastgele sırayla soru sorar.
- Doğru / yanlış kontrol eder.
- Yanlışlar aynı oturumda tekrar sorulacak kuyruğa girer (spaced repetition basit yaklaşım).
- İlerleme JSON dosyasına kaydedilir (progress.json) ve bir dahaki açılışta kaldığı yerden devam eder.
- Oturum sonunda doğru / yanlış sayısı gösterilir.
- İsteğe bağlı --reset bayrağı ile ilerleme sıfırlanabilir.

Kullanım:
  python hiragana_quiz.py            # Normal çalışma
  python hiragana_quiz.py --reset    # İlerlemeyi sıfırlar

Çıkış:
  Soru esnasında 'q' yazarak çıkabilirsiniz.

Notlar / Geliştirme Fikirleri:
- Günlük hedef ve hatırlatma
- Katakana entegrasyonu
- Basit kelime çalışmaları
- Ses dosyaları ile telaffuz desteği
- Web arayüzü / görselleştirme
"""
from __future__ import annotations
import json
import random
import argparse
from pathlib import Path
from typing import Dict, List, Any

# 46 temel hiragana (gojūon)
# Her karakter için kabul edilen romanizasyon varyantları (liste). İlk öğe ana gösterim.
HIRAGANA: Dict[str, List[str]] = {
    "あ": ["a"], "い": ["i"], "う": ["u"], "え": ["e"], "お": ["o"],
    "か": ["ka"], "き": ["ki"], "く": ["ku"], "け": ["ke"], "こ": ["ko"],
    "さ": ["sa"], "し": ["shi", "si"], "す": ["su"], "せ": ["se"], "そ": ["so"],
    "た": ["ta"], "ち": ["chi", "ti"], "つ": ["tsu", "tu"], "て": ["te"], "と": ["to"],
    "な": ["na"], "に": ["ni"], "ぬ": ["nu"], "ね": ["ne"], "の": ["no"],
    "は": ["ha"], "ひ": ["hi"], "ふ": ["fu", "hu"], "へ": ["he"], "ほ": ["ho"],
    "ま": ["ma"], "み": ["mi"], "む": ["mu"], "め": ["me"], "も": ["mo"],
    "や": ["ya"], "ゆ": ["yu"], "よ": ["yo"],
    "ら": ["ra"], "り": ["ri"], "る": ["ru"], "れ": ["re"], "ろ": ["ro"],
    "わ": ["wa"], "を": ["wo", "o"],
    "ん": ["n"],
}

DATA_FILE = Path("progress.json")

INITIAL_DATA: Dict[str, Any] = {
    "learned": [],          # Doğru cevaplananlar
    "to_review": list(HIRAGANA.keys()),  # Henüz öğrenilmemişler
    "attempts": {},         # Karakter bazlı istatistik
    "stats": {"total_correct": 0, "total_incorrect": 0},
    "version": 1,
}

COLOR = {
    "green": "\033[92m",
    "red": "\033[91m",
    "yellow": "\033[93m",
    "cyan": "\033[96m",
    "reset": "\033[0m",
}

def color(text: str, c: str) -> str:
    return f"{COLOR.get(c, '')}{text}{COLOR['reset']}"


def load_data(reset: bool = False) -> Dict[str, Any]:
    if reset or not DATA_FILE.exists():
        save_data(INITIAL_DATA)
        return json.loads(json.dumps(INITIAL_DATA))  # deep copy
    try:
        with DATA_FILE.open("r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        print("Veri dosyası bozuk görünüyor, sıfırlanıyor...")
        data = json.loads(json.dumps(INITIAL_DATA))
        save_data(data)
    # Backfill fields if missing
    changed = False
    for k, v in INITIAL_DATA.items():
        if k not in data:
            data[k] = v
            changed = True
    if changed:
        save_data(data)
    return data


def save_data(data: Dict[str, Any]) -> None:
    try:
        with DATA_FILE.open("w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Kaydetme hatası: {e}")


def pick_session_queue(data: Dict[str, Any]) -> List[str]:
    remaining = [c for c in data["to_review"] if c not in data["learned"]]
    random.shuffle(remaining)
    return remaining


def is_correct(char: str, answer: str) -> bool:
    variants = HIRAGANA[char]
    answer = answer.strip().lower()
    return answer in [v.lower() for v in variants]


def update_stats(data: Dict[str, Any], char: str, correct: bool) -> None:
    attempts = data.setdefault("attempts", {})
    entry = attempts.setdefault(char, {"correct": 0, "incorrect": 0})
    if correct:
        entry["correct"] += 1
        data["stats"]["total_correct"] += 1
    else:
        entry["incorrect"] += 1
        data["stats"]["total_incorrect"] += 1


def mark_learned_if_ready(data: Dict[str, Any], char: str) -> None:
    # Basit kural: İlk doğru cevapta learned listesine ekle.
    if char not in data["learned"]:
        data["learned"].append(char)
        # to_review listesinden çıkar
        if char in data["to_review"]:
            data["to_review"].remove(char)


def print_progress(data: Dict[str, Any]) -> None:
    learned = len(data["learned"])
    total = len(HIRAGANA)
    print(color(f"İlerleme: {learned}/{total} karakter öğrenildi.", "cyan"))


def session(data: Dict[str, Any]) -> None:
    session_queue = pick_session_queue(data)
    retry_queue: List[str] = []
    correct_count = 0
    incorrect_count = 0

    if not session_queue:
        print(color("Tebrikler! Tüm karakterleri öğrenmiş görünüyorsunuz.", "green"))
        return

    print(color("Çıkmak için 'q' yazın. Başlayalım!", "yellow"))

    while session_queue or retry_queue:
        if not session_queue and retry_queue:
            print(color("Yanlış yapılanlar tekrar soruluyor...", "yellow"))
            session_queue = retry_queue
            retry_queue = []
            random.shuffle(session_queue)

        char = session_queue.pop(0)
        answer = input(f"{char} = ").strip()
        if answer.lower() == 'q':
            print(color("Oturum sonlandırılıyor...", "yellow"))
            break
        correct = is_correct(char, answer)
        update_stats(data, char, correct)
        if correct:
            correct_count += 1
            mark_learned_if_ready(data, char)
            print(color("Doğru!", "green"))
        else:
            incorrect_count += 1
            expected = HIRAGANA[char][0]
            print(color(f"Yanlış. Doğrusu: {expected}", "red"))
            # Aynı oturumda tekrar sorulması için kuyruğa ekle
            if char not in retry_queue:
                retry_queue.append(char)
        save_data(data)
        print_progress(data)

    print("\n" + color("Oturum Özeti", "cyan"))
    print(f"Doğru: {correct_count} | Yanlış: {incorrect_count}")
    print_progress(data)


def list_remaining(data: Dict[str, Any]) -> None:
    remaining = [c for c in HIRAGANA if c not in data["learned"]]
    if remaining:
        print(color("Kalan karakterler:", "yellow"), ' '.join(remaining))
    else:
        print(color("Hiç kalmadı!", "green"))


def main() -> None:
    parser = argparse.ArgumentParser(description="Hiragana öğrenme quiz aracı")
    parser.add_argument("--reset", action="store_true", help="İlerlemeyi sıfırla")
    parser.add_argument("--list", action="store_true", help="Kalan karakterleri listele ve çık")
    args = parser.parse_args()

    data = load_data(reset=args.reset)

    if args.list:
        list_remaining(data)
        return

    print(color("Hiragana Quiz'e Hoş Geldiniz!", "cyan"))
    print_progress(data)
    session(data)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nÇıkış (Ctrl+C)")
