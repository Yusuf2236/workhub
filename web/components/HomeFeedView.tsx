'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  Newspaper,
  MessageCircle,
  ThumbsUp,
  Briefcase,
  ArrowRight,
  Eye,
  Calendar,
  Clock,
  Send,
  Building2,
  MapPin,
  ChevronRight,
  CheckCircle2,
  Award,
  DollarSign,
  Heart,
  X,
  Plus
} from 'lucide-react';
import { Language, translations } from '../lib/translations';

interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  image: string;
  author: string;
  authorRole: string;
  date: string;
  readTime: string;
  views: number;
  likes: number;
  tags: string[];
}

interface CommentItem {
  id: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
  likes: number;
  likedByMe?: boolean;
  repliesCount: number;
  topicTag: string;
}

interface CompanySpotlight {
  id: string;
  name: string;
  industry: string;
  location: string;
  openPositions: number;
  logo: string;
  coverImage: string;
  verified: boolean;
  tagline: string;
}

interface HomeFeedViewProps {
  vacancies: any[];
  onSelectVacancy: (vacancy: any) => void;
  onNavigateToVacancies: () => void;
  onOpenCreateResume: () => void;
  onOpenCreateVacancy: () => void;
  onApplyVacancy: (vacancy: any) => void;
  isSaved?: (id: string) => boolean;
  onToggleSave?: (vacancy: any) => void;
  currentUser: any;
  lang?: Language;
}

