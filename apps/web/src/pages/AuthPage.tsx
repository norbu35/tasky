import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Loader2, Shield, User, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import type { paths } from '@tasky/sdk';

import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { useAppContext } from '../context/AppContext';
import { LanguageSwitcher } from '../layout/LanguageSwitcher';
import { parseError } from '../lib/errorHandling';

type DevRole = 'CUSTOMER' | 'TASKER' | 'ADMIN';

function devLandingPath(role: DevRole): string {
  if (role === 'CUSTOMER') return '/customer/dashboard';
  if (role === 'TASKER') return '/tasker/feed';
  return '/admin';
}

function isCrossRoleReturnPath(returnPath: string, role: DevRole): boolean {
  return (
    (returnPath.startsWith('/tasker') && role !== 'TASKER') ||
    (returnPath.startsWith('/customer') && role !== 'CUSTOMER') ||
    (returnPath.startsWith('/admin') && role !== 'ADMIN')
  );
}

type FacebookAuthResponse = {
  accessToken: string;
};

type FacebookLoginResponse = {
  authResponse?: FacebookAuthResponse;
};

type FacebookSdk = {
  init: (config: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void;
  login: (
    callback: (response: FacebookLoginResponse) => void,
    options?: { scope?: string },
  ) => void;
};

declare global {
  interface Window {
    FB?: FacebookSdk;
    fbAsyncInit?: () => void;
  }
}

const FACEBOOK_SDK_SCRIPT_ID = 'tasky-facebook-sdk';

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
    </svg>
  );
}

