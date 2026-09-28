import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "WorkHub — O'zbekistondagi zamonaviy ish va vakansiyalar platformasi",
  description: "WorkHub — ish qidiruvchilar va ish beruvchilar uchun zamonaviy, real-vaqt platformasi. OneID va Google orqali tezkor kirish.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <script src="https://accounts.google.com/gsi/client" async defer />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('workhub_theme');
                  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (saved === 'dark' || (!saved && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 min-h-screen antialiased selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
