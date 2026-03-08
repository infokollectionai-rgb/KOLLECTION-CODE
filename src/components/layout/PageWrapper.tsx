import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';

export default function PageWrapper({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopHeader />
      <main className="ml-[60px] md:ml-[220px] mt-14 p-5 md:p-8">
        {title && (
          <h1 className="text-lg font-semibold text-foreground mb-6">{title}</h1>
        )}
        {children}
      </main>
    </div>
  );
}
