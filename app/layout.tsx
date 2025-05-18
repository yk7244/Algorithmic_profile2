import type { Metadata } from "next";
import { Inter } from 'next/font/google'
import "./globals.css";
import { Navbar } from "@/components/headers/Navbar";
import { AuthProvider } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "TubeLens",
  description: "유튜브 시청 기록 기반 프로필 분석",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={inter.className} suppressHydrationWarning>
      <head />
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
      )}>
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
