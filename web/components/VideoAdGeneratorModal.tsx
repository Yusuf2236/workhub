'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Download,
  Sparkles,
  Video,
  Layers,
  Volume2,
  VolumeX,
  Share2,
  CheckCircle2,
  Building2,
  Briefcase,
  DollarSign,
  MapPin,
  Clock,
  Flame,
  Check,
} from 'lucide-react';
import { Language, translations } from '../lib/translations';

interface VideoAdGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vacancies?: any[];
  currentUser?: any;
  lang?: Language;
}

type VideoTheme = 'cyber' | 'corporate' | 'flash' | 'minimal';

interface VideoData {
  companyName: string;
  jobTitle: string;
  salary: string;
  location: string;
  perks: string[];
  contact: string;
}

const THEME_STYLES: Record<
  VideoTheme,
  {
    name: string;
    bgGradient: [string, string, string];
    accent: string;
    textAccent: string;
    badgeBg: string;
  }
> = {
  cyber: {
    name: 'Tech Cyber Neon',
    bgGradient: ['#0A0E1A', '#1E1B4B', '#020617'],
    accent: '#3B82F6',
    textAccent: '#60A5FA',
    badgeBg: 'rgba(59, 130, 246, 0.25)',
  },
  corporate: {
    name: 'Executive Navy & Gold',
    bgGradient: ['#0B132B', '#1C2541', '#0B132B'],
    accent: '#F59E0B',
    textAccent: '#FCD34D',
    badgeBg: 'rgba(245, 158, 11, 0.25)',
  },
  flash: {
    name: 'Urgent Hiring Flash',
    bgGradient: ['#450A0A', '#1E1B4B', '#030712'],
    accent: '#EF4444',
    textAccent: '#FCA5A5',
    badgeBg: 'rgba(239, 68, 68, 0.25)',
  },
  minimal: {
    name: 'Emerald Clean Modern',
    bgGradient: ['#022C22', '#064E3B', '#022C22'],
    accent: '#10B981',
    textAccent: '#6EE7B7',
    badgeBg: 'rgba(16, 185, 129, 0.25)',
  },
};

