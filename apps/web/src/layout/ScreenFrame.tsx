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
    <div className="flex min-h-screen overflow-x-hidden bg-background text-foreground">
      <DesktopSidebar />

      <div className="flex min-w-0 flex-1 flex-col bg-[linear-gradient(180deg,hsl(var(--color-background))_0%,hsl(var(--color-muted)/0.22)_44%,hsl(var(--color-background))_100%)]">
        <Header />

        <main className="min-w-0 flex-1 px-4 pb-32 pt-20 md:px-8 md:pb-10 md:pt-8 lg:px-10">
          <div className={`mx-auto w-full min-w-0 ${maxWidthClass[maxWidth]}`}>{children}</div>
        </main>

        <BottomNavBar />
      </div>
    </div>
  );
}
