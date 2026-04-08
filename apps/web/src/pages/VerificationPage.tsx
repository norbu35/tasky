import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Clock, ImagePlus, Loader2, ShieldCheck, Upload, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { useAppContext } from '../context/AppContext';
import { ScreenFrame } from '../layout/ScreenFrame';
import type { VerificationStatus } from '../lib/apiClient';
import { parseError } from '../lib/errorHandling';

const CONSENT_POLICY_VERSION = 'v1.0';

type PageState = 'loading' | 'form' | 'pending' | 'approved' | 'rejected';

export function VerificationPage() {
  const { apiClient, session } = useAppContext();
  const { t } = useTranslation();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // File state
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const accessToken = session?.accessToken;

  const derivePageState = useCallback((status: VerificationStatus): PageState => {
    switch (status.status) {
      case 'APPROVED':
        return 'approved';
      case 'PENDING':
        return 'pending';
      case 'REJECTED':
        return 'rejected';
      case 'NOT_SUBMITTED':
      default:
        return 'form';
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    if (!accessToken) return;
    try {
      const status = await apiClient.getVerificationStatus(accessToken);
      setVerificationStatus(status);
      setPageState(derivePageState(status));
    } catch {
      // If status check fails (e.g. 404), assume not submitted
      setPageState('form');
    }
  }, [accessToken, apiClient, derivePageState]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleFileSelect = useCallback(
    (side: 'front' | 'back' | 'selfie') => (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        toast.error(
          t('verification.invalidFileType', 'Please select an image file (JPEG, PNG, or WebP).'),
        );
        return;
      }

      const previewUrl = URL.createObjectURL(file);

      if (side === 'front') {
        if (frontPreview) URL.revokeObjectURL(frontPreview);
        setFrontFile(file);
        setFrontPreview(previewUrl);
      } else if (side === 'back') {
        if (backPreview) URL.revokeObjectURL(backPreview);
        setBackFile(file);
        setBackPreview(previewUrl);
      } else {
        if (selfiePreview) URL.revokeObjectURL(selfiePreview);
        setSelfieFile(file);
        setSelfiePreview(previewUrl);
      }
    },
    [frontPreview, backPreview, selfiePreview, t],
  );

  const handleSubmit = useCallback(async () => {
    if (!accessToken || !frontFile || !backFile || !selfieFile || !consentAccepted) return;

    setSubmitting(true);
    try {
      // 1. Get presigned URL for front image
      const frontUpload = await apiClient.getVerificationUploadUrl(accessToken, frontFile.type);

      // 2. Upload front image
      const frontUploadRes = await fetch(frontUpload.uploadUrl, {
        method: 'PUT',
        body: frontFile,
        headers: { 'Content-Type': frontFile.type },
      });
      if (!frontUploadRes.ok) {
        throw new Error(t('verification.uploadFailed', 'Failed to upload ID card front image.'));
      }

      // 3. Get presigned URL for back image
      const backUpload = await apiClient.getVerificationUploadUrl(accessToken, backFile.type);

      // 4. Upload back image
      const backUploadRes = await fetch(backUpload.uploadUrl, {
        method: 'PUT',
        body: backFile,
        headers: { 'Content-Type': backFile.type },
      });
      if (!backUploadRes.ok) {
        throw new Error(t('verification.uploadFailed', 'Failed to upload ID card back image.'));
      }

      // 5. Get presigned URL for selfie image
      const selfieUpload = await apiClient.getVerificationUploadUrl(accessToken, selfieFile.type);

      // 6. Upload selfie image
      const selfieUploadRes = await fetch(selfieUpload.uploadUrl, {
        method: 'PUT',
        body: selfieFile,
        headers: { 'Content-Type': selfieFile.type },
      });
      if (!selfieUploadRes.ok) {
        throw new Error(t('verification.uploadFailedSelfie', 'Failed to upload selfie image.'));
      }

      // 7. Submit verification
      const result = await apiClient.submitVerification(accessToken, {
        id_card_front_key: frontUpload.storageKey,
        id_card_back_key: backUpload.storageKey,
        selfie_key: selfieUpload.storageKey,
        consent_policy_version: CONSENT_POLICY_VERSION,
        consent_accepted: true,
      });

      setVerificationStatus(result);
      setPageState(derivePageState(result));
      toast.success(
        t(
          'verification.submitted',
          'Verification submitted successfully! We will review it shortly.',
        ),
      );
    } catch (error) {
      toast.error(parseError(error));
    } finally {
      setSubmitting(false);
    }
  }, [accessToken, frontFile, backFile, selfieFile, consentAccepted, apiClient, derivePageState, t]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (frontPreview) URL.revokeObjectURL(frontPreview);
      if (backPreview) URL.revokeObjectURL(backPreview);
      if (selfiePreview) URL.revokeObjectURL(selfiePreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSubmit = frontFile && backFile && selfieFile && consentAccepted && !submitting;

  // ── Loading State ──────────────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <ScreenFrame maxWidth="narrow">
        <div className="w-full py-6 flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </ScreenFrame>
    );
  }

  // ── Approved State ──────────────────────────────────────────────────
  if (pageState === 'approved') {
    return (
      <ScreenFrame maxWidth="narrow">
        <div className="w-full py-6 space-y-6">
          <div className="flex items-center gap-3 px-2">
            <ShieldCheck className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight">
                {t('verification.title', 'Identity Verification')}
              </h1>
            </div>
          </div>

          <Card className="border-border shadow-xl rounded-3xl overflow-hidden backdrop-blur-xl bg-card">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-display font-bold">
                {t('verification.approvedTitle', "You're verified!")}
              </h2>
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                {t('verification.approvedBadge', 'Verified')}
              </Badge>
              <p className="text-muted-foreground">
                {t(
                  'verification.approvedDesc',
                  'Your identity has been verified. You can now accept tasks on Tasky.',
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      </ScreenFrame>
    );
  }

  // ── Pending State ──────────────────────────────────────────────────
  if (pageState === 'pending') {
    return (
      <ScreenFrame maxWidth="narrow">
        <div className="w-full py-6 space-y-6">
          <div className="flex items-center gap-3 px-2">
            <ShieldCheck className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight">
                {t('verification.title', 'Identity Verification')}
              </h1>
            </div>
          </div>

          <Card className="border-border shadow-xl rounded-3xl overflow-hidden backdrop-blur-xl bg-card">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-display font-bold">
                {t('verification.pendingTitle', 'Under Review')}
              </h2>
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                {t('verification.pendingBadge', 'Pending')}
              </Badge>
              <p className="text-muted-foreground">
                {t(
                  'verification.pendingDesc',
                  'Your verification is being reviewed. This usually takes up to 24 hours.',
                )}
              </p>
              {verificationStatus?.submitted_at && (
                <p className="text-xs text-muted-foreground">
                  {t('verification.submittedAt', 'Submitted:')}{' '}
                  {new Date(verificationStatus.submitted_at).toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </ScreenFrame>
    );
  }

  // ── Rejected + Form State ──────────────────────────────────────────
  return (
    <ScreenFrame maxWidth="narrow">
      <div className="w-full py-6 space-y-6">
        <div className="flex items-center gap-3 px-2">
          <ShieldCheck className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">
              {t('verification.title', 'Identity Verification')}
            </h1>
            <p className="text-muted-foreground">
              {t(
                'verification.subtitle',
                'Upload your government-issued ID and a selfie to verify your identity.',
              )}
            </p>
          </div>
        </div>

        {/* Rejection notice */}
        {pageState === 'rejected' && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>{t('verification.rejectedTitle', 'Verification Rejected')}</AlertTitle>
            <AlertDescription>
              {verificationStatus?.admin_notes ??
                t(
                  'verification.rejectedDesc',
                  'Your previous submission was rejected. Please re-submit with clearer images.',
                )}
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-border shadow-xl rounded-3xl overflow-hidden backdrop-blur-xl bg-card">
          <CardHeader className="border-b border-border/50 bg-muted/20 pb-6">
            <CardTitle className="text-xl font-display">
              {t('verification.uploadTitle', 'Upload ID Card')}
            </CardTitle>
            <CardDescription>
              {t(
                'verification.uploadDesc',
                'Take clear photos of the front and back of your government-issued ID card, plus a selfie.',
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-8 space-y-8">
            {/* ID Card Front */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('verification.idFront', 'ID Card — Front')}
              </Label>
              <div
                className="group relative border-2 border-dashed border-border rounded-2xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                onClick={() => !submitting && frontInputRef.current?.click()}
              >
                {frontPreview ? (
                  <img
                    src={frontPreview}
                    alt={t('verification.idFrontPreview', 'ID card front preview')}
                    className="mx-auto max-h-48 rounded-lg object-contain"
                  />
                ) : (
                  <div className="space-y-2">
                    <ImagePlus className="mx-auto w-10 h-10 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      {t('verification.clickToUpload', 'Click to select image')}
                    </p>
                  </div>
                )}
                <input
                  ref={frontInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileSelect('front')}
                  disabled={submitting}
                />
              </div>
            </div>

            {/* ID Card Back */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('verification.idBack', 'ID Card — Back')}
              </Label>
              <div
                className="group relative border-2 border-dashed border-border rounded-2xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                onClick={() => !submitting && backInputRef.current?.click()}
              >
                {backPreview ? (
                  <img
                    src={backPreview}
                    alt={t('verification.idBackPreview', 'ID card back preview')}
                    className="mx-auto max-h-48 rounded-lg object-contain"
                  />
                ) : (
                  <div className="space-y-2">
                    <ImagePlus className="mx-auto w-10 h-10 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      {t('verification.clickToUpload', 'Click to select image')}
                    </p>
                  </div>
                )}
                <input
                  ref={backInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileSelect('back')}
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Selfie */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('verification.selfie', 'Selfie')}
              </Label>
              <div
                className="group relative border-2 border-dashed border-border rounded-2xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                onClick={() => !submitting && selfieInputRef.current?.click()}
              >
                {selfiePreview ? (
                  <img
                    src={selfiePreview}
                    alt={t('verification.selfiePreview', 'Selfie preview')}
                    className="mx-auto max-h-48 rounded-lg object-contain"
                  />
                ) : (
                  <div className="space-y-2">
                    <ImagePlus className="mx-auto w-10 h-10 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      {t('verification.clickToUpload', 'Click to select image')}
                    </p>
                  </div>
                )}
                <input
                  ref={selfieInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileSelect('selfie')}
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Consent Checkbox */}
            <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-4">
              <Checkbox
                id="consent"
                checked={consentAccepted}
                onCheckedChange={(checked) => setConsentAccepted(checked === true)}
                disabled={submitting}
              />
              <div className="space-y-1">
                <Label
                  htmlFor="consent"
                  className="text-sm font-medium leading-snug cursor-pointer"
                >
                  {t(
                    'verification.consentLabel',
                    'I consent to Tasky verifying my identity using the uploaded documents',
                  )}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t('verification.consentPolicy', 'Policy version: {{version}}', {
                    version: CONSENT_POLICY_VERSION,
                  })}
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              className="w-full h-12 text-base rounded-xl font-semibold shadow-lg shadow-primary/20 transition-all hover:translate-y-[-2px]"
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              {submitting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Upload className="mr-2 h-5 w-5" />
              )}
              {submitting
                ? t('verification.submitting', 'Uploading & Submitting...')
                : t('verification.submit', 'Submit Verification')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </ScreenFrame>
  );
}