export function AuthPage() {
  const contractLoaded: boolean = typeof ({} as paths) === 'object';
  const devAuthEnabled = import.meta.env['VITE_DEV_AUTH_ENABLED'] === 'true';
  const facebookAppId = import.meta.env['VITE_FACEBOOK_APP_ID'];

  const { apiClient, session, setSession, setProfile, loadProfile } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [facebookReady, setFacebookReady] = useState<boolean>(
    () => typeof window !== 'undefined' && typeof window.FB !== 'undefined',
  );
  const [facebookOutage, setFacebookOutage] = useState(false);

  const returnPath =
    typeof location.state === 'object' && location.state !== null && 'from' in location.state
      ? (location.state as { from: string }).from
      : '/';

  // Securely intercept logged in sessions and bounce.
  useEffect(() => {
    if (session) {
      const isCrossRoleRedirect =
        (returnPath.startsWith('/tasker') && session.user?.role !== 'TASKER') ||
        (returnPath.startsWith('/customer') && session.user?.role !== 'CUSTOMER') ||
        (returnPath.startsWith('/admin') && session.user?.role !== 'ADMIN');

      if (returnPath === '/' || isCrossRoleRedirect) {
        if (session.user?.role === 'CUSTOMER') {
          // Fresh logins land on profile setup before entering the main app
          navigate('/profile', { replace: true });
        } else if (session.user?.role === 'TASKER') {
          navigate('/tasker/feed', { replace: true });
        } else if (session.user?.role === 'ADMIN') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/profile', { replace: true });
        }
      } else {
        navigate(returnPath, { replace: true });
      }
    }
  }, [session, navigate, returnPath]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (window.FB) {
      if (facebookAppId && facebookAppId.trim().length > 0) {
        window.FB.init({
          appId: facebookAppId,
          cookie: true,
          xfbml: false,
          version: 'v22.0',
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
        version: 'v22.0',
      });
      setFacebookReady(true);
    };

    if (!document.getElementById(FACEBOOK_SDK_SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = FACEBOOK_SDK_SCRIPT_ID;
      script.async = true;
      script.defer = true;
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      document.body.appendChild(script);
    }
  }, [facebookAppId]);

  useEffect(() => {
    const check = async () => {
      try {
        const data = await apiClient.getFacebookAuthStatus();
        setFacebookOutage(!data.available);
      } catch {
        // silently ignore — banner stays in last known state
      }
    };
    void check();
    const id = setInterval(() => void check(), 30_000);
    return () => clearInterval(id);
  }, [apiClient]);

  const handleFacebookLogin = async (): Promise<void> => {
    if (!window.FB) {
      toast.error(t('auth.loginUnavailable'));
      return;
    }

    setLoading(true);

    try {
      const accessToken = await new Promise<string>((resolve, reject) => {
        window.FB?.login(
          (response) => {
            const token = response.authResponse?.accessToken;
            if (token) {
              resolve(token);
              return;
            }
            reject(new Error('Facebook login was canceled.'));
          },
          { scope: 'public_profile,email' },
        );
      });

      const session = await apiClient.loginWithFacebook(accessToken);
      setSession(session);
      setProfile(null);
      await loadProfile(session.accessToken);
      // Fresh logins (returnPath '/') land on profile setup so new users
      // can complete their profile before entering the main app.
      navigate(returnPath === '/' ? '/profile' : returnPath, { replace: true });
    } catch (error) {
      toast.error(parseError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async (role: DevRole): Promise<void> => {
    setLoading(true);
    try {
      const devPhone =
        role === 'ADMIN' ? '+97694000001' : role === 'TASKER' ? '+97693000001' : '+97692000001';
      const session = await apiClient.devLogin(devPhone, role);
      setSession(session);
      setProfile(null);
      await loadProfile(session.accessToken);
      navigate(
        returnPath === '/' || isCrossRoleReturnPath(returnPath, role)
          ? devLandingPath(role)
          : returnPath,
        { replace: true },
      );
    } catch (error) {
      toast.error(parseError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex bg-background font-sans overflow-hidden">
      {/* Visual side panel - premium gradient style with smooth background image blur */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 text-primary-foreground relative overflow-hidden bg-gradient-to-br from-primary-deep via-primary to-primary-deep">
        {/* Background Image & Overlay */}
        <img
          src="/images/auth-bg.png"
          alt={t('auth.heroImageAlt')}
          className="pointer-events-none absolute inset-0 z-0 w-full h-full object-cover mix-blend-overlay opacity-60 filter saturate-100"
        />
        {/* Modern glowing gradients */}
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-tr from-transparent via-primary-deep/50 to-accent/20 z-0" />

        <div className="relative z-10 flex items-center gap-2">
          <img src="/logo.png" alt="" className="h-12 w-12 rounded-2xl shadow-elevated" />
          <span className="text-2xl font-display font-bold text-white">Tasky</span>
        </div>

        <div className="relative z-10 max-w-lg mt-auto mb-20 space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl font-display font-bold leading-[1.1] text-white tracking-tight"
          >
            {t('auth.trustedNetwork')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg text-white/80 font-medium"
          >
            {t('auth.connectSecurely')}
          </motion.p>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between border-t border-white/20 pt-8 gap-4 text-sm text-white/60 w-full">
          <p>{t('auth.copyright')}</p>
          <div className="flex items-center gap-4">
            <p className="hidden sm:block aria-hidden">
              {t('auth.sdkBindingLabel')}:{' '}
              {contractLoaded ? t('auth.sdkBindingVerified') : t('auth.sdkBindingOffline')}
            </p>
            <LanguageSwitcher className="hover:bg-white/10 text-white" />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative z-10 bg-subtle">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <img src="/logo.png" alt="" className="h-12 w-12 rounded-xl shadow-card" />
            <span className="text-2xl font-display font-bold text-foreground">Tasky</span>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card className="border-none shadow-deep rounded-3xl overflow-hidden bg-white ring-1 ring-border/50">
              <CardHeader className="space-y-3 pb-8 pt-10 px-10 border-b border-border/40 bg-gradient-to-b from-subtle to-transparent">
                <h1 className="sr-only">{t('auth.facebookLoginTitle')}</h1>
                <CardTitle className="text-3xl font-display font-bold tracking-tight text-foreground">
                  {t('auth.welcomeBack')}
                </CardTitle>
                <CardDescription className="text-base font-medium text-muted-foreground leading-relaxed">
                  {t('auth.continueDesc')}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-10 px-10 grid gap-5">
                {facebookOutage && (
                  <div className="flex items-start gap-3 rounded-2xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{t('auth.facebookOutage')}</span>
                  </div>
                )}
                <Button
                  className="w-full h-14 text-base rounded-2xl font-bold shadow-fab transition-all duration-300 hover:scale-[1.02] bg-primary text-primary-foreground hover:bg-primary-deep"
                  disabled={loading || !facebookReady || facebookOutage}
                  onClick={handleFacebookLogin}
                  type="button"
                  aria-label={t('auth.continueFacebook')}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <FacebookIcon className="mr-2 h-5 w-5 text-primary-foreground" />
                  )}
                  {t('auth.continueFacebook')}
                  {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>

                {!facebookReady && !facebookOutage && (
                  <p className="text-sm text-muted-foreground text-center">
                    {t('auth.initializing')}
                  </p>
                )}

                {!facebookAppId && !facebookReady && import.meta.env.DEV && (
                  <p className="text-sm text-muted-foreground text-center">
                    {t('auth.loginUnavailable')}
                  </p>
                )}
              </CardContent>

              <CardFooter className="pt-2 pb-8" />
            </Card>
          </motion.div>

          {devAuthEnabled && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-12 space-y-4"
            >
              <div className="flex items-center gap-4">
                <div className="h-px bg-border flex-1" />
                <span className="text-overline font-semibold uppercase text-muted-foreground">
                  {t('auth.devLogin')}
                </span>
                <div className="h-px bg-border flex-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="ghost"
                  className="h-auto py-3 flex-col gap-2 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5"
                  onClick={() => handleDevLogin('CUSTOMER')}
                  disabled={loading}
                >
                  <User className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs">{t('auth.loginAsCustomer')}</span>
                </Button>
                <Button
                  variant="ghost"
                  className="h-auto py-3 flex-col gap-2 rounded-xl border border-border hover:border-accent hover:bg-accent/5"
                  onClick={() => handleDevLogin('TASKER')}
                  disabled={loading}
                >
                  <Wrench className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs">{t('auth.loginAsTasker')}</span>
                </Button>
                <Button
                  variant="ghost"
                  className="h-auto py-3 flex-col gap-2 rounded-xl border border-border hover:border-secondary hover:bg-secondary/5"
                  onClick={() => handleDevLogin('ADMIN')}
                  disabled={loading}
                >
                  <Shield className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs">{t('auth.loginAsAdmin')}</span>
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
}
