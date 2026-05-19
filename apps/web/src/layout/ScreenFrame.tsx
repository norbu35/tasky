import type { ReactNode } from 'react';

import { BottomNavBar } from './BottomNavBar';
import { DesktopSidebar } from './DesktopSidebar';
import { Header } from './Header';

export type MaxWidth = 'narrow' | 'default' | 'wide';

const maxWidthClass: Record<MaxWidth, string> = {
  narrow: 'max-w-2xl',
  default: 'max-w-5xl',
  wide: 'max-w-6xl',
};

export function ScreenFrame({
  children,
  maxWidth = 'default',
}: {
  children: ReactNode;
  maxWidth?: MaxWidth;
}) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DesktopSidebar />

      <div className="flex flex-1 flex-col min-w-0">
        <Header />

        <main className="flex-1 px-4 pb-32 pt-20 md:px-8 md:pb-10 md:pt-8 lg:px-10">
          <div className={`mx-auto w-full ${maxWidthClass[maxWidth]}`}>{children}</div>
        </main>

        <BottomNavBar />
      </div>
    </div>
  );
}
