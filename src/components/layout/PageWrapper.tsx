import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';

export default function PageWrapper({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopHeader />
      <main className="ml-[60px] md:ml-[240px] mt-16 p-4 md:p-8 min-h-[calc(100vh-64px)]">
        {title && (
          <h1 className="font-display text-lg md:text-xl font-bold tracking-widest text-foreground mb-6 uppercase">
            {title}
          </h1>
        )}
        {children}
      </main>
    </div>
  );
}
