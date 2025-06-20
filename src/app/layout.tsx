import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./commons/AuthContext";
import { CacheSecurityInitializer } from "./commons/CacheSecurityInitializer";
import { AppInitializer } from './commons/AppInitializer';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SGD | Policia DDM",
  description:
    "Sistema de gerenciamento de dados do Departamento de Desenvolvimento Militar",
  icons: {
    icon: "/ddmLogo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <CacheSecurityInitializer />
          <AppInitializer>
            {children}
          </AppInitializer>
        </AuthProvider>
      </body>
    </html>
  );
}
