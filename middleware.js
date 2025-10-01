// D:\ggcon\web\middleware.js
import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./next-intl.config";

export default createMiddleware({
  locales,
  defaultLocale
});

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"], // 정적 파일, api 빼고 다 적용
};