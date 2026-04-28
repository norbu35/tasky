import { Search, Settings } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { SearchBar } from '@/components/ui/SearchBar';
import { Touchable } from '@/components/ui/Touchable';
import { elevations } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';
import { cn } from '@/lib/cn';

const { colors } = mobileTheme;

export type InboxFilter = 'all' | 'unread' | 'bookings';

interface InboxHeaderProps {
  activeFilter: InboxFilter;
  isSearchVisible: boolean;
  search: string;
  onOpenSettings: () => void;
  onSearchChange: (value: string) => void;
  onSelectFilter: (filter: InboxFilter) => void;
  onToggleSearch: () => void;
}

const FILTERS: InboxFilter[] = ['all', 'unread', 'bookings'];

export function InboxHeader({
  activeFilter,
  isSearchVisible,
  search,
  onOpenSettings,
  onSearchChange,
  onSelectFilter,
  onToggleSearch,
}: InboxHeaderProps) {
  const { t } = useTranslation();
  const shouldShowSearch = isSearchVisible || search.trim().length > 0;

  return (
    <View className="gap-md">
      <View className="flex-row justify-end gap-sm">
        <Touchable
          accessibilityRole="button"
          accessibilityLabel={t('shared.inbox.searchAction')}
          className="h-14 w-14 items-center justify-center rounded-full bg-muted"
          onPress={onToggleSearch}
          style={elevations.soft}
          testID="conversation-search-toggle"
        >
          <Search size={26} color={colors.primaryDeep} />
        </Touchable>
        <Touchable
          accessibilityRole="button"
          accessibilityLabel={t('shared.inbox.settingsAction')}
          className="h-14 w-14 items-center justify-center rounded-full bg-muted"
          onPress={onOpenSettings}
          style={elevations.soft}
          testID="conversation-settings"
        >
          <Settings size={24} color={colors.primaryDeep} />
        </Touchable>
      </View>

      <Text className="font-screen-title text-primary-deep">{t('shared.inbox.title')}</Text>

      <View className="flex-row gap-sm" testID="conversation-filter-chips">
        {FILTERS.map((filter) => {
          const selected = activeFilter === filter;
          return (
            <Touchable
              key={filter}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={t(`shared.inbox.filters.${filter}`)}
              className={cn(
                'min-h-12 items-center justify-center rounded-full px-lg',
                selected ? 'bg-foreground' : 'bg-muted',
              )}
              onPress={() => onSelectFilter(filter)}
              testID={`conversation-filter-${filter}`}
            >
              <Text
                className={cn(
                  'text-label font-sans-bold',
                  selected ? 'text-background' : 'text-foreground',
                )}
              >
                {t(`shared.inbox.filters.${filter}`)}
              </Text>
            </Touchable>
          );
        })}
      </View>

      {shouldShowSearch ? (
        <SearchBar
          value={search}
          onChangeText={onSearchChange}
          placeholder={t('shared.inbox.searchPlaceholder')}
          testID="conversation-search-input"
        />
      ) : null}
    </View>
  );
}
