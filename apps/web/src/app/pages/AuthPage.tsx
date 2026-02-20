import type { paths } from "@tasky/sdk";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Smartphone, KeyRound, Loader2, ArrowRight, User, Wrench, ShieldAlert } from "lucide-react";

import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useAppContext } from "../context/AppContext";
import { parseError } from "../utils/errorHandling";

type DevRole = "CUSTOMER" | "TASKER" | "ADMIN";

export function AuthPage() {
    const contractLoaded: boolean = typeof ({} as paths) === "object";
    const host = typeof window !== "undefined" ? window.location.hostname : "";
    const isLocalHost = host === "localhost" || host === "127.0.0.1";
    const devAuthEnabled = import.meta.env.VITE_DEV_AUTH_ENABLED === "true" || isLocalHost;

    const { apiClient, setSession, setProfile, refreshProfile } = useAppContext();
    const navigate = useNavigate();
    const location = useLocation();

    const [phone, setPhone] = useState("+976");
    const [code, setCode] = useState("");
    const [otpRequested, setOtpRequested] = useState(false);
    const [requestMessage, setRequestMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const returnPath =
        typeof location.state === "object" && location.state !== null && "from" in location.state
            ? (location.state as { from: string }).from
            : "/profile";

    const handleRequestOtp = async (): Promise<void> => {
        setLoading(true);
        setErrorMessage(null);
        try {
            const message = await apiClient.requestOtp(phone.trim());
            setRequestMessage(message);
            setOtpRequested(true);
        } catch (error) {
            setErrorMessage(parseError(error));
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (): Promise<void> => {
        setLoading(true);
        setErrorMessage(null);
        try {
            const session = await apiClient.verifyOtp(phone.trim(), code.trim());
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
                            <h1 className="sr-only">OTP Login</h1>
                            <CardTitle className="text-2xl font-display">Welcome back</CardTitle>
                            <CardDescription className="text-base">
                                {otpRequested
                                    ? "We sent a 6-digit code to your phone."
                                    : "Enter your phone number to securely log in or sign up."}
                            </CardDescription>


                        </CardHeader>

                        <CardContent className="pt-8 grid gap-6">
                            <AnimatePresence mode="popLayout">
                                {!otpRequested ? (
                                    <motion.div
                                        key="phone-step"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-4"
                                    >
                                        <div className="space-y-2">
                                            <Label htmlFor="phone" className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">
                                                Phone number
                                            </Label>
                                            <div className="relative">
                                                <Smartphone className="absolute left-3.5 top-3 h-5 w-5 text-muted-foreground/70" />
                                                <Input
                                                    id="phone"
                                                    aria-label="Phone number"
                                                    autoComplete="tel"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    placeholder="+976 9900 1122"
                                                    className="pl-11 h-12 text-lg rounded-xl bg-muted/50 border-transparent focus:border-primary focus:bg-background transition-colors"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="code-step"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-4"
                                    >
                                        <div className="space-y-2">
                                            <Label htmlFor="otp-code" className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">
                                                OTP code
                                            </Label>
                                            <div className="relative">
                                                <KeyRound className="absolute left-3.5 top-3 h-5 w-5 text-muted-foreground/70" />
                                                <Input
                                                    id="otp-code"
                                                    aria-label="OTP code"
                                                    inputMode="numeric"
                                                    value={code}
                                                    onChange={(e) => setCode(e.target.value)}
                                                    placeholder="123 456"
                                                    className="pl-11 h-12 text-lg tracking-widest rounded-xl bg-muted/50 border-transparent focus:border-primary focus:bg-background transition-colors"
                                                    maxLength={6}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <AnimatePresence>
                                {requestMessage && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="p-3 bg-secondary/50 text-secondary-foreground rounded-lg text-sm font-medium border border-secondary"
                                    >
                                        {requestMessage}
                                    </motion.div>
                                )}
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

                        <CardFooter className="pt-2 pb-8 flex-col gap-4">
                            {!otpRequested ? (
                                <Button
                                    className="w-full h-12 text-base rounded-xl font-semibold shadow-lg shadow-primary/20 transition-all hover:translate-y-[-2px]"
                                    disabled={loading || phone.trim().length < 4}
                                    onClick={handleRequestOtp}
                                    aria-label="Request OTP"
                                >
                                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Continue"}
                                    {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                                </Button>
                            ) : (
                                <div className="w-full flex gap-3">
                                    <Button
                                        variant="secondary"
                                        className="h-12 w-12 shrink-0 rounded-xl"
                                        onClick={() => {
                                            setOtpRequested(false);
                                            setErrorMessage(null);
                                            setRequestMessage(null);
                                            setCode("");
                                        }}
                                        disabled={loading}
                                    >
                                        <ArrowRight className="h-4 w-4 rotate-180" />
                                    </Button>
                                    <Button
                                        className="flex-1 h-12 text-base rounded-xl font-semibold shadow-lg shadow-primary/20"
                                        disabled={loading || code.trim().length < 4}
                                        onClick={handleVerify}
                                        aria-label="Verify OTP"
                                    >
                                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify Identity"}
                                    </Button>
                                </div>
                            )}
                        </CardFooter>
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
