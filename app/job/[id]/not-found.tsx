import Link from 'next/link';

export default function JobNotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-slate-50 dark:bg-[#0b0f19]">
      <div className="text-center space-y-3 max-w-md">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Vakansiya topilmadi
        </h1>
        <p className="text-sm text-slate-500">
          Bu eʼlon o‘chirilgan yoki mavjud emas. Boshqa vakansiyalarni ko‘ring.
        </p>
        <Link
          href="/job"
          className="inline-flex px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold"
        >
          Barcha vakansiyalar
        </Link>
      </div>
    </main>
  );
}
