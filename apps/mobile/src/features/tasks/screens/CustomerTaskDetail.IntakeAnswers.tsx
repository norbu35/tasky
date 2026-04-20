import React from 'react';
import { Text, View } from 'react-native';

import { mobileSurfaces } from '@/design/surfaces';

import { prettifyKey, formatAnswerValue } from './CustomerTaskDetail.model';

const { taskDetail } = mobileSurfaces;

export function IntakeAnswersSection({
  answers,
  t,
}: {
  answers: Record<string, unknown>;
  t: (k: string) => string;
}) {
  const entries = Object.entries(answers).filter(([, v]) => v != null && v !== '');
  if (entries.length === 0) return null;

  return (
    <View className="bg-muted rounded-sm p-lg gap-md">
      <Text
        className="text-caption font-bold text-text-secondary uppercase"
        style={{ letterSpacing: taskDetail.sectionTracking }}
      >
        {t('TaskDetailCustomerScreen.intakeTitle')}
      </Text>
      {entries.map(([key, value]) => (
        <View key={key} className="gap-xs">
          <Text className="text-caption text-text-secondary">{prettifyKey(key)}</Text>
          <View className="flex-row flex-wrap gap-xs">
            {Array.isArray(value) ? (
              value.map((item, idx) => (
                <View key={`${key}-${idx}`} className="px-md py-sm rounded-sm bg-card">
                  <Text className="text-label font-bold text-foreground">
                    {prettifyKey(String(item))}
                  </Text>
                </View>
              ))
            ) : (
              <View className="px-md py-sm rounded-sm bg-card">
                <Text className="text-label font-bold text-foreground">
                  {formatAnswerValue(value, t)}
                </Text>
              </View>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}
