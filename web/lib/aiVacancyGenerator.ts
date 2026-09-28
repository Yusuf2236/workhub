/**
 * WorkHub AI Vacancy Generation Engine
 * Intelligent semantic generator for Uzbekistan and international job markets.
 * Generates tailored categories, salaries, experience, tags, and detailed requirements
 * for any profession entered in Uzbek, Russian, or English.
 */

export interface AIVacancyInput {
  title: string;
  company?: string;
  location?: string;
}

export interface AIVacancyOutput {
  title: string;
  company: string;
  category: string;
  jobType: string;
  experience: string;
  salary: string;
  location: string;
  tags: string;
  description: string;
  suggestedTags: string[];
  marketInsights: {
    demandLevel: 'Juda yuqori' | 'Yuqori' | 'O‘rtacha';
    averageSalary: string;
    similarRoles: string[];
  };
}

// Clean and normalize input text
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘'ʻ`’]/g, "'")
    .replace(/[—–]/g, '-')
    .trim();
}

// Capitalize words properly
function formatTitle(title: string): string {
  if (!title) return '';
  const trimmed = title.trim();
  // If user typed all lowercase, capitalize nicely
  return trimmed
    .split(/\s+/)
    .map((word, idx) => {
      const lower = word.toLowerCase();
      if (['va', 'hamda', 'bo‘yicha', 'uchun', 'and', 'for', 'in', 'of'].includes(lower) && idx > 0) {
        return lower;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

export function generateVacancyWithAI(input: AIVacancyInput): AIVacancyOutput {
  const rawTitle = input.title || '';
  const norm = normalizeText(rawTitle);
  const companyName = input.company?.trim() || 'WorkHub Hamkori';
  const defaultLoc = input.location?.trim() || 'Toshkent shahri';

  // 1. TEACHING & EDUCATION (Ta'lim & Fan)
  if (
    norm.includes('matemat') ||
    norm.includes('algebra') ||
    norm.includes('geometr') ||
    norm.includes('o\'qituvch') ||
    norm.includes('oqituvch') ||
    norm.includes('ustoz') ||
    norm.includes('pedagog') ||
    norm.includes('muallim') ||
    norm.includes('repetitor') ||
    norm.includes('tarbiyachi') ||
    norm.includes('fizika') ||
    norm.includes('kimyo') ||
    norm.includes('biolog') ||
    norm.includes('ingliz tili') ||
    norm.includes('ielts') ||
    norm.includes('cefr') ||
    norm.includes('rus tili') ||
    norm.includes('ona tili') ||
    norm.includes('tarix') ||
    norm.includes('metodist') ||
    norm.includes('dars')
  ) {
    let subject = 'fanidan';
    let cleanTitle = 'Matematika o‘qituvchisi';
    let tagsList = ['Oliy matematika', 'Pedagogika', 'DTM testlari', 'Abituriyentlar tayyorlash', 'Dars metodikasi'];
    let salaryRange = '6 000 000 - 12 000 000 UZS';

    if (norm.includes('matemat') || norm.includes('algebra') || norm.includes('geometr')) {
      cleanTitle = 'Matematika o‘qituvchisi';
      subject = 'matematika (algebra va geometriya)';
      tagsList = ['Oliy matematika', 'Pedagogika', 'DTM testlari', 'Abituriyentlar', 'Olimpiada', 'Mental arifmetika'];
      salaryRange = '6 000 000 - 12 000 000 UZS';
    } else if (norm.includes('ingliz') || norm.includes('ielts') || norm.includes('cefr')) {
      cleanTitle = 'Ingliz tili o‘qituvchisi (IELTS / General)';
      subject = 'ingliz tili va IELTS imtihonlariga tayyorgarlik';
      tagsList = ['IELTS 7.5+', 'CEFR C1', 'General English', 'Speaking Club', 'Kids English', 'Interactive Teaching'];
      salaryRange = '7 000 000 - 15 000 000 UZS';
    } else if (norm.includes('fizika')) {
      cleanTitle = 'Fizika fani o‘qituvchisi';
      subject = 'fizika (nazariya va laboratoriya amaliyotlari)';
      tagsList = ['Fizika', 'Pedagogika', 'DTM tayyorgarlik', 'Laboratoriya', 'Olimpiada'];
      salaryRange = '5 000 000 - 10 000 000 UZS';
    } else if (norm.includes('kimyo') || norm.includes('biolog')) {
      cleanTitle = norm.includes('kimyo') ? 'Kimyo fani o‘qituvchisi' : 'Biologiya fani o‘qituvchisi';
      subject = norm.includes('kimyo') ? 'kimyo fani' : 'biologiya fani';
      tagsList = ['Tibbiyotga tayyorlov', 'DTM', 'Olimpiada', 'Pedagogika', 'Laboratoriya'];
      salaryRange = '5 500 000 - 11 000 000 UZS';
    } else if (norm.includes('boshlang') || norm.includes('tarbiyachi')) {
      cleanTitle = norm.includes('tarbiyachi') ? 'Bolalar bog‘chasi tarbiyachisi' : 'Boshlang‘ich sinf o‘qituvchisi';
      subject = 'boshlang‘ich ta’lim va bolalar rivojlanishi';
      tagsList = ['Boshlang‘ich ta’lim', 'Pedagogika', 'Bolalar psixologiyasi', 'Chiroyli yozuv', 'Mental arifmetika'];
      salaryRange = '4 000 000 - 8 000 000 UZS';
    } else {
      cleanTitle = formatTitle(rawTitle);
      subject = 'o‘z yo‘nalishi bo‘yicha fan';
      tagsList = ['Pedagogika', 'Dars metodikasi', 'Interaktiv ta’lim', 'Nazorat testlari'];
      salaryRange = '5 000 000 - 10 000 000 UZS';
    }

    const description = `🏢 Kompaniya / Muassasa haqida:
Bizning ta’lim maskanimiz o‘quvchilarga xalqaro standartlar asosida sifatli bilim berish, ularning qobiliyatlarini ro‘yobga chiqarish va oliy ta’lim muassasalariga muvaffaqiyatli kirishlariga ko‘maklashishga ixtisoslashgan. Jamoamizga o‘z kasbini sevadigan, izlanuvchan va mas’uliyatli ${cleanTitle} lavozimiga mutaxassis taklif etamiz!

📋 Asosiy vazifalar va majburiyatlar:
• O‘quvchilarga ${subject} bo‘yicha zamonaviy va interaktiv uslubda qiziqarli darslar o‘tish;
• Dars rejalari, mavzuli tarqatma materiallar, nazorat testlari va uy vazifalarini sifatli tayyorlash;
• Har bir o‘quvchining o‘zlashtirish darajasini muntazam monitoring qilib borish va ota-onalar bilan haftalik hisobotlarni yuritish;
• O‘quvchilarni DTM testlari, litsey/oliygohlarga kirish imtihonlari hamda fan olimpiadalariga puxta tayyorlash;
• Markazning ochiq darslari, mahorat saboqlari va metodik kengashlarida faol ishtirok etish.

🎓 Nomzodga qo‘yiladigan talablar:
• Pedagogika yoki tegishli fan yo‘nalishi bo‘yicha oliy ma’lumot (bakalavr / magistr);
• O‘quv markazlari yoki maktablarda kamida 1-3 yillik samarali pedagogik tajriba;
• O‘quvchilar bilan iliq munosabat o‘rnata olish, sabr-toqatli va tushunarli uslubda ma’lumot yetkaza bilish;
• Zamonaviy interaktiv doskalar, elektron test tizimlari va ta’lim texnologiyalaridan erkin foydalanish;
• DTM standartlari, yangilangan o‘quv qo‘llanmalari va zamonaviy darsliklarni mukammal bilish.

💡 Qo‘shimcha afzalliklar:
• Xalqaro sertifikatlar yoki pedagogik toifalar mavjudligi;
• Shaxsiy o‘quv-metodik qo‘llanmalari yoki video-darslar tajribasi.

🎁 Biz nimalarni taklif qilamiz:
• Munosib va o‘z vaqtida to‘lanadigan oylik maosh (${salaryRange}) + iqtidorli o‘quvchilar natijasi uchun bonuslar;
• Zamonaviy mebellar, texnik vositalar va konditsioner bilan jihozlangan yorug‘ o‘quv xonalari;
• Qulay ish grafigi (to‘liq yoki yarim stavka kelishuv asosida);
• Kasbiy o‘sish uchun treninglar, mahorat darslari va tajribali ustozlar ko‘magi;
• Do‘stona, yosh va qo‘llab-quvvatlovchi professional jamoa hamda bepul qahva/choy.`;

    return {
      title: cleanTitle,
      company: companyName,
      category: 'Ta’lim & Fan',
      jobType: 'Full-time',
      experience: '1-3 yil',
      salary: salaryRange,
      location: defaultLoc,
      tags: tagsList.join(', '),
      description,
      suggestedTags: ['Pedagogika', 'DTM', 'Abituriyentlar', 'Oliy toifa', 'Olimpiada', 'Repetitorlik'],
      marketInsights: {
        demandLevel: 'Juda yuqori',
        averageSalary: '7 500 000 UZS',
        similarRoles: ['Matematika ustozi', 'Aniq fanlar repetitori', 'Mental arifmetika treneri', 'Oliy toifali o‘qituvchi'],
      },
    };
  }

  // 2. IT & SOFTWARE (IT & Dasturlash)
  if (
    norm.includes('react') ||
    norm.includes('frontend') ||
    norm.includes('front-end') ||
    norm.includes('backend') ||
    norm.includes('back-end') ||
    norm.includes('developer') ||
    norm.includes('dasturchi') ||
    norm.includes('python') ||
    norm.includes('golang') ||
    norm.includes('go ') ||
    norm.includes('java') ||
    norm.includes('flutter') ||
    norm.includes('devops') ||
    norm.includes('qa') ||
    norm.includes('testchi') ||
    norm.includes('mobile') ||
    norm.includes('android') ||
    norm.includes('ios') ||
    norm.includes('fullstack') ||
    norm.includes('full-stack') ||
    norm.includes('php') ||
    norm.includes('node')
  ) {
    let cleanTitle = formatTitle(rawTitle);
    let tagsList = ['TypeScript', 'Git', 'REST API', 'Docker', 'Agile'];
    let salaryRange = '12 000 000 - 25 000 000 UZS';

    if (norm.includes('react') || norm.includes('frontend')) {
      cleanTitle = 'Frontend Dasturchi (React / Next.js)';
      tagsList = ['React.js', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Redux Toolkit', 'REST API', 'Git'];
      salaryRange = '12 000 000 - 24 000 000 UZS';
    } else if (norm.includes('go') || norm.includes('golang')) {
      cleanTitle = 'Go (Golang) Backend Dasturchi';
      tagsList = ['Go', 'PostgreSQL', 'Redis', 'Docker', 'gRPC', 'Microservices', 'Kafka'];
      salaryRange = '18 000 000 - 35 000 000 UZS';
    } else if (norm.includes('python')) {
      cleanTitle = 'Python / Django Backend Dasturchi';
      tagsList = ['Python', 'Django', 'FastAPI', 'PostgreSQL', 'Celery', 'Docker', 'REST API'];
      salaryRange = '14 000 000 - 28 000 000 UZS';
    } else if (norm.includes('flutter') || norm.includes('mobile')) {
      cleanTitle = 'Mobile Dasturchi (Flutter / Dart)';
      tagsList = ['Flutter', 'Dart', 'BLoC / Provider', 'REST API', 'Firebase', 'App Store', 'Google Play'];
      salaryRange = '12 000 000 - 26 000 000 UZS';
    } else if (norm.includes('qa') || norm.includes('test')) {
      cleanTitle = 'QA Muhandisi (Manual & Automation)';
      tagsList = ['QA Testing', 'Postman', 'Test Cases', 'Cypress / Selenium', 'Jira', 'Bug Tracking'];
      salaryRange = '8 000 000 - 18 000 000 UZS';
    } else if (norm.includes('devops')) {
      cleanTitle = 'DevOps Muhandisi (CI/CD, Kubernetes)';
      tagsList = ['Docker', 'Kubernetes', 'CI/CD Pipelines', 'Linux', 'Terraform', 'Nginx', 'Monitoring'];
      salaryRange = '20 000 000 - 40 000 000 UZS';
    }

    const description = `🏢 Kompaniya haqida:
Biz zamonaviy, keng ko‘lamli va yuqori yuklamali axborot tizimlarini yaratuvchi texnologik kompaniyamiz. Mahsulotlarimizni yangi bosqichga olib chiqish maqsadida jamoamizga kuchli va mas’uliyatli ${cleanTitle} izlamoqdamiz!

📋 Asosiy vazifalar va majburiyatlar:
• Mahsulot arxitekturasini loyihalash, yangi funksionalliklarni ishlab chiqish va ishlab chiqarishga chiqarish;
• Toza, sinovdan o‘tgan va o‘qilishi oson (Clean Code) kod yozish hamda jamoaviy Code Review jarayonlarida faol qatnashish;
• Xizmatlar tezkorligi, xavfsizligi va barqarorligini tahlil qilish, optimallashtirish (Performance Tuning);
• Product va dizayn jamoalari bilan birgalikda foydalanuvchilar talablariga eng ma’qul yechimlarni topish;
• CI/CD konveyerlari orqali avtomatlashtirilgan testlar va doimiy relizlarni ta’minlash.

🎯 Nomzodga qo‘yiladigan talablar:
• Tegishli yo‘nalish bo‘yicha kamida 2-3 yillik tijoriy loyihalarda ishlab chiqish tajribasi;
• Texnologik stek: ${tagsList.slice(0, 4).join(', ')};
• Relyatsion (PostgreSQL) va NoSQL (Redis) ma’lumotlar bazalari bilan ishlash tajribasi;
• Git versiyalarni boshqarish tizimi va zamonaviy jamoaviy ish madaniyati (Agile/Scrum);
• Texnik hujjatlarni o‘qish va xalqaro hamjamiyat bilan muloqot qilish uchun yetarli ingliz tili darajasi.

🎁 Biz nimalarni taklif qilamiz:
• Yuqori va barqaror oylik maosh (${salaryRange}) + har choraklik KPI bonuslar;
• Zamonaviy MacBook / ishchi noutbuk hamda kerakli litsenziyalar;
• Moslashuvchan ish grafigi (Gibrid yoki ofis, kerak bo‘lganda masofaviy);
• Xalqaro konferensiyalar, kurslar va kasbiy sertifikatsiyalar xarajatlarini to‘liq qoplash;
• Qulay ofis (chill-out zona, PlayStation, bepul tushlik, qahva va mevalar).`;

    return {
      title: cleanTitle,
      company: companyName,
      category: 'IT & Dasturlash',
      jobType: 'Full-time',
      experience: '1-3 yil',
      salary: salaryRange,
      location: defaultLoc,
      tags: tagsList.join(', '),
      description,
      suggestedTags: tagsList,
      marketInsights: {
        demandLevel: 'Juda yuqori',
        averageSalary: '18 000 000 UZS',
        similarRoles: ['Full-stack Engineer', 'Senior Developer', 'Tech Lead', 'System Architect'],
      },
    };
  }

  // 3. FINANCE & ACCOUNTING (Moliya & Buxgalteriya)
  if (
    norm.includes('buxgalter') ||
    norm.includes('buxgalteriya') ||
    norm.includes('moliya') ||
    norm.includes('hisobchi') ||
    norm.includes('1c') ||
    norm.includes('auditor') ||
    norm.includes('kassir') ||
    norm.includes('soliq')
  ) {
    let cleanTitle = 'Bosh buxgalter';
    let tagsList = ['1C:Korxona 8.3', 'Didox / E-imzo', 'Soliq hisoboti', 'Statistika', 'Bank-klient', 'Audit'];
    let salaryRange = '8 000 000 - 18 000 000 UZS';

    if (norm.includes('bosh buxgalter')) {
      cleanTitle = 'Bosh buxgalter (Chief Accountant)';
      salaryRange = '12 000 000 - 22 000 000 UZS';
    } else if (norm.includes('1c') || norm.includes('operator')) {
      cleanTitle = '1C Operator / Moddiy hisobchi';
      tagsList = ['1C 8.3', 'Ombor hisobi', 'Birlamchi hujjatlar', 'Fakturalar', 'Excel'];
      salaryRange = '5 000 000 - 9 000 000 UZS';
    } else if (norm.includes('moliya') || norm.includes('tahlilchi')) {
      cleanTitle = 'Moliyaviy tahlilchi (Financial Analyst)';
      tagsList = ['Moliyaviy model', 'P&L', 'Cash Flow', 'Budgeting', 'Excel Advanced', 'Power BI'];
      salaryRange = '10 000 000 - 20 000 000 UZS';
    }

    const description = `🏢 Kompaniya haqida:
Biz o‘z sohasida yetakchi bo‘lgan, shaffof va barqaror faoliyat yurituvchi korxonamiz. Kompaniyaning moliyaviy barqarorligini ta’minlash va hisob-kitoblarni qat’iy tartibda yuritish uchun jamoamizga tajribali ${cleanTitle}ni qidirmoqdamiz.

📋 Asosiy vazifalar va majburiyatlar:
• Korxonaning to‘liq buxgalteriya va soliq hisobini amaldagi qonunchilikka asosan yuritish;
• Davlat soliq qo‘mitasi, Statistika boshqarmasi va Xalq bankiga barcha oylik/choraklik hisobotlarni o‘z vaqtida topshirish;
• 1C 8.3 dasturida birlamchi hujjatlar, hisob-fakturalar (Didox), to‘lov topshirig‘nomalari va aktlarni to‘liq rasmiylashtirish;
• Xodimlarning oylik maoshlari, kasallik varaqalari, mehnat ta’tillari va daromad soliqlarini to‘g‘ri hisoblash;
• Bank-Klient tizimi orqali to‘lovlarni nazorat qilish hamda kontragentlar bilan solishtirma dalolatnomalarni (Akt sverki) tuzish.

🎓 Nomzodga qo‘yiladigan talablar:
• Iqtisodiyot, moliya yoki buxgalteriya yo‘nalishi bo‘yicha oliy ma’lumot;
• O‘zbekiston Respublikasi Soliq kodeksi va MHXS (IFRS) standartlarini chuqur bilish;
• 1C:Korxona 8.3, Didox, Soliq.uz, My.mehnat.uz va Excel (VLOOKUP, Pivot) dasturlarida professional ishlash tajribasi;
• Sohada kamida 2-4 yillik muvaffaqiyatli ish tajribasi;
• Yuqori darajadagi diqqat-e’tibor, halollik va konfidentsiallik tamoyillariga rioya qilish.

🎁 Biz nimalarni taklif qilamiz:
• Rasmiy mehnat shartnomasi va kafolatlangan barqaror maosh (${salaryRange});
• Zamonaviy va qulay ofis sharoiti, barcha qonuniy litsenziyaga ega dasturiy ta’minot;
• Qonunchilikdagi o‘zgarishlar bo‘yicha malaka oshirish kurslari to‘lovi;
• Ahil jamoa va tushunarli rahbarlik.`;

    return {
      title: cleanTitle,
      company: companyName,
      category: 'Moliya & Buxgalteriya',
      jobType: 'Full-time',
      experience: '3-5 yil',
      salary: salaryRange,
      location: defaultLoc,
      tags: tagsList.join(', '),
      description,
      suggestedTags: tagsList,
      marketInsights: {
        demandLevel: 'Yuqori',
        averageSalary: '12 000 000 UZS',
        similarRoles: ['Bosh buxgalter', 'Moliyaviy direktor (CFO)', 'Audit mutaxassisi', 'Soliq maslahatchisi'],
      },
    };
  }

  // 4. MARKETING, SMM & SALES (Marketing & Savdo)
  if (
    norm.includes('smm') ||
    norm.includes('marketing') ||
    norm.includes('target') ||
    norm.includes('savdo') ||
    norm.includes('sotuv') ||
    norm.includes('sales') ||
    norm.includes('reklama') ||
    norm.includes('mobilograf') ||
    norm.includes('kopirayt') ||
    norm.includes('call') ||
    norm.includes('operator') ||
    norm.includes('rieltor')
  ) {
    let cleanTitle = 'SMM va Kontent menejeri';
    let tagsList = ['Instagram', 'Telegram', 'Reels / Shorts', 'Targeting', 'Canva', 'Kopirayting', 'Kontent-reja'];
    let salaryRange = '6 000 000 - 12 000 000 UZS';

    if (norm.includes('sotuv') || norm.includes('savdo') || norm.includes('sales')) {
      cleanTitle = 'Sotuv bo‘limi menejeri (B2B / B2C Sales)';
      tagsList = ['Muzokaralar', 'B2B savdo', 'AmoCRM', 'Sovuq qo‘ng‘iroqlar', 'Taqdimotlar', 'Mijozlar bazasi'];
      salaryRange = '5 000 000 - 15 000 000 UZS (+ % bonus)';
    } else if (norm.includes('mobilograf') || norm.includes('video')) {
      cleanTitle = 'Mobilograf / Video Montajchi';
      tagsList = ['iPhone video', 'CapCut', 'Premiere Pro', 'Reels montaj', 'Svet / Ovoz', 'Kreativlik'];
      salaryRange = '5 000 000 - 10 000 000 UZS';
    } else if (norm.includes('target')) {
      cleanTitle = 'Targetolog (Meta Ads & TikTok)';
      tagsList = ['Facebook Ads', 'Instagram Ads', 'Pixel', 'A/B Testing', 'Lidogeneratsiya', 'ROAS tahlil'];
      salaryRange = '7 000 000 - 14 000 000 UZS';
    }

    const description = `🏢 Kompaniya haqida:
Biz brendimizni yangi marralarga olib chiqayotgan, kreativ va shijoatli kompaniyamiz. Mahsulot va xizmatlarimizni keng ommaga yetkazish hamda savdo ko‘rsatkichlarini oshirish maqsadida jamoamizga o‘z ishining ustasi bo‘lgan ${cleanTitle}ni taklif qilamiz!

📋 Asosiy vazifalar va majburiyatlar:
• Kompaniyaning ijtimoiy tarmoqlardagi sahifalarini (Instagram, Telegram, TikTok, YouTube) professional yuritish;
• Maqsadli auditoriyani jalb qiluvchi haftalik va oylik kreativ kontent-rejalar (Media Plan) tuzish;
• Yuqori ko‘rishlar va jalb etuvchanlikka ega Reels, Stories hamda sifatli postlar yaratish;
• Target reklamalari sozlash, lidlar oqimini ko‘paytirish va sarflangan byudjet samaradorligini tahlil qilish;
• Auditoriya bilan doimiy muloqot: izohlar, direkt xabarlariga tezkor javob qaytarish va mijozlar ishonchini oshirish.

🎯 Nomzodga qo‘yiladigan talablar:
• SMM, marketing yoki savdo sohasida kamida 1-2 yillik amaliy tajriba va muvaffaqiyatli Keyslar (Portfolio);
• Trendlarni his qilish, kreativ fikrlash va qiziqarli matnlar (kopirayting) yozish mahorati;
• Foto va video ilovalar (CapCut, VN, Canva, Photoshop) bilan erkin ishlay olish;
• Tahliliy fikrlash, natijaga yo‘naltirilganlik va jamoa bilan mustahkam hamkorlik qila olish;
• O‘zbek va rus tillarida ravon so‘zlasha olish va savodli yoza bilish.

🎁 Biz nimalarni taklif qilamiz:
• Doimiy o‘suvchi daromad (${salaryRange});
• Ijodiy erkinlik va g‘oyalaringizni amaliyotga tatbiq qilish uchun to‘liq sharoit;
• Zamonaviy suratga olish texnikalari, yorug‘lik jihozlari va reklama byudjeti;
• Do‘stona, yosh va pozitiv jamoa, qulay ofis va qiziqarli korporativ tadbirlar.`;

    return {
      title: cleanTitle,
      company: companyName,
      category: 'Marketing & Savdo',
      jobType: 'Full-time',
      experience: '1-3 yil',
      salary: salaryRange,
      location: defaultLoc,
      tags: tagsList.join(', '),
      description,
      suggestedTags: tagsList,
      marketInsights: {
        demandLevel: 'Juda yuqori',
        averageSalary: '8 500 000 UZS',
        similarRoles: ['SMM Lead', 'Marketing Direktori', 'Targetolog', 'Brend Menejer'],
      },
    };
  }

  // 5. DESIGN & CREATIVE (Dizayn & UX)
  if (
    norm.includes('dizayn') ||
    norm.includes('design') ||
    norm.includes('ux') ||
    norm.includes('ui') ||
    norm.includes('figma') ||
    norm.includes('grafik') ||
    norm.includes('photoshop') ||
    norm.includes('illustrat') ||
    norm.includes('3d') ||
    norm.includes('interyer')
  ) {
    let cleanTitle = 'Grafik Dizayner (Graphic & Brand Designer)';
    let tagsList = ['Photoshop', 'Illustrator', 'Figma', 'Brending', 'Poligrafiya', 'Bannerlar', 'Kreativlik'];
    let salaryRange = '6 000 000 - 14 000 000 UZS';

    if (norm.includes('ux') || norm.includes('ui') || norm.includes('figma')) {
      cleanTitle = 'UI/UX Dizayner (Web & Mobile)';
      tagsList = ['Figma', 'UI/UX', 'Design System', 'Prototyping', 'User Research', 'Wireframes'];
      salaryRange = '10 000 000 - 20 000 000 UZS';
    } else if (norm.includes('3d') || norm.includes('interyer')) {
      cleanTitle = '3D Vizualizator va Interyer Dizayneri';
      tagsList = ['3ds Max', 'Corona Renderer', 'AutoCAD', '3D Modeling', 'Interyer Dizayn'];
      salaryRange = '8 000 000 - 18 000 000 UZS';
    }

    const description = `🏢 Kompaniya haqida:
Biz estetik go‘zallik, qulaylik va zamonaviy yechimlarni qadrlaydigan jamoamiz. Mahsulotlarimiz vizual qiyofasini yaratish uchun iqtidorli va estetik didga ega ${cleanTitle}ni o‘z saflarimizga qo‘shilishga taklif qilamiz!

📋 Asosiy vazifalar va majburiyatlar:
• Kompaniyaning barcha vizual materiallari (bannerlar, ijtimoiy tarmoq postlari, reklama maketlari)ni yaratish;
• Brendbuk va korporativ uslub (Identity) qoidalariga qat’iy rioya qilgan holda brending konsepsiyalarini ishlab chiqish;
• Poligrafiya mahsulotlari (buklet, flayer, katalog, qadoqlash dizayni)ni chop etishga tayyorlash (Pre-press);
• Marketing jamoasi bilan yaqindan hamkorlikda yangi kreativ g‘oyalar va vizual yechimlarni taqdim etish;
• Dizayn fayllarini tartibli saqlash va zamonaviy dizayn trendlariga moslashib borish.

🎯 Nomzodga qo‘yiladigan talablar:
• Adobe Photoshop, Illustrator va Figma dasturlarida professional darajada ishlash ko‘nikmasi;
• Kamida 1-2 yillik tajriba va o‘z uslubini ko‘rsatuvchi mustahkam Portfolio (Behance / Dribbble / PDF);
• Kompozitsiya, ranglar uyg‘unligi (Color Theory) va tipografika qoidalarini chuqur tushunish;
• Muddatlarga (Deadlines) mas’uliyat bilan yondashish va konstruktiv fikrlarni to‘g‘ri qabul qila olish;
• Ijodiy yondashuv va yangiliklarga ochiqlik.

🎁 Biz nimalarni taklif qilamiz:
• Munosib va o‘z vaqtida to‘lanadigan daromad (${salaryRange});
• Kuchli texnik uskuna (iMac / kuchli grafik ish stansiyasi va grafik planshet);
• Ijodiy fikrlash uchun barcha qulayliklarga ega zamonaviy ofis muhiti;
• Do‘stona jamoa va yirik qiziqarli loyihalarda ishtirok etish imkoniyati.`;

    return {
      title: cleanTitle,
      company: companyName,
      category: 'Dizayn & UX',
      jobType: 'Full-time',
      experience: '1-3 yil',
      salary: salaryRange,
      location: defaultLoc,
      tags: tagsList.join(', '),
      description,
      suggestedTags: tagsList,
      marketInsights: {
        demandLevel: 'Yuqori',
        averageSalary: '10 000 000 UZS',
        similarRoles: ['Senior UI/UX Designer', 'Art Director', 'Motion Designer', 'Brand Strategist'],
      },
    };
  }

  // 6. HEALTHCARE & MEDICINE (Tibbiyot & Salomatlik)
  if (
    norm.includes('shifokor') ||
    norm.includes('doktor') ||
    norm.includes('vrach') ||
    norm.includes('hamshira') ||
    norm.includes('medsestra') ||
    norm.includes('stomatolog') ||
    norm.includes('tish') ||
    norm.includes('farmatsevt') ||
    norm.includes('dorixona') ||
    norm.includes('tibbiy')
  ) {
    let cleanTitle = 'Shifokor-mutaxassis';
    let tagsList = ['Tibbiy diplom', 'Bemorlar qabuli', 'Diagnostika', 'Davolash rejalari', 'Deontologiya'];
    let salaryRange = '6 000 000 - 15 000 000 UZS';

    if (norm.includes('stomatolog') || norm.includes('tish')) {
      cleanTitle = 'Shifokor Stomatolog (Terapevt / Ortoped)';
      tagsList = ['Stomatologiya', 'Tish davolash', 'Zamonaviy uskunalar', 'Rentgen tahlili', 'Gigiyena'];
      salaryRange = '8 000 000 - 20 000 000 UZS';
    } else if (norm.includes('hamshira') || norm.includes('medsestra')) {
      cleanTitle = 'Malakali Hamshira (Medsestra)';
      tagsList = ['Muolajalar', 'Vena ichiga ukol', 'Tibbiy sterilizatsiya', 'Birinchi yordam', 'Parvarish'];
      salaryRange = '4 000 000 - 7 500 000 UZS';
    } else if (norm.includes('farmatsevt') || norm.includes('dorixona')) {
      cleanTitle = 'Farmatsevt-Provizor';
      tagsList = ['Dorilar nazorati', 'Retseptlar', 'Farmakologiya', 'Kassa hisobi', 'Mijozlarga maslahat'];
      salaryRange = '5 000 000 - 9 000 000 UZS';
    }

    const description = `🏢 Tibbiy muassasa haqida:
Biz bemorlar salomatligini eng oliy qadriyat deb biluvchi, zamonaviy diagnostika va davolash uskunalariga ega klinikamiz. Jamoamizni kengaytirish maqsadida o‘z ishiga fidoyi ${cleanTitle}ni ishga qabul qilamiz.

📋 Asosiy vazifalar va majburiyatlar:
• Bemorlarni malakali qabul qilish, tekshirish va to‘g‘ri tashxis qo‘yish;
• Xalqaro va milliy tibbiy protokollar asosida individual davolash rejalarini tuzish;
• Tibbiy hujjatlar va elektron kartalarni to‘g‘ri hamda aniq yuritish;
• Bemorlarga mehr va xushmuomalalik bilan munosabatda bo‘lish, profilaktika tavsiyalarini berish;
• Sanitariya-gigiyena va sterilizatsiya talablariga qat’iy rioya qilish.

🎓 Nomzodga qo‘yiladigan talablar:
• Tegishli yo‘nalish bo‘yicha tugallangan oliy (yoki o‘rta maxsus) tibbiy ma’lumot va litsenziya/sertifikat;
• O‘z mutaxassisligi bo‘yicha kamida 1-3 yillik amaliy klinik ish tajribasi;
• Zamonaviy tibbiy texnika va dori vositalarini chuqur bilish;
• Bemorlar bilan psixologik til topisha olish, halollik va yuksak mas’uliyat.

🎁 Biz nimalarni taklif qilamiz:
• Munosib va barqaror oylik maosh (${salaryRange}) + har bir qabul uchun ustamalar;
• Eng zamonaviy Yevropa tibbiy jihozlari bilan ishlash imkoniyati;
• Do‘stona va professional shifokorlar jamoasi, qulay sharoitlar.`;

    return {
      title: cleanTitle,
      company: companyName,
      category: 'Tibbiyot & Salomatlik',
      jobType: 'Full-time',
      experience: '1-3 yil',
      salary: salaryRange,
      location: defaultLoc,
      tags: tagsList.join(', '),
      description,
      suggestedTags: tagsList,
      marketInsights: {
        demandLevel: 'Juda yuqori',
        averageSalary: '8 000 000 UZS',
        similarRoles: ['Bosh shifokor', 'Terapevt', 'Klinika koordinatori', 'Diagnostika mutaxassisi'],
      },
    };
  }

  // 7. TRANSPORT & LOGISTICS (Transport & Logistika)
  if (
    norm.includes('haydovch') ||
    norm.includes('voditel') ||
    norm.includes('logistik') ||
    norm.includes('dispetcher') ||
    norm.includes('kuryer') ||
    norm.includes('ombor') ||
    norm.includes('yuk') ||
    norm.includes('gruzchik')
  ) {
    let cleanTitle = 'Logistika menejeri va Dispetcher';
    let tagsList = ['Yuk tashish', 'Logistika', 'Dispetcherlik', 'Yo‘nalishlar nazorati', 'Xalqaro yuklar', 'CMR'];
    let salaryRange = '6 000 000 - 14 000 000 UZS';

    if (norm.includes('haydovch') || norm.includes('voditel')) {
      cleanTitle = 'Haydovchi (Kompaniya avtomashinasida / BC toifa)';
      tagsList = ['Haydovchilik guvohnomasi BC', 'Shaharni bilish', 'Yo‘l harakati qoidalari', 'Avto parvarishi'];
      salaryRange = '5 000 000 - 9 000 000 UZS';
    } else if (norm.includes('kuryer')) {
      cleanTitle = 'Tezkor Kuryer (Yetkazib beruvchi)';
      tagsList = ['Yetkazib berish', 'Tezkorlik', 'Navigatsiya', 'Xushmuomalalik', 'Ilova orqali ishlash'];
      salaryRange = '4 500 000 - 8 500 000 UZS';
    } else if (norm.includes('ombor')) {
      cleanTitle = 'Ombor mudiri (Sklad nazoratchisi)';
      tagsList = ['Ombor hisobi', 'Birlamchi qabul', '1C Sklad', 'Inventarizatsiya', 'Yuk ortish'];
      salaryRange = '5 000 000 - 10 000 000 UZS';
    }

    const description = `🏢 Kompaniya haqida:
Biz ishonchli va tezkor logistika xizmatlarini ko‘rsatuvchi yetakchi kompaniyalardan birimiz. Mahsulotlarni o‘z vaqtida va xavfsiz manzilga yetkazilishini ta’minlash maqsadida ${cleanTitle}ni qidirmoqdamiz.

📋 Asosiy vazifalar va majburiyatlar:
• Yuklarni tashish va yetkazib berish jarayonlarini samarali rejalashtirish hamda nazorat qilish;
• Haydovchilar bilan doimiy aloqa o‘rnatish, optimal yo‘nalishlarni (marshrutlarni) belgilash;
• Barcha yuk hujjatlarini (nakladnoy, schyot-faktura, aktlar) to‘g‘ri rasmiylashtirish;
• Yuklarning butunligi va xavfsizligini ta’minlash, vujudga kelgan vaziyatlarni tezkor hal qilish;
• Transport vositalarining texnik holatini muntazam nazorat qilib borish.

🎯 Nomzodga qo‘yiladigan talablar:
• O‘z yo‘nalishi bo‘yicha kamida 1-2 yillik amaliy tajriba;
• Toshkent shahri va viloyatlar yo‘nalishlarini, yo‘l harakati hamda logistika qoidalarini yaxshi bilish;
• Mas’uliyatlilik, tartiblilik va tezkor qaror qabul qila olish qobiliyati;
• Aloqa vositalari va navigatsiya tizimlaridan erkin foydalana olish.

🎁 Biz nimalarni taklif qilamiz:
• Barqaror va o‘z vaqtida to‘lanadigan oylik maosh (${salaryRange});
• Yoqilg‘i (benzin/gaz) va avtomobil xarajatlari to‘liq kompaniya hisobidan;
• Korporativ aloqa va qulay ish grafigi.`;

    return {
      title: cleanTitle,
      company: companyName,
      category: 'Transport & Logistika',
      jobType: 'Full-time',
      experience: '1-3 yil',
      salary: salaryRange,
      location: defaultLoc,
      tags: tagsList.join(', '),
      description,
      suggestedTags: tagsList,
      marketInsights: {
        demandLevel: 'Yuqori',
        averageSalary: '7 500 000 UZS',
        similarRoles: ['Katta dispetcher', 'Xalqaro logist', 'Avtopark boshlig‘i'],
      },
    };
  }

  // 8. SERVICE, RESTAURANT & HOSPITALITY (Servis & Xizmat ko‘rsatish)
  if (
    norm.includes('oshpaz') ||
    norm.includes('povar') ||
    norm.includes('ofitsiant') ||
    norm.includes('barista') ||
    norm.includes('barmen') ||
    norm.includes('administrator') ||
    norm.includes('konditer') ||
    norm.includes('qandolat') ||
    norm.includes('sartarosh') ||
    norm.includes('stilist')
  ) {
    let cleanTitle = 'Bosh oshpaz (Chef)';
    let tagsList = ['Milliy taomlar', 'Yevropa taomlari', 'Sanitariya qoidalari', 'Menyu tuzish', 'Texnologik karta'];
    let salaryRange = '6 000 000 - 15 000 000 UZS';

    if (norm.includes('barista') || norm.includes('barmen')) {
      cleanTitle = 'Professional Barista / Barmen';
      tagsList = ['Qahva tayyorlash', 'Latte-art', 'Kofe mashina parvarishi', 'Xushmuomalalik', 'Kassa'];
      salaryRange = '4 500 000 - 8 000 000 UZS';
    } else if (norm.includes('ofitsiant')) {
      cleanTitle = 'Ofitsiant (Xushmuomala xizmatchi)';
      tagsList = ['Servis madaniyati', 'Menyuni bilish', 'Mehmonlarni kutib olish', 'Tezkorlik', 'I-Check'];
      salaryRange = '4 000 000 - 8 000 000 UZS (+ choypuli)';
    } else if (norm.includes('konditer') || norm.includes('qandolat')) {
      cleanTitle = 'Qandolatchi-Usta (Konditer)';
      tagsList = ['Tortlar', 'Desertlar', 'Xamir pishirish', 'Bezatish san’ati', 'Gigiyena'];
      salaryRange = '5 500 000 - 12 000 000 UZS';
    }

    const description = `🏢 Muassasa haqida:
Biz shinam va mehmondo‘st muhitga ega restoran/kafe tarmog‘imiz. Mehmonlarimizga eng lazzatli taomlar va yuqori darajadagi xizmatni taqdim etish uchun o‘z kasbining mohir ustasi bo‘lgan ${cleanTitle}ni jamoamizga taklif qilamiz!

📋 Asosiy vazifalar va majburiyatlar:
• O‘rnatilgan texnologik xaritalar va retseptura asosida sifatli, mazali mahsulotlarni tayyorlash;
• Ish joyi, idish-tovoqlar va oshxona anjomlarining tozaligini yuqori sanitariya qoidalariga binoan saqlash;
• Mahsulotlarning yaroqlilik muddatlari va to‘g‘ri saqlanishini (tovarnoye sosedstvo) qat’iy nazorat qilish;
• Buyurtmalarni tezkor, chiroyli va me’yorida taqdim etish;
• Mehmonlar bilan xushmuomalalik bilan munosabat o‘rnatish va ularning mamnuniyatini oshirish.

🎯 Nomzodga qo‘yiladigan talablar:
• Mazkur sohada kamida 1-2 yillik tajriba;
• O‘z kasbini sevish, mas’uliyatlilik, tozalik va chaqqonlik;
• Jamoada do‘stona ishlash va stressga chidamlilik;
• Amal qiluvchi tibbiy daftarcha (Sanitarnaya knijka) mavjudligi.

🎁 Biz nimalarni taklif qilamiz:
• Barqaror va o‘z vaqtida to‘lanadigan daromad (${salaryRange}) + kunlik choypuli va bonuslar;
• Mazali va to‘yimli bepul 2-3 mahal ovqatlanish;
• Chiroyli maxsus ish kiyimi (uniforma);
• Ahil va qo‘llab-quvvatlovchi jamoa, martaba o‘sishi imkoniyati.`;

    return {
      title: cleanTitle,
      company: companyName,
      category: 'Servis & Xizmat ko‘rsatish',
      jobType: 'Full-time',
      experience: '1-3 yil',
      salary: salaryRange,
      location: defaultLoc,
      tags: tagsList.join(', '),
      description,
      suggestedTags: tagsList,
      marketInsights: {
        demandLevel: 'Yuqori',
        averageSalary: '7 000 000 UZS',
        similarRoles: ['Bosh oshpaz', 'Restoran menejeri', 'Bar menejer', 'Servis treneri'],
      },
    };
  }

  // 9. CONSTRUCTION & ENGINEERING (Qurilish & Ishlab chiqarish)
  if (
    norm.includes('qurilish') ||
    norm.includes('prorab') ||
    norm.includes('muhandis') ||
    norm.includes('injener') ||
    norm.includes('arxitektor') ||
    norm.includes('usta') ||
    norm.includes('elektrik') ||
    norm.includes('santexnik') ||
    norm.includes('payvand') ||
    norm.includes('svarchik') ||
    norm.includes('zavod') ||
    norm.includes('sex')
  ) {
    let cleanTitle = 'Qurilish uchastka boshlig‘i (Prorab / Muhandis)';
    let tagsList = ['Qurilish nazorati', 'Chizmalar bilan ishlash', 'AutoCAD', 'Smeta hisobi', 'Xavfsizlik texnikasi'];
    let salaryRange = '8 000 000 - 18 000 000 UZS';

    if (norm.includes('arxitektor') || norm.includes('chizma')) {
      cleanTitle = 'Bosh Arxitektor-Loyihachi';
      tagsList = ['AutoCAD', 'Revit', 'ArchiCAD', 'Bino loyihalash', 'ShNQ qoidalari'];
      salaryRange = '10 000 000 - 22 000 000 UZS';
    } else if (norm.includes('elektrik')) {
      cleanTitle = 'Bosh Elektrik (Muhandis-elektr)';
      tagsList = ['Elektr montaj', 'Sxemalar', 'Elektr xavfsizligi', 'Yuqori kuchlanish', 'Avtomatika'];
      salaryRange = '5 500 000 - 11 000 000 UZS';
    }

    const description = `🏢 Kompaniya haqida:
Biz sifatli va mustahkam binolar barpo etayotgan yirik qurilish-ishlab chiqarish korxonasimiz. Yangi obyektlarimizni o‘z vaqtida va xavfsiz foydalanishga topshirish uchun tajribali ${cleanTitle}ni jamoamizga chorlaymiz.

📋 Asosiy vazifalar va majburiyatlar:
• Obyektdagi qurilish-montaj ishlarini tasdiqlangan loyiha-smeta hujjatlari asosida tashkillashtirish;
• Qurilish materiallarining qabul qilinishi, to‘g‘ri sarflanishi va sifatini qat’iy nazorat qilish;
• Ishchilar va ustalarga kundalik vazifalarni taqsimlash hamda ularning bajarilishini tekshirish;
• Mehnat muhofazasi va texnika xavfsizligi (Tox) qoidalariga rioya etilishini ta’minlash;
• Bajarilgan ishlar bo‘yicha texnik hisobotlar va dalolatnomalarni o‘z vaqtida rasmiylashtirish.

🎯 Nomzodga qo‘yiladigan talablar:
• Qurilish yoki muhandislik yo‘nalishi bo‘yicha oliy yoki o‘rta maxsus ma’lumot;
• Sohada kamida 2-4 yillik amaliy qurilish tajribasi;
• Arxitektura chizmalari va loyihalarni mukammal o‘qiy olish;
• Yetakchilik qobiliyati, mas’uliyat va jamoani boshqara bilish mahorati.

🎁 Biz nimalarni taklif qilamiz:
• Rasmiy mehnat munosabatlari va kafolatlangan yuqori maosh (${salaryRange});
• Maxsus qulay kiyim-bosh, himoya vositalari va obyektda bepul issiq ovqat;
• Muvaffaqiyatli topshirilgan obyektlar uchun yillik yirik bonuslar.`;

    return {
      title: cleanTitle,
      company: companyName,
      category: 'Qurilish & Ishlab chiqarish',
      jobType: 'Full-time',
      experience: '3-5 yil',
      salary: salaryRange,
      location: defaultLoc,
      tags: tagsList.join(', '),
      description,
      suggestedTags: tagsList,
      marketInsights: {
        demandLevel: 'Juda yuqori',
        averageSalary: '11 000 000 UZS',
        similarRoles: ['Bosh muhandis (GIP/GAP)', 'Texnik nazoratchi', 'Smeta muhandisi'],
      },
    };
  }

  // 10. HR & GENERAL MANAGEMENT (HR & Menejment)
  if (
    norm.includes('hr') ||
    norm.includes('rekruter') ||
    norm.includes('xodim') ||
    norm.includes('kadr') ||
    norm.includes('recruiter') ||
    norm.includes('menejer') ||
    norm.includes('boshqaruvchi') ||
    norm.includes('direktor')
  ) {
    const cleanTitle = norm.includes('rekruter') ? 'HR Rekruter (Talent Acquisition)' : 'HR Menejer (Kadrlar boshqaruvi)';
    const tagsList = ['HR boshqaruvi', 'Ishga qabul (Recruitment)', 'Intervyu o‘tkazish', 'Adaptatsiya', 'Mehnat kodeksi', 'KPI'];
    const salaryRange = '7 000 000 - 16 000 000 UZS';

    const description = `🏢 Kompaniya haqida:
Biz jamoamiz xodimlarini eng asosiy boyligimiz deb hisoblovchi, o‘z sohasida yetakchi kompaniyamiz. Yangi iqtidorlarni topish va korporativ muhitni yanada rivojlantirish uchun tajribali ${cleanTitle}ni izlamoqdamiz.

📋 Asosiy vazifalar va majburiyatlar:
• Bo‘sh ish o‘rinlari bo‘yicha malakali mutaxassislarni izlash, saralash va suhbatlar o‘tkazish;
• Yangi xodimlarni kompaniya qadriyatlari va ish jarayonlariga tezkor moslashtirish (Onboarding & Adaptatsiya);
• Mehnat qonunchiligi asosida xodimlarning shaxsiy hujjatlari, buyruqlar va ta’tillar hisobini yuritish;
• Jamoaviy ruhni oshiruvchi korporativ tadbirlar, treninglar va motivatsiya tizimlarini tashkil etish;
• Xodimlar qoniqish darajasini o‘rganish va kadrlarning qo‘nimsizligini oldini olish bo‘yicha takliflar kiritish.

🎯 Nomzodga qo‘yiladigan talablar:
• Oliy ma’lumot (HR, psixologiya, menejment yoki iqtisodiyot);
• HR yoki rekruting sohasida kamida 2 yillik samarali amaliy tajriba;
• Odamlar psixologiyasini tushunish, muzokaralar olib borish va intervyu o‘tkazish mahorati;
• O‘zbekiston Respublikasining yangi Mehnat kodeksini bilish;
• Xushmuomalalik, diqqat-e’tibor va tashkilotchilik qobiliyati.

🎁 Biz nimalarni taklif qilamiz:
• Munosib oylik maosh (${salaryRange}) + muvaffaqiyatli yopilgan vakansiyalar uchun bonuslar;
• Zamonaviy va qulay ofis sharoiti, korporativ ta’lim va treninglar;
• Mustaqil qaror qabul qilish erkinligi va do‘stona jamoa.`;

    return {
      title: cleanTitle,
      company: companyName,
      category: 'HR & Menejment',
      jobType: 'Full-time',
      experience: '1-3 yil',
      salary: salaryRange,
      location: defaultLoc,
      tags: tagsList.join(', '),
      description,
      suggestedTags: tagsList,
      marketInsights: {
        demandLevel: 'Yuqori',
        averageSalary: '9 500 000 UZS',
        similarRoles: ['HR Director', 'Talent Lead', 'Kadrlar bo‘limi boshlig‘i', 'Ofis menejeri'],
      },
    };
  }

  // 11. GENERAL / ANY OTHER PROFESSION (Universal Semantic Generator)
  const cleanTitle = formatTitle(rawTitle) || 'Malakali Mutaxassis';
  const tagsList = [cleanTitle, 'Kasbiy tajriba', 'Mas’uliyatlilik', 'Jamoada ishlash', 'O‘sish imkoniyati'];
  const salaryRange = '5 000 000 - 10 000 000 UZS';

  const description = `🏢 Kompaniya haqida:
Biz o‘z sohasida barqaror va jadal rivojlanayotgan jamoamiz. Mijozlarimizga yuqori sifatli xizmat ko‘rsatish va yangi cho‘qqilarni zabt etish maqsadida o‘z ishining ustasi bo‘lgan ${cleanTitle} lavozimiga mas’uliyatli mutaxassisni taklif qilamiz!

📋 Asosiy vazifalar va majburiyatlar:
• ${cleanTitle} lavozimi bo‘yicha belgilangan vazifalarni sifatli, to‘liq va belgilangan muddatda bajarish;
• Korxonaning ichki tartib-qoidalari, xavfsizlik va xizmat ko‘rsatish standartlariga qat’iy rioya qilish;
• Bajarilgan ishlar bo‘yicha zarur hisobot va ma’lumotlarni rahbariyatga taqdim etib borish;
• Jamoaning boshqa a’zolari bilan yaqindan hamkorlikda umumiy maqsadlarga erishishga hissa qo‘shish;
• Ish jarayonlarini takomillashtirish va samaradorlikni oshirish bo‘yicha takliflar bildirish.

🎯 Nomzodga qo‘yiladigan talablar:
• O‘z yo‘nalishi bo‘yicha tegishli bilim, ma’lumot va amaliy ish tajribasi;
• Mas’uliyatlilik, halollik, intizom va berilgan topshiriqlarni mustaqil bajara olish;
• O‘rganishga ishtiyoq, yangiliklarni tez o‘zlashtirish va rivojlanishga intilish;
• Xushmuomalalik va jamoada o‘zaro hurmat bilan ishlash qobiliyati.

🎁 Biz nimalarni taklif qilamiz:
• Munosib va o‘z vaqtida to‘lanadigan oylik maosh (${salaryRange}) + natijadorlik bonuslari;
• Qulay va xavfsiz mehnat sharoiti, barcha kerakli ish anjomlari bilan ta’minlanish;
• Kasbiy mahoratni oshirish uchun imkoniyatlar va do‘stona hamkasblar jamoasi;
• Rasmiy mehnat munosabatlari va barqarorlik.`;

  return {
    title: cleanTitle,
    company: companyName,
    category: 'Mijozlarga xizmat',
    jobType: 'Full-time',
    experience: '1-3 yil',
    salary: salaryRange,
    location: defaultLoc,
    tags: tagsList.join(', '),
    description,
    suggestedTags: tagsList,
    marketInsights: {
      demandLevel: 'Yuqori',
      averageSalary: '7 000 000 UZS',
      similarRoles: [cleanTitle, 'Yetakchi mutaxassis', 'Bosh mutaxassis'],
    },
  };
}
