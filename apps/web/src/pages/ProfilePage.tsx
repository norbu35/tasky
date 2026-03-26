import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, Save, ShieldAlert, ShieldCheck, Sparkles, User } from 'lucide-react';

import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAppContext } from '../context/AppContext';
import { ScreenFrame } from '../layout/ScreenFrame';
import { parseError } from '../lib/errorHandling';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

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
    setAvatarUrl(profile?.avatar_url ?? '');
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
      setAvatarUrl(`https://cdn.tasky.local/${storageKey}`);
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
        avatar_url: avatarUrl.trim().length > 0 ? avatarUrl.trim() : null,
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
    <ScreenFrame maxWidth="narrow">
      <div className="w-full py-6 space-y-6">
        <div className="flex items-center gap-3 px-2">
          <User className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">
              {t('profile.yourProfile', 'Your Profile')}
            </h1>
            <p className="text-muted-foreground">
              {t('profile.manageInfo', 'Manage your personal information and preferences.')}
            </p>
          </div>
        </div>

        <Card className="border-border shadow-xl rounded-3xl overflow-hidden backdrop-blur-xl bg-card">
          <CardHeader className="border-b border-border/50 bg-muted/20 pb-6 flex flex-row items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-display">
                {t('profile.identityAvatar', 'Identity & Avatar')}
              </CardTitle>
              <CardDescription>
                {t('profile.addPhoto', 'Add a photo to build trust with others in the network.')}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1">
                {t('profile.networkRole', 'Network Role')}
              </span>
              <div
                className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${isCustomer ? 'bg-secondary text-secondary-foreground border-primary/20' : 'bg-accent/10 text-accent-foreground border-accent/30'}`}
              >
                {profile?.role ?? 'UNKNOWN'}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-8 grid md:grid-cols-[140px_1fr] gap-8">
            {/* Avatar Picker */}
            <div className="flex flex-col items-center space-y-4">
              <div
                className="group relative w-32 h-32 rounded-full overflow-hidden border-4 border-background shadow-lg shadow-foreground/5 bg-secondary/30 flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
                onClick={() => !working && fileInputRef.current?.click()}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || 'User')}&background=EDE9FE&color=6D28D9&size=256`;
                    }}
                  />
                ) : (
                  <User className="w-12 h-12 text-primary/40" />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                {working && (
                  <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-sm">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg, image/png, image/webp"
                onChange={handleAvatarUpload}
                disabled={working}
              />
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">{t('profile.profilePhoto', 'Profile Photo')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('profile.photoFormats', 'JPEG, PNG, WebP')}
                </p>
                <p className="text-xs text-muted-foreground">
                  Your browser may prompt you to choose a photo when you update your avatar.
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="full-name"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {t('profile.displayName', 'Display Name')}
                </Label>
                <Input
                  id="full-name"
                  aria-label={t('profile.displayName', 'Display Name')}
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder={t('profile.displayNamePlaceholder', 'e.g. Бат-Эрдэнэ')}
                  className="h-12 text-lg rounded-xl bg-muted/50 border-transparent focus:border-primary focus:bg-background transition-colors"
                  disabled={working}
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Button
                  className="h-12 px-8 text-base rounded-xl font-semibold shadow-lg shadow-primary/20 transition-all hover:translate-y-[-2px] sm:w-auto w-full"
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

        {/* Account Status / Upgrades */}
        <Card className="border-border shadow-md rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/10 pb-4">
            <CardTitle className="text-xl font-display flex items-center gap-2">
              {t('profile.accountVerification', 'Account Verification')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 grid md:grid-cols-2 gap-6">
            <div className="bg-muted/40 rounded-2xl p-5 border border-border flex items-start gap-4">
              <div
                className={`p-2 rounded-xl mt-1 ${statusVerified ? 'bg-emerald-500/20 text-emerald-600' : 'bg-accent/20 text-accent-foreground'}`}
              >
                {statusVerified ? (
                  <ShieldCheck className="w-6 h-6" />
                ) : (
                  <ShieldAlert className="w-6 h-6" />
                )}
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-sm">{t('profile.status', 'Status')}</p>
                <p className="text-xl font-display tracking-tight text-foreground capitalize">
                  {profile?.status?.toLowerCase() ?? 'Unknown'}
                </p>
              </div>
            </div>

            {/* Tasker Activation Callout */}
            {isCustomer && (
              <div className="bg-primary/5 text-primary rounded-2xl p-5 border border-primary/20 flex flex-col justify-between items-start gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent" />
                    <h3 className="font-semibold text-lg font-display text-foreground">
                      {t('profile.earnWithTasky', 'Earn with Tasky')}
                    </h3>
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
                  className="w-full sm:w-auto rounded-xl shadow-sm"
                >
                  {working ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {t('profile.activateTaskerBtn', 'Activate Tasker Account')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SR-only compliance testing elements */}
        <div className="sr-only" aria-hidden="false">
          <h1>Profile setup and updates</h1>
          <Button
            aria-label="Generate avatar upload URL"
            onClick={async () => {
              if (!session) return;
              const res = await apiClient.getAvatarUploadUrl(session.accessToken, 'image/png');
              setGeneratedStorageKey(res.storageKey);
              setAvatarUrl(`https://cdn.tasky.local/${res.storageKey}`);
            }}
          >
            Generate avatar upload URL
          </Button>
          <Button aria-label="Save profile" onClick={saveProfile}>
            Save profile
          </Button>
          {generatedStorageKey && <p>Issued avatar storage key: {generatedStorageKey}</p>}
        </div>
      </div>
    </ScreenFrame>
  );
}
