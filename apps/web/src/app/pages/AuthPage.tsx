import type {paths} from "@tasky/sdk";
import {useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {Button} from "../../components/ui/button";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "../../components/ui/card";
import {Input} from "../../components/ui/input";
import {Label} from "../../components/ui/label";
import {useAppContext} from "../context/AppContext";
import {parseError} from "../utils/errorHandling";

type DevRole = "CUSTOMER" | "TASKER" | "ADMIN";

export function AuthPage() {
    const contractLoaded: boolean = typeof ({} as paths) === "object";
    const host = typeof window !== "undefined" ? window.location.hostname : "";
    const isLocalHost = host === "localhost" || host === "127.0.0.1";
    const devAuthEnabled = import.meta.env.VITE_DEV_AUTH_ENABLED === "true" || isLocalHost;
    const {apiClient, setSession, setProfile, refreshProfile} = useAppContext();
    const navigate = useNavigate();
    const location = useLocation();

    const [phone, setPhone] = useState("+976");
    const [code, setCode] = useState("");
    const [otpRequested, setOtpRequested] = useState(false);
    const [requestMessage, setRequestMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const returnPath =
        typeof location.state === "object" &&
        location.state !== null &&
        "from" in location.state
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
            navigate(returnPath, {replace: true});
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
                role === "ADMIN"
                    ? "+97600000000"
                    : role === "TASKER"
                        ? "+97611111111"
                        : "+97622222222";
            const session = await apiClient.devLogin(devPhone, role);
            setSession(session);
            setProfile(null);
            await refreshProfile();
            navigate(returnPath, {replace: true});
        } catch (error) {
            setErrorMessage(parseError(error));
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-background to-secondary/30 px-4 py-8 sm:px-6">
            <section className="mx-auto grid w-full max-w-xl gap-6">
                <Card className="border-border/70 shadow-xl shadow-foreground/5">
                    <CardHeader>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            Tasky Web MVP
                        </p>
                        <CardTitle>OTP Login</CardTitle>
                        <CardDescription>
                            OpenAPI SDK binding loaded: {String(contractLoaded)}. Authenticate to continue to profile
                            and task
                            workflows.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone number</Label>
                            <Input
                                id="phone"
                                autoComplete="tel"
                                value={phone}
                                onChange={(event) => setPhone(event.target.value)}
                                placeholder="+97699001122"
                            />
                        </div>
                        {otpRequested ? (
                            <div className="grid gap-2">
                                <Label htmlFor="otp-code">OTP code</Label>
                                <Input
                                    id="otp-code"
                                    inputMode="numeric"
                                    value={code}
                                    onChange={(event) => setCode(event.target.value)}
                                    placeholder="123456"
                                />
                            </div>
                        ) : null}
                        {requestMessage ? <p className="text-sm text-muted-foreground">{requestMessage}</p> : null}
                        {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
                    </CardContent>
                    <CardFooter className="justify-end gap-3">
                        <Button disabled={loading || phone.trim().length < 4} variant="secondary"
                                onClick={handleRequestOtp}>
                            Request OTP
                        </Button>
                        <Button disabled={loading || !otpRequested || code.trim().length < 4} onClick={handleVerify}>
                            Verify OTP
                        </Button>
                    </CardFooter>
                    {devAuthEnabled ? (
                        <>
                            <CardHeader className="pt-0">
                                <CardTitle className="text-lg">Developer quick login</CardTitle>
                                <CardDescription>
                                    Use local role shortcuts to bypass SMS OTP while testing app flows.
                                </CardDescription>
                            </CardHeader>
                            <CardFooter className="justify-start gap-3">
                                <Button disabled={loading} variant="secondary"
                                        onClick={() => handleDevLogin("CUSTOMER")}>
                                    Login as Customer
                                </Button>
                                <Button disabled={loading} variant="ghost" onClick={() => handleDevLogin("TASKER")}>
                                    Login as Tasker
                                </Button>
                                <Button disabled={loading} variant="ghost" onClick={() => handleDevLogin("ADMIN")}>
                                    Login as Admin
                                </Button>
                            </CardFooter>
                        </>
                    ) : null}
                </Card>
            </section>
        </main>
    );
}
