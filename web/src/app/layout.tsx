import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Corkage MVP',
  description: '정적 seed 데이터 기반 콜키지 식당 웹 MVP',
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ko">
      <body>
        <div className="shell">
          <header className="site-header">
            <a className="brand" href="/">
              Corkage MVP
            </a>
            <nav>
              <a href="/store">리스트</a>
              <a href="/report">제보</a>
            </nav>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
