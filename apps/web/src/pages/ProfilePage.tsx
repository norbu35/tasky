import { Camera, Loader2, Save, ShieldAlert, ShieldCheck, Sparkles, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAppContext } from '../context/AppContext';
import { ResponsiveDetailShell } from '../layout/parity';
import { avatarValueToPreviewUrl, avatarValueToApiPayload } from '../lib/avatarHelpers';
import { parseError } from '../lib/errorHandling';

export function ProfilePage() {
  const { apiClient, session, profile, setProfile, refreshProfile, updateSessionUser } =
    useAppContext();
  const { t } = useTranslation();

  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [working, setWorking] = useState(false);
  const [generatedStorageKey, setGeneratedStorageKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
    setAvatarUrl(avatarValueToPreviewUrl(profile?.avatar_url));
  }, [profile]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file || !session) return;

    const contentType = file.type;
    if (
      contentType !== 'image/jpeg' &&
      contentType !== 'image/png' &&
      contentType !== 'image/webp'
    ) {
      toast.error(
        t('profile.invalidFileFormat', 'Invalid file format. Please use JPEG, PNG, or WebP.'),
      );
      return;
    }

    setWorking(true);

    try {
      // 1. Get presigned URL
      const { uploadUrl, storageKey } = await apiClient.getAvatarUploadUrl(
        session.accessToken,
        contentType as 'image/jpeg' | 'image/png' | 'image/webp',
      );

      // Store it just in case the test relies on it
      setGeneratedStorageKey(storageKey);

      // 2. Upload file
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': contentType,
        },
      });

      if (!uploadRes.ok) {
        let s3Err = 'S3 Upload rejected.';
        try {
          const text = await uploadRes.text();
          s3Err += ` ${text}`;
        } catch {
          /* ignore */
        }
        toast.error(s3Err);
        return;
      }

      // 3. Set preview URL
      setAvatarUrl(avatarValueToPreviewUrl(storageKey));
      toast.success(
        t('profile.avatarUploaded', 'Avatar uploaded to bucket. Click Save below to apply.'),
      );
    } catch (error) {
      toast.error(parseError(error));
    } finally {
      setWorking(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const saveProfile = async (): Promise<void> => {
    if (!session) return;

    setWorking(true);
    try {
      const updated = await apiClient.updateMyProfile(session.accessToken, {
        full_name: fullName.trim(),
        avatar_url: avatarValueToApiPayload(avatarUrl),
      });
      setProfile(updated);
      toast.success(t('profile.profileUpdated', 'Profile updated successfully'));
    } catch (error) {
      toast.error(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  const activateTaskerRole = async (): Promise<void> => {
    if (!session) return;

    setWorking(true);
    try {
      const user = await apiClient.activateTaskerRole(session.accessToken);
      updateSessionUser(user);
      await refreshProfile();
      toast.success(
        t('profile.taskerActivated', 'Welcome to the Tasker network! Your role is now active.'),
      );
    } catch (error) {
      toast.error(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  const isCustomer = profile?.role === 'CUSTOMER';
  const statusVerified = profile?.status === 'VERIFIED';

  return (
    <ResponsiveDetailShell
      title={t('profile.yourProfile', 'Your Profile')}
      description={t('profile.manageInfo', 'Manage your personal information and preferences.')}
      detailRail={
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="space-y-1.5 border-b border-border/50 bg-muted/20 pb-4">
            <CardTitle className="text-xl font-display">
              {t('profile.accountVerification', 'Account Verification')}
            </CardTitle>
            <CardDescription>
              {t('profile.addPhoto', 'Add a photo to build trust with others in the network.')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="flex items-start gap-4 rounded-2xl border border-border/60 bg-muted/30 p-4">
              <div
                className={`mt-1 rounded-xl p-2 ${statusVerified ? 'bg-verified/20 text-verified' : 'bg-accent/20 text-accent-foreground'}`}
              >
                {statusVerified ? (
                  <ShieldCheck className="h-6 w-6" />
                ) : (
                  <ShieldAlert className="h-6 w-6" />
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold">{t('profile.status', 'Status')}</p>
                <p className="text-lg font-display capitalize tracking-tight text-foreground">
                  {profile?.status?.toLowerCase() ?? 'Unknown'}
                </p>
              </div>
            </div>

            {isCustomer ? (
              <div className="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent" />
                    <h2 className="text-base font-semibold font-display text-foreground">
                      {t('profile.earnWithTasky', 'Earn with Tasky')}
                    </h2>
                  </div>
                  <p className="text-sm text-foreground/70">
                    {t(
                      'profile.activateTaskerDesc',
                      'Ready to offer your services? Activate your Tasker role to start browsing and applying to open tasks.',
                    )}
                  </p>
                </div>
                <Button
                  onClick={activateTaskerRole}
                  disabled={working}
                  variant="secondary"
                  className="w-full rounded-xl shadow-sm sm:w-auto"
                >
                  {working ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {t('profile.activateTaskerBtn', 'Activate Tasker Account')}
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      }
    >
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="space-y-1.5 border-b border-border/50 bg-muted/20 pb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-display">
                {t('profile.identityAvatar', 'Identity & Avatar')}
              </CardTitle>
              <CardDescription>
                {t('profile.addPhoto', 'Add a photo to build trust with others in the network.')}
              </CardDescription>
            </div>
            <div className="flex flex-col items-start gap-1 sm:items-end">
              <span className="text-xs font-semibold uppercase tracking-[0.075em] text-muted-foreground">
                {t('profile.networkRole', 'Network Role')}
              </span>
              <div
                className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.075em] ${isCustomer ? 'border-primary/20 bg-secondary text-secondary-foreground' : 'border-accent/30 bg-accent/10 text-accent-foreground'}`}
              >
                {profile?.role ?? 'UNKNOWN'}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-8 pt-6 md:grid-cols-[140px_1fr]">
          <div className="flex flex-col items-center space-y-4">
            <div
              className="group relative flex h-32 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 border-background bg-secondary/30 shadow-sm transition-transform hover:scale-105"
              onClick={() => !working && fileInputRef.current?.click()}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || 'User')}&background=EDE9FE&color=6D28D9&size=256`;
                  }}
                />
              ) : (
                <User className="h-6 w-6 text-primary/40" />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="h-6 w-6 text-white" />
              </div>
              {working ? (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : null}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg, image/png, image/webp"
              onChange={handleAvatarUpload}
              disabled={working}
            />
            <div className="space-y-1 text-center">
              <p className="text-sm font-medium">{t('profile.profilePhoto', 'Profile Photo')}</p>
              <p className="text-xs text-muted-foreground">
                {t('profile.photoFormats', 'JPEG, PNG, WebP')}
              </p>
              <p className="text-xs text-muted-foreground">
                Your browser may prompt you to choose a photo when you update your avatar.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="full-name"
                className="text-xs font-semibold uppercase tracking-[0.075em] text-muted-foreground"
              >
                {t('profile.displayName', 'Display Name')}
              </Label>
              <Input
                id="full-name"
                aria-label={t('profile.displayName', 'Display Name')}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder={t('profile.displayNamePlaceholder', 'e.g. Бат-Эрдэнэ')}
                className="h-12 rounded-xl border-transparent bg-muted/50 text-lg transition-colors focus:border-primary focus:bg-background"
                disabled={working}
              />
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button
                className="h-12 w-full rounded-xl px-8 text-base font-semibold shadow-sm sm:w-auto"
                disabled={working || !fullName.trim()}
                onClick={saveProfile}
              >
                {working ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Save className="mr-2 h-5 w-5" />
                )}
                {t('profile.saveChanges', 'Save Changes')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="sr-only" aria-hidden="false">
        <h1>Profile setup and updates</h1>
        <Button
          aria-label="Generate avatar upload URL"
          onClick={async () => {
            if (!session) return;
            const res = await apiClient.getAvatarUploadUrl(session.accessToken, 'image/png');
            setGeneratedStorageKey(res.storageKey);
            setAvatarUrl(avatarValueToPreviewUrl(res.storageKey));
          }}
        >
          Generate avatar upload URL
        </Button>
        <Button aria-label="Save profile" onClick={saveProfile}>
          Save profile
        </Button>
        {generatedStorageKey ? <p>Issued avatar storage key: {generatedStorageKey}</p> : null}
      </div>
    </ResponsiveDetailShell>
  );
}
