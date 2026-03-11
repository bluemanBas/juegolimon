import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "@/components/ui/Providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Juego del Limon",
  description:
    "Simulacion multijugador de cadena de suministro agricola para ensenar el Efecto Bullwhip",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
