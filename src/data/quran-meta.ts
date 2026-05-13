export interface SurahInfo {
  number: number;
  name: string;
  nameArabic: string;
  ayahCount: number;
  startPage: number;
}

export const surahs: SurahInfo[] = [
  { number: 1, name: "Al-Fatiha", nameArabic: "الفاتحة", ayahCount: 7, startPage: 1 },
  { number: 2, name: "Al-Baqarah", nameArabic: "البقرة", ayahCount: 286, startPage: 2 },
  { number: 3, name: "Aal-Imran", nameArabic: "آل عمران", ayahCount: 200, startPage: 50 },
  { number: 4, name: "An-Nisa", nameArabic: "النساء", ayahCount: 176, startPage: 77 },
  { number: 5, name: "Al-Ma'idah", nameArabic: "المائدة", ayahCount: 120, startPage: 106 },
  { number: 6, name: "Al-An'am", nameArabic: "الأنعام", ayahCount: 165, startPage: 128 },
  { number: 7, name: "Al-A'raf", nameArabic: "الأعراف", ayahCount: 206, startPage: 151 },
  { number: 8, name: "Al-Anfal", nameArabic: "الأنفال", ayahCount: 75, startPage: 177 },
  { number: 9, name: "At-Tawbah", nameArabic: "التوبة", ayahCount: 129, startPage: 187 },
  { number: 10, name: "Yunus", nameArabic: "يونس", ayahCount: 109, startPage: 208 },
  { number: 11, name: "Hud", nameArabic: "هود", ayahCount: 123, startPage: 221 },
  { number: 12, name: "Yusuf", nameArabic: "يوسف", ayahCount: 111, startPage: 235 },
  { number: 13, name: "Ar-Ra'd", nameArabic: "الرعد", ayahCount: 43, startPage: 249 },
  { number: 14, name: "Ibrahim", nameArabic: "إبراهيم", ayahCount: 52, startPage: 255 },
  { number: 15, name: "Al-Hijr", nameArabic: "الحجر", ayahCount: 99, startPage: 262 },
  { number: 16, name: "An-Nahl", nameArabic: "النحل", ayahCount: 128, startPage: 267 },
  { number: 17, name: "Al-Isra", nameArabic: "الإسراء", ayahCount: 111, startPage: 282 },
  { number: 18, name: "Al-Kahf", nameArabic: "الكهف", ayahCount: 110, startPage: 293 },
  { number: 19, name: "Maryam", nameArabic: "مريم", ayahCount: 98, startPage: 305 },
  { number: 20, name: "Ta-Ha", nameArabic: "طه", ayahCount: 135, startPage: 312 },
  { number: 21, name: "Al-Anbiya", nameArabic: "الأنبياء", ayahCount: 112, startPage: 322 },
  { number: 22, name: "Al-Hajj", nameArabic: "الحج", ayahCount: 78, startPage: 332 },
  { number: 23, name: "Al-Mu'minun", nameArabic: "المؤمنون", ayahCount: 118, startPage: 342 },
  { number: 24, name: "An-Nur", nameArabic: "النور", ayahCount: 64, startPage: 350 },
  { number: 25, name: "Al-Furqan", nameArabic: "الفرقان", ayahCount: 77, startPage: 359 },
  { number: 26, name: "Ash-Shu'ara", nameArabic: "الشعراء", ayahCount: 227, startPage: 367 },
  { number: 27, name: "An-Naml", nameArabic: "النمل", ayahCount: 93, startPage: 377 },
  { number: 28, name: "Al-Qasas", nameArabic: "القصص", ayahCount: 88, startPage: 385 },
  { number: 29, name: "Al-Ankabut", nameArabic: "العنكبوت", ayahCount: 69, startPage: 396 },
  { number: 30, name: "Ar-Rum", nameArabic: "الروم", ayahCount: 60, startPage: 404 },
  { number: 31, name: "Luqman", nameArabic: "لقمان", ayahCount: 34, startPage: 411 },
  { number: 32, name: "As-Sajdah", nameArabic: "السجدة", ayahCount: 30, startPage: 415 },
  { number: 33, name: "Al-Ahzab", nameArabic: "الأحزاب", ayahCount: 73, startPage: 418 },
  { number: 34, name: "Saba", nameArabic: "سبأ", ayahCount: 54, startPage: 428 },
  { number: 35, name: "Fatir", nameArabic: "فاطر", ayahCount: 45, startPage: 434 },
  { number: 36, name: "Ya-Sin", nameArabic: "يس", ayahCount: 83, startPage: 440 },
  { number: 37, name: "As-Saffat", nameArabic: "الصافات", ayahCount: 182, startPage: 446 },
  { number: 38, name: "Sad", nameArabic: "ص", ayahCount: 88, startPage: 453 },
  { number: 39, name: "Az-Zumar", nameArabic: "الزمر", ayahCount: 75, startPage: 458 },
  { number: 40, name: "Ghafir", nameArabic: "غافر", ayahCount: 85, startPage: 467 },
  { number: 41, name: "Fussilat", nameArabic: "فصلت", ayahCount: 54, startPage: 477 },
  { number: 42, name: "Ash-Shura", nameArabic: "الشورى", ayahCount: 53, startPage: 483 },
  { number: 43, name: "Az-Zukhruf", nameArabic: "الزخرف", ayahCount: 89, startPage: 489 },
  { number: 44, name: "Ad-Dukhan", nameArabic: "الدخان", ayahCount: 59, startPage: 496 },
  { number: 45, name: "Al-Jathiyah", nameArabic: "الجاثية", ayahCount: 37, startPage: 499 },
  { number: 46, name: "Al-Ahqaf", nameArabic: "الأحقاف", ayahCount: 35, startPage: 502 },
  { number: 47, name: "Muhammad", nameArabic: "محمد", ayahCount: 38, startPage: 507 },
  { number: 48, name: "Al-Fath", nameArabic: "الفتح", ayahCount: 29, startPage: 511 },
  { number: 49, name: "Al-Hujurat", nameArabic: "الحجرات", ayahCount: 18, startPage: 515 },
  { number: 50, name: "Qaf", nameArabic: "ق", ayahCount: 45, startPage: 518 },
  { number: 51, name: "Adh-Dhariyat", nameArabic: "الذاريات", ayahCount: 60, startPage: 520 },
  { number: 52, name: "At-Tur", nameArabic: "الطور", ayahCount: 49, startPage: 523 },
  { number: 53, name: "An-Najm", nameArabic: "النجم", ayahCount: 62, startPage: 526 },
  { number: 54, name: "Al-Qamar", nameArabic: "القمر", ayahCount: 55, startPage: 528 },
  { number: 55, name: "Ar-Rahman", nameArabic: "الرحمن", ayahCount: 78, startPage: 531 },
  { number: 56, name: "Al-Waqi'ah", nameArabic: "الواقعة", ayahCount: 96, startPage: 534 },
  { number: 57, name: "Al-Hadid", nameArabic: "الحديد", ayahCount: 29, startPage: 537 },
  { number: 58, name: "Al-Mujadila", nameArabic: "المجادلة", ayahCount: 22, startPage: 542 },
  { number: 59, name: "Al-Hashr", nameArabic: "الحشر", ayahCount: 24, startPage: 545 },
  { number: 60, name: "Al-Mumtahanah", nameArabic: "الممتحنة", ayahCount: 13, startPage: 549 },
  { number: 61, name: "As-Saff", nameArabic: "الصف", ayahCount: 14, startPage: 551 },
  { number: 62, name: "Al-Jumu'ah", nameArabic: "الجمعة", ayahCount: 11, startPage: 553 },
  { number: 63, name: "Al-Munafiqun", nameArabic: "المنافقون", ayahCount: 11, startPage: 554 },
  { number: 64, name: "At-Taghabun", nameArabic: "التغابن", ayahCount: 18, startPage: 556 },
  { number: 65, name: "At-Talaq", nameArabic: "الطلاق", ayahCount: 12, startPage: 558 },
  { number: 66, name: "At-Tahrim", nameArabic: "التحريم", ayahCount: 12, startPage: 560 },
  { number: 67, name: "Al-Mulk", nameArabic: "الملك", ayahCount: 30, startPage: 562 },
  { number: 68, name: "Al-Qalam", nameArabic: "القلم", ayahCount: 52, startPage: 564 },
  { number: 69, name: "Al-Haqqah", nameArabic: "الحاقة", ayahCount: 52, startPage: 566 },
  { number: 70, name: "Al-Ma'arij", nameArabic: "المعارج", ayahCount: 44, startPage: 568 },
  { number: 71, name: "Nuh", nameArabic: "نوح", ayahCount: 28, startPage: 570 },
  { number: 72, name: "Al-Jinn", nameArabic: "الجن", ayahCount: 28, startPage: 572 },
  { number: 73, name: "Al-Muzzammil", nameArabic: "المزمل", ayahCount: 20, startPage: 574 },
  { number: 74, name: "Al-Muddaththir", nameArabic: "المدثر", ayahCount: 56, startPage: 575 },
  { number: 75, name: "Al-Qiyamah", nameArabic: "القيامة", ayahCount: 40, startPage: 577 },
  { number: 76, name: "Al-Insan", nameArabic: "الإنسان", ayahCount: 31, startPage: 578 },
  { number: 77, name: "Al-Mursalat", nameArabic: "المرسلات", ayahCount: 50, startPage: 580 },
  { number: 78, name: "An-Naba", nameArabic: "النبأ", ayahCount: 40, startPage: 582 },
  { number: 79, name: "An-Nazi'at", nameArabic: "النازعات", ayahCount: 46, startPage: 583 },
  { number: 80, name: "Abasa", nameArabic: "عبس", ayahCount: 42, startPage: 585 },
  { number: 81, name: "At-Takwir", nameArabic: "التكوير", ayahCount: 29, startPage: 586 },
  { number: 82, name: "Al-Infitar", nameArabic: "الانفطار", ayahCount: 19, startPage: 587 },
  { number: 83, name: "Al-Mutaffifin", nameArabic: "المطففين", ayahCount: 36, startPage: 587 },
  { number: 84, name: "Al-Inshiqaq", nameArabic: "الانشقاق", ayahCount: 25, startPage: 589 },
  { number: 85, name: "Al-Buruj", nameArabic: "البروج", ayahCount: 22, startPage: 590 },
  { number: 86, name: "At-Tariq", nameArabic: "الطارق", ayahCount: 17, startPage: 591 },
  { number: 87, name: "Al-A'la", nameArabic: "الأعلى", ayahCount: 19, startPage: 591 },
  { number: 88, name: "Al-Ghashiyah", nameArabic: "الغاشية", ayahCount: 26, startPage: 592 },
  { number: 89, name: "Al-Fajr", nameArabic: "الفجر", ayahCount: 30, startPage: 593 },
  { number: 90, name: "Al-Balad", nameArabic: "البلد", ayahCount: 20, startPage: 594 },
  { number: 91, name: "Ash-Shams", nameArabic: "الشمس", ayahCount: 15, startPage: 595 },
  { number: 92, name: "Al-Layl", nameArabic: "الليل", ayahCount: 21, startPage: 595 },
  { number: 93, name: "Ad-Duha", nameArabic: "الضحى", ayahCount: 11, startPage: 596 },
  { number: 94, name: "Ash-Sharh", nameArabic: "الشرح", ayahCount: 8, startPage: 596 },
  { number: 95, name: "At-Tin", nameArabic: "التين", ayahCount: 8, startPage: 597 },
  { number: 96, name: "Al-Alaq", nameArabic: "العلق", ayahCount: 19, startPage: 597 },
  { number: 97, name: "Al-Qadr", nameArabic: "القدر", ayahCount: 5, startPage: 598 },
  { number: 98, name: "Al-Bayyinah", nameArabic: "البينة", ayahCount: 8, startPage: 598 },
  { number: 99, name: "Az-Zalzalah", nameArabic: "الزلزلة", ayahCount: 8, startPage: 599 },
  { number: 100, name: "Al-Adiyat", nameArabic: "العاديات", ayahCount: 11, startPage: 599 },
  { number: 101, name: "Al-Qari'ah", nameArabic: "القارعة", ayahCount: 11, startPage: 600 },
  { number: 102, name: "At-Takathur", nameArabic: "التكاثر", ayahCount: 8, startPage: 600 },
  { number: 103, name: "Al-Asr", nameArabic: "العصر", ayahCount: 3, startPage: 601 },
  { number: 104, name: "Al-Humazah", nameArabic: "الهمزة", ayahCount: 9, startPage: 601 },
  { number: 105, name: "Al-Fil", nameArabic: "الفيل", ayahCount: 5, startPage: 601 },
  { number: 106, name: "Quraysh", nameArabic: "قريش", ayahCount: 4, startPage: 602 },
  { number: 107, name: "Al-Ma'un", nameArabic: "الماعون", ayahCount: 7, startPage: 602 },
  { number: 108, name: "Al-Kawthar", nameArabic: "الكوثر", ayahCount: 3, startPage: 602 },
  { number: 109, name: "Al-Kafirun", nameArabic: "الكافرون", ayahCount: 6, startPage: 603 },
  { number: 110, name: "An-Nasr", nameArabic: "النصر", ayahCount: 3, startPage: 603 },
  { number: 111, name: "Al-Masad", nameArabic: "المسد", ayahCount: 5, startPage: 603 },
  { number: 112, name: "Al-Ikhlas", nameArabic: "الإخلاص", ayahCount: 4, startPage: 604 },
  { number: 113, name: "Al-Falaq", nameArabic: "الفلق", ayahCount: 5, startPage: 604 },
  { number: 114, name: "An-Nas", nameArabic: "الناس", ayahCount: 6, startPage: 604 },
];

