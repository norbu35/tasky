import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FeedListTemplate } from '../../../components/templates/FeedListTemplate';
import { Button } from '../../../components/ui/Button';

export default function BusinessDashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  // TODO: wire real data — fetch business accounts list

  return (
    <FeedListTemplate
      testID="SCR-B2B-001"
      data={[]}
      renderItem={() => ({ type: 'text', key: 'placeholder' } as any)}
      keyExtractor={(item: any) => item.key}
      isLoading={false}
      isEmpty
      emptyTitle={t('b2b.dashboard.empty', 'No business accounts yet')}
      emptyDescription={t('b2b.dashboard.emptyDesc', 'Create a business account to manage tasks for your team.')}
      emptyCtaLabel={t('b2b.dashboard.createAccount', 'Create Business Account')}
      emptyCtaOnPress={() => router.push('/(customer)/business/new/details')}
      ListHeaderComponent={
        <Button
          label={t('b2b.dashboard.createAccount', 'Create Business Account')}
          onPress={() => router.push('/(customer)/business/new/details')}
        />
      }
    />
  );
}
