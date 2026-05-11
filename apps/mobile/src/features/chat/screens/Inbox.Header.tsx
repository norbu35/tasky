import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Touchable } from '@/components/ui/Touchable';
import { cn } from '@/lib/cn';

export type InboxFilter = 'all' | 'unread' | 'bookings';

interface InboxHeaderProps {
  activeFilter: InboxFilter;
  onSelectFilter: (filter: InboxFilter) => void;
}

const FILTERS: InboxFilter[] = ['all', 'unread', 'bookings'];

export function InboxHeader({ activeFilter, onSelectFilter }: InboxHeaderProps) {
  const { t } = useTranslation();

  return (
    <View className="gap-md">
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
    </View>
  );
}
