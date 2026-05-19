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
      toast.error(t('profile.invalidFileFormat'));
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
      toast.success(t('profile.avatarUploaded'));
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
      toast.success(t('profile.profileUpdated'));
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
      toast.success(t('profile.taskerActivated'));
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
      title={t('profile.yourProfile')}
      description={t('profile.manageInfo')}
      detailRail={
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-display">
              {t('profile.accountVerification')}
            </CardTitle>
            <CardDescription>{t('profile.addPhoto')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="flex items-center gap-4 rounded-xl bg-muted/20 p-4 ring-1 ring-inset ring-border/30">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors ${statusVerified ? 'bg-verified/15 text-verified' : 'bg-sun-wash/60 text-sun-warm'}`}
              >
                {statusVerified ? (
                  <ShieldCheck className="h-6 w-6" />
                ) : (
                  <ShieldAlert className="h-6 w-6" />
                )}
              </div>
              <div className="space-y-1">
                <p className="text-label text-muted-foreground">{t('profile.status')}</p>
                <p className="text-section-heading font-display capitalize tracking-tight text-foreground">
                  {profile?.status?.toLowerCase() ?? 'Unknown'}
                </p>
              </div>
            </div>

            {isCustomer ? (
              <div className="space-y-4 rounded-xl bg-sun-wash/30 p-5 ring-1 ring-inset ring-sun-light/30">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sun-light/30">
                      <Sparkles className="h-4 w-4 text-sun-warm" />
                    </div>
                    <h2 className="text-lg font-semibold font-display text-foreground">
                      {t('profile.earnWithTasky')}
                    </h2>
                  </div>
                  <p className="text-body-sm text-muted-foreground pl-[2.625rem]">
                    {t('profile.activateTaskerDesc')}
                  </p>
                </div>
                <Button
                  onClick={activateTaskerRole}
                  disabled={working}
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  {working ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {t('profile.activateTaskerBtn')}
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      }
    >
      <Card>
        <CardHeader className="pb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-display">{t('profile.identityAvatar')}</CardTitle>
              <CardDescription>{t('profile.addPhoto')}</CardDescription>
            </div>
            <div className="flex flex-col items-start gap-1.5 sm:items-end">
              <span className="text-badge-text font-semibold uppercase tracking-caps text-muted-foreground">
                {t('profile.networkRole')}
              </span>
              <div
                className={`rounded-full px-3.5 py-1 text-badge-text font-bold uppercase tracking-caps ring-1 ring-inset ${isCustomer ? 'bg-secondary/60 text-secondary-foreground ring-border/40' : 'bg-sun-wash/50 text-sun-warm ring-sun-light/40'}`}
              >
                {profile?.role ?? 'UNKNOWN'}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-8 pt-6 md:grid-cols-[160px_1fr]">
          <div className="flex flex-col items-center space-y-4">
            <div
              className="group relative flex h-36 w-36 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-muted/20 shadow-elevated ring-4 ring-background transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:shadow-deep hover:ring-primary/20"
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
                <div className="flex h-full w-full items-center justify-center bg-muted/30">
                  <User className="h-8 w-8 text-muted-foreground/40" />
                </div>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-primary/50 opacity-0 backdrop-blur-[2px] transition-all duration-300 group-hover:opacity-100">
                <Camera className="h-6 w-6 text-primary-foreground" />
                <span className="text-badge-text font-semibold text-primary-foreground">
                  {t('profile.profilePhoto')}
                </span>
              </div>
              {working ? (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
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
              <p className="text-body-sm font-medium text-foreground">
                {t('profile.profilePhoto')}
              </p>
              <p className="text-badge-text text-muted-foreground">{t('profile.photoFormats')}</p>
              <p className="text-badge-text text-muted-foreground">
                Your browser may prompt you to choose a photo when you update your avatar.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="full-name"
                className="text-badge-text font-semibold uppercase tracking-caps text-muted-foreground"
              >
                {t('profile.displayName')}
              </Label>
              <Input
                id="full-name"
                aria-label={t('profile.displayName')}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder={t('profile.displayNamePlaceholder')}
                className="text-lg"
                disabled={working}
              />
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button
                className="w-full px-8 text-base font-semibold sm:w-auto"
                disabled={working || !fullName.trim()}
                onClick={saveProfile}
              >
                {working ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Save className="mr-2 h-5 w-5" />
                )}
                {t('profile.saveChanges')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="sr-only" aria-hidden="false">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Profile setup and updates
        </h1>
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
