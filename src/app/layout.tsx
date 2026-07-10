import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { getCurrentUser } from '@/lib/auth';
import { SITE_NAME, SITE_URL } from '@/lib/constants';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['500', '600', '700', '800'],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Discover Beautiful Photography Locations`,
    template: `%s — ${SITE_NAME}`,
  },
  description:
    'Discover, upload, and share beautiful photography locations across Georgia. Find the perfect spot for your next photoshoot — mountains, lakes, castles, hidden gems and more.',
  keywords: [
    'Georgia photography',
    'photo locations Georgia',
    'photoshoot spots Tbilisi',
    'Batumi photography',
    'Kazbegi photo spot',
  ],
  openGraph: {
    title: `${SITE_NAME} — Discover Beautiful Photography Locations`,
    description: 'Discover, upload, and share beautiful photography locations across Georgia.',
    siteName: SITE_NAME,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Discover Beautiful Photography Locations`,
    description: 'Discover, upload, and share beautiful photography locations across Georgia.',
  },
  icons: { icon: '/favicon.svg' },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jakarta.variable} font-sans`}>
        <ThemeProvider>
          <AuthProvider initialUser={user}>
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <Toaster richColors position="top-center" closeButton />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
