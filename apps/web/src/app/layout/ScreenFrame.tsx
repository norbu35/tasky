import type {ReactNode} from "react";
import {Header} from "./Header";

export function ScreenFrame({children}: { children: ReactNode }) {
    return (
        <main className="relative min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
            <Header/>
            <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 pb-12 pt-28 sm:px-6">
                {children}
            </section>
        </main>
    );
}