export interface JuzInfo {
  number: number;
  startSurah: number;
  startAyah: number;
  endSurah: number;
  endAyah: number;
}

export const juzData: JuzInfo[] = [
  { number: 1, startSurah: 1, startAyah: 1, endSurah: 2, endAyah: 141 },
  { number: 2, startSurah: 2, startAyah: 142, endSurah: 2, endAyah: 252 },
  { number: 3, startSurah: 2, startAyah: 253, endSurah: 3, endAyah: 92 },
  { number: 4, startSurah: 3, startAyah: 93, endSurah: 4, endAyah: 23 },
  { number: 5, startSurah: 4, startAyah: 24, endSurah: 4, endAyah: 147 },
  { number: 6, startSurah: 4, startAyah: 148, endSurah: 5, endAyah: 81 },
  { number: 7, startSurah: 5, startAyah: 82, endSurah: 6, endAyah: 110 },
  { number: 8, startSurah: 6, startAyah: 111, endSurah: 7, endAyah: 87 },
  { number: 9, startSurah: 7, startAyah: 88, endSurah: 8, endAyah: 40 },
  { number: 10, startSurah: 8, startAyah: 41, endSurah: 9, endAyah: 92 },
  { number: 11, startSurah: 9, startAyah: 93, endSurah: 11, endAyah: 5 },
  { number: 12, startSurah: 11, startAyah: 6, endSurah: 12, endAyah: 52 },
  { number: 13, startSurah: 12, startAyah: 53, endSurah: 14, endAyah: 52 },
  { number: 14, startSurah: 15, startAyah: 1, endSurah: 16, endAyah: 128 },
  { number: 15, startSurah: 17, startAyah: 1, endSurah: 18, endAyah: 74 },
  { number: 16, startSurah: 18, startAyah: 75, endSurah: 20, endAyah: 135 },
  { number: 17, startSurah: 21, startAyah: 1, endSurah: 22, endAyah: 78 },
  { number: 18, startSurah: 23, startAyah: 1, endSurah: 25, endAyah: 20 },
  { number: 19, startSurah: 25, startAyah: 21, endSurah: 27, endAyah: 55 },
  { number: 20, startSurah: 27, startAyah: 56, endSurah: 29, endAyah: 45 },
  { number: 21, startSurah: 29, startAyah: 46, endSurah: 33, endAyah: 30 },
  { number: 22, startSurah: 33, startAyah: 31, endSurah: 36, endAyah: 27 },
  { number: 23, startSurah: 36, startAyah: 28, endSurah: 39, endAyah: 31 },
  { number: 24, startSurah: 39, startAyah: 32, endSurah: 41, endAyah: 46 },
  { number: 25, startSurah: 41, startAyah: 47, endSurah: 45, endAyah: 37 },
  { number: 26, startSurah: 46, startAyah: 1, endSurah: 51, endAyah: 30 },
  { number: 27, startSurah: 51, startAyah: 31, endSurah: 57, endAyah: 29 },
  { number: 28, startSurah: 58, startAyah: 1, endSurah: 66, endAyah: 12 },
  { number: 29, startSurah: 67, startAyah: 1, endSurah: 77, endAyah: 50 },
  { number: 30, startSurah: 78, startAyah: 1, endSurah: 114, endAyah: 6 },
];