const NEWS_DATA: Record<Language, NewsItem[]> = {
  uz: [
    {
      id: 'news-1',
      title: "O'zbekistonda 2026-yilda eng yuqori maosh to'lanadigan 10 ta IT va Fintech yo'nalishi",
      excerpt: "Mehnat bozori tahlili: Go backend, AI integratsiyalari va kiberxavfsizlik mutaxassislariga bo'lgan talab 45% ga oshdi. O'rtacha oylik maoshlar $1,500 dan $4,000 gacha yetmoqda.",
      content: `O'zbekiston raqamli iqtisodiyoti tez sur'atlar bilan rivojlanmoqda. 2026-yilning birinchi choragi yakunlariga ko'ra, fintech, bank tizimlari va xalqaro autsorsing bozorida yuqori malakali mutaxassislarga bo'lgan ehtiyoj rekord darajaga yetdi.

Eng talabgir yo'nalishlar:
1. Backend muhandislari (Go, Java, Python microservices)
2. Sun'iy intellekt va Data Engineering mutaxassislari
3. Kiberxavfsizlik va DevSecOps muhandislari
4. High-load Fintech tizimlari arxitektorlari
5. Mobil dasturchilar (Flutter, Swift, Kotlin)

Tahlillarga ko'ra, ingliz tilini yaxshi biladigan va xalqaro loyihalarda ishlash tajribasiga ega nomzodlar uchun oylik maosh o'rtacha 30% yuqoriroq taklif qilinmoqda.`,
      category: 'Bozor tahlili',
      image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80',
      author: 'Sanjar Rahimov',
      authorRole: 'Bozor tahlilchisi, WZone Research',
      date: '28-sentyabr, 2026',
      readTime: '4 daqiqa',
      views: 1420,
      likes: 89,
      tags: ['Fintech', 'IT Bozor', 'Maoshlar', 'Tahlil'],
    },
    {
      id: 'news-2',
      title: "Toshkentda 'Tech Careers Summit 2026' yirik xalqaro ish yarmarkasi start oldi",
      excerpt: "50 dan ortiq yirik texnologik kompaniyalar, jumladan IT Park rezidentlari va xorijiy korxonalar 1,000 dan ziyod ochiq bo'sh ish o'rinlarini taqdim etmoqda.",
      content: `Bugun poytaxtimizda yilning eng yirik karyera forumi o'z ishini boshladi. Forumda Uzum, EPAM, Payme, Click va boshqa yetakchi texnologiya gigantlari o'zlarining bo'sh ish o'rinlari va amaliyot dasturlari bilan qatnashmoqda.

Tadbir doirasida:
- HR mutaxassislari bilan to'g'ridan-to'g'ri ekspress suhbatlar
- Rezyumelarni sun'iy intellekt orqali bepul audit qilish
- Xalqaro loyihalarga masofaviy qabul jarayonlari o'tkazilmoqda.

WZone portali forumning rasmiy raqamli hamkori sifatida barcha arizalarni onlayn qabul qilmoqda.`,
      category: 'Tadbirlar',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
      author: 'Aziza Yo‘ldosheva',
      authorRole: 'Tadbir koordinatori',
      date: '27-sentyabr, 2026',
      readTime: '3 daqiqa',
      views: 2150,
      likes: 142,
      tags: ['Tadbir', 'Vakansiyalar', 'Expo', 'Toshkent'],
    },
    {
      id: 'news-3',
      title: "Sun'iy intellekt davrida zamonaviy rezyume: HR mutaxassislaridan 6 ta amaliy qoida",
      excerpt: "Rezyumengiz ATS filtrlaridan o'tishi va birinchi 10 soniyada ish beruvchi e'tiborini jalb qilishi uchun qanday tuzilishi lozim? WZone AI tavsiyalari.",
      content: `Zamonaviy rekrutingda dastlabki saralash ko'pincha avtomatlashtirilgan tizimlar orqali amalga oshiriladi. Shu sababli an'anaviy rezyumelar o'rniga aniq faktlar va natijalarga asoslangan portfolio talab qilinadi.

Asosiy tavsiyalar:
1. Natijalarni raqamlar bilan ifodalang (masalan: 'Loyihani 2 barobar tezlashtirdim').
2. Aniq texnologiyalar stekini ko'rsating va keraksiz umumiy gaplardan qoching.
3. GitHub, LinkedIn yoki portfolio havolalarini yangilab boring.
4. Har bir vakansiyaga moslashtirilgan motivatsion qism qo'shing.
5. WZone portali orqali rezyumeni OneID tasdiqlangan holda joylashtirish ishonchni 70% ga oshiradi.`,
      category: 'Karyera maslahati',
      image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=1200&q=80',
      author: 'Dilnoza Karimova',
      authorRole: 'Bosh rekruter & HR konsul',
      date: '26-sentyabr, 2026',
      readTime: '5 daqiqa',
      views: 3100,
      likes: 210,
      tags: ['Rezyume', 'Karyera', 'AI', 'Maslahat'],
    },
    {
      id: 'news-4',
      title: "Masofaviy ish (Remote) madaniyati: O'zbekistonlik mutaxassislar xalqaro loyihalarda qanday muvaffaqiyat qozonmoqda?",
      excerpt: "AQSH, Yevropa va Osiyo kompaniyalarida uyda o'tirib dollar va yevroda daromad topayotgan yosh mutaxassislar tajribasi va maslahatlari.",
      content: `Masofaviy ishlash endi faqat vaqtinchalik trend emas, balki qulaylik va yuqori daromad manbaiga aylandi. O'zbekistonda ro'yxatdan o'tgan frilanserlar va masofaviy xodimlar uchun soliq imtiyozlari joriy etilishi bu jarayonni yanada tezlashtirdi.

Asosiy muvaffaqiyat omillari:
- Vaqtni to'g'ri boshqarish (Time management)
- Ingliz tilida erkin muloqot va yozish ko'nikmasi
- Asinxron aloqa madaniyati (Slack, Jira, Gitlab).`,
      category: 'Masofaviy ish',
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
      author: 'Jahongir Po‘latov',
      authorRole: 'Xalqaro masofaviy muhandis',
      date: '25-sentyabr, 2026',
      readTime: '4 daqiqa',
      views: 1890,
      likes: 125,
      tags: ['Remote', 'Frilans', 'Xalqaro Ish', 'Tajriba'],
    },
  ],
  ru: [
    {
      id: 'news-1',
      title: "Топ-10 самых высокооплачиваемых направлений IT и Финтех в Узбекистане в 2026 году",
      excerpt: "Анализ рынка труда: спрос на Go бэкенд, интеграции ИИ и специалистов по кибербезопасности вырос на 45%. Средние зарплаты достигают от $1,500 до $4,000.",
      content: `Цифровая экономика Узбекистана стремительно развивается. По итогам первого квартала 2026 года спрос на высококвалифицированных специалистов в финтехе, банковском секторе и международном аутсорсинге достиг рекордных показателей.

Самые востребованные направления:
1. Бэкенд-инженеры (Go, Java, Python микросервисы)
2. Специалисты по Искусственному Интеллекту и Data Engineering
3. Инженеры кибербезопасности и DevSecOps
4. Архитекторы высоконагруженных финтех-платформ
5. Мобильные разработчики (Flutter, Swift, Kotlin)

Кандидатам со свободным английским и опытом в распределенных проектах предлагают зарплаты в среднем на 30% выше рынка.`,
      category: 'Анализ рынка',
      image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80',
      author: 'Санжар Рахимов',
      authorRole: 'Аналитик рынка, WZone Research',
      date: '28 сентября 2026',
      readTime: '4 мин',
      views: 1420,
      likes: 89,
      tags: ['Финтех', 'IT Рынок', 'Зарплаты', 'Аналитика'],
    },
    {
      id: 'news-2',
      title: "В Ташкенте стартовала крупнейшая международная ярмарка вакансий 'Tech Careers Summit 2026'",
      excerpt: "Более 50 ведущих технологических компаний, включая резидентов IT Park и зарубежные корпорации, представили свыше 1,000 открытых вакансий.",
      content: `Сегодня в столице открылся главный карьерный форум года. В саммите участвуют Uzum, EPAM, Payme, Click и другие технологические гиганты со своими вакансиями и стажировками.

В программе мероприятия:
- Экспресс-собеседования напрямую с HR-директорами
- Бесплатный AI-аудит резюме от специалистов
- Онлайн-найм на международные удаленные проекты.

Платформа WZone выступает официальным цифровым партнером форума.`,
      category: 'Мероприятия',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
      author: 'Азиза Юлдашева',
      authorRole: 'Координатор мероприятий',
      date: '27 сентября 2026',
      readTime: '3 мин',
      views: 2150,
      likes: 142,
      tags: ['Мероприятия', 'Вакансии', 'Экспо', 'Ташкент'],
    },
    {
      id: 'news-3',
      title: "Современное резюме в эпоху ИИ: 6 практических правил от ведущих HR-специалистов",
      excerpt: "Как пройти фильтры ATS и привлечь внимание работодателя за первые 10 секунд? Практические рекомендации от WZone AI.",
      content: `В современном рекрутинге первичный отбор кандидатов всё чаще выполняют автоматизированные алгоритмы. Поэтому сухое перечисление обязанностей уступает место конкретным фактам и измеримым достижениям.

Ключевые советы:
1. Выражайте результаты в цифрах (например: 'Оптимизировал скорость загрузки на 40%').
2. Указывайте актуальный технологический стек без шаблонных фраз.
3. Держите ссылки на GitHub, LinkedIn и портфолио актуальными.
4. Добавляйте лаконичное сопроводительное письмо под конкретную позицию.
5. Прохождение верификации OneID на WZone повышает доверие работодателей на 70%.`,
      category: 'Советы по карьере',
      image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=1200&q=80',
      author: 'Дильноза Каримова',
      authorRole: 'Ведущий рекрутер & HR консультант',
      date: '26 сентября 2026',
      readTime: '5 мин',
      views: 3100,
      likes: 210,
      tags: ['Резюме', 'Карьера', 'AI', 'Советы'],
    },
    {
      id: 'news-4',
      title: "Культура удаленной работы (Remote): как специалисты из Узбекистана преуспевают в глобальных проектах",
      excerpt: "Опыт и практические лайфхаки специалистов, работающих на компании из США, Европы и Азии с валютным доходом.",
      content: `Удаленная работа стала стандартом профессиональной свободы и высокого дохода. Налоговые льготы для IT-экспортеров и фрилансеров в Узбекистане еще сильнее стимулируют развитие этого направления.

Факторы успеха:
- Грамотное управление рабочим временем (Time management)
- Свободный деловой английский язык
- Культура асинхронного взаимодействия (Slack, Jira, Gitlab).`,
      category: 'Удаленная работа',
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
      author: 'Жахонгир Пулатов',
      authorRole: 'Международный инженер-разработчик',
      date: '25 сентября 2026',
      readTime: '4 мин',
      views: 1890,
      likes: 125,
      tags: ['Remote', 'Фриланс', 'Международная работа', 'Опыт'],
    },
  ],
  en: [
    {
      id: 'news-1',
      title: "Top 10 Highest-Paying IT and Fintech Career Tracks in Uzbekistan in 2026",
      excerpt: "Labor market report: demand for Go backend, AI integrations, and cybersecurity specialists surged 45%. Average monthly compensation ranges from $1,500 to $4,000.",
      content: `Uzbekistan's digital economy is expanding at an unprecedented rate. According to Q1 2026 labor metrics, demand for senior talent in fintech, banking infrastructure, and global outsourcing reached record levels.

Highest in-demand engineering tracks:
1. Backend Systems Engineers (Go, Java, Python microservices)
2. Artificial Intelligence & Data Engineers
3. DevSecOps & Cloud Security Architects
4. High-Load Core Banking Architects
5. Mobile Engineers (Flutter, Swift, Kotlin)

Candidates with fluent English and remote collaboration experience receive offers up to 30% above local median rates.`,
      category: 'Market Analysis',
      image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80',
      author: 'Sanjar Rakhimov',
      authorRole: 'Senior Market Analyst, WZone Research',
      date: 'Sep 28, 2026',
      readTime: '4 min read',
      views: 1420,
      likes: 89,
      tags: ['Fintech', 'IT Market', 'Salaries', 'Analytics'],
    },
    {
      id: 'news-2',
      title: "The 'Tech Careers Summit 2026' Mega Career Fair Launched in Tashkent",
      excerpt: "Over 50 enterprise tech leaders, including IT Park residents and international corporations, offer 1,000+ open positions.",
      content: `Today the capital hosts the nation's premier tech hiring event. Uzum, EPAM, Payme, Click, and other industry leaders are actively interviewing candidates on-site.

Highlights:
- Fast-track technical interviews with HR leaders
- Free automated AI resume scoring & feedback
- Remote job matchmaking for international teams.

WZone serves as the official digital partner facilitating instant applications.`,
      category: 'Events',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
      author: 'Aziza Yuldasheva',
      authorRole: 'Event Coordinator',
      date: 'Sep 27, 2026',
      readTime: '3 min read',
      views: 2150,
      likes: 142,
      tags: ['Events', 'Jobs', 'Expo', 'Tashkent'],
    },
    {
      id: 'news-3',
      title: "Modern Resume in the Era of AI: 6 Practical Rules from Leading HR Directors",
      excerpt: "How to beat ATS automated screeners and capture hiring managers' attention in 10 seconds. Insights by WZone AI.",
      content: `Recruiters rely heavily on applicant tracking engines. Conventional resumes with generic text no longer cut through the noise; quantitative achievements are critical.

Actionable recommendations:
1. Quantify impact with hard numbers ('Accelerated release cycle by 2x').
2. Keep your tech stack precise and tailored to target positions.
3. Maintain active GitHub, LinkedIn, and portfolio links.
4. Attach focused cover notes explaining value proposition.
5. OneID verified profiles on WZone enjoy a 70% higher interview invite rate.`,
      category: 'Career Tips',
      image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=1200&q=80',
      author: 'Dilnoza Karimova',
      authorRole: 'Lead Technical Recruiter',
      date: 'Sep 26, 2026',
      readTime: '5 min read',
      views: 3100,
      likes: 210,
      tags: ['Resume', 'Career', 'AI', 'Tips'],
    },
    {
      id: 'news-4',
      title: "Remote Work Culture: How Uzbekistan Tech Talents Excel in Global Projects",
      excerpt: "Valuable firsthand advice from software engineers working remotely for US, EU, and Asian tech leaders with USD income.",
      content: `Remote engineering is now the gold standard of career autonomy. Progressive tax incentives for digital freelancers in Uzbekistan have accelerated this trend.

Key success drivers:
- Effective asynchronous communication
- Professional English proficiency
- Solid command of remote tooling (Slack, Jira, Gitlab).`,
      category: 'Remote Work',
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
      author: 'Jakhongir Pulatov',
      authorRole: 'Global Remote Engineer',
      date: 'Sep 25, 2026',
      readTime: '4 min read',
      views: 1890,
      likes: 125,
      tags: ['Remote', 'Freelance', 'Global Jobs', 'Experience'],
    },
  ],
};

