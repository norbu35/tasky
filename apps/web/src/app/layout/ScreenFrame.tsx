import type { ReactNode } from "react";
import { Header } from "./Header";
import { BottomNavBar } from "./BottomNavBar";

export function ScreenFrame({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen bg-background">
      <Header />
      <section className="mx-auto w-full max-w-2xl px-4 pb-28 pt-20 sm:px-6">
        {children}
      </section>
      <BottomNavBar />
    </main>
  );
}
