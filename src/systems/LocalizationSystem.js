const STRINGS = {
  en: {
    title: 'Combat Prototype',
    start: 'Start Game',
    settings: 'Settings',
    username: 'Username',
    language: 'Language',
    english: 'English',
    arabic: 'Arabic',
    health: 'HP',
    weaponSlots: 'Weapons',
    victory: 'Victory!',
    nextLevel: 'Next Level',
    restart: 'Restart',
    respawnIn: 'Respawn in',
    saveLoaded: 'Save Loaded',
    noSave: 'No Save Found'
  },
  ar: {
    title: 'نموذج قتال',
    start: 'ابدأ اللعبة',
    settings: 'الإعدادات',
    username: 'اسم المستخدم',
    language: 'اللغة',
    english: 'الإنجليزية',
    arabic: 'العربية',
    health: 'الصحة',
    weaponSlots: 'الأسلحة',
    victory: 'النصر!',
    nextLevel: 'المستوى التالي',
    restart: 'إعادة',
    respawnIn: 'إعادة الظهور خلال',
    saveLoaded: 'تم تحميل الحفظ',
    noSave: 'لا يوجد حفظ'
  }
};

class LocalizationSystem {
  constructor() {
    this.language = 'en';
  }

  setLanguage(lang) {
    this.language = STRINGS[lang] ? lang : 'en';
  }

  t(key) {
    return STRINGS[this.language][key] || key;
  }

  isRTL() {
    return this.language === 'ar';
  }
}

const Localization = new LocalizationSystem();

export default Localization;
