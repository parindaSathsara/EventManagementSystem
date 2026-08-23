import type { Metadata } from 'next';
import { Manrope, Sora } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/auth-provider';
import { MobileDock, SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

const sora = Sora({ subsets: ['latin'], variable: '--font-heading' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: { default: 'Stage — Find your next night out', template: '%s · Stage' },
  description: 'Discover live music, festivals and unforgettable events across Sri Lanka.',
  icons: { icon: '/brand/stage-mark.png' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sora.variable} ${manrope.variable}`} data-scroll-behavior="smooth">
      <body>
        <AuthProvider>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
          <MobileDock />
        </AuthProvider>
      </body>
    </html>
  );
}
