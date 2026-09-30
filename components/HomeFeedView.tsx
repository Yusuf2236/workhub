'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Plus,
  Bookmark,
  Share2,
  RefreshCw,
  HelpCircle,
  Lightbulb,
  Check,
  Filter
} from 'lucide-react';
import { Language, translations } from '../lib/translations';
import { api } from '../lib/api';

export interface NewsItem {
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

export interface CommentItem {
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
  replies?: Array<{
    id: string;
    authorName: string;
    authorRole: string;
    content: string;
    timestamp: string;
  }>;
}

export interface PollItem {
  id: string;
  question: string;
  tag: string;
  totalVotes: number;
  userVotedIndex?: number;
  options: Array<{
    text: string;
    votes: number;
  }>;
}

export interface CareerHackItem {
  id: string;
  title: string;
  category: string;
  content: string;
  author: string;
  likes: number;
  likedByMe?: boolean;
}

export interface CompanySpotlight {
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

export type StreamCardType = 'vacancy' | 'news' | 'discussion' | 'poll' | 'career_hack';

export interface StreamItem {
  streamId: string;
  type: StreamCardType;
  data: any;
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

// ==========================================
// 📰 STATIC DATA POOLS (UZ / RU / EN)
// ==========================================

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
- Asinxron muloqot (Slack, Notion, Jira) qoidalariga rioya qilish
- Barqaror va yuqori tezlikdagi internet muhiti.`,
      category: 'Masofaviy ish',
      image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1200&q=80',
      author: 'Jamshid Ismoilov',
      authorRole: 'Xalqaro IT frilanser',
      date: '25-sentyabr, 2026',
      readTime: '4 daqiqa',
      views: 1890,
      likes: 175,
      tags: ['Remote', 'Frilans', 'Daromad', 'Maslahat'],
    },
    {
      id: 'news-5',
      title: "O'zbekiston fintech bozorida 2026-yilgi startaplar va investitsiyalar hajmi $50M dan oshdi",
      excerpt: "To'lov xizmatlari, mikromoliya va AI scoring tizimlari yaratuvchi kompaniyalar faol ravishda yangi muhandislar va biznes tahlilchilarni ishga yollamoqda.",
      content: `Toshkentdagi IT Park rezidentlari 2026-yil boshidan beri 50 million dollardan ortiq to'g'ridan-to'g'ri investitsiya jalb qildi.

Ushbu loyihalar uchun quyidagi rollar eng yuqori takliflarga ega:
- Fraud Detection & Kiberxavfsizlik mutaxassislari ($2,500 - $4,500)
- Product Manager & Scrum Master ($1,500 - $3,000)
- Core Banking & Integratsiya muhandislari ($2,000 - $4,000).`,
      category: 'Bozor tahlili',
      image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80',
      author: 'Sardor Qodirov',
      authorRole: 'Fintech tahlilchisi',
      date: '29-sentyabr, 2026',
      readTime: '3 daqiqa',
      views: 1980,
      likes: 154,
      tags: ['Fintech', 'Startap', 'Investitsiya'],
    }
  ],
  ru: [
    {
      id: 'news-1',
      title: "Топ-10 самых высокооплачиваемых IT и Fintech профессий в Узбекистане в 2026 году",
      excerpt: "Анализ рынка труда: спрос на Go бэкенд, AI интеграции и кибербезопасность вырос на 45%. Средние зарплаты достигают от $1,500 до $4,000 в месяц.",
      content: `Цифровая экономика Узбекистана развивается рекордными темпами. По итогам первого квартала 2026 года в финтех-секторе, банковских системах и международном аутсорсинге зафиксирован пиковый спрос на высококвалифицированных специалистов.

Самые востребованные направления:
1. Бэкенд-инженеры (микросервисы Go, Java, Python)
2. Специалисты по искусственному интеллекту и Data Engineering
3. Эксперты по информационной безопасности и DevSecOps
4. Архитекторы высоконагруженных систем
5. Мобильные разработчики (Flutter, Swift, Kotlin).`,
      category: 'Анализ рынка',
      image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80',
      author: 'Санжар Рахимов',
      authorRole: 'Аналитик рынка, WZone Research',
      date: '28 сентября 2026',
      readTime: '4 мин',
      views: 1420,
      likes: 89,
      tags: ['Fintech', 'Рынок IT', 'Зарплаты', 'Анализ'],
    },
    {
      id: 'news-2',
      title: "В Ташкенте стартовала международная ярмарка вакансий 'Tech Careers Summit 2026'",
      excerpt: "Более 50 ведущих компаний представляют свыше 1,000 открытых позиций для кандидатов всех уровней.",
      content: `В столице открылся один из масштабнейших карьерных форумов региона. Компании Uzum, EPAM, Payme, Click проводят экспресс-собеседования прямо на площадке.

В рамках события:
- Мгновенные офферы для Middle/Senior инженеров
- Бесплатный AI-аудит резюме на стенде WZone
- Прямой найм в международные удаленные проекты.`,
      category: 'Мероприятия',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
      author: 'Азиза Юлдашева',
      authorRole: 'Координатор саммита',
      date: '27 сентября 2026',
      readTime: '3 мин',
      views: 2150,
      likes: 142,
      tags: ['События', 'Вакансии', 'Ташкент'],
    }
  ],
  en: [
    {
      id: 'news-1',
      title: "Top 10 Highest-Paying Tech & Fintech Careers in Uzbekistan 2026",
      excerpt: "Labor market insights: Demand for Go backend, AI integrations, and cybersecurity jumped 45%. Average compensations reach $1,500 to $4,000/mo.",
      content: `The digital transformation of Uzbekistan is accelerating rapidly. As of Q1 2026, leading fintech ecosystems and global development hubs report record demand for senior technical talent.

Key roles in demand:
1. Backend Microservices Engineers (Go, Java, Python)
2. AI and Data Platform Engineers
3. Cybersecurity and DevSecOps Experts
4. High-load Architecture Leads
5. Mobile Engineers (Flutter, Swift, Kotlin).`,
      category: 'Market Analysis',
      image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80',
      author: 'Sanjar Rahimov',
      authorRole: 'Lead Market Analyst, WZone',
      date: 'September 28, 2026',
      readTime: '4 min',
      views: 1420,
      likes: 89,
      tags: ['Fintech', 'Tech Market', 'Salaries'],
    }
  ]
};

const COMMENTS_DATA: Record<Language, CommentItem[]> = {
  uz: [
    {
      id: 'c-1',
      authorName: 'Farrux Zokirov',
      authorRole: 'Senior Go Dasturchi',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
      content: "O'zbekistonda hozir mikroservislar, gRPC va Kafka biladigan backendchilarga talab 40% ga oshdi. Lekin kompaniyalar ko'pincha tayyor seniorlarni qidirmoqda. Sizningcha, kompaniyalar noutbuk olib berib junior/middle mutaxassislarni tarbiyalashga ko'proq sarmoya kiritishi kerak emasmi?",
      timestamp: '12 daqiqa oldin',
      likes: 34,
      likedByMe: false,
      repliesCount: 6,
      topicTag: '#backend_talab',
      replies: [
        {
          id: 'rep-1',
          authorName: 'Akbar Shokirov',
          authorRole: 'Tech Lead @ Fintech',
          content: "To‘liq qo‘shilaman. Biz o‘z jamoamizda 3 nafar Junior olib, 6 oyda kuchli Middle darajaga chiqardik. Natija ancha arzon va sadoqatli kadrlar bo‘ldi.",
          timestamp: '8 daqiqa oldin',
        }
      ]
    },
    {
      id: 'c-2',
      authorName: 'Nilufar Qosimova',
      authorRole: 'HR Direktor, Fintech Hub',
      authorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=160&q=80',
      content: "Bizda ayni vaqtda 12 ta ochiq vakansiya bor. Rezyumelarni ko'rib chiqishda biz birinchi navbatda soft skills va yangi bilimlarni o'rganish tezligiga qaraymiz. WZone orqali topshirilgan arizalar birinchi navbatda ko'rib chiqiladi!",
      timestamp: '35 daqiqa oldin',
      likes: 52,
      likedByMe: false,
      repliesCount: 14,
      topicTag: '#hr_maslahat',
      replies: []
    },
    {
      id: 'c-3',
      authorName: 'Jasur Alimov',
      authorRole: 'Lead UI/UX Dizayner',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
      content: "WZone'dagi yangilangan mobil ko'rinish va filtrlar juda qulay bo'libdi. Ayniqsa hududlar bo'yicha saralash va maosh darajasini ko'rib ish tanlash vaqtni 3 barobar tejamoqda.",
      timestamp: '1 soat oldin',
      likes: 28,
      likedByMe: true,
      repliesCount: 4,
      topicTag: '#platforma',
      replies: []
    },
    {
      id: 'c-4',
      authorName: 'Malika Rustamova',
      authorRole: 'Data Analyst & AI',
      authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80',
      content: "AI bo'yicha birinchi stajirovkasini qidirayotgan talabalarga maslahat: WZone profilida 3 ta real loyiha havolasini qoldiring. Ish beruvchilar amaliy natijani juda qadrlashadi.",
      timestamp: '3 soat oldin',
      likes: 41,
      likedByMe: false,
      repliesCount: 9,
      topicTag: '#karyera_boshlash',
      replies: []
    }
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
      replies: []
    }
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
      replies: []
    }
  ]
};

const POLL_DATA: Record<Language, PollItem[]> = {
  uz: [
    {
      id: 'poll-1',
      question: "2026-yilda siz uchun eng ma'qul ish formati qaysi?",
      tag: '#so‘rovnoma',
      totalVotes: 348,
      options: [
        { text: "To'liq masofaviy (Remote)", votes: 198 },
        { text: "Gibrid (Haftada 2-3 kun ofis)", votes: 114 },
        { text: "Faqat ofisda (Katta jamoaviy muhit)", votes: 36 }
      ]
    },
    {
      id: 'poll-2',
      question: "Ish taklifini (Offer) tanlashda siz uchun eng muhim omil?",
      tag: '#karyera',
      totalVotes: 412,
      options: [
        { text: "Yuqori maosh & dollar indeksatsiyasi", votes: 245 },
        { text: "Kuchli mentorlik va kasbiy o'sish", votes: 110 },
        { text: "Moslashuvchan grafik va erkinlik", votes: 57 }
      ]
    }
  ],
  ru: [
    {
      id: 'poll-1',
      question: "Какой формат работы для вас идеален в 2026 году?",
      tag: '#опрос',
      totalVotes: 289,
      options: [
        { text: "Полный Remote (из дома)", votes: 172 },
        { text: "Гибридный график", votes: 94 },
        { text: "Работа в офисе", votes: 23 }
      ]
    }
  ],
  en: [
    {
      id: 'poll-1',
      question: "What is your preferred work setup in 2026?",
      tag: '#poll',
      totalVotes: 310,
      options: [
        { text: "100% Remote work", votes: 185 },
        { text: "Hybrid (2-3 days office)", votes: 98 },
        { text: "On-site office only", votes: 27 }
      ]
    }
  ]
};

const CAREER_HACKS: Record<Language, CareerHackItem[]> = {
  uz: [
    {
      id: 'hack-1',
      title: "ATS Filtrlaridan 100% o'tish siri",
      category: "Rezyume Taktikasi",
      content: "Rezyumeda faqat mas'uliyatlarni emas, raqamlar bilan erishilgan natijalarni yozing: masalan, 'API so'rovlarini 150ms dan 35ms gacha tezlashtirdim'. Bu sizni 90% boshqa nomzodlardan ajratib turadi.",
      author: "Dilshod Muxtorov (Lead Recruiter)",
      likes: 88,
    },
    {
      id: 'hack-2',
      title: "Intervyuda maoshni kelishish (Salary Negotiation)",
      category: "Muzokaralar",
      content: "Hech qachon birinchi bo'lib aniq bir raqam aytmang. Oraliq ko'rsating (masalan, $1,500 - $2,200) va kompaniyaning taklif qilayotgan qo'shimcha imtiyozlari (sug'urta, ta'lim) haqida so'rang.",
      author: "Nargiza Bekmirzayeva (Career Coach)",
      likes: 124,
    }
  ],
  ru: [
    {
      id: 'hack-1',
      title: "Секрет прохождения фильтров ATS на 100%",
      category: "Резюме и Оффер",
      content: "Пишите достижения на языке цифр: не 'разрабатывал API', а 'ускорил обработку заказов на 45% и снизил задержки до 30мс'.",
      author: "Дильшод Мухтаров (Lead Recruiter)",
      likes: 88,
    }
  ],
  en: [
    {
      id: 'hack-1',
      title: "The ATS Resume Breakthrough Formula",
      category: "Resume Strategy",
      content: "Quantify every project milestone: instead of 'worked on APIs', highlight 'scaled microservices throughput by 3x and reduced latency to 30ms'.",
      author: "Dilshod Mukhtarov (Lead Recruiter)",
      likes: 88,
    }
  ]
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
      tagline: 'Yangi avlod mutaxassislarini tarbiyalayotgan ilg‘or texnologiya maktabi.',
    },
  ],
  ru: [
    {
      id: 'comp-1',
      name: 'Uzum Technologies',
      industry: 'Экосистема E-commerce & Fintech',
      location: 'Ташкент',
      openPositions: 28,
      logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
      coverImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
      verified: true,
      tagline: 'Стройте карьеру в первом технологическом единороге Узбекистана.',
    }
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
    }
  ]
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

  // Selected article detail modal state
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);

  // Comments state
  const [comments, setComments] = useState<CommentItem[]>(COMMENTS_DATA[lang] || COMMENTS_DATA.uz);
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentTopic, setNewCommentTopic] = useState('#fikr');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Polls state
  const [polls, setPolls] = useState<PollItem[]>(POLL_DATA[lang] || POLL_DATA.uz);

  // Stream Filter: 'all' | 'jobs' | 'news' | 'comments' | 'polls'
  const [streamFilter, setStreamFilter] = useState<'all' | 'jobs' | 'news' | 'comments' | 'polls'>('all');

  // Endless Stream Generator & State
  const [streamItems, setStreamItems] = useState<StreamItem[]>([]);
  const [streamPage, setStreamPage] = useState(1);
  const [isLoadingMoreStream, setIsLoadingMoreStream] = useState(false);
  const infiniteSentinelRef = useRef<HTMLDivElement | null>(null);

  // Reply inline box state: commentId -> text
  const [replyBoxes, setReplyBoxes] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  // Sync language data changes
  useEffect(() => {
    setComments(COMMENTS_DATA[lang] || COMMENTS_DATA.uz);
    setPolls(POLL_DATA[lang] || POLL_DATA.uz);
  }, [lang]);

  // Build initial stream batch from available data
  useEffect(() => {
    const newsPool = NEWS_DATA[lang] || NEWS_DATA.uz;
    const commentsPool = COMMENTS_DATA[lang] || COMMENTS_DATA.uz;
    const pollsPool = POLL_DATA[lang] || POLL_DATA.uz;
    const hacksPool = CAREER_HACKS[lang] || CAREER_HACKS.uz;

    const initial: StreamItem[] = [];

    // Mix 1: Vacancy
    if (vacancies.length > 0) {
      initial.push({ streamId: `v-${vacancies[0].id}`, type: 'vacancy', data: vacancies[0] });
    }
    // Mix 2: News
    if (newsPool.length > 0) {
      initial.push({ streamId: `n-${newsPool[0].id}`, type: 'news', data: newsPool[0] });
    }
    // Mix 3: Community Discussion
    if (commentsPool.length > 0) {
      initial.push({ streamId: `d-${commentsPool[0].id}`, type: 'discussion', data: commentsPool[0] });
    }
    // Mix 4: Vacancy 2
    if (vacancies.length > 1) {
      initial.push({ streamId: `v-${vacancies[1].id}`, type: 'vacancy', data: vacancies[1] });
    }
    // Mix 5: Poll
    if (pollsPool.length > 0) {
      initial.push({ streamId: `p-${pollsPool[0].id}`, type: 'poll', data: pollsPool[0] });
    }
    // Mix 6: Career Hack
    if (hacksPool.length > 0) {
      initial.push({ streamId: `h-${hacksPool[0].id}`, type: 'career_hack', data: hacksPool[0] });
    }
    // Mix 7: Vacancy 3
    if (vacancies.length > 2) {
      initial.push({ streamId: `v-${vacancies[2].id}`, type: 'vacancy', data: vacancies[2] });
    }
    // Mix 8: Discussion 2
    if (commentsPool.length > 1) {
      initial.push({ streamId: `d-${commentsPool[1].id}`, type: 'discussion', data: commentsPool[1] });
    }

    setStreamItems(initial);
  }, [vacancies, lang]);

  // Load more stream items endlessly
  const loadMoreStream = useCallback(async () => {
    if (isLoadingMoreStream) return;
    setIsLoadingMoreStream(true);

    try {
      const nextPage = streamPage + 1;
      const res = await api.getVacancies({ page: nextPage, limit: 3 });
      const freshVacancies = res.success && res.data?.vacancies ? res.data.vacancies : [];

      const newsPool = NEWS_DATA[lang] || NEWS_DATA.uz;
      const commentsPool = comments;
      const pollsPool = polls;
      const hacksPool = CAREER_HACKS[lang] || CAREER_HACKS.uz;

      const randomNews = newsPool[(nextPage) % newsPool.length];
      const randomComment = commentsPool[(nextPage) % commentsPool.length];
      const randomPoll = pollsPool[(nextPage) % pollsPool.length];
      const randomHack = hacksPool[(nextPage) % hacksPool.length];

      const newBatch: StreamItem[] = [];

      // Add fresh vacancies from backend
      freshVacancies.forEach((vac, idx) => {
        newBatch.push({ streamId: `v-${vac.id}-${nextPage}-${idx}`, type: 'vacancy', data: vac });
      });

      // Add rotating daily news
      if (randomNews) {
        newBatch.push({ streamId: `n-${randomNews.id}-${nextPage}`, type: 'news', data: randomNews });
      }

      // Add community discussion
      if (randomComment) {
        newBatch.push({ streamId: `d-${randomComment.id}-${nextPage}`, type: 'discussion', data: randomComment });
      }

      // Add poll or career insight
      if (nextPage % 2 === 0 && randomPoll) {
        newBatch.push({ streamId: `p-${randomPoll.id}-${nextPage}`, type: 'poll', data: randomPoll });
      } else if (randomHack) {
        newBatch.push({ streamId: `h-${randomHack.id}-${nextPage}`, type: 'career_hack', data: randomHack });
      }

      setStreamItems((prev) => [...prev, ...newBatch]);
      setStreamPage(nextPage);
    } catch (err) {
      console.error('Failed to load more feed stream items', err);
    } finally {
      setIsLoadingMoreStream(false);
    }
  }, [streamPage, isLoadingMoreStream, lang, comments, polls]);

  // IntersectionObserver for Infinite Stream
  useEffect(() => {
    const sentinel = infiniteSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMoreStream) {
          loadMoreStream();
        }
      },
      { threshold: 0.1, rootMargin: '300px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMoreStream, isLoadingMoreStream]);

  // Add Comment Form Submission
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setIsSubmittingComment(true);
    setTimeout(() => {
      const createdComment: CommentItem = {
        id: `c-${Date.now()}`,
        authorName: currentUser?.name || t.guestUser,
        authorRole: currentUser?.role === 'employer' ? t.createVacancy : (currentUser?.profession || 'Mutaxassis'),
        authorAvatar:
          currentUser?.avatar_url ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
        content: newCommentText.trim(),
        timestamp: lang === 'ru' ? 'Только что' : lang === 'en' ? 'Just now' : 'Hozirgina',
        likes: 1,
        likedByMe: true,
        repliesCount: 0,
        topicTag: newCommentTopic.startsWith('#') ? newCommentTopic : `#${newCommentTopic}`,
        replies: []
      };

