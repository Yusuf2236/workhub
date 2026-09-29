export type Language = 'uz' | 'ru' | 'en';

export interface TranslationDictionary {
  appName: string;
  appTagline: string;
  searchPlaceholder: string;
  addListing: string;
  createVacancy: string;
  createVacancySub: string;
  createResume: string;
  createResumeSub: string;
  loginBtn: string;
  logoutBtn: string;
  notifications: string;
  chat: string;
  liveChat: string;

  // Nav
  navFeed: string;
  navVacancies: string;
  navResumes: string;
  navApplications: string;
  navChat: string;
  navSaved: string;
  navMyVacancies: string;
  navProfile: string;

  // Filters & Counts
  categoryAll: string;
  regionLabel: string;
  regionAll: string;
  jobTypeLabel: string;
  jobTypeAll: string;
  vacanciesCount: string;
  refresh: string;
  noVacanciesFound: string;
  noVacanciesSub: string;
  allLoadedNotice: string;
  loadingMoreNotice: string;

  // Categories
  categories: Record<string, string>;
  regions: Record<string, string>;
  jobTypes: Record<string, string>;

  // Feed & Highlights
  feedHeroBadge: string;
  feedHeroTitle: string;
  feedHeroSub: string;
  feedHeroBtn: string;
  topCompaniesTitle: string;
  pollTitle: string;
  pollTotalVotes: string;
  pollQuestion: string;
  pollOption1: string;
  pollOption2: string;
  pollOption3: string;
  pollOption4: string;
  communityTitle: string;
  liveFeedBadge: string;
  featuredVacanciesTitle: string;
  viewAllLink: string;
  salaryIndexTitle: string;
  salaryIndexSub: string;
  commentsTitle: string;
  commentPlaceholder: string;
  commentSubmitBtn: string;
  newsTitle: string;
  newsSubtitle: string;
  realTimeBadge: string;
  readFull: string;
  commentsSubtitle: string;
  guestUser: string;
  shareThoughtPrompt: string;
  topicLabel: string;
  submitComment: string;
  submittingComment: string;
  replyBtn: string;
  repliesCountSuffix: string;
  likedBtn: string;
  featuredJobsSub: string;
  viewAllWithCount: string;
  leadingCompanies: string;
  leadingCompaniesSub: string;
  viewCompanyJobs: string;
  openPositionsCount: string;
  salaryIndexNew: string;
  salaryIndexDesc: string;
  perMonth: string;
  heroWelcomeBadge: string;
  heroMainHeading: string;
  heroMainDesc: string;

  // Endless Feed Stream Keys
  streamTitle: string;
  streamSubtitle: string;
  streamFilterAll: string;
  streamFilterJobs: string;
  streamFilterNews: string;
  streamFilterComments: string;
  streamFilterPolls: string;
  pollVoteBtn: string;
  pollVotedBadge: string;
  careerHackTitle: string;
  loadingMoreStreamNotice: string;

  // Vacancy Card & Detail
  topVacancy: string;
  applyBtn: string;
  applyShort: string;
  viewsCount: string;
  share: string;
  details: string;
  salaryNegotiable: string;
  requirementsTitle: string;
  responsibilitiesTitle: string;
  benefitsTitle: string;
  companyInfoTitle: string;
  closeBtn: string;

  // Applications
  applicationsTitle: string;
  applicationsSubtitle: string;
  noApplications: string;
  statusSubmitted: string;
  statusReviewing: string;
  statusInterview: string;
  statusAccepted: string;
  statusRejected: string;
  cancelApplicationBtn: string;
  appliedDateLabel: string;

  // Resumes & ATS
  resumesTitle: string;
  resumesSub: string;
  atsScoreLabel: string;
  skillsLabel: string;
  experienceLabel: string;
  educationLabel: string;

  // OneID
  oneidTitle: string;
  oneidSub: string;
  oneidVerifiedBadge: string;
  oneidVerifyBtn: string;
  oneidSecurityNotice: string;

  // Profile & Settings
  profileTitle: string;
  uploadPhoto: string;
  fullName: string;
  phone: string;
  profession: string;
  location: string;
  bio: string;
  skills: string;
  saveChanges: string;
  profileSaved: string;
  languageSetting: string;
  darkModeSetting: string;
  notificationsSetting: string;
  enabledBadge: string;

  // LeftSidebar AI card
  aiResumeAnalysisTitle: string;
  aiResumeAnalysisDesc: string;

  // Right Sidebar & Footer
  mobileTitle: string;
  mobileSubtitle: string;
  telegramTitle: string;
  telegramHandle: string;
  telegramDesc: string;
  telegramBtn: string;
  statsTitle: string;
  activeVacancies: string;
  verifiedCompanies: string;
  verifiedPercent: string;
  terms: string;
  privacy: string;
  help: string;
  copyright: string;

  // Empty states in main page
  noSavedVacanciesTitle: string;
  noSavedVacanciesDesc: string;
  viewVacanciesBtn: string;
  noMyVacanciesTitle: string;
  noMyVacanciesDesc: string;
  postVacancyBtn: string;

  // Resumes View
  refreshResumes: string;
  noResumes: string;
  noResumesSub: string;
  viewFilePdf: string;
  onlineProfile: string;
  contactCandidate: string;
  noSummaryProvided: string;
  recently: string;

  // Applications View
  totalCountSuffix: string;
  noApplicationsSub: string;
  defaultAppTitle: string;
  applicationIdLabel: string;
  viewVacancyDetail: string;

  // Profile View
  profileSubResumesSkills: string;
  profileSubSettings: string;
  profileCompleteness: string;
  profileAddResumeBtn: string;
  profileMyResumesTitle: string;
  profileMyResumesDesc: string;
  profileNoResumesTitle: string;
  profileNoResumesDesc: string;
  profileCreateResumeWithAI: string;
  profilePopularSkillsTitle: string;
  profileAddCustomSkill: string;
  profileSaveSkillsBtn: string;
  profileSiteThemeTitle: string;
  profileInterfaceLangLabel: string;
  profileInterfaceLangDesc: string;
  profileThemeLabel: string;
  profileThemeDesc: string;
  profileLightModeBtn: string;
  profileDarkModeBtn: string;
  profileNotificationsTitle: string;
  profileNotifyJobsLabel: string;
  profileNotifyJobsDesc: string;
  profileNotifyAppStatusLabel: string;
  profileNotifyAppStatusDesc: string;
  profileNotifyChatLabel: string;
  profileNotifyChatDesc: string;
  profileSaveGeneralBtn: string;

  // Profile Extras
  oneIdVerifiedBadge: string;
  profileSettingsSaved: string;
  profileSkillsUpdated: string;
  profileDownloadFile: string;
  profileSkillsExpTitle: string;
  profileExpLevel: string;
  expJunior: string;
  expMiddle: string;
  expSenior: string;
  expLead: string;
  profileOfficialVerified: string;
  profilePinfl: string;
  profileBirthGender: string;
  profileRegion: string;
  profilePersonalData: string;
  profilePrivacySecurity: string;

  // Modals (Vacancy, Resume, OneID)
  fillWithAi: string;
  popularExamples: string;
  jobTypeFullTime: string;
  jobTypePartTime: string;
  jobTypeRemote: string;
  jobTypeHybrid: string;
  expNotRequired: string;
  exp1to3: string;
  exp3to5: string;
  exp5plus: string;
  searchRelevanceHint: string;
  suggestedTags: string;
  regenerateAi: string;
  avgMarketSalary: string;
  similarVacancies: string;

  editResume: string;
  originalCvPreview: string;
  printPdf: string;
  resumeExamples: string;
  updateWithAi: string;
  viewAiAnalysis: string;
  scoreLabel: string;
  marketDemand: string;
  expectedSalary: string;
  atsScore: string;

