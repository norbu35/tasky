import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors, typography } = mobileTheme;

export default function TasksScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Tasks</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.heading,
    fontWeight: '700',
    color: colors.foreground,
  },
});
