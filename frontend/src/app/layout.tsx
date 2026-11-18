import type { Metadata, Viewport } from "next";
import { Inter_Tight, JetBrains_Mono, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

// 숫자·영문은 Inter Tight, 한글은 Noto Sans KR, 코드는 JetBrains Mono (ADR-018)
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Retrievo",
  description: "꺼낼수록 지식이 쌓이는 인출 효과 기반 학습 서비스",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${interTight.variable} ${notoSansKr.variable} ${jetbrainsMono.variable} antialiased`}
    >
      <body className="font-sans">{children}</body>
    </html>
  );
}