export interface AyahReference {
  surah: number;
  ayah: number;
}

export function getAyahsInRange(
  startSurah: number,
  startAyah: number,
  endSurah: number,
  endAyah: number
): AyahReference[] {
  const refs: AyahReference[] = [];
  for (let s = startSurah; s <= endSurah; s++) {
    const surah = surahs[s - 1];
    const from = s === startSurah ? startAyah : 1;
    const to = s === endSurah ? endAyah : surah.ayahCount;
    for (let a = from; a <= to; a++) {
      refs.push({ surah: s, ayah: a });
    }
  }
  return refs;
}

export function getJuzRange(juzNumber: number) {
  const juz = juzData[juzNumber - 1];
  return {
    startSurah: juz.startSurah,
    startAyah: juz.startAyah,
    endSurah: juz.endSurah,
    endAyah: juz.endAyah,
  };
}

/**
 * Returns the list of surah segments that make up a juz, with the ayah
 * range of each segment clipped to the juz boundaries. Used by the
 * customize-range drill-down so each surah row knows its in-juz ayah
 * span (e.g. surah 9 starts at ayah 1 in juz 11 but the previous juz
 * ended mid-surah-9 at ayah 92, so juz 11's surah-9 segment is 93–129).
 */
export interface JuzSurahSegment {
  surah: number;
  startAyah: number;
  endAyah: number;
  totalAyahs: number; // ayahCount of the surah (unchanged)
  segmentCount: number; // endAyah - startAyah + 1
}