export default function VideoAdGeneratorModal({
  isOpen,
  onClose,
  vacancies = [],
  currentUser,
  lang = 'uz',
}: VideoAdGeneratorModalProps) {
  const t = translations[lang] || translations.uz;

  // Selected vacancy or custom details
  const [selectedVacancyId, setSelectedVacancyId] = useState<string>('custom');
  const [theme, setTheme] = useState<VideoTheme>('cyber');
  const [companyName, setCompanyName] = useState(
    currentUser?.company_name || currentUser?.name || 'WZone Tashkilot'
  );
  const [jobTitle, setJobTitle] = useState('Senior Go Developer');
  const [salary, setSalary] = useState('$2,000 - $3,500 / oy');
  const [location, setLocation] = useState('Toshkent shahri (Gibrid)');
  const [perk1, setPerk1] = useState('Moslashuvchan grafik');
  const [perk2, setPerk2] = useState('Yillik bonuslar & Sug‘urta');
  const [contact, setContact] = useState('wzone.uz orqali ariza bering');

  // Player controls
  const [isPlaying, setIsPlaying] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Populate from active vacancy selection
  useEffect(() => {
    if (selectedVacancyId !== 'custom') {
      const v = vacancies.find((item) => String(item.id) === selectedVacancyId);
      if (v) {
        setJobTitle(v.title || '');
        setCompanyName(v.company_name || v.company || companyName);
        if (v.salary_min || v.salary_max) {
          const min = v.salary_min ? v.salary_min.toLocaleString() : '';
          const max = v.salary_max ? v.salary_max.toLocaleString() : '';
          const curr = v.currency || 'UZS';
          setSalary(min && max ? `${min} - ${max} ${curr}` : min ? `Dan ${min} ${curr}` : `${max} ${curr}`);
        } else {
          setSalary('Kelishilgan holda');
        }
        setLocation(v.location || v.region || 'Toshkent');
      }
    }
  }, [selectedVacancyId, vacancies]);

  // Audio tone synth for ambient tech rhythm
  const playBeep = (freq: number, duration = 0.08) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  };

  // Canvas rendering loop: generates a 9:16 high-resolution animated reel
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set resolution (720x1280 - perfect 9:16 Story/Reel format)
    canvas.width = 720;
    canvas.height = 1280;

    const DURATION_PER_SCENE = 3500; // 3.5s per scene
    const TOTAL_SCENES = 4;
    const TOTAL_CYCLE = DURATION_PER_SCENE * TOTAL_SCENES; // 14s loop
    let lastBeat = 0;

    const render = () => {
      const now = Date.now();
      const elapsed = isPlaying ? (now - startTimeRef.current) % TOTAL_CYCLE : 0;
      const currentScene = Math.floor(elapsed / DURATION_PER_SCENE);
      const sceneProgress = (elapsed % DURATION_PER_SCENE) / DURATION_PER_SCENE;

      // Pulse audio beat
      const currentBeat = Math.floor(elapsed / 600);
      if (currentBeat !== lastBeat) {
        lastBeat = currentBeat;
        if (currentBeat % 2 === 0) playBeep(220, 0.06);
        else playBeep(330, 0.04);
      }

      const activeTheme = THEME_STYLES[theme];

      // 1. Dynamic Gradient Background
      const grad = ctx.createLinearGradient(0, 0, 720, 1280);
      grad.addColorStop(0, activeTheme.bgGradient[0]);
      grad.addColorStop(0.5, activeTheme.bgGradient[1]);
      grad.addColorStop(1, activeTheme.bgGradient[2]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 720, 1280);

      // 2. Animated floating particle circles
      for (let i = 0; i < 24; i++) {
        const seed = i * 137.5;
        const x = (Math.sin(seed + elapsed * 0.0006) * 0.5 + 0.5) * 720;
        const y = ((seed * 11 + elapsed * 0.04) % 1360) - 40;
        const r = (Math.sin(seed * 3) * 0.5 + 0.5) * 8 + 3;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = activeTheme.accent;
        ctx.globalAlpha = 0.12;
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // 3. Top Branding Bar
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.roundRect(40, 50, 640, 80, 20);
      ctx.fill();

      // WZone Logo Badge
      ctx.fillStyle = '#0047BA';
      ctx.roundRect(55, 62, 56, 56, 14);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('W', 83, 102);

      // Platform text
      ctx.textAlign = 'left';
      ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('WZone Jobs', 125, 96);
      ctx.font = '16px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText('O‘zbekiston Rasmiy Karyera Portali', 125, 120);

      // Live Beacon Tag
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.roundRect(520, 68, 140, 44, 12);
      ctx.fill();
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(542, 90, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
      ctx.fillText('Faol Vakansiya', 556, 96);
      ctx.restore();

      // 4. Scene Switching Logic
      ctx.save();
      // Scene Transition Fade
      let sceneAlpha = 1;
      if (sceneProgress < 0.1) sceneAlpha = sceneProgress / 0.1;
      else if (sceneProgress > 0.9) sceneAlpha = (1 - sceneProgress) / 0.1;
      ctx.globalAlpha = sceneAlpha;

      if (currentScene === 0) {
        // SCENE 1: HOOK & COMPANY
        ctx.textAlign = 'center';
        ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = activeTheme.textAccent;
        ctx.fillText('⚡ BIZ JAMOMIZGA MUTAXASSIS IZLAYAPMIZ', 360, 360);

        // Huge Company Name
        ctx.font = '900 52px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(companyName, 360, 460);

        // Subtitle badge
        ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText('Kompaniyasida yangi imkoniyat!', 360, 530);

        // Visual Icon Box
        ctx.fillStyle = activeTheme.badgeBg;
        ctx.roundRect(220, 620, 280, 280, 36);
        ctx.fill();
        ctx.strokeStyle = activeTheme.accent;
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.font = '900 110px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = activeTheme.textAccent;
        ctx.fillText('💼', 360, 800);

        ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('Tezkor saralash jarayoni', 360, 970);
      } else if (currentScene === 1) {
        // SCENE 2: JOB TITLE & ROLE
        ctx.textAlign = 'center';
        ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = activeTheme.textAccent;
        ctx.fillText('BO‘SH ISH O‘RNI (VAKANSIYA)', 360, 340);

        // Massive Job Title
        ctx.font = '900 56px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        // Wrap title if long
        const words = jobTitle.split(' ');
        if (words.length > 3) {
          const mid = Math.ceil(words.length / 2);
          ctx.fillText(words.slice(0, mid).join(' '), 360, 450);
          ctx.fillText(words.slice(mid).join(' '), 360, 520);
        } else {
          ctx.fillText(jobTitle, 360, 470);
        }

        // Location Box
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.roundRect(140, 630, 440, 80, 20);
        ctx.fill();
        ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`📍 ${location}`, 360, 680);

        // Verification Badge
        ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
        ctx.roundRect(160, 760, 400, 70, 18);
        ctx.fill();
        ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#34D399';
        ctx.fillText('✓ OneID bilan Tasdiqlangan', 360, 804);
      } else if (currentScene === 2) {
        // SCENE 3: SALARY & PERKS
        ctx.textAlign = 'center';
        ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = activeTheme.textAccent;
        ctx.fillText('TAKLIFF ETILAYOTGAN MAOSH', 360, 340);

        // Gold / Accent Salary Card
        ctx.fillStyle = activeTheme.badgeBg;
        ctx.roundRect(80, 400, 560, 140, 28);
        ctx.fill();
        ctx.strokeStyle = activeTheme.accent;
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.font = '900 52px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(salary, 360, 490);

        // Benefits / Perks Cards
        ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';

        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.roundRect(100, 600, 520, 90, 20);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`✨ ${perk1}`, 360, 655);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.roundRect(100, 720, 520, 90, 20);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`🚀 ${perk2}`, 360, 775);
      } else {
        // SCENE 4: CALL TO ACTION
        ctx.textAlign = 'center';
        ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = activeTheme.textAccent;
        ctx.fillText('IMKONIYATNI QO‘LDAN BOY BERMANG', 360, 350);

        ctx.font = '900 54px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('Hoziroq Ariza Bering!', 360, 440);

        // Big CTA Button Glow
        ctx.fillStyle = activeTheme.accent;
        ctx.roundRect(100, 570, 520, 110, 28);
        ctx.fill();
        ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('WZone orqali topshirish', 360, 640);

        // Contact info
        ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillText(contact, 360, 750);

        ctx.font = '20px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillText('id.egov.uz orqali xavfsiz tasdiqlangan', 360, 810);
      }
      ctx.restore();

      // 5. Bottom Progress Bars (Scene Indicators)
      const barWidth = (640 - 10 * 3) / TOTAL_SCENES;
      for (let s = 0; s < TOTAL_SCENES; s++) {
        const x = 40 + s * (barWidth + 10);
        const y = 1200;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.roundRect(x, y, barWidth, 6, 3);
        ctx.fill();

        if (s < currentScene) {
          ctx.fillStyle = activeTheme.accent;
          ctx.roundRect(x, y, barWidth, 6, 3);
          ctx.fill();
        } else if (s === currentScene) {
          ctx.fillStyle = activeTheme.accent;
          ctx.roundRect(x, y, barWidth * sceneProgress, 6, 3);
          ctx.fill();
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [
    isOpen,
    isPlaying,
    soundEnabled,
    theme,
    companyName,
    jobTitle,
    salary,
    location,
    perk1,
    perk2,
    contact,
  ]);

  // Video Export / Recording
  const handleStartRecording = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setRecording(true);
      setRecordProgress(0);
      setDownloadUrl(null);

      const stream = canvas.captureStream(30); // 30 FPS
      const recordedChunks: Blob[] = [];

      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        setRecording(false);
      };

      startTimeRef.current = Date.now();
      setIsPlaying(true);
      recorder.start();

      // Record full 14s loop
      const RECORD_TIME = 14000;
      const interval = setInterval(() => {
        const p = Math.min(100, Math.round(((Date.now() - startTimeRef.current) / RECORD_TIME) * 100));
        setRecordProgress(p);
      }, 200);

      setTimeout(() => {
        clearInterval(interval);
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      }, RECORD_TIME);
    } catch (err) {
      console.error('Recording error', err);
      setRecording(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[94vh] animate-scaleUp"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <Video size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  WZone AI Video Reklama Generatori
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-extrabold uppercase shadow">
                  HD 9:16 Reel
                </span>
              </div>
              <p className="text-xs text-blue-100">
                Vakansiya va kompaniyangiz uchun professional animatsion video reklama yarating va yuklab oling
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Video Preview & Player (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-3">
            {/* 9:16 Video Canvas Box */}
            <div className="relative w-full max-w-[280px] sm:max-w-[310px] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700/80 bg-slate-950 group">
              <canvas
                ref={canvasRef}
                className="w-full h-full object-cover block"
              />

              {/* Recording Overlay Indicator */}
              {recording && (
                <div className="absolute top-4 left-4 right-4 p-2 rounded-xl bg-black/80 backdrop-blur border border-red-500/50 flex items-center justify-between text-xs text-white">
                  <div className="flex items-center gap-2 font-bold text-red-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping inline-block" />
                    <span>Yozilmoqda...</span>
                  </div>
                  <span className="font-mono font-bold text-amber-400">{recordProgress}%</span>
                </div>
              )}
            </div>

            {/* Video Controls Bar */}
            <div className="w-full max-w-[310px] p-2 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-between gap-1 shadow-xs">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-white hover:text-blue-600 transition shadow-xs cursor-pointer"
                title={isPlaying ? 'Pauza' : 'Ijro etish'}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>

              <button
                type="button"
                onClick={() => {
                  startTimeRef.current = Date.now();
                  setIsPlaying(true);
                }}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 transition cursor-pointer"
                title="Boshidan boshlash"
              >
                <RotateCcw size={16} />
              </button>

              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  soundEnabled
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 hover:bg-white dark:hover:bg-slate-900'
                }`}
                title={soundEnabled ? 'Ovozni o‘chirish' : 'Ovozni yoqish'}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>

              <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

              {downloadUrl ? (
                <a
                  href={downloadUrl}
                  download={`wzone-video-ad-${jobTitle.toLowerCase().replace(/\s+/g, '-')}.webm`}
                  className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md animate-bounce"
                >
                  <Download size={14} />
                  <span>Videoni yuklash</span>
                </a>
              ) : (
                <button
                  type="button"
                  disabled={recording}
                  onClick={handleStartRecording}
                  className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  {recording ? (
                    <span>{recordProgress}% Yozilmoqda</span>
                  ) : (
                    <>
                      <Download size={14} />
                      <span>Video fayl olish (14s)</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Customizer & Settings (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Quick Template Picker */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                1. Video Dizayn Uslubini Tanlang
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.keys(THEME_STYLES) as VideoTheme[]).map((tKey) => {
                  const isSel = theme === tKey;
                  return (
                    <button
                      key={tKey}
                      type="button"
                      onClick={() => setTheme(tKey)}
                      className={`p-2.5 rounded-xl border-2 text-left transition cursor-pointer ${
                        isSel
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: THEME_STYLES[tKey].accent }} />
                        {isSel && <Check size={12} className="text-blue-600 font-bold" />}
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {THEME_STYLES[tKey].name.split(' ')[0]}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Autofill from active vacancy */}
            {vacancies.length > 0 && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  2. Mavjud Vakansiyadan Avtomatik To‘ldirish
                </label>
                <select
                  value={selectedVacancyId}
                  onChange={(e) => setSelectedVacancyId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="custom">-- Maxsus matn kiritish --</option>
                  {vacancies.map((v) => (
                    <option key={v.id} value={String(v.id)}>
                      {v.title} ({v.company_name || v.company || 'Kompaniya'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Editable Fields */}
            <div className="space-y-3 pt-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                3. Video Reklama Matnlari
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Kompaniya nomi
                  </span>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Lavozim / Kasb
                  </span>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Maosh miqdori
                  </span>
                  <input
                    type="text"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Shahar / Manzil
                  </span>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Afzallik 1
                  </span>
                  <input
                    type="text"
                    value={perk1}
                    onChange={(e) => setPerk1(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Afzallik 2
                  </span>
                  <input
                    type="text"
                    value={perk2}
                    onChange={(e) => setPerk2(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <span className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Murojaat / CTA matni
                </span>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Quick Info Box */}
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-2xl border border-blue-200 dark:border-blue-900/60 text-xs space-y-1">
              <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" />
                <span>Instagram Story, Telegram & TikTok uchun tayyor</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                Ushbu video reklama avtomatik ravishda 14 soniyalik 4 ta sahnada (Kompaniya, Kasb, Maosh va Ariza topshirish) harakatlanadi. "Video fayl olish" tugmasini bosing va olingan videoni to‘g‘ridan-to‘g‘ri ijtimoiy tarmoqlarga joylang!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
