import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { mobileTheme } from '../../design/tokenAdapter';
import { cn } from '../../lib/cn';

const { colors, spacing } = mobileTheme;

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

function SettingsRowItem({ row, testID }: { row: SettingsRow; testID?: string }) {
  const isInteractive = !!row.onPress;
  const Wrapper = isInteractive ? Pressable : View;

  return (
    <Wrapper
      onPress={row.onPress}
      className={cn(
        'flex-row items-center p-md border-b border-border/50',
        !isInteractive && 'bg-transparent',
      )}
      style={(state) => {
        const pressed = isInteractive && (state as any).pressed;
        return [pressed && { backgroundColor: 'rgba(0,0,0,0.05)' }];
      }}
      testID={testID}
      {...(isInteractive ? { accessibilityRole: 'button' as const } : {})}
    >
      {row.icon && (
        <View
          className={cn(
            'w-10 h-10 rounded-full items-center justify-center mr-md',
            row.destructive ? 'bg-danger/10' : 'bg-primary/10',
          )}
        >
          {row.icon}
        </View>
      )}
      <Text
        className={cn(
          'flex-1 text-body font-sans-medium',
          row.destructive ? 'text-danger' : 'text-foreground',
        )}
      >
        {row.label}
      </Text>
      <View className="flex-row items-center">
        {row.rightElement ? (
          row.rightElement
        ) : row.value ? (
          <Text className="text-body text-text-secondary mr-xs">{row.value}</Text>
        ) : null}
        {isInteractive && !row.rightElement && (
          <ChevronRight size={20} color={colors.navInactive} />
        )}
      </View>
    </Wrapper>
  );
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
              <SettingsRowItem
                key={`${row.label}-${rowIndex}`}
                row={row}
                testID={testID ? `${testID}-row-${rowIndex}` : undefined}
              />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