const COMMENTS_DATA: Record<Language, CommentItem[]> = {
  uz: [
    {
      id: 'c-1',
      authorName: 'Farrux Zokirov',
      authorRole: 'Senior Go Developer',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
      content: "O'zbekistonda backend yo'nalishida Microservices, gRPC va Kafka biladigan dasturchilarga talab 40% oshibdi. Lekin ko'p kompaniyalar o'qitishdan ko'ra tayyor seniorlarni qidirmoqda. Sizningcha, kompaniyalar junior/middle kadrlarga ko'proq sarmoya kiritishi kerak emasmi?",
      timestamp: '15 daqiqa oldin',
      likes: 24,
      likedByMe: false,
      repliesCount: 7,
      topicTag: '#backend_talab',
    },
    {
      id: 'c-2',
      authorName: 'Nilufar Qosimova',
      authorRole: 'HR Director, Fintech Hub',
      authorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=160&q=80',
      content: "Bizning kompaniyada hozirda 12 ta ochiq vakansiya bor. Rezyumelarni ko'rib chiqishda biz eng avvalo nomzodning soft skills ko'nikmalariga va yangi narsalarni o'rganish ishtiyoqiga qaraymiz. WZone orqali topshirilgan arizalarni to'g'ridan-to'g'ri ko'rib chiqyapmiz!",
      timestamp: '42 daqiqa oldin',
      likes: 38,
      likedByMe: false,
      repliesCount: 12,
      topicTag: '#hr_maslahati',
    },
    {
      id: 'c-3',
      authorName: 'Jasur Alimov',
      authorRole: 'Lead UI/UX Designer',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
      content: "WZone platformasidagi yangi dizayn va o'zbek tilidagi qulay filtrlar juda ajoyib chiqibdi. Ayniqsa viloyatlar bo'yicha va maosh oralig'i ko'rsatilganligi qidiruv vaqtini 3 barobarga qisqartirdi!",
      timestamp: '2 soat oldin',
      likes: 19,
      likedByMe: true,
      repliesCount: 3,
      topicTag: '#platforma',
    },
    {
      id: 'c-4',
      authorName: 'Malika Rustamova',
      authorRole: 'Data Analyst & AI Enthusiast',
      authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80',
      content: "AI bo'yicha dastlabki amaliyot (internship) qidirayotgan talabalar uchun maslahat: WZone'da to'liq portfoliongizni ko'rsatib, 3 ta kichik real loyihangizni biriktiring. Ish beruvchilar amaliy natijalarni juda qadrlaydi.",
      timestamp: '4 soat oldin',
      likes: 31,
      likedByMe: false,
      repliesCount: 5,
      topicTag: '#karyera_boshlash',
    },
  ],
  ru: [
    {
      id: 'c-1',
      authorName: 'Фаррух Зокиров',
      authorRole: 'Senior Go Developer',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
      content: "В Узбекистане спрос на бэкенд с опытом микросервисов, gRPC и Kafka вырос на 40%. Но многие компании ищут готовых сеньоров вместо обучения. Считаете ли вы, что бизнесу стоит больше инвестировать в джунов и мидлов?",
      timestamp: '15 минут назад',
      likes: 24,
      likedByMe: false,
      repliesCount: 7,
      topicTag: '#backend_спрос',
    },
    {
      id: 'c-2',
      authorName: 'Нилуфар Касымова',
      authorRole: 'HR Директор, Fintech Hub',
      authorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=160&q=80',
      content: "В нашей компании сейчас открыто 12 вакансий. При скрининге резюме мы в первую очередь смотрим на soft skills и готовность учиться новому. Заявки с WZone мы рассматриваем в приоритетном порядке!",
      timestamp: '42 минуты назад',
      likes: 38,
      likedByMe: false,
      repliesCount: 12,
      topicTag: '#hr_советы',
    },
    {
      id: 'c-3',
      authorName: 'Жасур Алимов',
      authorRole: 'Lead UI/UX Designer',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
      content: "Новый интерфейс WZone и удобные фильтры невероятно удобны. Особенно фильтрация по регионам и зарплатным вилкам сократила поиск работы втрое!",
      timestamp: '2 часа назад',
      likes: 19,
      likedByMe: true,
      repliesCount: 3,
      topicTag: '#платформа',
    },
    {
      id: 'c-4',
      authorName: 'Малика Рустамова',
      authorRole: 'Data Analyst & AI',
      authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80',
      content: "Совет студентам, ищущим первую стажировку по AI: оформите портфолио на WZone и прикрепите 3 реальных мини-проекта. Работодатели высоко ценят практический результат.",
      timestamp: '4 часа назад',
      likes: 31,
      likedByMe: false,
      repliesCount: 5,
      topicTag: '#старт_карьеры',
    },
  ],
  en: [
    {
      id: 'c-1',
      authorName: 'Farrukh Zokirov',
      authorRole: 'Senior Go Developer',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
      content: "Demand for Go microservices, gRPC, and Kafka engineers in Uzbekistan grew by 40%. Yet many firms hunt for seniors rather than mentoring. Shouldn't companies invest more in junior and middle talent?",
      timestamp: '15 minutes ago',
      likes: 24,
      likedByMe: false,
      repliesCount: 7,
      topicTag: '#backend_demand',
    },
    {
      id: 'c-2',
      authorName: 'Nilufar Qosimova',
      authorRole: 'HR Director, Fintech Hub',
      authorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=160&q=80',
      content: "We currently have 12 open engineering vacancies. During screening, we prioritize candidate soft skills and growth mindset. Applications submitted via WZone are reviewed with priority!",
      timestamp: '42 minutes ago',
      likes: 38,
      likedByMe: false,
      repliesCount: 12,
      topicTag: '#hr_advice',
    },
    {
      id: 'c-3',
      authorName: 'Jasur Alimov',
      authorRole: 'Lead UI/UX Designer',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
      content: "The revamped WZone interface and filters make job hunting lightning-fast. Especially regional salary filters cut our search time by 3x!",
      timestamp: '2 hours ago',
      likes: 19,
      likedByMe: true,
      repliesCount: 3,
      topicTag: '#platform',
    },
    {
      id: 'c-4',
      authorName: 'Malika Rustamova',
      authorRole: 'Data Analyst & AI Specialist',
      authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80',
      content: "Advice for students seeking their first AI/ML internship: build your WZone profile with 3 verified project links. Hiring teams deeply value concrete shipped projects.",
      timestamp: '4 hours ago',
      likes: 31,
      likedByMe: false,
      repliesCount: 5,
      topicTag: '#career_start',
    },
  ],
};

