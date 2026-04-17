import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import { mobileTheme } from '../../design/tokenAdapter';
import { cn } from '../../lib/cn';
import { ActionRow } from '../ui/ActionRow';

const { spacing } = mobileTheme;

export interface SettingsRow {
  label: string;
  value?: string;
  onPress?: () => void;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  destructive?: boolean;
}

export interface SettingsSection {
  title?: string;
  rows: SettingsRow[];
}

export interface SettingsTemplateProps {
  sections: SettingsSection[];
  testID?: string;
  className?: string;
}

export function SettingsTemplate({ sections, testID, className }: SettingsTemplateProps) {
  return (
    <ScrollView
      className={cn('flex-1 bg-background', className)}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing['2xl'] + spacing.xl,
      }}
      testID={testID}
    >
      {sections.map((section, sectionIndex) => (
        <View key={section.title ?? `section-${sectionIndex}`} className="mb-xl">
          {section.title ? (
            <Text className="text-caption font-bold text-primary-deep tracking-widest uppercase mb-sm">
              {section.title.toUpperCase()}
            </Text>
          ) : null}
          <View className="bg-muted rounded-md overflow-hidden">
            {section.rows.map((row, rowIndex) => (
              <ActionRow
                key={`${row.label}-${rowIndex}`}
                icon={row.icon ?? <View />}
                label={row.label}
                onPress={row.onPress}
                value={row.value}
                trailing={row.rightElement}
                destructive={row.destructive}
                showDivider={rowIndex < section.rows.length - 1}
                testID={testID ? `${testID}-row-${rowIndex}` : undefined}
              />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
