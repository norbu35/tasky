import React from 'react';
import { Text, View } from 'react-native';

import { elevations } from '@/design/elevations';

import { type DisputeLike, DISPUTE_STATUS_SURFACE, getEvidenceLabel } from './DisputeStatus.model';

export function EvidenceList({
  items,
  sectionTitle,
  emptyLabel,
  t,
}: {
  items: DisputeLike['evidence'];
  sectionTitle: string;
  emptyLabel: string;
  t: (key: string) => string;
}) {
  const evidenceItems = Array.isArray(items) ? items : [];
  return (
    <View className="bg-card rounded-lg p-lg gap-sm" style={elevations.soft}>
      <Text className="text-heading font-sans-bold text-primary-deep">{sectionTitle}</Text>
      {evidenceItems.length > 0 ? (
        evidenceItems.map((item, index) => (
          <View
            key={`${index}-${typeof item === 'string' ? item : item.type}-${typeof item === 'string' ? 'string' : (item.storage_key ?? 'item')}`}
            className="flex-row items-start gap-sm"
          >
            <View
              className="rounded-full bg-primary-deep mt-sm"
              style={{
                width: DISPUTE_STATUS_SURFACE.timeline.evidenceBullet,
                height: DISPUTE_STATUS_SURFACE.timeline.evidenceBullet,
              }}
            />
            <Text className="flex-1 text-body text-primary-deep leading-snug">
              {getEvidenceLabel(item, t)}
            </Text>
          </View>
        ))
      ) : (
        <Text className="text-body text-text-secondary">{emptyLabel}</Text>
      )}
    </View>
  );
}