const SPOTLIGHT_DATA: Record<Language, CompanySpotlight[]> = {
  uz: [
    {
      id: 'comp-1',
      name: 'Uzum Technologies',
      industry: 'E-commerce & Fintech Ekotizim',
      location: 'Toshkent shahri',
      openPositions: 28,
      logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
      coverImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
      verified: true,
      tagline: "O'zbekistondagi birinchi texnologik unicorn ekotizimida faoliyat olib boring.",
    },
    {
      id: 'comp-2',
      name: 'EPAM Systems Uzbekistan',
      industry: 'Xalqaro Dasturiy Injiniring',
      location: 'Toshkent / Masofaviy',
      openPositions: 35,
      logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=120&q=80',
      coverImage: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80',
      verified: true,
      tagline: 'Dunyo miqyosidagi global loyihalar va ilg‘or xalqaro muhandislik amaliyoti.',
    },
    {
      id: 'comp-3',
      name: 'Payme / Paycom',
      industry: 'To‘lov tizimlari va Bank Texnologiyalari',
      location: 'Toshkent shahri',
      openPositions: 14,
      logo: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=120&q=80',
      coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
      verified: true,
      tagline: 'Har kuni 12 milliondan ziyod foydalanuvchiga xizmat qiluvchi fintech platforma.',
    },
    {
      id: 'comp-4',
      name: 'Mohirdev & IT Academy',
      industry: 'EdTech va Dasturiy Yechimlar',
      location: 'Toshkent shahri',
      openPositions: 9,
      logo: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=120&q=80',
      coverImage: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80',
      verified: true,
      tagline: 'Kelajak IT mutaxassislarini tayyorlovchi eng yirik ta’lim platformasi.',
    },
  ],
  ru: [
    {
      id: 'comp-1',
      name: 'Uzum Technologies',
      industry: 'E-commerce & Финтех Экосистема',
      location: 'г. Ташкент',
      openPositions: 28,
      logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
      coverImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
      verified: true,
      tagline: 'Работайте в первой технологической unicorn-экосистеме Узбекистана.',
    },
    {
      id: 'comp-2',
      name: 'EPAM Systems Uzbekistan',
      industry: 'Международная Разработка ПО',
      location: 'Ташкент / Удаленно',
      openPositions: 35,
      logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=120&q=80',
      coverImage: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80',
      verified: true,
      tagline: 'Глобальные проекты мирового уровня и передовые инженерные практики.',
    },
    {
      id: 'comp-3',
      name: 'Payme / Paycom',
      industry: 'Платежные системы и Финтех',
      location: 'г. Ташкент',
      openPositions: 14,
      logo: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=120&q=80',
      coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
      verified: true,
      tagline: 'Финтех-сервис, обслуживающий более 12 миллионов пользователей каждый день.',
    },
    {
      id: 'comp-4',
      name: 'Mohirdev & IT Academy',
      industry: 'EdTech и Программные Решения',
      location: 'г. Ташкент',
      openPositions: 9,
      logo: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=120&q=80',
      coverImage: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80',
      verified: true,
      tagline: 'Крупнейшая образовательная платформа для будущих IT-специалистов.',
    },
  ],
  en: [
    {
      id: 'comp-1',
      name: 'Uzum Technologies',
      industry: 'E-commerce & Fintech Ecosystem',
      location: 'Tashkent City',
      openPositions: 28,
      logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
      coverImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
      verified: true,
      tagline: "Build your career in Uzbekistan's first tech unicorn ecosystem.",
    },
    {
      id: 'comp-2',
      name: 'EPAM Systems Uzbekistan',
      industry: 'Global Software Engineering',
      location: 'Tashkent / Remote',
      openPositions: 35,
      logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=120&q=80',
      coverImage: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80',
      verified: true,
      tagline: 'World-class global enterprise architectures and international engineering culture.',
    },
    {
      id: 'comp-3',
      name: 'Payme / Paycom',
      industry: 'Payment Systems & Core Banking Tech',
      location: 'Tashkent City',
      openPositions: 14,
      logo: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=120&q=80',
      coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
      verified: true,
      tagline: 'Leading fintech platform serving over 12 million active consumers every day.',
    },
    {
      id: 'comp-4',
      name: 'Mohirdev & IT Academy',
      industry: 'EdTech & Digital Solutions',
      location: 'Tashkent City',
      openPositions: 9,
      logo: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=120&q=80',
      coverImage: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80',
      verified: true,
      tagline: 'The premier tech education ecosystem empowering next-gen developers.',
    },
  ],
};

