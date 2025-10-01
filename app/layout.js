import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../hooks/useAuth";
// import { NextIntlClientProvider } from "next-intl";
// import koMessages from "../messages/ko.json";
// import enMessages from "../messages/en.json";
// import { cookies } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "여누 날씨 캘린더",
  description: "실시간 날씨 정보와 월별 캘린더를 확인할 수 있는 날씨 앱입니다.",
};

// function getMessagesAndLocale() {
//   // const cookieStore = cookies();
//   const lang = cookieStore.get("lang")?.value || "ko";
//   const locale = lang === "en" ? "en" : "ko";
//   const messages = locale === "en" ? enMessages : koMessages;
//   return { locale, messages };
// }

export default function RootLayout({ children }) {
  const { locale, messages } = getMessagesAndLocale();
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
