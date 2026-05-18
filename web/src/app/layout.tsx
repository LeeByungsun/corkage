import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Corkage MVP",
  description: "정적 seed 데이터 기반 콜키지 식당 리스트/상세/제보",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div className="page-shell">
          <header className="topbar">
            <h1>콜키지 확인</h1>
            <nav>
              <a href="/">홈</a>
              <a href="/store">식당 목록</a>
              <a href="/report">제보하기</a>
            </nav>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
