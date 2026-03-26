import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { mobileTheme } from '../../design/tokenAdapter';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      <TouchableOpacity
        style={[styles.btn, currentLang === 'en' && styles.active]}
        onPress={() => changeLanguage('en')}
      >
        <Text style={[styles.text, currentLang === 'en' && styles.activeText]}>English</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity
        style={[styles.btn, currentLang === 'mn' && styles.active]}
        onPress={() => changeLanguage('mn')}
      >
        <Text style={[styles.text, currentLang === 'mn' && styles.activeText]}>Монгол</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(23, 56, 56, 0.12)',
    overflow: 'hidden',
  },
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: {
    backgroundColor: mobileTheme.colors.primary,
  },
  divider: {
    width: 0,
    backgroundColor: 'transparent',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    color: mobileTheme.colors.foreground,
  },
  activeText: {
    color: '#FFFFFF',
  },
});