const SALARY_DATA: Record<Language, Array<{ role: string; range: string; growth: string; popular: boolean }>> = {
  uz: [
    { role: 'Backend (Go, Java, Python)', range: '$900 - $3,800', growth: '+28%', popular: true },
    { role: 'Frontend & Full-stack (React, Next.js)', range: '$700 - $2,900', growth: '+22%', popular: true },
    { role: 'Mobile Dev (Flutter, iOS, Android)', range: '$800 - $3,200', growth: '+25%', popular: false },
    { role: 'DevOps & Cloud Security', range: '$1,200 - $4,200', growth: '+35%', popular: true },
    { role: 'UI/UX & Product Design', range: '$600 - $2,400', growth: '+18%', popular: false },
  ],
  ru: [
    { role: 'Бэкенд (Go, Java, Python)', range: '$900 - $3,800', growth: '+28%', popular: true },
    { role: 'Фронтенд & Full-stack (React, Next.js)', range: '$700 - $2,900', growth: '+22%', popular: true },
    { role: 'Мобильная разработка (Flutter, iOS, Android)', range: '$800 - $3,200', growth: '+25%', popular: false },
    { role: 'DevOps & Облачная безопасность', range: '$1,200 - $4,200', growth: '+35%', popular: true },
    { role: 'UI/UX & Продуктовый дизайн', range: '$600 - $2,400', growth: '+18%', popular: false },
  ],
  en: [
    { role: 'Backend (Go, Java, Python)', range: '$900 - $3,800', growth: '+28%', popular: true },
    { role: 'Frontend & Full-stack (React, Next.js)', range: '$700 - $2,900', growth: '+22%', popular: true },
    { role: 'Mobile Dev (Flutter, iOS, Android)', range: '$800 - $3,200', growth: '+25%', popular: false },
    { role: 'DevOps & Cloud Security', range: '$1,200 - $4,200', growth: '+35%', popular: true },
    { role: 'UI/UX & Product Design', range: '$600 - $2,400', growth: '+18%', popular: false },
  ],
};

