import type { Metadata } from "next";
import { Oswald, Geist_Mono } from "next/font/google";
import "./globals.css";
import SplashScreen from "./_components/SplashScreen";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Innamoratti — Control de Operaciones",
  description: "Sistema de apertura y cierre para Innamoratti Focaccia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${oswald.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <SplashScreen />
        {children}
      </body>
    </html>
  );
}
