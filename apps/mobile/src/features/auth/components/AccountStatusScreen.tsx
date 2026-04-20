import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ban, TriangleAlert } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/shells/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { mobileTheme } from '@/design/tokenAdapter';
import { mobileSurfaces } from '@/design/surfaces';

const { colors } = mobileTheme;

type Variant = 'suspended' | 'banned';

interface AccountStatusScreenProps {
  variant: Variant;
}

function formatDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10).replace(/-/g, '.');
}

const CONFIG: Record<
  Variant,
  {
    screenTestID: string;
    titleKey: string;
    copyKey: string;
    Icon: typeof TriangleAlert;
    appealTestID: string;
  }
> = {
  suspended: {
    screenTestID: 'SCR-SHARED-020',
    titleKey: 'shared.account.suspendedTitle',
    copyKey: 'SuspendedAccountScreen.copy1',
    Icon: TriangleAlert,
    appealTestID: 'suspended-appeal-button',
  },
  banned: {
    screenTestID: 'SCR-SHARED-021',
    titleKey: 'shared.account.bannedTitle',
    copyKey: 'BannedAccountScreen.copy1',
    Icon: Ban,
    appealTestID: 'banned-support-button',
  },
};

export default function AccountStatusScreen({ variant }: AccountStatusScreenProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { expiryDate } = useLocalSearchParams<{ expiryDate?: string }>();
  const cfg = CONFIG[variant];
  const Icon = cfg.Icon;

  return (
    <ScreenContainer testID={cfg.screenTestID}>
      <View className="flex-1 justify-center items-center px-lg">
        <View
          className="rounded-full items-center justify-center mb-lg"
          style={{
            width: mobileSurfaces.statusHero.iconBox,
            height: mobileSurfaces.statusHero.iconBox,
            backgroundColor: `${colors.danger}1A`,
          }}
        >
          <Icon size={24} color={colors.danger} />
        </View>
        <Text className="text-title font-bold text-foreground text-center mb-md">
          {t(cfg.titleKey)}
        </Text>
        <Text className="text-body text-text-secondary text-center leading-6">
          {t(cfg.copyKey)}
        </Text>
        {variant === 'suspended' && expiryDate && (
          <Text className="text-body font-semibold text-danger text-center mt-md">
            {t('shared.account.suspendedExpiry', { date: formatDate(expiryDate) })}
          </Text>
        )}
        <Button
          label={t(
            variant === 'suspended'
              ? 'shared.account.suspendedAppeal'
              : 'shared.account.contactSupport',
          )}
          variant={variant === 'banned' ? 'ghost' : undefined}
          onPress={() => {
            if (variant === 'banned') {
              void Linking.openURL('mailto:support@tasky.mn');
            }
            // Suspended: appeal flow - will be connected in a later phase
          }}
          className="self-stretch mt-xl"
          testID={cfg.appealTestID}
        />
        <Button
          label={t('shared.account.logout')}
          variant={variant === 'suspended' ? 'ghost' : undefined}
          onPress={() => router.replace('/(auth)')}
          className="self-stretch mt-sm"
          testID={`${variant}-logout-button`}
        />
      </View>
    </ScreenContainer>
  );
}