const NEWS_CATEGORIES: Record<Language, string[]> = {
  uz: ['Barchasi', 'Bozor tahlili', 'Tadbirlar', 'Karyera maslahati', 'Masofaviy ish'],
  ru: ['Все', 'Анализ рынка', 'Мероприятия', 'Советы по карьере', 'Удаленная работа'],
  en: ['All', 'Market Analysis', 'Events', 'Career Tips', 'Remote Work'],
};

export default function HomeFeedView({
  vacancies,
  onSelectVacancy,
  onNavigateToVacancies,
  onOpenCreateResume,
  onOpenCreateVacancy,
  onApplyVacancy,
  isSaved,
  onToggleSave,
  currentUser,
  lang = 'uz',
}: HomeFeedViewProps) {
  const t = translations[lang] || translations.uz;

  const activeCategories = NEWS_CATEGORIES[lang] || NEWS_CATEGORIES.uz;
  const [selectedNewsCategory, setSelectedNewsCategory] = useState(activeCategories[0]);
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);

  // Synchronize news category when language switches
  useEffect(() => {
    setSelectedNewsCategory(activeCategories[0]);
  }, [lang]);

  const [newsList, setNewsList] = useState<NewsItem[]>(NEWS_DATA[lang] || NEWS_DATA.uz);
  const [comments, setComments] = useState<CommentItem[]>(COMMENTS_DATA[lang] || COMMENTS_DATA.uz);
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentTopic, setNewCommentTopic] = useState('#fikr');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Sync news & comments if language changed
  useEffect(() => {
    setNewsList(NEWS_DATA[lang] || NEWS_DATA.uz);
    setComments(COMMENTS_DATA[lang] || COMMENTS_DATA.uz);
    if (selectedArticle) {
      const match = (NEWS_DATA[lang] || NEWS_DATA.uz).find((n) => n.id === selectedArticle.id);
      if (match) setSelectedArticle(match);
    }
  }, [lang]);

  const filteredNews =
    selectedNewsCategory === activeCategories[0]
      ? newsList
      : newsList.filter((n) => n.category === selectedNewsCategory);

  const handleToggleLikeComment = (commentId: string) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const liked = !c.likedByMe;
          return {
            ...c,
            likedByMe: liked,
            likes: liked ? c.likes + 1 : c.likes - 1,
          };
        }
        return c;
      })
    );
  };

  const handleLikeArticle = (articleId: string) => {
    setNewsList((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, likes: a.likes + 1 } : a))
    );
    if (selectedArticle && selectedArticle.id === articleId) {
      setSelectedArticle({ ...selectedArticle, likes: selectedArticle.likes + 1 });
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setIsSubmittingComment(true);
    setTimeout(() => {
      const newComment: CommentItem = {
        id: `c-${Date.now()}`,
        authorName: currentUser?.name || t.guestUser,
        authorRole: currentUser?.role === 'employer' ? t.createVacancy : (currentUser?.profession || 'Specialist'),
        authorAvatar:
          currentUser?.avatar_url ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
        content: newCommentText.trim(),
        timestamp: lang === 'ru' ? 'Только что' : lang === 'en' ? 'Just now' : 'Hozirgina',
        likes: 1,
        likedByMe: true,
        repliesCount: 0,
        topicTag: newCommentTopic.startsWith('#') ? newCommentTopic : `#${newCommentTopic}`,
      };

      setComments([newComment, ...comments]);
      setNewCommentText('');
      setIsSubmittingComment(false);
    }, 300);
  };

  const featuredVacancies = vacancies.slice(0, 3);
  const spotlightCompanies = SPOTLIGHT_DATA[lang] || SPOTLIGHT_DATA.uz;
  const salaryTrends = SALARY_DATA[lang] || SALARY_DATA.uz;

  return (
    <div className="space-y-6">
      {/* 1. HERO SPOTLIGHT BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 text-white p-6 sm:p-8 shadow-xl shadow-blue-900/20 border border-blue-500/30">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs font-bold text-blue-200">
              <Sparkles size={14} className="text-yellow-400 animate-pulse" />
              <span>{t.heroWelcomeBadge}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              {t.heroMainHeading}
            </h1>

            <p className="text-sm text-blue-100/90 leading-relaxed font-medium">
              {t.heroMainDesc}
            </p>

            {/* Quick Stat Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur text-xs font-bold text-white border border-white/10 flex items-center gap-1.5">
                <Briefcase size={13} className="text-emerald-400" />
                {vacancies.length > 0 ? `${vacancies.length}+` : '5,400+'} {t.vacanciesCount}
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur text-xs font-bold text-white border border-white/10 flex items-center gap-1.5">
                <Building2 size={13} className="text-blue-300" />
                1,200+ {t.verifiedCompanies}
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur text-xs font-bold text-white border border-white/10 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-amber-300" />
                {t.oneidVerifiedBadge}
              </span>
            </div>
          </div>

          {/* Quick CTA Actions */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={onNavigateToVacancies}
              className="px-5 py-3 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 font-black text-xs shadow-lg shadow-black/10 flex items-center justify-center gap-2 transition group"
            >
              <span>{t.feedHeroBtn}</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition" />
            </button>

            <button
              onClick={onOpenCreateResume}
              className="px-5 py-3 rounded-2xl bg-blue-600/60 hover:bg-blue-600 text-white font-bold text-xs border border-white/20 backdrop-blur flex items-center justify-center gap-2 transition"
            >
              <Plus size={16} />
              <span>{t.createResume}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. YANGILIKLAR & SOHA TAHLILLARI (INDUSTRY NEWS & ARTICLES) */}
      <section className="bg-white dark:bg-slate-900/90 backdrop-blur rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Newspaper size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                {t.newsTitle}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-black">
                  {t.realTimeBadge}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {t.newsSubtitle}
              </p>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {activeCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedNewsCategory(cat)}
                className={`px-3 py-1 text-xs font-bold rounded-xl whitespace-nowrap transition ${
                  selectedNewsCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNews.map((news) => (
            <article
              key={news.id}
              onClick={() => setSelectedArticle(news)}
              className="group cursor-pointer rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition duration-200 overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700"
            >
              <div>
                <div className="relative h-44 w-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                  <img
                    src={news.image}
                    alt={news.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur text-white text-[11px] font-black uppercase tracking-wider">
                      {news.category}
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur text-white text-[11px] font-semibold">
                    <Clock size={12} />
                    <span>{news.readTime}</span>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <Calendar size={12} />
                    <span>{news.date}</span>
                    <span>•</span>
                    <span className="text-blue-600 dark:text-blue-400 font-extrabold">{news.author}</span>
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition leading-snug">
                    {news.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {news.excerpt}
                  </p>
                </div>
              </div>

              <div className="px-4 pb-4 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Eye size={13} />
                    {news.views}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-rose-500">
                    <Heart size={13} className="fill-rose-500" />
                    {news.likes}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold text-xs group-hover:translate-x-1 transition">
                  <span>{t.readFull}</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 3. JONLI KOMMENTARIYALAR & JAMIYAT MUHOKAMASI (LIVE COMMUNITY DISCUSSIONS) */}
      <section className="bg-white dark:bg-slate-900/90 backdrop-blur rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <MessageCircle size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                {t.commentsTitle}
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {t.commentsSubtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Add Comment Input Form */}
        <form onSubmit={handleAddComment} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xs overflow-hidden shrink-0 shadow-sm">
              {currentUser?.avatar_url ? (
                <img src={currentUser.avatar_url} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                <span>{currentUser?.name ? currentUser.name[0].toUpperCase() : 'W'}</span>
              )}
            </div>
            <div className="flex-1">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {currentUser?.name || t.guestUser}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                {t.shareThoughtPrompt}
              </span>
            </div>

            {/* Quick Topic Selector */}
            <select
              value={newCommentTopic}
              onChange={(e) => setNewCommentTopic(e.target.value)}
              className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            >
              <option value="#fikr">#fikr</option>
              <option value="#karyera">#karyera</option>
              <option value="#maoshlar">#maoshlar</option>
              <option value="#intervyu">#intervyu</option>
              <option value="#maslahat">#maslahat</option>
            </select>
          </div>

          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder={t.commentPlaceholder}
            rows={2}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span>{t.topicLabel}</span>
              <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold">
                {newCommentTopic}
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmittingComment || !newCommentText.trim()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-500/25 flex items-center gap-1.5 transition"
            >
              <Send size={13} />
              <span>{isSubmittingComment ? t.submittingComment : t.submitComment}</span>
            </button>
          </div>
        </form>

        {/* Live Comments Stream */}
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800/70 transition space-y-2.5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={comment.authorAvatar}
                    alt={comment.authorName}
                    className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {comment.authorName}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                        {comment.authorRole}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">{comment.timestamp}</span>
                  </div>
                </div>

                <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/70 px-2 py-0.5 rounded-md">
                  {comment.topicTag}
                </span>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                {comment.content}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleToggleLikeComment(comment.id)}
                    className={`flex items-center gap-1.5 font-bold transition ${
                      comment.likedByMe
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400'
                    }`}
                  >
                    <ThumbsUp size={13} className={comment.likedByMe ? 'fill-blue-600 dark:fill-blue-400' : ''} />
                    <span>{comment.likes}</span>
                  </button>

                  <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                    <MessageCircle size={13} />
                    <span>{comment.repliesCount} {t.repliesCountSuffix}</span>
                  </span>
                </div>

                <button
                  onClick={() => {
                    setNewCommentText(`@${comment.authorName} `);
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                >
                  {t.replyBtn}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. TOP SARA VAKANSIYALAR & CTA (HOT JOBS PREVIEW) */}
      <section className="bg-white dark:bg-slate-900/90 backdrop-blur rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Award size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                {t.featuredVacanciesTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {t.featuredJobsSub}
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateToVacancies}
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            <span>{t.viewAllLink} ({vacancies.length})</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Featured Job Cards */}
        <div className="grid grid-cols-1 gap-3.5">
          {featuredVacancies.length > 0 ? (
            featuredVacancies.map((v) => (
              <div
                key={v.id}
                onClick={() => onSelectVacancy(v)}
                className="group p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800/90 transition shadow-sm hover:shadow-md cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-slate-700 dark:to-blue-900/60 flex items-center justify-center font-black text-blue-700 dark:text-blue-300 text-lg shadow-sm shrink-0">
                    {v.company ? v.company[0].toUpperCase() : 'W'}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {v.company || 'Kompaniya'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold">
                        {t.categories[v.category] || v.category || 'IT'}
                      </span>
                      {v.location && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <MapPin size={11} />
                          {t.regions[v.location] || v.location}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                      {v.title}
                    </h3>

                    <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <DollarSign size={13} />
                      <span>{v.salary_min ? `${v.salary_min} - ${v.salary_max} ${v.salary_currency || 'UZS'}` : t.salaryNegotiable}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onApplyVacancy(v);
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition"
                  >
                    {t.applyBtn}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              {t.noVacanciesFound}
            </div>
          )}
        </div>

        <button
          onClick={onNavigateToVacancies}
          className="w-full py-3 rounded-2xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-slate-700 font-extrabold text-xs flex items-center justify-center gap-2 transition"
        >
          <span>{t.viewAllWithCount} ({vacancies.length})</span>
          <ArrowRight size={14} />
        </button>
      </section>

      {/* 5. TOP ISH BERUVCHILAR (COMPANY SPOTLIGHTS) */}
      <section className="bg-white dark:bg-slate-900/90 backdrop-blur rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                {t.leadingCompanies}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {t.leadingCompaniesSub}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {spotlightCompanies.map((comp) => (
            <div
              key={comp.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="h-28 w-full relative bg-slate-300">
                  <img src={comp.coverImage} alt={comp.name} className="w-full h-full object-cover" />
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-black">
                    {comp.openPositions} {t.openPositionsCount}
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {comp.name}
                    </h3>
                    {comp.verified && (
                      <CheckCircle2 size={15} className="text-blue-500 fill-blue-500 text-white" />
                    )}
                  </div>

                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {comp.industry} • {comp.location}
                  </p>

                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    {comp.tagline}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0">
                <button
                  onClick={onNavigateToVacancies}
                  className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-700/60 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <span>{t.viewCompanyJobs}</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. MAOSH VA SOHA TRENDLARI (SALARY INSIGHTS WIDGET) */}
      <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-indigo-500/20 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
            <TrendingUp size={20} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              {t.salaryIndexTitle}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-black">
                {t.salaryIndexNew}
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              {t.salaryIndexDesc}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {salaryTrends.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 backdrop-blur hover:bg-white/10 transition"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200">{item.role}</span>
                <span className="text-[11px] font-black text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  {item.growth}
                </span>
              </div>
              <div className="text-base font-black text-blue-300 flex items-center gap-1">
                <span>{item.range}</span>
                <span className="text-[10px] font-medium text-slate-400">{t.perMonth}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ARTICLE DETAIL MODAL */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            {/* Modal Image Header */}
            <div className="relative h-60 w-full bg-slate-200 dark:bg-slate-800">
              <img
                src={selectedArticle.image}
                alt={selectedArticle.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition backdrop-blur"
              >
                <X size={18} />
              </button>
              <div className="absolute bottom-4 left-4">
                <span className="px-3 py-1 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-wider shadow">
                  {selectedArticle.category}
                </span>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-blue-600 dark:text-blue-400">
                    {selectedArticle.author}
                  </span>
                  <span>({selectedArticle.authorRole})</span>
                </div>
                <span>{selectedArticle.date}</span>
              </div>

              <h2 className="text-xl font-black text-slate-900 dark:text-white leading-snug">
                {selectedArticle.title}
              </h2>

              <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-line space-y-3">
                {selectedArticle.content}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {selectedArticle.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleLikeArticle(selectedArticle.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition hover:bg-rose-100"
                  >
                    <Heart size={14} className="fill-rose-500" />
                    <span>{selectedArticle.likes} {t.likedBtn}</span>
                  </button>

                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Eye size={13} />
                    {selectedArticle.views} {t.viewsCount}
                  </span>
                </div>

                <button
                  onClick={() => setSelectedArticle(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
                >
                  {t.closeBtn}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
