import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable } from 'react-native';

import { elevations } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';
import { cn } from '@/lib/cn';
import { setStoredLanguage } from '@/utils/i18n';

const { colors, spacing, typography } = mobileTheme;

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();

  const currentLang = (i18n.resolvedLanguage ?? i18n.language).split('-')[0];

  const changeLanguage = async (lng: string) => {
    if (lng !== currentLang) {
      await i18n.changeLanguage(lng);
      await setStoredLanguage(lng);
    }
  };

  return (
    <View
      className={cn(
        'flex-row rounded-full border border-border overflow-hidden bg-card',
        className,
      )}
      style={elevations.card}
    >
      <Pressable
        style={({ pressed }) => [
          { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
          currentLang === 'en' && { backgroundColor: colors.primary },
          pressed && { opacity: 0.9 },
        ]}
        className="items-center justify-center"
        onPress={() => changeLanguage('en')}
      >
        <Text
          style={{
            fontSize: typography.caption,
            fontWeight: '700',
            color: currentLang === 'en' ? colors.primaryForeground : colors.foreground,
          }}
        >
          {t('LanguageSwitcher.copy1')}
        </Text>
      </Pressable>

      <View className="w-px bg-border" />

      <Pressable
        style={({ pressed }) => [
          { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
          currentLang === 'mn' && { backgroundColor: colors.primary },
          pressed && { opacity: 0.9 },
        ]}
        className="items-center justify-center"
        onPress={() => changeLanguage('mn')}
      >
        <Text
          style={{
            fontSize: typography.caption,
            fontWeight: '700',
            color: currentLang === 'mn' ? colors.primaryForeground : colors.foreground,
          }}
        >
          {t('LanguageSwitcher.copy2')}
        </Text>
      </Pressable>
    </View>
  );
}
