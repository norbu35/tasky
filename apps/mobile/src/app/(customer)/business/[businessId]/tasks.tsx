import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FeedListTemplate } from '../../../../components/templates/FeedListTemplate';

export default function BusinessTaskListScreen() {
  const { t } = useTranslation();
  const { businessId } = useLocalSearchParams<{ businessId: string }>();

  // TODO: wire real data — fetch tasks for this business account

  return (
    <FeedListTemplate
      testID="SCR-B2B-006"
      data={[]}
      renderItem={() => ({ type: 'placeholder' } as any)}
      keyExtractor={(item: any) => item.type}
      isEmpty
      emptyTitle={t('b2b.tasks.empty')}
      emptyDescription={t('b2b.tasks.emptyDesc')}
    />
  );
}
