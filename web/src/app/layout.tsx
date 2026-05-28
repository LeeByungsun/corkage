import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Corkage MVP',
  description: 'DB 기반 콜키지 식당 웹 MVP',
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
              <a href="/store">지도/리스트</a>
              <a href="/report">제보</a>
              <a href="/review">검수 큐</a>
            </nav>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
