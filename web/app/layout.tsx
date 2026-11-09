import type { Metadata } from 'next';
import { Manrope, Sora } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/auth-provider';
import { MobileDock, SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Reveal } from '@/components/reveal';

const sora = Sora({ subsets: ['latin'], variable: '--font-heading' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: { default: 'Stage — Your next stage is waiting', template: '%s · Stage' },
  description: "Sri Lanka's home for live events — festivals, EDM nights, live concerts and hip hop. Follow the companies you love and never miss a drop.",
  // Vector badge first (Project/scripts/build-brand-svg.py); PNGs from
  // Project/scripts/build-icons.py as the fallback + Apple touch icon.
  icons: {
    icon: [{ url: '/brand/stage-badge.svg', type: 'image/svg+xml' }, { url: '/brand/app-icon.png', type: 'image/png' }],
    apple: '/brand/apple-icon.png',
  },
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
          <Reveal />
        </AuthProvider>
      </body>
    </html>
  );
}
