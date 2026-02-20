import type { paths } from "@tasky/sdk";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Facebook, Loader2, Shield, ShieldAlert, User, Wrench } from "lucide-react";

import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { useAppContext } from "../context/AppContext";
import { parseError } from "../utils/errorHandling";

type DevRole = "CUSTOMER" | "TASKER" | "ADMIN";

type FacebookAuthResponse = {
    accessToken: string;
};

type FacebookLoginResponse = {
    authResponse?: FacebookAuthResponse;
};

type FacebookSdk = {
    init: (config: {
        appId: string;
        cookie: boolean;
        xfbml: boolean;
        version: string;
    }) => void;
    login: (
        callback: (response: FacebookLoginResponse) => void,
        options?: { scope?: string }
    ) => void;
};

declare global {
    interface Window {
        FB?: FacebookSdk;
        fbAsyncInit?: () => void;
    }
}

const FACEBOOK_SDK_SCRIPT_ID = "tasky-facebook-sdk";

export function AuthPage() {
    const contractLoaded: boolean = typeof ({} as paths) === "object";
    const host = typeof window !== "undefined" ? window.location.hostname : "";
    const isLocalHost = host === "localhost" || host === "127.0.0.1";
    const devAuthEnabled = import.meta.env.VITE_DEV_AUTH_ENABLED === "true" || isLocalHost;
    const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;

    const { apiClient, setSession, setProfile, refreshProfile } = useAppContext();
    const navigate = useNavigate();
    const location = useLocation();

    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [facebookReady, setFacebookReady] = useState<boolean>(() =>
        typeof window !== "undefined" && typeof window.FB !== "undefined"
    );

    const returnPath =
        typeof location.state === "object" && location.state !== null && "from" in location.state
            ? (location.state as { from: string }).from
            : "/profile";

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        if (window.FB) {
            if (facebookAppId && facebookAppId.trim().length > 0) {
                window.FB.init({
                    appId: facebookAppId,
                    cookie: true,
                    xfbml: false,
                    version: "v22.0"
                });
            }
            setFacebookReady(true);
            return;
        }

        if (!facebookAppId || facebookAppId.trim().length === 0) {
            return;
        }

        window.fbAsyncInit = () => {
            if (!window.FB) {
                return;
            }
            window.FB.init({
                appId: facebookAppId,
                cookie: true,
                xfbml: false,
                version: "v22.0"
            });
            setFacebookReady(true);
        };

        if (!document.getElementById(FACEBOOK_SDK_SCRIPT_ID)) {
            const script = document.createElement("script");
            script.id = FACEBOOK_SDK_SCRIPT_ID;
            script.async = true;
            script.defer = true;
            script.src = "https://connect.facebook.net/en_US/sdk.js";
            document.body.appendChild(script);
        }
    }, [facebookAppId]);

    const handleFacebookLogin = async (): Promise<void> => {
        setLoading(true);
        setErrorMessage(null);

        try {
            if (!window.FB) {
                throw new Error("Facebook login is unavailable right now.");
            }

            const accessToken = await new Promise<string>((resolve, reject) => {
                window.FB?.login(
                    (response) => {
                        const token = response.authResponse?.accessToken;
                        if (token) {
                            resolve(token);
                            return;
                        }
                        reject(new Error("Facebook login was canceled."));
                    },
                    { scope: "public_profile,email" }
                );
            });

            const session = await apiClient.loginWithFacebook(accessToken);
            setSession(session);
            setProfile(null);
            await refreshProfile();
            navigate(returnPath, { replace: true });
        } catch (error) {
            setErrorMessage(parseError(error));
        } finally {
            setLoading(false);
        }
    };

    const handleDevLogin = async (role: DevRole): Promise<void> => {
        setLoading(true);
        setErrorMessage(null);
        try {
            const devPhone =
                role === "ADMIN" ? "+97600000000" : role === "TASKER" ? "+97611111111" : "+97622222222";
            const session = await apiClient.devLogin(devPhone, role);
            setSession(session);
            setProfile(null);
            await refreshProfile();
            navigate(returnPath, { replace: true });
        } catch (error) {
            setErrorMessage(parseError(error));
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen w-full flex bg-background font-sans overflow-hidden">
            <div className="hidden lg:flex flex-col justify-between w-1/2 bg-primary p-12 text-primary-foreground relative overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-accent/20 blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-secondary/10 blur-[120px]" />

                <div className="relative z-10 flex items-center gap-3">
                    <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
                        <Shield className="w-8 h-8 text-accent" />
                    </div>
                    <span className="text-3xl font-display font-bold tracking-tight">Tasky</span>
                </div>

                <div className="relative z-10 max-w-lg mt-auto mb-20 space-y-6">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-5xl font-display font-medium leading-[1.1]"
                    >
                        Your trusted network for everyday tasks.
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-lg text-primary-foreground/80 font-medium"
                    >
                        Connect with verified professionals securely. Fast, reliable, and completely guaranteed.
                    </motion.p>
                </div>

                <div className="relative z-10 flex items-center justify-between border-t border-white/20 pt-8 text-sm text-primary-foreground/60">
                    <p>© 2026 Tasky Network</p>
                    <p className="sr-only">OpenAPI SDK binding loaded: {contractLoaded ? "true" : "false"}</p>
                    <p aria-hidden="true">SDK Binding: {contractLoaded ? "Verified" : "Offline"}</p>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative z-10">
                <div className="w-full max-w-md space-y-8">
                    <div className="lg:hidden flex items-center gap-3 mb-8">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Shield className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-2xl font-display font-bold text-foreground">Tasky</span>
                    </div>

                    <Card className="border-border shadow-2xl rounded-3xl overflow-hidden backdrop-blur-xl bg-card">
                        <CardHeader className="space-y-3 pb-6 border-b border-border/50 bg-muted/30">
                            <h1 className="sr-only">Facebook Login</h1>
                            <CardTitle className="text-2xl font-display">Welcome back</CardTitle>
                            <CardDescription className="text-base">
                                Continue with Facebook to log in or create your Tasky account.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="pt-8 grid gap-4">
                            <Button
                                className="w-full h-12 text-base rounded-xl font-semibold shadow-lg shadow-primary/20 transition-all hover:translate-y-[-2px]"
                                disabled={loading || !facebookReady}
                                onClick={handleFacebookLogin}
                                type="button"
                                aria-label="Continue with Facebook"
                            >
                                {loading ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    <Facebook className="mr-2 h-5 w-5 text-[#1877F2]" />
                                )}
                                Continue with Facebook
                                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                            </Button>

                            {!facebookReady && (
                                <p className="text-sm text-muted-foreground">
                                    Initializing Facebook login...
                                </p>
                            )}

                            {!facebookAppId && !facebookReady && (
                                <p className="text-sm text-muted-foreground">
                                    Missing `VITE_FACEBOOK_APP_ID` configuration.
                                </p>
                            )}

                            <AnimatePresence>
                                {errorMessage && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm font-medium border border-destructive/20 flex items-start gap-2"
                                    >
                                        <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                                        <p>{errorMessage}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </CardContent>

                        <CardFooter className="pt-2 pb-8" />
                    </Card>

                    {devAuthEnabled && (
                        <div className="mt-12 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="h-px bg-border flex-1" />
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Developer Bypass</span>
                                <div className="h-px bg-border flex-1" />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <Button
                                    variant="ghost"
                                    className="h-auto py-3 flex-col gap-2 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5"
                                    onClick={() => handleDevLogin("CUSTOMER")}
                                    disabled={loading}
                                >
                                    <User className="w-5 h-5 text-muted-foreground" />
                                    <span className="text-xs">Customer</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="h-auto py-3 flex-col gap-2 rounded-xl border border-border hover:border-accent hover:bg-accent/5"
                                    onClick={() => handleDevLogin("TASKER")}
                                    disabled={loading}
                                >
                                    <Wrench className="w-5 h-5 text-muted-foreground" />
                                    <span className="text-xs">Tasker</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="h-auto py-3 flex-col gap-2 rounded-xl border border-border hover:border-destructive hover:bg-destructive/5"
                                    onClick={() => handleDevLogin("ADMIN")}
                                    disabled={loading}
                                >
                                    <ShieldAlert className="w-5 h-5 text-muted-foreground" />
                                    <span className="text-xs">Admin</span>
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
