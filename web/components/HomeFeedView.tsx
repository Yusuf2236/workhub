'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  Newspaper,
  MessageCircle,
  ThumbsUp,
  Share2,
  Bookmark,
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
import { Language } from '../lib/translations';

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

const INITIAL_NEWS: NewsItem[] = [
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
];

const INITIAL_COMMENTS: CommentItem[] = [
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
];

const SPOTLIGHT_COMPANIES: CompanySpotlight[] = [
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
];

const SALARY_TRENDS = [
  { role: 'Backend (Go, Java, Python)', range: '$900 - $3,800', growth: '+28%', popular: true },
  { role: 'Frontend & Full-stack (React, Next.js)', range: '$700 - $2,900', growth: '+22%', popular: true },
  { role: 'Mobile Dev (Flutter, iOS, Android)', range: '$800 - $3,200', growth: '+25%', popular: false },
  { role: 'DevOps & Cloud Security', range: '$1,200 - $4,200', growth: '+35%', popular: true },
  { role: 'UI/UX & Product Design', range: '$600 - $2,400', growth: '+18%', popular: false },
];

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
  const [selectedNewsCategory, setSelectedNewsCategory] = useState('Barchasi');
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [newsList, setNewsList] = useState<NewsItem[]>(INITIAL_NEWS);

  // Live Comments State
  const [comments, setComments] = useState<CommentItem[]>(INITIAL_COMMENTS);
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentTopic, setNewCommentTopic] = useState('#fikr');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // News category filter
  const newsCategories = ['Barchasi', 'Bozor tahlili', 'Tadbirlar', 'Karyera maslahati', 'Masofaviy ish'];
  const filteredNews =
    selectedNewsCategory === 'Barchasi'
      ? newsList
      : newsList.filter((n) => n.category === selectedNewsCategory);

  // Like comment handler
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

  // Like article handler
  const handleLikeArticle = (articleId: string) => {
    setNewsList((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, likes: a.likes + 1 } : a))
    );
    if (selectedArticle && selectedArticle.id === articleId) {
      setSelectedArticle({ ...selectedArticle, likes: selectedArticle.likes + 1 });
    }
  };

  // Submit comment handler
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setIsSubmittingComment(true);
    setTimeout(() => {
      const newComment: CommentItem = {
        id: `c-${Date.now()}`,
        authorName: currentUser?.name || 'Foydalanuvchi',
        authorRole: currentUser?.role === 'employer' ? 'Ish beruvchi' : 'Mutaxassis / Izlovchi',
        authorAvatar:
          currentUser?.avatar_url ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
        content: newCommentText.trim(),
        timestamp: 'Hozirgina',
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

  // 3 Featured hot jobs
  const featuredVacancies = vacancies.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* 1. HERO SPOTLIGHT BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 text-white p-6 sm:p-8 shadow-xl shadow-blue-900/20 border border-blue-500/30">
        {/* Ambient background glow & decorative circles */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs font-bold text-blue-200">
              <Sparkles size={14} className="text-yellow-400 animate-pulse" />
              <span>WZone 2026 Raqamli Mehnat Bozoriga Xush Kelibsiz!</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              Karyerangizni yangi bosqichga olib chiqing
            </h1>

            <p className="text-sm text-blue-100/90 leading-relaxed font-medium">
              O‘zbekiston va xalqaro bozorning eng so‘nggi vakansiyalari, tahliliy yangiliklar, soha mutaxassislari bilan jonli muloqot va sun’iy intellekt rezyume tekshiruvi.
            </p>

            {/* Quick Stat Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur text-xs font-bold text-white border border-white/10 flex items-center gap-1.5">
                <Briefcase size={13} className="text-emerald-400" />
                {vacancies.length > 0 ? `${vacancies.length}+` : '5,400+'} Vakansiyalar
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur text-xs font-bold text-white border border-white/10 flex items-center gap-1.5">
                <Building2 size={13} className="text-blue-300" />
                1,200+ Korxonalar
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur text-xs font-bold text-white border border-white/10 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-amber-300" />
                OneID bilan Tasdiqlangan
              </span>
            </div>
          </div>

          {/* Quick CTA Actions */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={onNavigateToVacancies}
              className="px-5 py-3 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 font-black text-xs shadow-lg shadow-black/10 flex items-center justify-center gap-2 transition group"
            >
              <span>Vakansiyalarni ko‘rish</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition" />
            </button>

            <button
              onClick={onOpenCreateResume}
              className="px-5 py-3 rounded-2xl bg-blue-600/60 hover:bg-blue-600 text-white font-bold text-xs border border-white/20 backdrop-blur flex items-center justify-center gap-2 transition"
            >
              <Plus size={16} />
              <span>Rezyume joylashtirish</span>
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
                Yangiliklar & Karyera Tahlillari
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-black">
                  REAL-TIME
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                O‘zbekiston va jahon mehnat bozoridagi eng muhim o‘zgarishlar va ekspert maslahatlari
              </p>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {newsCategories.map((cat) => (
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
                {/* News Image with category badge */}
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

                {/* News Content */}
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

              {/* Card Footer */}
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
                  <span>To‘liq o‘qish</span>
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
                Jonli Muhokamalar & Fikrlar
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Dasturchilar, HR menejerlar va nomzodlar o‘rtasidagi professional tajriba almashinuvi
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
                {currentUser?.name || 'Mehmon foydalanuvchi'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                Jamiyat bilan fikr yoki tajribangizni ulashing
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
            placeholder="O‘z fikringiz, maslahatingiz yoki savolingizni yozing..."
            rows={2}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span>Mavzu:</span>
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
              <span>{isSubmittingComment ? 'Yuborilmoqda...' : 'Fikr bildirish'}</span>
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
                    <span>{comment.repliesCount} ta javob</span>
                  </span>
                </div>

                <button
                  onClick={() => {
                    setNewCommentText(`@${comment.authorName} `);
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                >
                  Javob berish
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
                Haftaning Eng Sara Vakansiyalari
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Yuqori maoshli va tezkor ko‘rib chiqiluvchi takliflar
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateToVacancies}
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            <span>Barchasini ko‘rish ({vacancies.length})</span>
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
                        {v.category || 'IT'}
                      </span>
                      {v.location && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <MapPin size={11} />
                          {v.location}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                      {v.title}
                    </h3>

                    <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <DollarSign size={13} />
                      <span>{v.salary_min ? `${v.salary_min} - ${v.salary_max} ${v.salary_currency || 'UZS'}` : "Kelishilgan maosh"}</span>
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
                    Ariza topshirish
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              Hozircha faol vakansiyalar yuklanmoqda...
            </div>
          )}
        </div>

        <button
          onClick={onNavigateToVacancies}
          className="w-full py-3 rounded-2xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-slate-700 font-extrabold text-xs flex items-center justify-center gap-2 transition"
        >
          <span>Katalogdagi barcha {vacancies.length} ta vakansiyalarni ko‘rish</span>
          <ArrowRight size={14} />
        </button>
      </section>

      {/* 5. TOP ISH BERUVCHILAR VA OFIS FOTO-TAHLILLARI (COMPANY SPOTLIGHTS & MEDIA) */}
      <section className="bg-white dark:bg-slate-900/90 backdrop-blur rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Yetakchi Texnologiya Kompaniyalari
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Eng nufuzli jamoalar, zamonaviy ofislar va ochiq ish o‘rinlari
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SPOTLIGHT_COMPANIES.map((comp) => (
            <div
              key={comp.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="h-28 w-full relative bg-slate-300">
                  <img src={comp.coverImage} alt={comp.name} className="w-full h-full object-cover" />
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-black">
                    {comp.openPositions} ta ochiq vakansiya
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
                  <span>Kompaniya vakansiyalarini ko‘rish</span>
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
              2026-yil O‘rtacha Maoshlar Indeksi
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-black">
                YANGI STATISTIKA
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              WZone tahliliy markazi ma’lumotlariga ko‘ra O‘zbekiston IT bozoridagi oylik maoshlar
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SALARY_TRENDS.map((item, idx) => (
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
                <span className="text-[10px] font-medium text-slate-400">/oy</span>
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
                    <span>{selectedArticle.likes} Yoqdi</span>
                  </button>

                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Eye size={13} />
                    {selectedArticle.views} ko‘rildi
                  </span>
                </div>

                <button
                  onClick={() => setSelectedArticle(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
