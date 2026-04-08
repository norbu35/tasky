import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { mobileTheme } from '../../design/tokenAdapter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { elevations } from '../../design/elevations';
import { cn } from '../../lib/cn';

const { colors, spacing, typography } = mobileTheme;

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();

  const currentLang = i18n.language;

  const changeLanguage = async (lng: string) => {
    if (lng !== currentLang) {
      await i18n.changeLanguage(lng);
      // Optionally persist it if needed, but react-i18next handles mem caching.
      // Saving to async storage manually just to be explicitly safe across boots.
      await AsyncStorage.setItem('user-language', lng);
    }
  };

  return (
    <View
      className={cn('flex-row rounded-full border border-border overflow-hidden bg-card', className)}
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
          English
        </Text>
      </Pressable>

      <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />

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
          {t('LanguageSwitcher.copy1')}</Text>
      </Pressable>
    </View>
  );
}
