import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Conversation, createMobileApiClient } from '../../../lib/mobileApiClient';
import { useAuthStore } from '../../../store/authStore';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors } = mobileTheme;

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
    } catch (err: any) {
      setError(err.message || t('shared.inbox.errorLoading', 'Failed to load conversations.'));
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
      <Text style={styles.headerTitle}>{t('messaging.inboxTitle', 'Inbox')}</Text>

      <FlatList
        style={{ flex: 1 }}
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/inbox/${item.id}`)}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.task_title?.charAt(0) || 'T'}</Text>
            </View>
            <View style={styles.content}>
              <Text style={styles.taskTitle}>
                {item.task_title || t('messaging.taskDiscussion')}
              </Text>
              <Text style={styles.subtext}>
                {t('messaging.bookingRef', { id: (item as any).booking_id?.substring(0, 8) })}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {t('messaging.noConversations', 'No conversations found.')}
          </Text>
        }
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
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20', // 20% opacity
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
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
