import type { ReactNode } from 'react';
import { Header } from './Header';
import { BottomNavBar } from './BottomNavBar';

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
    <main className="relative min-h-screen bg-background">
      <Header />
      <section
        className={`mx-auto w-full ${maxWidthClass[maxWidth]} px-4 pb-28 md:pb-8 pt-16 md:pt-20 sm:px-6`}
      >
        {children}
      </section>
      <BottomNavBar />
    </main>
  );
}
