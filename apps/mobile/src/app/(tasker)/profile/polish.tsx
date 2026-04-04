import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { DetailTemplate } from '../../../components/templates/DetailTemplate';
import { CategoryChip } from '../../../components/ui/CategoryChip';
import { Input } from '../../../components/ui/Input';
import { SkeletonLoader } from '../../../components/ui/SkeletonLoader';
import { Toast } from '../../../components/ui/Toast';
import { useMyProfile, useUpdateProfile } from '../../../features/profile/hooks/useProfile';
import { useProfilePolishPreview } from '../../../features/profile/hooks/useProfilePolish';
import { mobileTheme, elevations } from '../../../design/tokenAdapter';
import {
  createConsoleClientAnalyticsTracker,
  resolveClientLocale,
  type ClientEventName,
} from '../../../lib/clientAnalytics';

const { colors, spacing, typography, radius } = mobileTheme;

type Tone = 'friendly' | 'professional' | 'concise';
type ScreenState = 'draft_ready' | 'generating' | 'suggestion_ready';

const TONE_LABELS: Record<Tone, string> = {
  friendly: 'Найрсаг',
  professional: 'Мэргэжлийн',
  concise: 'Товч',
};
const MAX_BIO_LENGTH = 300;

export default function ProfilePolishScreen() {
  const { t, i18n } = useTranslation();
  const { data: profile, isLoading, isError, refetch } = useMyProfile();
  const updateProfile = useUpdateProfile();
  const previewProfilePolish = useProfilePolishPreview();
  const profileDetails = profile as ({ bio?: string | null } & Record<string, unknown>) | undefined;
  const analyticsTracker = React.useMemo(() => createConsoleClientAnalyticsTracker(), []);
  const locale = React.useMemo(() => resolveClientLocale(i18n.language), [i18n.language]);

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
              message: t('tasker.profilePolish.toastError', 'Сүлжээний алдаа гарлаа'),
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
            message: t('tasker.profilePolish.toastError', 'Сүлжээний алдаа гарлаа'),
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
            message: t('tasker.profilePolish.toastSuccess', 'Санал болгосон текст хадгалагдлаа'),
            variant: 'success',
          });
        },
        onError: () => {
          setToast({
            message: t('tasker.profilePolish.toastError', 'Сүлжээний алдаа гарлаа'),
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
    <DetailTemplate testID="SCR-TASK-019"
      ctaLabel={
        screenState === 'suggestion_ready'
          ? t('tasker.profilePolish.apply', 'Энэ хувилбарыг хэрэглэх')
          : t('tasker.profilePolish.generate', 'Санал болгох')
      }
      ctaOnPress={handlePrimaryAction}
      ctaLoading={
        screenState === 'generating' || previewProfilePolish.isPending || updateProfile.isPending
      }
      ctaDisabled={!sourceBio.trim()}
      secondaryCtaLabel={
        screenState === 'generating'
          ? undefined
          : t('tasker.profilePolish.manualEdit', 'Гараар засах')
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
      <View style={styles.content}>
        <View style={styles.introCard}>
          <View style={styles.aiBadge}>
            <Sparkles size={14} color={colors.secondary} />
            <Text style={styles.aiBadgeText}>{t('tasker.polish.aiPowered', 'AI POWERED')}</Text>
          </View>
          <Text style={styles.heroTitle}>
            {t('tasker.profilePolish.heroTitle', 'Профайл засах')}
          </Text>
          <Text style={styles.heroBody}>
            {t(
              'tasker.profilePolish.heroBody',
              'AI-ийн тусламжтайгаар өөрийн ажлын туршлага, ур чадвараа илүү мэргэжлийн түвшинд харагдуулаарай.',
            )}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            {t('tasker.profilePolish.sourceLabel', 'Одоогийн тайлбар')}
          </Text>
          <View style={styles.sourceCard}>
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
              placeholder={t(
                'tasker.profilePolish.sourcePlaceholder',
                'Өөрийн ажлын туршлагаа бичнэ үү',
              )}
              multiline
              numberOfLines={6}
              maxLength={MAX_BIO_LENGTH}
            />
            <Text style={styles.counter}>{`${currentCount}/${MAX_BIO_LENGTH}`}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('tasker.profilePolish.toneLabel', 'Хэв маяг')}</Text>
          <View style={styles.toneRow}>
            {(Object.keys(TONE_LABELS) as Tone[]).map((value) => (
              <CategoryChip
                key={value}
                label={TONE_LABELS[value]}
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

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            {t('tasker.profilePolish.polishedLabel', 'Санал болгосон хувилбар')}
          </Text>
          {screenState === 'generating' ? (
            <View style={styles.suggestionCard} testID="profile-polish-suggestion-loading">
              <SkeletonLoader height={24} width="60%" />
              <SkeletonLoader height={20} />
              <SkeletonLoader height={20} width="85%" />
              <SkeletonLoader height={20} width="70%" />
            </View>
          ) : (
            <View style={styles.suggestionCard} testID="profile-polish-suggestion-card">
              {suggestion ? (
                <Text style={styles.suggestionText}>{suggestion}</Text>
              ) : (
                <Text style={styles.placeholderText}>
                  {t(
                    'tasker.profilePolish.suggestionPlaceholder',
                    'AI санал энд харагдана. Эхлээд тайлбараа сайжруулах хүсэлт илгээнэ үү.',
                  )}
                </Text>
              )}
            </View>
          )}
        </View>

        {toast ? (
          <View style={styles.toastWrap}>
            <Toast message={toast.message} variant={toast.variant} />
          </View>
        ) : null}
      </View>
    </DetailTemplate>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
  introCard: {
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  aiBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: 'rgba(253, 206, 106, 0.24)',
  },
  aiBadgeText: {
    fontSize: typography.micro,
    fontWeight: '700',
    color: colors.secondary,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: typography.heading,
    lineHeight: typography.heading * (19 / 12),
    fontWeight: '800',
    color: colors.primaryDeep,
  },
  heroBody: {
    fontSize: typography.body,
    lineHeight: typography.body * 1.625,
    color: colors.textSecondary,
  },
  section: {
    gap: spacing.md,
  },
  sectionLabel: {
    fontSize: typography.caption,
    lineHeight: typography.caption * (5 / 3),
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sourceCard: {
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  counter: {
    alignSelf: 'flex-end',
    fontSize: typography.caption,
    color: colors.mutedForeground,
  },
  toneRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  suggestionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
    ...elevations.soft,
  },
  suggestionText: {
    fontSize: typography.body,
    lineHeight: typography.body * 1.625,
    color: colors.foreground,
  },
  placeholderText: {
    fontSize: typography.body,
    lineHeight: typography.body * 1.625,
    color: colors.mutedForeground,
  },
  toastWrap: {
    paddingBottom: spacing.sm,
  },
});
