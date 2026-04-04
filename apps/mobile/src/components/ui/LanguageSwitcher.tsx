import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { mobileTheme } from '../../design/tokenAdapter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { elevations } from '../../design/elevations';

const { colors, radius, spacing, typography } = mobileTheme;

export function LanguageSwitcher() {
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
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [styles.btn, currentLang === 'en' && styles.active, pressed && styles.pressed]}
        onPress={() => changeLanguage('en')}
      >
        <Text style={[styles.text, currentLang === 'en' && styles.activeText]}>English</Text>
      </Pressable>

      <View style={styles.divider} />

      <Pressable
        style={({ pressed }) => [styles.btn, currentLang === 'mn' && styles.active, pressed && styles.pressed]}
        onPress={() => changeLanguage('mn')}
      >
        <Text style={[styles.text, currentLang === 'mn' && styles.activeText]}>Монгол</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...elevations.card,
  },
  btn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: {
    backgroundColor: mobileTheme.colors.primary,
  },
  pressed: {
    opacity: 0.9,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  text: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.foreground,
  },
  activeText: {
    color: colors.primaryForeground,
  },
});
