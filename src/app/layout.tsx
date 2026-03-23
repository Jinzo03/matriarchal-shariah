import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/site-nav";
import { LocaleProvider } from "@/components/locale-provider";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, localeDir, type Locale } from "@/lib/locale";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Matriarchal Shari'ah",
  description: "Connected universe dashboard for lore, stories, and navigation.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  return (
    <html lang={locale} dir={localeDir[locale]} className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${cormorant.variable} min-h-screen bg-background text-foreground antialiased`}
      >
        <LocaleProvider initialLocale={locale}>
          <SiteNav />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