  oneIdTitle: string;
  wzoneSystemName: string;
  oneIdAuthRequest: string;
  oneIdTabLogin: string;
  oneIdTabQr: string;
  oneIdTabEri: string;
  oneIdTabMobileId: string;
  oneIdVerifiedNotice: string;
  oneIdGender: string;
  oneIdBirth: string;
  oneIdRegion: string;
  oneIdConsentBtn: string;
  oneIdQrStep1: string;
  oneIdQrStep2: string;
  oneIdQrStep3: string;
  oneIdConfirmed: string;
  oneIdQrGenerating: string;
  oneIdQrExpired: string;
  oneIdRefresh: string;
  oneIdWaitingQr: string;
  oneIdDemoConfirm: string;
  oneIdEimzoActive: string;
  oneIdSignInEri: string;
  oneIdConfirmMobileId: string;
  oneIdCitizen: string;
  oneIdPinflLabel: string;
  oneIdPhone: string;
  oneIdAutoSyncNotice: string;
  oneIdLawNotice: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  uz: {
    appName: 'WZone',
    appTagline: 'Ish va faoliyat portali',
    searchPlaceholder: 'Kasb, lavozim, ko‘nikma yoki kompaniya bo‘yicha qidiring...',
    addListing: '+ E’lon berish',
    createVacancy: 'Vakansiya yaratish',
    createVacancySub: 'Yangi ish o‘rnini e’lon qilish',
    createResume: 'Rezyume joylashtirish',
    createResumeSub: 'Nomzodlar bazasida ko‘rinish',
    loginBtn: 'Kirish',
    logoutBtn: 'Tizimdan chiqish',
    notifications: 'Bildirishnomalar',
    chat: 'Xabarlar & Muloqot',
    liveChat: 'WZone Jonli Muloqot',

    navFeed: 'Bosh sahifa',
    navVacancies: 'Vakansiyalar',
    navResumes: 'Nomzodlar bazasi',
    navApplications: 'Mening arizalarim',
    navChat: 'Xabarlar & Chat',
    navSaved: 'Saqlanganlar',
    navMyVacancies: 'Mening e’lonlarim',
    navProfile: 'Profil & Sozlamalar',

    categoryAll: 'Barchasi',
    regionLabel: 'Hudud:',
    regionAll: 'Barcha hududlar',
    jobTypeLabel: 'Bandlik:',
    jobTypeAll: 'Barchasi',
    vacanciesCount: 'ta vakansiya',
    refresh: 'Yangilash',
    noVacanciesFound: 'Ushbu hudud yoki mezon bo‘yicha vakansiyalar topilmadi',
    noVacanciesSub: 'Boshqa viloyatni tanlang yoki qidiruv so‘zini tozalang.',
    allLoadedNotice: 'Barcha vakansiyalar ko‘rsatildi',
    loadingMoreNotice: 'Yangi vakansiyalar yuklanmoqda...',

    categories: {
      'Barchasi': 'Barchasi',
      'Ta’lim & Fan': 'Ta’lim & Fan',
      'IT & Dasturlash': 'IT & Dasturlash',
      'Marketing & Savdo': 'Marketing & Savdo',
      'Dizayn & UX': 'Dizayn & UX',
      'Moliya & Buxgalteriya': 'Moliya & Buxgalteriya',
      'HR & Menejment': 'HR & Menejment',
      'Tibbiyot & Salomatlik': 'Tibbiyot & Salomatlik',
      'Transport & Logistika': 'Transport & Logistika',
      'Mijozlarga xizmat': 'Mijozlarga xizmat',
      'Qurilish & Ishlab chiqarish': 'Qurilish & Ishlab chiqarish',
      'Servis & Xizmat ko‘rsatish': 'Servis & Xizmat ko‘rsatish',
    },

    regions: {
      'Barcha hududlar': 'Barcha hududlar',
      'Toshkent shahri': 'Toshkent shahri',
      'Toshkent viloyati': 'Toshkent viloyati',
      'Samarqand viloyati': 'Samarqand viloyati',
      'Farg‘ona viloyati': 'Farg‘ona viloyati',
      'Andijon viloyati': 'Andijon viloyati',
      'Namangan viloyati': 'Namangan viloyati',
      'Buxoro viloyati': 'Buxoro viloyati',
      'Xorazm viloyati': 'Xorazm viloyati',
      'Qashqadaryo viloyati': 'Qashqadaryo viloyati',
      'Surxondaryo viloyati': 'Surxondaryo viloyati',
      'Jizzax viloyati': 'Jizzax viloyati',
      'Sirdaryo viloyati': 'Sirdaryo viloyati',
      'Navoiy viloyati': 'Navoiy viloyati',
      'Qoraqalpog‘iston Respublikasi': 'Qoraqalpog‘iston Respublikasi',
      'Masofaviy (Remote)': 'Masofaviy (Remote)',
    },

    jobTypes: {
      'Barchasi': 'Barchasi',
      'Full-time': 'To‘liq stavka (Full-time)',
      'Part-time': 'Yarim stavka (Part-time)',
      'Remote': 'Masofaviy (Remote)',
      'Gibrid': 'Gibrid',
    },

    feedHeroBadge: '✨ WZone 2026',
    feedHeroTitle: 'O‘zbekistondagi eng yirik ish platformasi',
    feedHeroSub: '5,000+ vakansiyalar, OneID davlat verifikatsiyasi, jonli chat va soha yangiliklari.',
    feedHeroBtn: 'Barcha vakansiyalar →',
    topCompaniesTitle: 'Top Kompaniyalar',
    pollTitle: '📊 Haftaning So‘rovnomasi',
    pollTotalVotes: 'Jami ovozlar',
    pollQuestion: '2026-yilda qaysi texnologik sohada maoshlar eng tez o‘smoqda?',
    pollOption1: 'Go & Yuqori yuklamali mikroxizmatlar',
    pollOption2: 'Sun’iy intellekt & LLM integratsiyalari',
    pollOption3: 'Mobil Native (Kotlin & Swift)',
    pollOption4: 'Fintech & Kiberxavfsizlik',
    communityTitle: 'Hamjamiyat & Yangiliklar',
    liveFeedBadge: 'Jonli Lenta',
    featuredVacanciesTitle: 'Haftaning Sara Vakansiyalari',
    viewAllLink: 'Barchasi →',
    salaryIndexTitle: '📈 2026-yil IT Maoshlar Indeksi',
    salaryIndexSub: 'Mehnat bozori tahlili',
    commentsTitle: 'Jonli Muhokamalar & Izohlar',
    commentPlaceholder: 'Fikringiz yoki maslahatingizni yozing...',
    commentSubmitBtn: 'Yuborish',
    newsTitle: 'Yangiliklar & Karyera Tahlillari',
    newsSubtitle: 'O‘zbekiston va jahon mehnat bozoridagi eng muhim o‘zgarishlar va ekspert maslahatlari',
    realTimeBadge: 'REAL-TIME',
    readFull: 'To‘liq o‘qish',
    commentsSubtitle: 'Dasturchilar, HR menejerlar va nomzodlar o‘rtasidagi professional tajriba almashinuvi',
    guestUser: 'Mehmon foydalanuvchi',
    shareThoughtPrompt: 'Jamiyat bilan fikr yoki tajribangizni ulashing',
    topicLabel: 'Mavzu:',
    submitComment: 'Fikr bildirish',
    submittingComment: 'Yuborilmoqda...',
    replyBtn: 'Javob berish',
    repliesCountSuffix: 'ta javob',
    likedBtn: 'Yoqdi',
    featuredJobsSub: 'Yuqori maoshli va tezkor ko‘rib chiqiluvchi takliflar',
    viewAllWithCount: 'Katalogdagi barcha vakansiyalarni ko‘rish',
    leadingCompanies: 'Yetakchi Texnologiya Kompaniyalari',
    leadingCompaniesSub: 'Eng nufuzli jamoalar, zamonaviy ofislar va ochiq ish o‘rinlari',
    viewCompanyJobs: 'Kompaniya vakansiyalarini ko‘rish',
    openPositionsCount: 'ta ochiq vakansiya',
    salaryIndexNew: 'YANGI STATISTIKA',
    salaryIndexDesc: 'WZone tahliliy markazi ma’lumotlariga ko‘ra O‘zbekiston IT bozoridagi oylik maoshlar',
    perMonth: '/oy',
    heroWelcomeBadge: '✨ WZone 2026 Raqamli Mehnat Bozoriga Xush Kelibsiz!',
    heroMainHeading: 'Karyerangizni yangi bosqichga olib chiqing',
    heroMainDesc: 'O‘zbekiston va xalqaro bozorning eng so‘nggi vakansiyalari, tahliliy yangiliklar, soha mutaxassislari bilan jonli muloqot va sun’iy intellekt rezyume tekshiruvi.',

    // Endless Feed Stream Keys
    streamTitle: '🔥 Jonli Professional Lenta & Muhokamalar',
    streamSubtitle: 'Har kungi yangi ishlar, tahliliy yangiliklar, jamoatchilik fikrlari va karyera maslahatlari oqimi',
    streamFilterAll: 'Barchasi',
    streamFilterJobs: '💼 Yangi Ishlar',
    streamFilterNews: '📰 Yangiliklar',
    streamFilterComments: '💬 Kamentlar & Fikrlar',
    streamFilterPolls: '📊 So‘rovnoma & Maslahat',
    pollVoteBtn: 'Ovoz berish',
    pollVotedBadge: 'Ovozingiz qabul qilindi',
    careerHackTitle: '💡 Kundalik Karyera Tavsiyasi',
    loadingMoreStreamNotice: 'Yangi yangiliklar, kamentlar va ishlar yuklanmoqda...',

    topVacancy: 'TOP VAKANSIYA',
    applyBtn: 'Ariza topshirish',
    applyShort: 'Ariza',
    viewsCount: 'ko‘rildi',
    share: 'Ulashish',
    details: 'Batafsil',
    salaryNegotiable: 'Kelishilgan maosh',
    requirementsTitle: 'Nomzodga talablar',
    responsibilitiesTitle: 'Vazifalar & Majburiyatlar',
    benefitsTitle: 'Kompaniya takliflari & Imtiyozlar',
    companyInfoTitle: 'Kompaniya haqida',
    closeBtn: 'Yopish',

    applicationsTitle: 'Mening arizalarim',
    applicationsSubtitle: 'Siz topshirgan arizalar va ularning real vaqt holati',
    noApplications: 'Hozircha hech qanday vakansiyaga ariza topshirmagansiz',
    statusSubmitted: 'Yuborildi',
    statusReviewing: 'Ko‘rib chiqilmoqda',
    statusInterview: 'Suhbat belgilandi',
    statusAccepted: 'Qabul qilindi',
    statusRejected: 'Rad etildi',
    cancelApplicationBtn: 'Arizani bekor qilish',
    appliedDateLabel: 'Topshirildi',

    resumesTitle: 'Nomzodlar bazasi',
    resumesSub: 'Malakali mutaxassislarning tasdiqlangan rezyumelari',
    atsScoreLabel: 'ATS Moslik ko‘rsatkichi',
    skillsLabel: 'Ko‘nikmalar',
    experienceLabel: 'Ish tajribasi',
    educationLabel: 'Ma’lumoti',

    oneidTitle: 'OneID Pasport Verifikatsiyasi',
    oneidSub: 'JSHSHIR va biometrik ma’lumotlar davlat tizimi orqali to‘liq tasdiqlangan',
    oneidVerifiedBadge: 'OneID Tasdiqlangan',
    oneidVerifyBtn: 'OneID orqali tasdiqlash',
    oneidSecurityNotice: 'Harbiy darajadagi AES-256-GCM shifrlash',

    profileTitle: 'Shaxsiy Profil va Sozlamalar',
    uploadPhoto: 'Rasm yuklash',
    fullName: 'To‘liq ismingiz',
    phone: 'Telefon raqamingiz',
    profession: 'Kasb / Mutaxassislik',
    location: 'Yashash hududingiz',
    bio: 'Qisqacha o‘zingiz haqingizda (Bio)',
    skills: 'Asosiy ko‘nikmalar',
    saveChanges: 'O‘zgarishlarni saqlash',
    profileSaved: 'Profil muvaffaqiyatli saqlandi!',
    languageSetting: 'Ilova tili',
    darkModeSetting: 'Tungi rejim (Dark Theme)',
    notificationsSetting: 'Push-bildirishnomalar',
    enabledBadge: 'Faol ✓',

    // LeftSidebar AI card
    aiResumeAnalysisTitle: 'AI Rezyume tahlili',
    aiResumeAnalysisDesc: 'WZone AI sizning ko‘nikmalaringizga mos eng sara vakansiyalarni real-vaqtda tavsiya qiladi.',

    mobileTitle: 'WZone Mobil Ilova',
    mobileSubtitle: 'Barcha vakansiyalar va tezkor suhbatlar cho‘ntagingizda.',
    telegramTitle: 'Telegram Bot',
    telegramHandle: '@WZoneUzBot',
    telegramDesc: 'Yangi vakansiyalar chiqqanda Telegram orqali birinchilardan bo‘lib bilib oling.',
    telegramBtn: 'Botga ulanish',
    statsTitle: 'JONLI KO‘RSATKICHLAR',
    activeVacancies: 'Faol vakansiyalar',
    verifiedCompanies: 'Tasdiqlangan korxonalar',
    verifiedPercent: '100% Tasdiqlangan',
    terms: 'Ommaviy oferta',
    privacy: 'Maxfiylik siyosati',
    help: 'Yordam markazi',
    copyright: '© 2026 WZone. Barcha huquqlar himoyalangan.',

    // Empty states in main page
    noSavedVacanciesTitle: 'Saqlangan vakansiyalar yo‘q',
    noSavedVacanciesDesc: 'Sizga ma’qul kelgan vakansiya kartasidagi belgi (bookmark) ustiga bosib saqlab qo‘yishingiz mumkin.',
    viewVacanciesBtn: 'Vakansiyalarni ko‘rish',
    noMyVacanciesTitle: 'Siz joylashtirgan e’lonlar mavjud emas',
    noMyVacanciesDesc: 'Kompaniyangiz uchun yangi bo‘sh ish o‘rni yaratish uchun quyidagi tugmani bosing.',
    postVacancyBtn: '+ Vakansiya e’lon qilish',

    // Resumes View
    refreshResumes: 'Nomzodlar bazasini yangilash',
    noResumes: 'Hozircha rezyumelar mavjud emas',
    noResumesSub: 'Birinchi bo‘lib rezyumeingizni joylashtiring va ish beruvchilar e’tiboriga tushing.',
    viewFilePdf: 'Faylni ko‘rish (PDF)',
    onlineProfile: 'Onlayn profil',
    contactCandidate: 'Bog‘lanish',
    noSummaryProvided: 'Tavsif berilmagan',
    recently: 'Yaqinda',

    // Applications View
    totalCountSuffix: 'ta',
    noApplicationsSub: 'Bosh sahifadagi vakansiyalarni ko‘rib chiqing va 1 klikda ariza jo‘nating.',
    defaultAppTitle: 'Vakansiya arizasi',
    applicationIdLabel: 'Ariza ID',
    viewVacancyDetail: 'Vakansiyani ko‘rish',

    // Profile View
    profileSubResumesSkills: '1. Rezyumelar & Skillar',
    profileSubSettings: '2. Sayt va Profil Sozlamalari',
    profileCompleteness: 'Profil to‘liqligi',
    profileAddResumeBtn: '+ Yangi rezyume yaratish',
    profileMyResumesTitle: 'Mening Rezyumelarim',
    profileMyResumesDesc: 'Platformadagi ish beruvchilar va HR mutaxassislar ko‘radigan faol rezyumelaringiz',
    profileNoResumesTitle: 'Sizda hali yaratilgan rezyume yo‘q',
    profileNoResumesDesc: 'WZone AI generatori yordamida 30 soniyada professional rezyume shakllantiring yoki tayyor faylingizni yuklang.',
    profileCreateResumeWithAI: 'AI bilan Rezyume yaratish',
    profilePopularSkillsTitle: 'Ommabop ko‘nikmalar (1 klikda qo‘shing)',
    profileAddCustomSkill: 'Boshqa ko‘nikma qo‘shish',
    profileSaveSkillsBtn: 'Ko‘nikmalarni saqlash',
    profileSiteThemeTitle: 'Sayt Interfeysi va Mavzusi',
    profileInterfaceLangLabel: 'Interfeys Tili:',
    profileInterfaceLangDesc: 'Platformaning barcha sahifalari tanlangan tilda ko‘rsatiladi',
    profileThemeLabel: 'Tizim Ko‘rinishi (Mavzu):',
    profileThemeDesc: 'Kunduzgi (yorug‘) yoki tungi (qorong‘i) interfeysni tanlang',
    profileLightModeBtn: 'Kunduzgi rejimga o‘tish (Light Mode)',
    profileDarkModeBtn: 'Tungi rejimga o‘tish (Dark Mode)',
    profileNotificationsTitle: 'Bildirishnomalar va Ogohlantirishlar',
    profileNotifyJobsLabel: 'Yangi mos vakansiyalar haqida xabar',
    profileNotifyJobsDesc: 'Sizning ko‘nikmalaringizga mos ish e’lonlari chiqqanda push-bildirishnoma',
    profileNotifyAppStatusLabel: 'Topshirilgan arizalar holati',
    profileNotifyAppStatusDesc: 'Ish beruvchi arizangizni ko‘rib chiqqanda yoki suhbatga chaqirganda',
    profileNotifyChatLabel: 'Chatdagi yangi xabarlar',
    profileNotifyChatDesc: 'Kompaniyalar yoki nomzodlardan yangi xabar kelganda',
    profileSaveGeneralBtn: 'Barcha sozlamalarni saqlash',

    // Profile Extras
    oneIdVerifiedBadge: 'OneID Tasdiqlangan',
    profileSettingsSaved: 'Barcha sozlamalar muvaffaqiyatli saqlandi!',
    profileSkillsUpdated: 'Ko‘nikmalar bazasi yangilandi!',
    profileDownloadFile: 'Faylni yuklab olish',
    profileSkillsExpTitle: 'Ko‘nikmalar va Tajriba',
    profileExpLevel: 'Tajriba darajasi:',
    expJunior: 'Junior (0-1 yil)',
    expMiddle: 'Middle (2-4 yil)',
    expSenior: 'Senior (5+ yil)',
    expLead: 'Lead / Architect (7+ yil)',
    profileOfficialVerified: 'Rasmiy Tasdiqlangan',
    profilePinfl: 'JShShIR (PINFL)',
    profileBirthGender: 'Tug‘ilgan sana va jinsi',
    profileRegion: 'Doimiy hudud',
    profilePersonalData: 'Shaxsiy Ma’lumotlar',
    profilePrivacySecurity: 'Maxfiylik va Xavfsizlik',

    // Modals (Vacancy, Resume, OneID)
    fillWithAi: '«AI bilan to‘ldirish»',
    popularExamples: 'Ommabop namunalar:',
    jobTypeFullTime: 'To‘liq stavka (Full-time)',
    jobTypePartTime: 'Yarim stavka (Part-time)',
    jobTypeRemote: 'Masofaviy (Remote)',
    jobTypeHybrid: 'Gibrid (Hybrid)',
    expNotRequired: 'Talab etilmaydi',
    exp1to3: '1-3 yil',
    exp3to5: '3-5 yil',
    exp5plus: '5+ yil',
    searchRelevanceHint: 'Qidiruvda mos vakansiyalar chiqishi uchun',
    suggestedTags: 'Tavsiya etilgan teglar:',
    regenerateAi: 'AI matnini qayta yaratish',
    avgMarketSalary: 'O‘rtacha bozor maoshi:',
    similarVacancies: 'O‘xshash vakansiyalar:',

    editResume: 'Tahrirlash',
    originalCvPreview: 'Original CV Ko‘rinishi',
    printPdf: 'Chop etish / PDF',
    resumeExamples: 'Namunalar:',
    updateWithAi: 'AI bilan yangilash',
    viewAiAnalysis: 'AI Tahlilini ko‘rish',
    scoreLabel: 'Ball',
    marketDemand: 'Bozor talabi:',
    expectedSalary: 'Kutilayotgan oylik maosh:',
    atsScore: 'ATS Mosligi:',

    oneIdTitle: 'Yagona identifikatsiya tizimi — OneID',
    wzoneSystemName: 'WZone Axborot Tizimi',
    oneIdAuthRequest: 'OneID orqali xavfsiz autentifikatsiya so‘rovi',
    oneIdTabLogin: 'Login va parol',
    oneIdTabQr: 'QR-kod (Mobile)',
    oneIdTabEri: 'ERI (E-IMZO)',
    oneIdTabMobileId: 'Mobile-ID',
    oneIdVerifiedNotice: 'OneID identifikatsiyasi tasdiqlandi:',
    oneIdGender: 'Jinsi:',
    oneIdBirth: 'Tug‘ilgan:',
    oneIdRegion: 'Hudud:',
    oneIdConsentBtn: 'Rozilik va kirish',
    oneIdQrStep1: 'Smartfoningizda OneID Mobile yoki MyGov mobil ilovasini oching;',
    oneIdQrStep2: 'Ilova bosh sahifasidagi QR-skaner tugmasini bosing;',
    oneIdQrStep3: 'Kamerani quyidagi QR-kodga qarating va barmoq izi / FaceID bilan tasdiqlang.',
    oneIdConfirmed: 'Tasdiqlandi!',
    oneIdQrGenerating: 'QR-kod yaratilmoqda...',
    oneIdQrExpired: 'QR-kod muddati tugadi',
    oneIdRefresh: 'Qayta yangilash',
    oneIdWaitingQr: 'OneID ilovasidan skanerlash kutilmoqda...',
    oneIdDemoConfirm: 'Demo: OneID orqali avtomatik tasdiqlash',
    oneIdEimzoActive: 'E-IMZO 3.42 moduli faol',
    oneIdSignInEri: 'ERI bilan imzolash va kirish',
    oneIdConfirmMobileId: 'Mobile-ID bilan tasdiqlash',
    oneIdCitizen: 'Fuqaro (F.I.O):',
    oneIdPinflLabel: 'JShShIR (PINFL):',
    oneIdPhone: 'Telefon raqami:',
    oneIdAutoSyncNotice: 'Ushbu ma’lumotlar avtomatik tarzda WZone profilingizga ko‘chiriladi va tasdiqlanadi.',
    oneIdLawNotice: 'O‘zbekiston Respublikasi «Elektron hukumat to‘g‘risida»gi Qonuni',
  },