export function getJuzSurahs(juzNumber: number): JuzSurahSegment[] {
  const juz = juzData[juzNumber - 1];
  const segments: JuzSurahSegment[] = [];
  for (let s = juz.startSurah; s <= juz.endSurah; s++) {
    const surah = surahs[s - 1];
    const startAyah = s === juz.startSurah ? juz.startAyah : 1;
    const endAyah = s === juz.endSurah ? juz.endAyah : surah.ayahCount;
    segments.push({
      surah: s,
      startAyah,
      endAyah,
      totalAyahs: surah.ayahCount,
      segmentCount: endAyah - startAyah + 1,
    });
  }
  return segments;
}

export function getSurahRange(from: number, to: number) {
  return {
    startSurah: from,
    startAyah: 1,
    endSurah: to,
    endAyah: surahs[to - 1].ayahCount,
  };
}

/**
 * Picks an ayah from the pool with uniform probability per ayah. Every
 * candidate ayah has the same chance of being rolled, so longer surahs,
 * pages, and surah-ayah subranges proportionally show up more often —
 * the range's actual ayah count drives the distribution, not the surah
 * count.
 */
export function pickWeightedRandomAyah(ayahs: AyahReference[]): AyahReference {
  return ayahs[Math.floor(Math.random() * ayahs.length)];
}
