import { Sparkles } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { DetailTemplate } from '../../../components/templates/DetailTemplate';
import { CategoryChip } from '../../../components/ui/CategoryChip';
import { Input } from '../../../components/ui/Input';
import { SkeletonLoader } from '../../../components/ui/SkeletonLoader';
import { Toast } from '../../../components/ui/Toast';
import { elevations, mobileSurfaces, mobileTheme } from '../../../design/tokenAdapter';
import { useMyProfile, useUpdateProfile } from '../../../features/profile/hooks/useProfile';
import { useProfilePolishPreview } from '../../../features/profile/hooks/useProfilePolish';
import {
  createConsoleClientAnalyticsTracker,
  resolveClientLocale,
  type ClientEventName,
} from '../../../lib/clientAnalytics';

const { colors } = mobileTheme;

type Tone = 'friendly' | 'professional' | 'concise';
type ScreenState = 'draft_ready' | 'generating' | 'suggestion_ready';
const MAX_BIO_LENGTH = 300;

export default function ProfilePolishScreen() {
  const { t, i18n } = useTranslation();
  const { data: profile, isLoading, isError, refetch } = useMyProfile();
  const updateProfile = useUpdateProfile();
  const previewProfilePolish = useProfilePolishPreview();
  const profileDetails = profile as ({ bio?: string | null } & Record<string, unknown>) | undefined;
  const analyticsTracker = React.useMemo(() => createConsoleClientAnalyticsTracker(), []);
  const locale = React.useMemo(() => resolveClientLocale(i18n.language), [i18n.language]);
  const toneLabels: Record<Tone, string> = {
    friendly: t('ProfilePolishScreen.friendly'),
    professional: t('ProfilePolishScreen.professional'),
    concise: t('ProfilePolishScreen.concise'),
  };

  const [sourceBio, setSourceBio] = React.useState('');
  const [tone, setTone] = React.useState<Tone>('professional');
  const [screenState, setScreenState] = React.useState<ScreenState>('draft_ready');
  const [suggestion, setSuggestion] = React.useState('');
  const [toast, setToast] = React.useState<{
    message: string;
    variant: 'success' | 'error';
  } | null>(null);
  const requestVersionRef = React.useRef(0);
  const trackRejectedRef = React.useRef(false);
  const appliedSuggestionRef = React.useRef(false);
  const hasDirtyDraftRef = React.useRef(false);

  const trackEvent = React.useCallback(
    (eventName: ClientEventName) => {
      analyticsTracker({
        event_name: eventName,
        platform: 'MOBILE',
        locale,
        actor_role: 'TASKER',
        timestamp: new Date().toISOString(),
      });
    },
    [analyticsTracker, locale],
  );

  React.useEffect(() => {
    if (!hasDirtyDraftRef.current && profileDetails?.bio) {
      setSourceBio(profileDetails.bio);
    }
  }, [profileDetails?.bio]);

  React.useEffect(() => {
    trackEvent('profile_polish_viewed');

    return () => {
      if (trackRejectedRef.current && !appliedSuggestionRef.current) {
        trackEvent('profile_polish_rejected');
      }
    };
  }, [trackEvent]);

  const currentCount = sourceBio.length;

  const resetSuggestion = React.useCallback(() => {
    requestVersionRef.current += 1;
    trackRejectedRef.current = false;
    setScreenState('draft_ready');
    setSuggestion('');
  }, []);

  const handleGenerate = () => {
    const requestBio = sourceBio.trim();
    if (!requestBio) {
      return;
    }

    const requestTone = tone;
    const requestVersion = requestVersionRef.current + 1;
    requestVersionRef.current = requestVersion;
    appliedSuggestionRef.current = false;
    trackRejectedRef.current = false;
    setToast(null);
    setScreenState('generating');
    setSuggestion('');
    trackEvent('profile_polish_requested');

    previewProfilePolish.mutate(
      { bio: requestBio, tone: requestTone },
      {
        onSuccess: (response) => {
          if (requestVersion !== requestVersionRef.current) {
            return;
          }

          const nextSuggestion = response.suggested_bio.trim();
          if (!nextSuggestion) {
            resetSuggestion();
            setToast({
              message: t('tasker.profilePolish.toastError'),
              variant: 'error',
            });
            return;
          }

          setSuggestion(nextSuggestion);
          setScreenState('suggestion_ready');
          trackRejectedRef.current = true;
        },
        onError: () => {
          if (requestVersion !== requestVersionRef.current) {
            return;
          }

          resetSuggestion();
          setToast({
            message: t('tasker.profilePolish.toastError'),
            variant: 'error',
          });
        },
      },
    );
  };

  const handleApply = () => {
    updateProfile.mutate(
      { bio: suggestion.trim() },
      {
        onSuccess: () => {
          appliedSuggestionRef.current = true;
          trackRejectedRef.current = false;
          hasDirtyDraftRef.current = false;
          setSourceBio(suggestion.trim());
          trackEvent('profile_polish_applied');
          setToast({
            message: t('tasker.profilePolish.toastSuccess'),
            variant: 'success',
          });
        },
        onError: () => {
          setToast({
            message: t('tasker.profilePolish.toastError'),
            variant: 'error',
          });
        },
      },
    );
  };

  const handlePrimaryAction = () => {
    if (screenState === 'suggestion_ready' && suggestion) {
      handleApply();
      return;
    }

    handleGenerate();
  };

  return (
    <DetailTemplate
      testID="SCR-TASK-019"
      ctaLabel={
        screenState === 'suggestion_ready'
          ? t('tasker.profilePolish.apply')
          : t('tasker.profilePolish.generate')
      }
      ctaOnPress={handlePrimaryAction}
      ctaLoading={
        screenState === 'generating' || previewProfilePolish.isPending || updateProfile.isPending
      }
      ctaDisabled={!sourceBio.trim()}
      secondaryCtaLabel={
        screenState === 'generating' ? undefined : t('tasker.profilePolish.manualEdit')
      }
      secondaryCtaOnPress={
        screenState === 'generating'
          ? undefined
          : () => {
              resetSuggestion();
              setToast(null);
            }
      }
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
    >
      <View className="gap-xl">
        <View className="bg-muted rounded-lg p-xl gap-md">
          {/* aiBadge: rgba background → imperative */}
          <View
            className="self-start flex-row items-center gap-xs px-md py-xs rounded-full"
            style={{ backgroundColor: 'rgba(253, 206, 106, 0.24)' }}
          >
            <Sparkles size={14} color={colors.secondary} />
            <Text className="text-micro font-bold text-secondary" style={{ letterSpacing: 0.5 }}>
              {t('tasker.polish.aiPowered')}
            </Text>
          </View>
          <Text className="text-heading font-extrabold text-primary-deep leading-tight">
            {t('tasker.profilePolish.heroTitle')}
          </Text>
          <Text className="text-body text-text-secondary leading-relaxed">
            {t('ProfilePolishScreen.copy1')}
          </Text>
        </View>

        <View className="gap-md">
          <Text
            className="text-caption font-bold text-text-secondary uppercase"
            style={{ letterSpacing: mobileSurfaces.taskDetail.sectionTracking }}
          >
            {t('tasker.profilePolish.sourceLabel')}
          </Text>
          <View className="bg-muted rounded-lg p-lg gap-sm">
            <Input
              value={sourceBio}
              onChangeText={(text) => {
                hasDirtyDraftRef.current = true;
                setSourceBio(text.slice(0, MAX_BIO_LENGTH));
                if (screenState === 'generating' || suggestion) {
                  resetSuggestion();
                }
                setToast(null);
              }}
              placeholder={t('ProfilePolishScreen.copy2')}
              multiline
              numberOfLines={6}
              maxLength={MAX_BIO_LENGTH}
            />
            <Text className="self-end text-caption text-muted-foreground">
              {`${currentCount}/${MAX_BIO_LENGTH}`}
            </Text>
          </View>
        </View>

        <View className="gap-md">
          <Text
            className="text-caption font-bold text-text-secondary uppercase"
            style={{ letterSpacing: mobileSurfaces.taskDetail.sectionTracking }}
          >
            {t('tasker.profilePolish.toneLabel')}
          </Text>
          <View className="flex-row flex-wrap gap-sm">
            {(Object.keys(toneLabels) as Tone[]).map((value) => (
              <CategoryChip
                key={value}
                label={toneLabels[value]}
                isActive={tone === value}
                onPress={() => {
                  if (tone !== value) {
                    if (screenState === 'generating' || suggestion) {
                      resetSuggestion();
                    }
                    setTone(value);
                  }
                  setToast(null);
                }}
              />
            ))}
          </View>
        </View>

        <View className="gap-md">
          <Text
            className="text-caption font-bold text-text-secondary uppercase"
            style={{ letterSpacing: mobileSurfaces.taskDetail.sectionTracking }}
          >
            {t('tasker.profilePolish.polishedLabel')}
          </Text>
          {screenState === 'generating' ? (
            <View
              className="bg-card rounded-lg p-xl gap-md"
              style={elevations.soft}
              testID="profile-polish-suggestion-loading"
            >
              <SkeletonLoader height={24} width="60%" />
              <SkeletonLoader height={20} />
              <SkeletonLoader height={20} width="85%" />
              <SkeletonLoader height={20} width="70%" />
            </View>
          ) : (
            <View
              className="bg-card rounded-lg p-xl gap-md"
              style={elevations.soft}
              testID="profile-polish-suggestion-card"
            >
              {suggestion ? (
                <Text className="text-body text-foreground leading-relaxed">{suggestion}</Text>
              ) : (
                <Text className="text-body text-muted-foreground leading-relaxed">
                  {t('ProfilePolishScreen.copy3')}
                </Text>
              )}
            </View>
          )}
        </View>

        {toast ? (
          <View className="pb-sm">
            <Toast message={toast.message} variant={toast.variant} />
          </View>
        ) : null}
      </View>
    </DetailTemplate>
  );
}
