import type { ReactNode } from "react";
import { Header } from "./Header";

export function ScreenFrame({ children }: { children: ReactNode }) {
    return (
        <main className="relative min-h-screen bg-background">
            <Header />
            <section className="mx-auto grid w-full max-w-6xl gap-6 px-6 pb-12 pt-24">
                {children}
            </section>
        </main>
    );
}