  ru: {
    appName: 'WZone',
    appTagline: 'Портал работы и вакансий',
    searchPlaceholder: 'Поиск по профессии, должности, навыкам или компании...',
    addListing: '+ Разместить',
    createVacancy: 'Создать вакансию',
    createVacancySub: 'Опубликовать новую вакансию',
    createResume: 'Разместить резюме',
    createResumeSub: 'Появиться в базе кандидатов',
    loginBtn: 'Войти',
    logoutBtn: 'Выйти из системы',
    notifications: 'Уведомления',
    chat: 'Сообщения & Чат',
    liveChat: 'Живой чат WZone',

    navFeed: 'Главная',
    navVacancies: 'Вакансии',
    navResumes: 'База резюме',
    navApplications: 'Мои заявки',
    navChat: 'Чат & Сообщения',
    navSaved: 'Сохраненные',
    navMyVacancies: 'Мои вакансии',
    navProfile: 'Профиль & Настройки',

    categoryAll: 'Все категории',
    regionLabel: 'Регион:',
    regionAll: 'Все регионы',
    jobTypeLabel: 'Занятость:',
    jobTypeAll: 'Все типы',
    vacanciesCount: 'вакансий',
    refresh: 'Обновить',
    noVacanciesFound: 'По данному региону или критерию вакансий не найдено',
    noVacanciesSub: 'Выберите другой регион или очистите поисковый запрос.',
    allLoadedNotice: 'Все вакансии успешно загружены',
    loadingMoreNotice: 'Загружаются свежие вакансии...',

    categories: {
      'Barchasi': 'Все',
      'Ta’lim & Fan': 'Образование и Наука',
      'IT & Dasturlash': 'IT и Разработка ПО',
      'Marketing & Savdo': 'Маркетинг и Продажи',
      'Dizayn & UX': 'Дизайн и UX/UI',
      'Moliya & Buxgalteriya': 'Финансы и Бухгалтерия',
      'HR & Menejment': 'HR и Управление',
      'Tibbiyot & Salomatlik': 'Медицина и Здоровье',
      'Transport & Logistika': 'Транспорт и Логистика',
      'Mijozlarga xizmat': 'Клиентский сервис',
      'Qurilish & Ishlab chiqarish': 'Строительство и Производство',
      'Servis & Xizmat ko‘rsatish': 'Сфера услуг',
    },

    regions: {
      'Barcha hududlar': 'Все регионы',
      'Toshkent shahri': 'г. Ташкент',
      'Toshkent viloyati': 'Ташкентская область',
      'Samarqand viloyati': 'Самаркандская область',
      'Farg‘ona viloyati': 'Ферганская область',
      'Andijon viloyati': 'Андижанская область',
      'Namangan viloyati': 'Наманганская область',
      'Buxoro viloyati': 'Бухарская область',
      'Xorazm viloyati': 'Хорезмская область',
      'Qashqadaryo viloyati': 'Кашкадарьинская область',
      'Surxondaryo viloyati': 'Сурхандарьинская область',
      'Jizzax viloyati': 'Джизакская область',
      'Sirdaryo viloyati': 'Сырдарьинская область',
      'Navoiy viloyati': 'Навоийская область',
      'Qoraqalpog‘iston Respublikasi': 'Республика Каракалпакстан',
      'Masofaviy (Remote)': 'Удаленная работа (Remote)',
    },

    jobTypes: {
      'Barchasi': 'Все',
      'Full-time': 'Полная занятость (Full-time)',
      'Part-time': 'Частичная занятость (Part-time)',
      'Remote': 'Удаленно (Remote)',
      'Gibrid': 'Гибридный формат',
    },

    feedHeroBadge: '✨ WZone 2026',
    feedHeroTitle: 'Крупнейшая платформа карьеры и вакансий в Узбекистане',
    feedHeroSub: '5,000+ вакансий, государственная верификация OneID, живой чат и аналитика рынка.',
    feedHeroBtn: 'Все вакансии →',
    topCompaniesTitle: 'Топ Компании',
    pollTitle: '📊 Опрос Недели',
    pollTotalVotes: 'Всего голосов',
    pollQuestion: 'В какой сфере в 2026 году зарплаты растут быстрее всего?',
    pollOption1: 'Go и высоконагруженные микросервисы',
    pollOption2: 'Искусственный интеллект и LLM',
    pollOption3: 'Мобильная разработка (Kotlin & Swift)',
    pollOption4: 'Финтех и Кибербезопасность',
    communityTitle: 'Сообщество и Новости',
    liveFeedBadge: 'Живая Лента',
    featuredVacanciesTitle: 'Лучшие Вакансии Недели',
    viewAllLink: 'Все →',
    salaryIndexTitle: '📈 Индекс зарплат в IT на 2026 год',
    salaryIndexSub: 'Анализ рынка труда',
    commentsTitle: 'Живые обсуждения и отзывы',
    commentPlaceholder: 'Напишите ваше мнение или совет...',
    commentSubmitBtn: 'Отправить',
    newsTitle: 'Новости и Аналитика Карьеры',
    newsSubtitle: 'Ключевые изменения рынка труда Узбекистана и экспертные советы',
    realTimeBadge: 'В РЕАЛЬНОМ ВРЕМЕНИ',
    readFull: 'Читать далее',
    commentsSubtitle: 'Профессиональный обмен опытом между разработчиками, HR и соискателями',
    guestUser: 'Гость',
    shareThoughtPrompt: 'Поделитесь мнением или профессиональным опытом с сообществом',
    topicLabel: 'Тема:',
    submitComment: 'Опубликовать',
    submittingComment: 'Отправка...',
    replyBtn: 'Ответить',
    repliesCountSuffix: 'ответов',
    likedBtn: 'Нравится',
    featuredJobsSub: 'Высокооплачиваемые и проверенные предложения',
    viewAllWithCount: 'Смотреть все вакансии в каталоге',
    leadingCompanies: 'Ведущие Технологические Компании',
    leadingCompaniesSub: 'Престижные команды, современные офисы и открытые вакансии',
    viewCompanyJobs: 'Вакансии компании',
    openPositionsCount: 'открытых вакансий',
    salaryIndexNew: 'НОВАЯ СТАТИСТИКА',
    salaryIndexDesc: 'Ежемесячные зарплаты на IT-рынке Узбекистана по данным аналитики WZone',
    perMonth: '/мес',
    heroWelcomeBadge: '✨ Добро пожаловать на цифровую платформу WZone 2026!',
    heroMainHeading: 'Выведите вашу карьеру на новый уровень',
    heroMainDesc: 'Свежие вакансии Узбекистана и международного рынка, аналитика, живое профессиональное общение и AI-аудит резюме.',

    // Endless Feed Stream Keys
    streamTitle: '🔥 Живая Профессиональная Лента и Обсуждения',
    streamSubtitle: 'Ежедневный поток новых вакансий, аналитических новостей, комментариев сообщества и карьерных советов',
    streamFilterAll: 'Все публикации',
    streamFilterJobs: '💼 Новые Вакансии',
    streamFilterNews: '📰 Новости',
    streamFilterComments: '💬 Комментарии и Мнения',
    streamFilterPolls: '📊 Опросы и Советы',
    pollVoteBtn: 'Голосовать',
    pollVotedBadge: 'Ваш голос учтен',
    careerHackTitle: '💡 Совет Дня по Карьере',
    loadingMoreStreamNotice: 'Загрузка свежих новостей, комментариев и вакансий...',

    topVacancy: 'ТОП ВАКАНСИЯ',
    applyBtn: 'Откликнуться',
    applyShort: 'Отклик',
    viewsCount: 'просмотров',
    share: 'Поделиться',
    details: 'Подробнее',
    salaryNegotiable: 'По договорённости',
    requirementsTitle: 'Требования к кандидату',
    responsibilitiesTitle: 'Обязанности и задачи',
    benefitsTitle: 'Условия и бонусы компании',
    companyInfoTitle: 'О компании',
    closeBtn: 'Закрыть',

    applicationsTitle: 'Мои заявки',
    applicationsSubtitle: 'Статус ваших отправленных откликов в реальном времени',
    noApplications: 'Вы еще не откликались ни на одну вакансию',
    statusSubmitted: 'Отправлено',
    statusReviewing: 'На рассмотрении',
    statusInterview: 'Назначено собеседование',
    statusAccepted: 'Принято',
    statusRejected: 'Отклонено',
    cancelApplicationBtn: 'Отозвать заявку',
    appliedDateLabel: 'Отправлено',

    resumesTitle: 'База резюме',
    resumesSub: 'Проверенные профили квалифицированных специалистов',
    atsScoreLabel: 'ATS Рейтинг соответствия',
    skillsLabel: 'Навыки',
    experienceLabel: 'Опыт работы',
    educationLabel: 'Образование',

    oneidTitle: 'Верификация Паспорта OneID',
    oneidSub: 'ПИНФЛ и биометрические данные подтверждены государственной системой',
    oneidVerifiedBadge: 'OneID Подтвержден',
    oneidVerifyBtn: 'Верифицировать через OneID',
    oneidSecurityNotice: 'Военное шифрование AES-256-GCM',

    profileTitle: 'Личный профиль и настройки',
    uploadPhoto: 'Загрузить фото',
    fullName: 'Полное имя',
    phone: 'Номер телефона',
    profession: 'Профессия / Специальность',
    location: 'Регион проживания',
    bio: 'О себе (Bio)',
    skills: 'Ключевые навыки',
    saveChanges: 'Сохранить изменения',
    profileSaved: 'Профиль успешно сохранен!',
    languageSetting: 'Язык приложения',
    darkModeSetting: 'Тёмная тема (Dark Theme)',
    notificationsSetting: 'Push-уведомления',
    enabledBadge: 'Включено ✓',

    // LeftSidebar AI card
    aiResumeAnalysisTitle: 'AI Анализ резюме',
    aiResumeAnalysisDesc: 'WZone AI рекомендует лучшие вакансии под ваши навыки в реальном времени.',

    mobileTitle: 'Мобильное приложение WZone',
    mobileSubtitle: 'Все вакансии и быстрые чаты в вашем кармане.',
    telegramTitle: 'Telegram Бот',
    telegramHandle: '@WZoneUzBot',
    telegramDesc: 'Получайте уведомления о новых вакансиях прямо в Telegram.',
    telegramBtn: 'Подключить бота',
    statsTitle: 'ЖИВАЯ СТАТИСТИКА',
    activeVacancies: 'Активные вакансии',
    verifiedCompanies: 'Проверенные компании',
    verifiedPercent: '100% Проверено',
    terms: 'Публичная оферта',
    privacy: 'Политика конфиденциальности',
    help: 'Центр помощи',
    copyright: '© 2026 WZone. Все права защищены.',

    // Empty states in main page
    noSavedVacanciesTitle: 'Нет сохраненных вакансий',
    noSavedVacanciesDesc: 'Вы можете сохранить понравившуюся вакансию, нажав на значок закладки на карточке.',
    viewVacanciesBtn: 'Смотреть вакансии',
    noMyVacanciesTitle: 'У вас нет размещенных вакансий',
    noMyVacanciesDesc: 'Чтобы опубликовать новую вакансию для вашей компании, нажмите кнопку ниже.',
    postVacancyBtn: '+ Опубликовать вакансию',

    // Resumes View
    refreshResumes: 'Обновить базу кандидатов',
    noResumes: 'Резюме пока не добавлены',
    noResumesSub: 'Разместите резюме первым и привлеките внимание лучших работодателей.',
    viewFilePdf: 'Открыть файл (PDF)',
    onlineProfile: 'Онлайн-профиль',
    contactCandidate: 'Связаться',
    noSummaryProvided: 'Описание не указано',
    recently: 'Недавно',

    // Applications View
    totalCountSuffix: 'шт',
    noApplicationsSub: 'Изучите вакансии на главной странице и отправьте отклик в 1 клик.',
    defaultAppTitle: 'Отклик на вакансию',
    applicationIdLabel: 'ID заявки',
    viewVacancyDetail: 'Посмотреть вакансию',

    // Profile View
    profileSubResumesSkills: '1. Резюме и навыки',
    profileSubSettings: '2. Настройки платформы',
    profileCompleteness: 'Заполненность профиля',
    profileAddResumeBtn: '+ Создать новое резюме',
    profileMyResumesTitle: 'Мои резюме',
    profileMyResumesDesc: 'Активные резюме, доступные работодателям и HR-специалистам платформы',
    profileNoResumesTitle: 'У вас пока нет созданных резюме',
    profileNoResumesDesc: 'Создайте профессиональное резюме за 30 секунд с помощью WZone AI или загрузите готовый файл.',
    profileCreateResumeWithAI: 'Создать резюме с AI',
    profilePopularSkillsTitle: 'Популярные навыки (добавьте в 1 клик)',
    profileAddCustomSkill: 'Добавить другой навык',
    profileSaveSkillsBtn: 'Сохранить навыки',
    profileSiteThemeTitle: 'Интерфейс и тема платформы',
    profileInterfaceLangLabel: 'Язык интерфейса:',
    profileInterfaceLangDesc: 'Все страницы платформы будут отображаться на выбранном языке',
    profileThemeLabel: 'Оформление (тема):',
    profileThemeDesc: 'Выберите светлую или тёмную тему интерфейса',
    profileLightModeBtn: 'Переключить на светлую тему (Light Mode)',
    profileDarkModeBtn: 'Переключить на тёмную тему (Dark Mode)',
    profileNotificationsTitle: 'Уведомления и оповещения',
    profileNotifyJobsLabel: 'Уведомления о подходящих вакансиях',
    profileNotifyJobsDesc: 'Push-уведомления при появлении вакансий, соответствующих вашим навыкам',
    profileNotifyAppStatusLabel: 'Статус отправленных откликов',
    profileNotifyAppStatusDesc: 'Когда работодатель просматривает отклик или приглашает на интервью',
    profileNotifyChatLabel: 'Новые сообщения в чате',
    profileNotifyChatDesc: 'При получении новых сообщений от компаний или кандидатов',
    profileSaveGeneralBtn: 'Сохранить все настройки',

    // Profile Extras
    oneIdVerifiedBadge: 'Верифицирован OneID',
    profileSettingsSaved: 'Все настройки успешно сохранены!',
    profileSkillsUpdated: 'База навыков успешно обновлена!',
    profileDownloadFile: 'Скачать файл',
    profileSkillsExpTitle: 'Навыки и опыт',
    profileExpLevel: 'Уровень опыта:',
    expJunior: 'Junior (0-1 год)',
    expMiddle: 'Middle (2-4 года)',
    expSenior: 'Senior (5+ лет)',
    expLead: 'Lead / Architect (7+ лет)',
    profileOfficialVerified: 'Официально верифицирован',
    profilePinfl: 'ПИНФЛ (JShShIR)',
    profileBirthGender: 'Дата рождения и пол',
    profileRegion: 'Постоянный регион',
    profilePersonalData: 'Персональные данные',
    profilePrivacySecurity: 'Конфиденциальность и безопасность',

    // Modals (Vacancy, Resume, OneID)
    fillWithAi: '«Заполнить с помощью AI»',
    popularExamples: 'Популярные примеры:',
    jobTypeFullTime: 'Полная занятость (Full-time)',
    jobTypePartTime: 'Частичная занятость (Part-time)',
    jobTypeRemote: 'Удаленная работа (Remote)',
    jobTypeHybrid: 'Гибридный формат (Hybrid)',
    expNotRequired: 'Не требуется',
    exp1to3: '1-3 года',
    exp3to5: '3-5 лет',
    exp5plus: '5+ лет',
    searchRelevanceHint: 'Для точного подбора в поиске',
    suggestedTags: 'Рекомендуемые теги:',
    regenerateAi: 'Перегенерировать с AI',
    avgMarketSalary: 'Средняя рыночная зарплата:',
    similarVacancies: 'Похожие вакансии:',

    editResume: 'Редактировать',
    originalCvPreview: 'Вид оригинального резюме',
    printPdf: 'Печать / PDF',
    resumeExamples: 'Примеры:',
    updateWithAi: 'Обновить с AI',
    viewAiAnalysis: 'Смотреть AI Анализ',
    scoreLabel: 'Балл',
    marketDemand: 'Рыночный спрос:',
    expectedSalary: 'Ожидаемая зарплата:',
    atsScore: 'ATS Совместимость:',

    oneIdTitle: 'Единая система идентификации — OneID',
    wzoneSystemName: 'Информационная система WZone',
    oneIdAuthRequest: 'Безопасный запрос аутентификации через OneID',
    oneIdTabLogin: 'Логин и пароль',
    oneIdTabQr: 'QR-код (Mobile)',
    oneIdTabEri: 'ЭЦП (E-IMZO)',
    oneIdTabMobileId: 'Mobile-ID',
    oneIdVerifiedNotice: 'Идентификация OneID подтверждена:',
    oneIdGender: 'Пол:',
    oneIdBirth: 'Родился(-лась):',
    oneIdRegion: 'Регион:',
    oneIdConsentBtn: 'Согласие и вход',
    oneIdQrStep1: 'Откройте OneID Mobile или MyGov на смартфоне;',
    oneIdQrStep2: 'Нажмите кнопку QR-сканера на главной странице приложения;',
    oneIdQrStep3: 'Наведите камеру на QR-код и подтвердите по FaceID или отпечатку пальца.',
    oneIdConfirmed: 'Подтверждено!',
    oneIdQrGenerating: 'Генерация QR-кода...',
    oneIdQrExpired: 'Срок действия QR-кода истек',
    oneIdRefresh: 'Обновить',
    oneIdWaitingQr: 'Ожидание сканирования из приложения OneID...',
    oneIdDemoConfirm: 'Демо: Автоматическое подтверждение через OneID',
    oneIdEimzoActive: 'Модуль E-IMZO 3.42 активен',
    oneIdSignInEri: 'Подписать с ЭЦП и войти',
    oneIdConfirmMobileId: 'Подтвердить через Mobile-ID',
    oneIdCitizen: 'Гражданин (Ф.И.О):',
    oneIdPinflLabel: 'ПИНФЛ (JShShIR):',
    oneIdPhone: 'Номер телефона:',
    oneIdAutoSyncNotice: 'Эти данные автоматически синхронизируются и верифицируются в вашем профиле WZone.',
    oneIdLawNotice: 'Закон Республики Узбекистан «Об электронном правительстве»',
  },

