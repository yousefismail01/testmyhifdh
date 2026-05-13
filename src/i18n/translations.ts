export type Language = "en" | "ar" | "ur";

const en = {
  appTitle: "testmyhifdh.com",
  appTagline: "test your memorization, ayah by ayah",

  back: "Back",
  begin: "Begin",
  cancel: "Cancel",
  apply: "Apply",

  tabJuz: "Juz",
  tabSurah: "Surah",
  tabPage: "Page",

  selectJuz: "Select Juz",
  fromSurah: "From Surah",
  toSurah: "To Surah",
  ayah: "Ayah",
  fromPage: "From Page",
  toPage: "To Page",

  rangeFooter: "Surahs are weighted equally — short surahs roll as often as long ones",

  revealFirstAyah: "Reveal First Ayah",
  revealNextAyah: "Reveal Next Ayah",
  revealMore: "Reveal More (+10)",
  nextRandomAyah: "Next Random Ayah",
  whatsFirstAyahOf: "What's the first ayah of",
  lastAyah: "Last ayah",
  endOfRange: "End of range",

  settings: "Settings",
  changeRange: "Change range",
  switchToLight: "Switch to light mode",
  switchToDark: "Switch to dark mode",

  hideSurahNames: "Hide surah names",
  hideSurahNamesDesc: "Don't show which surah the ayah is from",
  testFirstAyahs: "Test first ayahs",
  testFirstAyahsDesc:
    "When the rolled ayah is the first of a surah, show only the surah name and you guess the ayah",
  showAyahNumbers: "Show ayah numbers",
  showAyahNumbersDesc: "Display an end-of-ayah marker with the ayah number",
  tajweed: "Tajweed",
  tajweedDesc: "Render with the QPC v4 tajweed-colored Mushaf font",
  textSize: "Text size",
  textSizeSmall: "Small",
  textSizeLarge: "Large",
  theme: "Theme",
  themeLight: "Light",
  themeDark: "Dark",
  language: "Language",
};

const ar: typeof en = {
  appTitle: "testmyhifdh.com",
  appTagline: "اختبر حفظك، آية بآية",

  back: "رجوع",
  begin: "ابدأ",
  cancel: "إلغاء",
  apply: "تطبيق",

  tabJuz: "الجزء",
  tabSurah: "السورة",
  tabPage: "الصفحة",

  selectJuz: "اختر الجزء",
  fromSurah: "من سورة",
  toSurah: "إلى سورة",
  ayah: "الآية",
  fromPage: "من صفحة",
  toPage: "إلى صفحة",

  rangeFooter:
    "تُعطى السور نفس الاحتمال — السور القصيرة تُطرح بنفس وتيرة الطويلة",

  revealFirstAyah: "اكشف الآية الأولى",
  revealNextAyah: "اكشف الآية التالية",
  revealMore: "اكشف المزيد (١٠+)",
  nextRandomAyah: "آية عشوائية تالية",
  whatsFirstAyahOf: "ما الآية الأولى من سورة",
  lastAyah: "آخر آية",
  endOfRange: "نهاية المدى",

  settings: "الإعدادات",
  changeRange: "تغيير المدى",
  switchToLight: "التبديل إلى الوضع الفاتح",
  switchToDark: "التبديل إلى الوضع الداكن",

  hideSurahNames: "إخفاء أسماء السور",
  hideSurahNamesDesc: "عدم إظهار السورة التي تنتمي إليها الآية",
  testFirstAyahs: "اختبار الآيات الأولى",
  testFirstAyahsDesc:
    "إذا كانت الآية المختارة أولى سورة، يُعرض اسم السورة فقط وعليك تذكر الآية",
  showAyahNumbers: "إظهار أرقام الآيات",
  showAyahNumbersDesc: "عرض علامة نهاية الآية مع رقمها",
  tajweed: "التجويد",
  tajweedDesc: "العرض بخط مصحف QPC v4 الملوّن بألوان التجويد",
  textSize: "حجم النص",
  textSizeSmall: "صغير",
  textSizeLarge: "كبير",
  theme: "السمة",
  themeLight: "فاتح",
  themeDark: "داكن",
  language: "اللغة",
};

const ur: typeof en = {
  appTitle: "testmyhifdh.com",
  appTagline: "اپنا حفظ آزمائیں، آیت بہ آیت",

  back: "واپس",
  begin: "شروع کریں",
  cancel: "منسوخ",
  apply: "لاگو کریں",

  tabJuz: "پارہ",
  tabSurah: "سورۃ",
  tabPage: "صفحہ",

  selectJuz: "پارہ منتخب کریں",
  fromSurah: "سے سورۃ",
  toSurah: "تک سورۃ",
  ayah: "آیت",
  fromPage: "سے صفحہ",
  toPage: "تک صفحہ",

  rangeFooter:
    "تمام سورتوں کا برابر امکان — چھوٹی سورتیں بھی بڑی سورتوں جتنی بار آتی ہیں",

  revealFirstAyah: "پہلی آیت دکھائیں",
  revealNextAyah: "اگلی آیت دکھائیں",
  revealMore: "مزید دکھائیں (+۱۰)",
  nextRandomAyah: "اگلی بے ترتیب آیت",
  whatsFirstAyahOf: "اس سورت کی پہلی آیت کیا ہے",
  lastAyah: "آخری آیت",
  endOfRange: "حد کا اختتام",

  settings: "ترتیبات",
  changeRange: "حد تبدیل کریں",
  switchToLight: "ہلکے وضع پر بدلیں",
  switchToDark: "گہرے وضع پر بدلیں",

  hideSurahNames: "سورت کے نام چھپائیں",
  hideSurahNamesDesc: "یہ مت دکھائیں کہ آیت کس سورت سے ہے",
  testFirstAyahs: "پہلی آیات کا امتحان",
  testFirstAyahsDesc:
    "اگر منتخب آیت سورت کی پہلی ہو تو صرف سورت کا نام دکھایا جائے اور آپ آیت یاد کریں",
  showAyahNumbers: "آیت نمبر دکھائیں",
  showAyahNumbersDesc: "ہر آیت کے اختتام پر اس کا نمبر دکھائیں",
  tajweed: "تجوید",
  tajweedDesc: "QPC v4 تجویدی رنگین مصحف فونٹ کے ساتھ رینڈر کریں",
  textSize: "متن کا سائز",
  textSizeSmall: "چھوٹا",
  textSizeLarge: "بڑا",
  theme: "تھیم",
  themeLight: "ہلکا",
  themeDark: "گہرا",
  language: "زبان",
};

export const translations: Record<Language, typeof en> = { en, ar, ur };
export type StringKey = keyof typeof en;

export function isRTL(lang: Language): boolean {
  return lang === "ar" || lang === "ur";
}

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  ar: "العربية",
  ur: "اردو",
};