      setComments((prev) => [createdComment, ...prev]);

      // Also prepend to stream
      setStreamItems((prev) => [
        { streamId: `d-${createdComment.id}`, type: 'discussion', data: createdComment },
        ...prev
      ]);

      setNewCommentText('');
      setIsSubmittingComment(false);
    }, 250);
  };

  // Reply to Comment Thread
  const handleAddReply = (commentId: string) => {
    const replyText = replyBoxes[commentId]?.trim();
    if (!replyText) return;

    const newReply = {
      id: `rep-${Date.now()}`,
      authorName: currentUser?.name || t.guestUser,
      authorRole: currentUser?.profession || 'Mutaxassis',
      content: replyText,
      timestamp: lang === 'ru' ? 'Только что' : lang === 'en' ? 'Just now' : 'Hozirgina',
    };

    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          return {
            ...c,
            repliesCount: c.repliesCount + 1,
            replies: [...(c.replies || []), newReply]
          };
        }
        return c;
      })
    );

    // Also update in stream
    setStreamItems((prev) =>
      prev.map((item) => {
        if (item.type === 'discussion' && item.data.id === commentId) {
          return {
            ...item,
            data: {
              ...item.data,
              repliesCount: item.data.repliesCount + 1,
              replies: [...(item.data.replies || []), newReply]
            }
          };
        }
        return item;
      })
    );

    setReplyBoxes((prev) => ({ ...prev, [commentId]: '' }));
    setActiveReplyId(null);
  };

  // Toggle Like on Comment
  const handleToggleLikeComment = (commentId: string) => {
    const updater = (c: CommentItem) => {
      if (c.id === commentId) {
        const liked = !c.likedByMe;
        return {
          ...c,
          likedByMe: liked,
          likes: liked ? c.likes + 1 : c.likes - 1,
        };
      }
      return c;
    };

    setComments((prev) => prev.map(updater));
    setStreamItems((prev) =>
      prev.map((item) => {
        if (item.type === 'discussion' && item.data.id === commentId) {
          return { ...item, data: updater(item.data) };
        }
        return item;
      })
    );
  };

  // Vote on Poll
  const handleVotePoll = (pollId: string, optionIndex: number) => {
    const pollUpdater = (p: PollItem) => {
      if (p.id === pollId && p.userVotedIndex === undefined) {
        const updatedOptions = p.options.map((opt, i) =>
          i === optionIndex ? { ...opt, votes: opt.votes + 1 } : opt
        );
        return {
          ...p,
          totalVotes: p.totalVotes + 1,
          userVotedIndex: optionIndex,
          options: updatedOptions
        };
      }
      return p;
    };

    setPolls((prev) => prev.map(pollUpdater));
    setStreamItems((prev) =>
      prev.map((item) => {
        if (item.type === 'poll' && item.data.id === pollId) {
          return { ...item, data: pollUpdater(item.data) };
        }
        return item;
      })
    );
  };

  // Filtered Stream Items
  const displayedStream = streamItems.filter((item) => {
    if (streamFilter === 'jobs') return item.type === 'vacancy';
    if (streamFilter === 'news') return item.type === 'news';
    if (streamFilter === 'comments') return item.type === 'discussion';
    if (streamFilter === 'polls') return item.type === 'poll' || item.type === 'career_hack';
    return true;
  });

  const spotlightCompanies = SPOTLIGHT_DATA[lang] || SPOTLIGHT_DATA.uz;
  const salaryTrends = SALARY_DATA[lang] || SALARY_DATA.uz;

  return (
    <div className="space-y-6 pb-24">
      
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
                {vacancies.length > 0 ? `${vacancies.length}+` : '6,490+'} {t.vacanciesCount}
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

      {/* 2. TEZKOR FIKR / KAMENT QO'SHISH FORMASI (TOP QUICK POST FORM) */}
      <section className="bg-white dark:bg-slate-900/90 backdrop-blur rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
        <form onSubmit={handleAddComment} className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black flex items-center justify-center text-xs overflow-hidden shrink-0 shadow-sm">
              {currentUser?.avatar_url ? (
                <img src={currentUser.avatar_url} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                <span>{currentUser?.name ? currentUser.name[0].toUpperCase() : 'W'}</span>
              )}
            </div>
            <div className="flex-1">
              <span className="text-xs font-extrabold text-slate-900 dark:text-white">
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
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="#fikr">#fikr</option>
              <option value="#karyera">#karyera</option>
              <option value="#maoshlar">#maoshlar</option>
              <option value="#intervyu">#intervyu</option>
              <option value="#savol">#savol</option>
            </select>
          </div>

          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder={t.commentPlaceholder}
            rows={2}
            className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition"
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
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-500/25 flex items-center gap-1.5 transition active:scale-95"
            >
              <Send size={13} />
              <span>{isSubmittingComment ? t.submittingComment : t.submitComment}</span>
            </button>
          </div>
        </form>
      </section>

      {/* 3. KOMPANIYALAR VA STATISTIK VIDJETLAR (SPOTLIGHTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Top Companies */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/90 backdrop-blur rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <Building2 size={18} className="text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {t.leadingCompanies}
              </h3>
            </div>
            <button
              onClick={onNavigateToVacancies}
              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              {t.viewAllLink}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {spotlightCompanies.slice(0, 4).map((comp) => (
              <div
                key={comp.id}
                onClick={onNavigateToVacancies}
                className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-3 group"
              >
                <img
                  src={comp.logo}
                  alt={comp.name}
                  className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                      {comp.name}
                    </h4>
                    {comp.verified && (
                      <CheckCircle2 size={13} className="text-blue-500 fill-blue-500 text-white shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{comp.industry}</p>
                  <span className="inline-block mt-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {comp.openPositions} {t.openPositionsCount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Salary Trends Snapshot */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 shadow-xl border border-indigo-500/20 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <TrendingUp size={18} className="text-emerald-400" />
              <h3 className="text-sm font-extrabold text-white">
                {t.salaryIndexTitle}
              </h3>
            </div>
            <div className="space-y-2 pt-2">
              {salaryTrends.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                  <span className="text-slate-300 font-medium truncate max-w-[140px]">{item.role}</span>
                  <div className="text-right">
                    <span className="font-extrabold text-blue-300 block">{item.range}</span>
                    <span className="text-[10px] font-black text-emerald-400">{item.growth}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={onNavigateToVacancies}
            className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-blue-200 text-[11px] font-bold transition text-center"
          >
            {t.feedHeroBtn} →
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. 🔥 CHEKSIZ JONLI PROFESSIONAL LENTA (ENDLESS INFINITE FEED STREAM)      */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        
        {/* Stream Header & Filter Chips */}
        <div className="bg-white dark:bg-slate-900/90 backdrop-blur rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>{t.streamTitle}</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {t.streamSubtitle}
              </p>
            </div>

            {/* Stream Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setStreamFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  streamFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {t.streamFilterAll}
              </button>
              <button
                onClick={() => setStreamFilter('jobs')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  streamFilter === 'jobs'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {t.streamFilterJobs}
              </button>
              <button
                onClick={() => setStreamFilter('news')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  streamFilter === 'news'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {t.streamFilterNews}
              </button>
              <button
                onClick={() => setStreamFilter('comments')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  streamFilter === 'comments'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {t.streamFilterComments}
              </button>
              <button
                onClick={() => setStreamFilter('polls')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  streamFilter === 'polls'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {t.streamFilterPolls}
              </button>
            </div>
          </div>
        </div>

        {/* Endless Stream Cards List */}
        <div className="space-y-4">
          {displayedStream.map((item) => {
            
            // ---------------------------------------------------------------
            // 💼 CARD: VACANCY (Bo'sh ish o'rni)
            // ---------------------------------------------------------------
            if (item.type === 'vacancy') {
              const v = item.data;
              return (
                <div
                  key={item.streamId}
                  onClick={() => onSelectVacancy(v)}
                  className="p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/95 hover:border-blue-400 dark:hover:border-blue-600 transition shadow-sm hover:shadow-md cursor-pointer space-y-3 group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                        {v.company ? v.company[0].toUpperCase() : 'W'}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {v.company || 'Kompaniya'}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold">
                            {t.categories?.[v.category] || v.category || 'IT'}
                          </span>
                          {v.location && (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <MapPin size={11} />
                              {t.regions?.[v.location] || v.location}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition leading-snug">
                          {v.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {onToggleSave && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSave(v);
                          }}
                          className={`p-2 rounded-xl border transition ${
                            isSaved && isSaved(v.id)
                              ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400'
                              : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                          }`}
                        >
                          <Bookmark size={15} className={isSaved && isSaved(v.id) ? 'fill-blue-600 dark:fill-blue-400' : ''} />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {v.description}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <DollarSign size={14} />
                      <span>{v.salary_min ? `${v.salary_min} - ${v.salary_max} ${v.salary_currency || 'UZS'}` : t.salaryNegotiable}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onApplyVacancy(v);
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold shadow-md shadow-blue-500/25 transition flex items-center gap-1.5"
                    >
                      <Briefcase size={13} />
                      <span>{t.applyBtn}</span>
                    </button>
                  </div>
                </div>
              );
            }

            // ---------------------------------------------------------------
            // 📰 CARD: NEWS (Yangilik / Tahlil)
            // ---------------------------------------------------------------
            if (item.type === 'news') {
              const news = item.data;
              return (
                <article
                  key={item.streamId}
                  onClick={() => setSelectedArticle(news)}
                  className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/95 overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer group"
                >
                  <div className="flex flex-col sm:flex-row">
                    <div className="sm:w-60 h-44 sm:h-auto relative bg-slate-200 dark:bg-slate-700 shrink-0">
                      <img
                        src={news.image}
                        alt={news.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        loading="lazy"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur text-white text-[10px] font-black uppercase tracking-wider">
                          {news.category}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          <Calendar size={12} />
                          <span>{news.date}</span>
                          <span>•</span>
                          <span className="text-blue-600 dark:text-blue-400 font-extrabold">{news.author}</span>
                        </div>

                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition leading-snug">
                          {news.title}
                        </h3>

                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                          {news.excerpt}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
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
                    </div>
                  </div>
                </article>
              );
            }

            // ---------------------------------------------------------------
            // 💬 CARD: COMMUNITY DISCUSSION & COMMENTS
            // ---------------------------------------------------------------
            if (item.type === 'discussion') {
              const comment = item.data;
              const hasReplies = comment.replies && comment.replies.length > 0;
              const isReplying = activeReplyId === comment.id;

              return (
                <div
                  key={item.streamId}
                  className="p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/95 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={comment.authorAvatar}
                        alt={comment.authorName}
                        className="w-10 h-10 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                            {comment.authorName}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                            {comment.authorRole}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">{comment.timestamp}</span>
                      </div>
                    </div>

                    <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/70 px-2.5 py-0.5 rounded-md">
                      {comment.topicTag}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                    {comment.content}
                  </p>

                  {/* Actions & Like Counter */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
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
                      onClick={() => setActiveReplyId(isReplying ? null : comment.id)}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {isReplying ? t.closeBtn : t.replyBtn}
                    </button>
                  </div>

                  {/* Existing Replies */}
                  {hasReplies && (
                    <div className="pl-6 space-y-2 pt-2 border-l-2 border-slate-100 dark:border-slate-800">
                      {comment.replies.map((rep: any) => (
                        <div key={rep.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-xs space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-extrabold text-slate-900 dark:text-white">{rep.authorName}</span>
                            <span className="text-slate-400">{rep.timestamp}</span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 font-medium">{rep.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline Reply Input Box */}
                  {isReplying && (
                    <div className="pt-2 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={`@${comment.authorName} ga javob yozing...`}
                        value={replyBoxes[comment.id] || ''}
                        onChange={(e) => setReplyBoxes({ ...replyBoxes, [comment.id]: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddReply(comment.id)}
                        className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleAddReply(comment.id)}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm hover:bg-blue-700 transition"
                      >
                        <Send size={13} />
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            // ---------------------------------------------------------------
            // 📊 CARD: INTERACTIVE POLL (So'rovnoma)
            // ---------------------------------------------------------------
            if (item.type === 'poll') {
              const poll = item.data;
              const hasVoted = poll.userVotedIndex !== undefined;

              return (
                <div
                  key={item.streamId}
                  className="p-5 rounded-3xl border border-indigo-200/80 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/40 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/40 shadow-sm space-y-3.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      {poll.tag}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      {poll.totalVotes} {t.viewsCount}
                    </span>
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                    {poll.question}
                  </h3>

                  <div className="space-y-2">
                    {poll.options.map((opt: any, optIdx: number) => {
                      const percentage = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                      const isUserChoice = poll.userVotedIndex === optIdx;

                      return (
                        <button
                          key={optIdx}
                          disabled={hasVoted}
                          onClick={() => handleVotePoll(poll.id, optIdx)}
                          className={`w-full p-3 rounded-2xl border text-left transition relative overflow-hidden flex items-center justify-between text-xs font-bold ${
                            isUserChoice
                              ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300'
                              : 'border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 hover:border-blue-400'
                          }`}
                        >
                          {/* Progress bar background fill if voted */}
                          {hasVoted && (
                            <div
                              style={{ width: `${percentage}%` }}
                              className={`absolute inset-y-0 left-0 transition-all duration-700 pointer-events-none opacity-20 ${
                                isUserChoice ? 'bg-blue-600' : 'bg-slate-500'
                              }`}
                            />
                          )}

                          <div className="relative z-10 flex items-center gap-2">
                            {isUserChoice && <Check size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />}
                            <span>{opt.text}</span>
                          </div>

                          {hasVoted && (
                            <span className="relative z-10 text-[11px] font-black text-slate-600 dark:text-slate-400">
                              {percentage}%
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {hasVoted && (
                    <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 pt-1">
                      <CheckCircle2 size={13} />
                      <span>{t.pollVotedBadge}</span>
                    </div>
                  )}
                </div>
              );
            }

            // ---------------------------------------------------------------
            // 💡 CARD: CAREER HACK / ADVICE
            // ---------------------------------------------------------------
            if (item.type === 'career_hack') {
              const hack = item.data;
              return (
                <div
                  key={item.streamId}
                  className="p-5 rounded-3xl border border-amber-200/80 dark:border-amber-900/50 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/20 dark:from-slate-900 dark:via-slate-900/90 dark:to-amber-950/30 shadow-sm space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lightbulb size={16} className="text-amber-500" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        {t.careerHackTitle}
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                      {hack.category}
                    </span>
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                    {hack.title}
                  </h3>

                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    {hack.content}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                    <span>{hack.author}</span>
                    <span className="flex items-center gap-1 text-rose-500">
                      <Heart size={12} className="fill-rose-500" />
                      {hack.likes}
                    </span>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* ========================================================================= */}
        {/* 🔄 INFINITE SCROLL TRIGGER SENTINEL (NEVER ENDS)                          */}
        {/* ========================================================================= */}
        <div ref={infiniteSentinelRef} className="py-6 text-center">
          <div className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm text-xs font-bold text-blue-600 dark:text-blue-400">
            <RefreshCw size={16} className="animate-spin text-blue-600" />
            <span>{t.loadingMoreStreamNotice}</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 📖 ARTICLE DETAIL MODAL                                                    */}
      {/* ========================================================================= */}
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
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Eye size={13} />
                    {selectedArticle.views} {t.viewsCount}
                  </span>
                  <span className="text-xs text-rose-500 flex items-center gap-1 font-bold">
                    <Heart size={13} className="fill-rose-500" />
                    {selectedArticle.likes}
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