  en: {
    appName: 'WZone',
    appTagline: 'Career & Jobs Platform',
    searchPlaceholder: 'Search jobs, titles, skills, or companies...',
    addListing: '+ Post Job',
    createVacancy: 'Create Vacancy',
    createVacancySub: 'Post a new job opening',
    createResume: 'Post Resume',
    createResumeSub: 'Appear in candidates database',
    loginBtn: 'Sign In',
    logoutBtn: 'Sign Out',
    notifications: 'Notifications',
    chat: 'Messages & Chat',
    liveChat: 'WZone Live Chat',

    navFeed: 'Home Feed',
    navVacancies: 'All Vacancies',
    navResumes: 'Candidates Pool',
    navApplications: 'My Applications',
    navChat: 'Messages & Chat',
    navSaved: 'Saved Jobs',
    navMyVacancies: 'My Job Listings',
    navProfile: 'Profile & Settings',

    categoryAll: 'All Categories',
    regionLabel: 'Region:',
    regionAll: 'All Regions',
    jobTypeLabel: 'Employment Type:',
    jobTypeAll: 'All Types',
    vacanciesCount: 'vacancies',
    refresh: 'Refresh',
    noVacanciesFound: 'No vacancies found matching your region or criteria',
    noVacanciesSub: 'Try selecting another region or clear your search query.',
    allLoadedNotice: 'All vacancies have been displayed',
    loadingMoreNotice: 'Loading fresh vacancies...',

    categories: {
      'Barchasi': 'All',
      'Ta’lim & Fan': 'Education & Science',
      'IT & Dasturlash': 'IT & Software Development',
      'Marketing & Savdo': 'Marketing & Sales',
      'Dizayn & UX': 'Design & UX/UI',
      'Moliya & Buxgalteriya': 'Finance & Accounting',
      'HR & Menejment': 'HR & Management',
      'Tibbiyot & Salomatlik': 'Medicine & Healthcare',
      'Transport & Logistika': 'Transport & Logistics',
      'Mijozlarga xizmat': 'Customer Service',
      'Qurilish & Ishlab chiqarish': 'Construction & Manufacturing',
      'Servis & Xizmat ko‘rsatish': 'Hospitality & Services',
    },

    regions: {
      'Barcha hududlar': 'All Regions',
      'Toshkent shahri': 'Tashkent City',
      'Toshkent viloyati': 'Tashkent Region',
      'Samarqand viloyati': 'Samarkand Region',
      'Farg‘ona viloyati': 'Fergana Region',
      'Andijon viloyati': 'Andijan Region',
      'Namangan viloyati': 'Namangan Region',
      'Buxoro viloyati': 'Bukhara Region',
      'Xorazm viloyati': 'Khorezm Region',
      'Qashqadaryo viloyati': 'Kashkadarya Region',
      'Surxondaryo viloyati': 'Surkhandarya Region',
      'Jizzax viloyati': 'Jizzakh Region',
      'Sirdaryo viloyati': 'Syrdarya Region',
      'Navoiy viloyati': 'Navoi Region',
      'Qoraqalpog‘iston Respublikasi': 'Republic of Karakalpakstan',
      'Masofaviy (Remote)': 'Remote',
    },

    jobTypes: {
      'Barchasi': 'All Types',
      'Full-time': 'Full-time',
      'Part-time': 'Part-time',
      'Remote': 'Remote',
      'Gibrid': 'Hybrid',
    },

    feedHeroBadge: '✨ WZone 2026',
    feedHeroTitle: 'The Premier Career & Jobs Platform in Uzbekistan',
    feedHeroSub: '5,000+ vacancies, OneID sovereign passport verification, live chat & market analytics.',
    feedHeroBtn: 'All Vacancies →',
    topCompaniesTitle: 'Top Companies',
    pollTitle: '📊 Weekly Career Poll',
    pollTotalVotes: 'Total votes',
    pollQuestion: 'Which tech sector is experiencing the highest salary growth in 2026?',
    pollOption1: 'Go & High-load Microservices',
    pollOption2: 'Artificial Intelligence & LLMs',
    pollOption3: 'Mobile Native (Kotlin & Swift)',
    pollOption4: 'Fintech & Cybersecurity',
    communityTitle: 'Community & Industry News',
    liveFeedBadge: 'Live Feed',
    featuredVacanciesTitle: 'Featured Jobs of the Week',
    viewAllLink: 'View all →',
    salaryIndexTitle: '📈 2026 Tech Salary Index',
    salaryIndexSub: 'Labor market analytics',
    commentsTitle: 'Live Discussions & Comments',
    commentPlaceholder: 'Share your perspective or advice...',
    commentSubmitBtn: 'Post',
    newsTitle: 'News & Career Insights',
    newsSubtitle: 'Key developments in the Uzbekistan labor market and expert career advice',
    realTimeBadge: 'REAL-TIME',
    readFull: 'Read full article',
    commentsSubtitle: 'Professional knowledge sharing between developers, HR, and candidates',
    guestUser: 'Guest User',
    shareThoughtPrompt: 'Share your thoughts or professional experience with the community',
    topicLabel: 'Topic:',
    submitComment: 'Post comment',
    submittingComment: 'Submitting...',
    replyBtn: 'Reply',
    repliesCountSuffix: 'replies',
    likedBtn: 'Liked',
    featuredJobsSub: 'High-paying and fast-track opportunities',
    viewAllWithCount: 'Explore all vacancies in catalog',
    leadingCompanies: 'Leading Tech Companies',
    leadingCompaniesSub: 'Top employer brands, modern tech campuses & open roles',
    viewCompanyJobs: 'Explore company jobs',
    openPositionsCount: 'open positions',
    salaryIndexNew: 'NEW STATS',
    salaryIndexDesc: 'Monthly IT salary benchmarks according to WZone Analytics',
    perMonth: '/mo',
    heroWelcomeBadge: '✨ Welcome to WZone 2026 Digital Labor Market!',
    heroMainHeading: 'Take your career to the next level',
    heroMainDesc: 'The latest local and international jobs, industry analytics, live professional discussions, and AI-powered resume screening.',

    // Endless Feed Stream Keys
    streamTitle: '🔥 Live Professional Feed & Discussions',
    streamSubtitle: 'Daily stream of fresh jobs, industry insights, community discussions, and career hacks',
    streamFilterAll: 'All Posts',
    streamFilterJobs: '💼 Fresh Jobs',
    streamFilterNews: '📰 News & Insights',
    streamFilterComments: '💬 Discussions & Feedback',
    streamFilterPolls: '📊 Polls & Tips',
    pollVoteBtn: 'Vote',
    pollVotedBadge: 'Vote recorded',
    careerHackTitle: '💡 Daily Career Insight',
    loadingMoreStreamNotice: 'Loading fresh daily news, discussions, and jobs...',

    topVacancy: 'FEATURED',
    applyBtn: 'Apply Now',
    applyShort: 'Apply',
    viewsCount: 'views',
    share: 'Share',
    details: 'Details',
    salaryNegotiable: 'Negotiable',
    requirementsTitle: 'Candidate Requirements',
    responsibilitiesTitle: 'Responsibilities & Tasks',
    benefitsTitle: 'Perks & Benefits',
    companyInfoTitle: 'About Company',
    closeBtn: 'Close',

    applicationsTitle: 'My Applications',
    applicationsSubtitle: 'Track your submitted applications and real-time status',
    noApplications: 'You haven’t applied to any vacancies yet',
    statusSubmitted: 'Submitted',
    statusReviewing: 'Under Review',
    statusInterview: 'Interview Scheduled',
    statusAccepted: 'Accepted',
    statusRejected: 'Rejected',
    cancelApplicationBtn: 'Withdraw Application',
    appliedDateLabel: 'Submitted',

    resumesTitle: 'Candidates Pool',
    resumesSub: 'Verified talent profiles and resumes',
    atsScoreLabel: 'ATS Match Score',
    skillsLabel: 'Skills',
    experienceLabel: 'Experience',
    educationLabel: 'Education',

    oneidTitle: 'OneID Passport Verification',
    oneidSub: 'PINFL and biometric credentials verified by the digital governance portal',
    oneidVerifiedBadge: 'OneID Verified',
    oneidVerifyBtn: 'Verify with OneID',
    oneidSecurityNotice: 'Military-grade AES-256-GCM encryption',

    profileTitle: 'Profile & Settings',
    uploadPhoto: 'Upload Photo',
    fullName: 'Full Name',
    phone: 'Phone Number',
    profession: 'Profession / Title',
    location: 'Location',
    bio: 'About Yourself (Bio)',
    skills: 'Key Skills',
    saveChanges: 'Save Changes',
    profileSaved: 'Profile saved successfully!',
    languageSetting: 'App Language',
    darkModeSetting: 'Dark Theme Mode',
    notificationsSetting: 'Push Notifications',
    enabledBadge: 'Enabled ✓',

    // LeftSidebar AI card
    aiResumeAnalysisTitle: 'AI Resume Audit',
    aiResumeAnalysisDesc: 'WZone AI matches and recommends top vacancies tailored to your skills in real-time.',

    mobileTitle: 'WZone Mobile App',
    mobileSubtitle: 'All jobs and instant messages right in your pocket.',
    telegramTitle: 'Telegram Bot',
    telegramHandle: '@WZoneUzBot',
    telegramDesc: 'Get instant notifications about fresh vacancies directly in Telegram.',
    telegramBtn: 'Connect Bot',
    statsTitle: 'LIVE PLATFORM STATS',
    activeVacancies: 'Active Vacancies',
    verifiedCompanies: 'Verified Employers',
    verifiedPercent: '100% Verified',
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    help: 'Help Center',
    copyright: '© 2026 WZone. All rights reserved.',

    // Empty states in main page
    noSavedVacanciesTitle: 'No saved vacancies',
    noSavedVacanciesDesc: 'You can save any vacancy you like by clicking the bookmark icon on the vacancy card.',
    viewVacanciesBtn: 'Browse Vacancies',
    noMyVacanciesTitle: 'No posted vacancies yet',
    noMyVacanciesDesc: 'To post a new vacancy for your company, click the button below.',
    postVacancyBtn: '+ Post a Vacancy',

    // Resumes View
    refreshResumes: 'Refresh candidates database',
    noResumes: 'No resumes available yet',
    noResumesSub: 'Be the first to publish your resume and get noticed by leading employers.',
    viewFilePdf: 'View File (PDF)',
    onlineProfile: 'Online Profile',
    contactCandidate: 'Connect',
    noSummaryProvided: 'No summary provided',
    recently: 'Recently',

    // Applications View
    totalCountSuffix: '',
    noApplicationsSub: 'Explore vacancies on the home page and submit your application with 1 click.',
    defaultAppTitle: 'Job Application',
    applicationIdLabel: 'Application ID',
    viewVacancyDetail: 'View Vacancy',

    // Profile View
    profileSubResumesSkills: '1. Resumes & Skills',
    profileSubSettings: '2. Site & Profile Settings',
    profileCompleteness: 'Profile Completeness',
    profileAddResumeBtn: '+ Create New Resume',
    profileMyResumesTitle: 'My Resumes',
    profileMyResumesDesc: 'Active resumes visible to recruiters and employers across the platform',
    profileNoResumesTitle: 'You have not created any resumes yet',
    profileNoResumesDesc: 'Generate a professional resume in 30 seconds with WZone AI or upload an existing file.',
    profileCreateResumeWithAI: 'Generate Resume with AI',
    profilePopularSkillsTitle: 'Popular Skills (add with 1 click)',
    profileAddCustomSkill: 'Add custom skill',
    profileSaveSkillsBtn: 'Save Skills',
    profileSiteThemeTitle: 'Appearance & System Theme',
    profileInterfaceLangLabel: 'Interface Language:',
    profileInterfaceLangDesc: 'All platform pages will be presented in the selected language',
    profileThemeLabel: 'Theme Appearance:',
    profileThemeDesc: 'Choose between Light and Dark interface theme',
    profileLightModeBtn: 'Switch to Light Mode',
    profileDarkModeBtn: 'Switch to Dark Mode',
    profileNotificationsTitle: 'Notifications & Alerts',
    profileNotifyJobsLabel: 'Matching job alerts',
    profileNotifyJobsDesc: 'Receive push notifications when vacancies matching your skills appear',
    profileNotifyAppStatusLabel: 'Application progress status',
    profileNotifyAppStatusDesc: 'When an employer reviews your application or invites you to an interview',
    profileNotifyChatLabel: 'New chat messages',
    profileNotifyChatDesc: 'When you receive new messages from employers or candidates',
    profileSaveGeneralBtn: 'Save All Settings',

    // Profile Extras
    oneIdVerifiedBadge: 'OneID Verified',
    profileSettingsSaved: 'All settings saved successfully!',
    profileSkillsUpdated: 'Skills database updated successfully!',
    profileDownloadFile: 'Download file',
    profileSkillsExpTitle: 'Skills & Experience',
    profileExpLevel: 'Experience level:',
    expJunior: 'Junior (0-1 yr)',
    expMiddle: 'Middle (2-4 yrs)',
    expSenior: 'Senior (5+ yrs)',
    expLead: 'Lead / Architect (7+ yrs)',
    profileOfficialVerified: 'Officially Verified',
    profilePinfl: 'PINFL (Civil ID)',
    profileBirthGender: 'Date of birth & gender',
    profileRegion: 'Permanent region',
    profilePersonalData: 'Personal Information',
    profilePrivacySecurity: 'Privacy & Security',

    // Modals (Vacancy, Resume, OneID)
    fillWithAi: '«Auto-fill with AI»',
    popularExamples: 'Popular examples:',
    jobTypeFullTime: 'Full-time',
    jobTypePartTime: 'Part-time',
    jobTypeRemote: 'Remote',
    jobTypeHybrid: 'Hybrid',
    expNotRequired: 'Not required',
    exp1to3: '1-3 years',
    exp3to5: '3-5 years',
    exp5plus: '5+ years',
    searchRelevanceHint: 'For better search matching',
    suggestedTags: 'Suggested tags:',
    regenerateAi: 'Regenerate with AI',
    avgMarketSalary: 'Average market salary:',
    similarVacancies: 'Similar vacancies:',

    editResume: 'Edit',
    originalCvPreview: 'Original CV Preview',
    printPdf: 'Print / PDF',
    resumeExamples: 'Examples:',
    updateWithAi: 'Update with AI',
    viewAiAnalysis: 'View AI Analysis',
    scoreLabel: 'Score',
    marketDemand: 'Market demand:',
    expectedSalary: 'Expected salary:',
    atsScore: 'ATS Compatibility:',

    oneIdTitle: 'Single Identification System — OneID',
    wzoneSystemName: 'WZone Information System',
    oneIdAuthRequest: 'Secure authentication request via OneID',
    oneIdTabLogin: 'Login & Password',
    oneIdTabQr: 'QR-code (Mobile)',
    oneIdTabEri: 'EDS (E-IMZO)',
    oneIdTabMobileId: 'Mobile-ID',
    oneIdVerifiedNotice: 'OneID identity confirmed:',
    oneIdGender: 'Gender:',
    oneIdBirth: 'Date of birth:',
    oneIdRegion: 'Region:',
    oneIdConsentBtn: 'Consent & Sign In',
    oneIdQrStep1: 'Open OneID Mobile or MyGov app on your smartphone;',
    oneIdQrStep2: 'Tap the QR-scanner button on the app home screen;',
    oneIdQrStep3: 'Point your camera at the QR code and confirm with biometric scan.',
    oneIdConfirmed: 'Confirmed!',
    oneIdQrGenerating: 'Generating QR code...',
    oneIdQrExpired: 'QR code expired',
    oneIdRefresh: 'Refresh',
    oneIdWaitingQr: 'Waiting for scan from OneID mobile app...',
    oneIdDemoConfirm: 'Demo: Automatic confirmation via OneID',
    oneIdEimzoActive: 'E-IMZO 3.42 module active',
    oneIdSignInEri: 'Sign with EDS & Enter',
    oneIdConfirmMobileId: 'Confirm with Mobile-ID',
    oneIdCitizen: 'Citizen (Full Name):',
    oneIdPinflLabel: 'PINFL (Civil ID):',
    oneIdPhone: 'Phone number:',
    oneIdAutoSyncNotice: 'This data is automatically transferred and verified in your WZone profile.',
    oneIdLawNotice: 'Law of the Republic of Uzbekistan "On Electronic Government"',
  },
};
