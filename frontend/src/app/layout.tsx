import type { Metadata } from 'next';
import { Outfit, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { ToastProvider } from '@/components/Toast';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from 'sonner';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MoviNEXO | Asistente Comercial Inteligente Movistar',
  description: 'MoviNEXO: Plataforma inteligente de personalización de ofertas, Next Best Offer y convergencia Movistar Total para asesores comerciales.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`dark ${outfit.variable} ${jakarta.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased selection:bg-[#019DF4]/30 selection:text-[#00D2FF]">
        <ThemeProvider>
          <ToastProvider>
            <Navbar />
            <main className="max-w-[1440px] w-full mx-auto p-4 sm:p-6 flex-1">
              {children}
            </main>
            <Toaster richColors position="bottom-right" closeButton />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

