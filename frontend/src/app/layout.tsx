import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import { ToastProvider } from '@/components/Toast';

export const metadata: Metadata = {
  title: 'Movistar Smart Personalization | NBO & Movistar Total',
  description: 'Motor predictivo de personalización comercial, Next Best Offer y convergencia Movistar Total para asesores y canales digitales.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col bg-[#071524] text-white">
        <ToastProvider>
          <Navbar />
          <main className="max-w-[1440px] w-full mx-auto p-6 flex-1">
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
