import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileAvatar } from '../../../components/ui/ProfileAvatar';
import { mobileTheme } from '../../../design/tokenAdapter';
import { Conversation, createMobileApiClient } from '../../../lib/mobileApiClient';
import { useAuthStore } from '../../../store/authStore';

const { colors, spacing } = mobileTheme;

export function InboxScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { session } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    if (!session) return;
    try {
      const client = createMobileApiClient();
      const res = await client.listConversations(session.accessToken);
      setConversations(res.data);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || t('shared.inbox.errorLoading'));
    } finally {
      setIsLoading(false);
    }
  }, [session, t]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <Text style={styles.headerTitle}>{t('messaging.inboxTitle')}</Text>

      <FlatList
        style={{ flex: 1 }}
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/inbox/${item.id}`)}>
            <View style={styles.avatarWrapper}>
              <ProfileAvatar name={item.task_title || 'T'} size="md" />
            </View>
            <View style={styles.content}>
              <Text style={styles.taskTitle}>
                {item.task_title || t('messaging.taskDiscussion')}
              </Text>
              <Text style={styles.subtext}>
                {t('messaging.bookingRef', {
                  id: (item as { booking_id?: string }).booking_id?.substring(0, 8),
                })}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>{t('messaging.noConversations')}</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    color: colors.foreground,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: spacing['3xl'],
  },
  card: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  avatarWrapper: {
    width: 44,
    height: 44,
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.cardForeground,
    marginBottom: 4,
  },
  subtext: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  errorText: {
    color: colors.danger,
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.mutedForeground,
    marginTop: 40,
    fontSize: 16,
  },
});
