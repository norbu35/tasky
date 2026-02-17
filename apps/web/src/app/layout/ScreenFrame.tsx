import type {ReactNode} from "react";
import {Header} from "./Header";

export function ScreenFrame({children}: { children: ReactNode }) {
    return (
        <main className="min-h-screen bg-gradient-to-b from-background to-secondary/30 px-4 py-8 sm:px-6">
            <section className="mx-auto grid w-full max-w-6xl gap-6">
                <Header/>
                {children}
            </section>
        </main>
    );
}
