import type { Metadata } from 'next';
import { Geist, Geist_Mono, Oxanium } from "next/font/google";
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { LocaleProvider } from '@/components/providers/locale-provider';
import { TimerProvider } from '@/components/providers/timer-provider';
import { cn } from 'cn';

const oxanium = Oxanium({ subsets: ["latin"], variable: "--font-sans" });


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: 'TicketHub - GitHub-style Issues, Timesheets & Budget Management',
  description: 'Enterprise multi-project ticketing system with live time tracking and audited budget management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs" suppressHydrationWarning 
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", oxanium.variable)}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LocaleProvider>
            <TimerProvider>
              {children}
            </TimerProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
