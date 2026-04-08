import React from 'react';
import { Pressable, SectionList, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { mobileTheme } from '../../design/tokenAdapter';
import { cn } from '../../lib/cn';

const { colors } = mobileTheme;

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
      className="flex-row items-center py-lg px-lg bg-muted"
      testID={testID}
      {...(isInteractive ? { accessibilityRole: 'button' as const } : {})}
    >
      {row.icon && <View className="mr-md">{row.icon}</View>}
      <Text className={cn('flex-1 text-body text-primary', row.destructive && 'text-danger')}>
        {row.label}
      </Text>
      <View className="flex-row items-center">
        {row.rightElement ? (
          row.rightElement
        ) : row.value ? (
          <Text className="text-body text-textSecondary mr-xs">{row.value}</Text>
        ) : null}
        {isInteractive && !row.rightElement && (
          <ChevronRight size={20} color={colors.textTertiary} className="ml-xs" />
        )}
      </View>
    </Wrapper>
  );
}

export function SettingsTemplate({ sections, testID, className }: SettingsTemplateProps) {
  const sectionListData = sections.map((section, sectionIndex) => ({
    title: section.title,
    data: section.rows,
    key: section.title ?? `section-${sectionIndex}`,
  }));

  return (
    <SectionList
      className={cn('flex-1 bg-background', className)}
      sections={sectionListData}
      initialNumToRender={32}
      keyExtractor={(item, index) => `${item.label}-${index}`}
      renderItem={({ item, index, section }) => (
        <>
          <SettingsRowItem row={item} testID={testID ? `${testID}-row-${index}` : undefined} />
          {index < section.data.length - 1 && (
            <View className="bg-border ml-lg" style={{ height: 1 }} />
          )}
        </>
      )}
      renderSectionHeader={({ section }) =>
        section.title ? (
          <View className="px-lg pt-xl pb-sm">
            <Text className="text-caption font-bold text-primaryDeep tracking-widest uppercase">
              {section.title.toUpperCase()}
            </Text>
          </View>
        ) : (
          <View className="h-xl" />
        )
      }
      stickySectionHeadersEnabled={false}
      showsVerticalScrollIndicator={false}
      testID={testID}
    />
  );
}
