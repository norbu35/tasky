import {createContext, useContext} from "react";
import type {AppContextValue} from "../types";

export const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext(): AppContextValue {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error("App context is missing.");
    }
    return context;
}
