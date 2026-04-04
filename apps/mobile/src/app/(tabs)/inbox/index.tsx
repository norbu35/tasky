import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react-native';
import { useConversations } from '../../../features/chat/hooks/useConversations';
import { FeedListTemplate } from '../../../components/templates/FeedListTemplate';
import { Input } from '../../../components/ui/Input';
import { ProfileAvatar } from '../../../components/ui/ProfileAvatar';
import { elevations, mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

interface ConversationItem {
  id: string;
  task_title?: string;
  last_message_preview?: string;
  last_message_at?: string;
  counterparty_name?: string;
  counterparty_avatar_url?: string | null;
  unread_count?: number;
}

export default function ConversationListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading, isError, isRefetching, refetch } = useConversations();
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<'all' | 'unread' | 'important'>('all');

  const conversations = useMemo<ConversationItem[]>(() => data?.data ?? [], [data?.data]);
  const filteredConversations = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();
    const sorted = [...conversations].sort((a, b) => {
      const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return bTime - aTime;
    });

    if (!normalizedQuery) {
      return sorted.filter((item) => {
        if (mode === 'unread') {
          return (item.unread_count ?? 0) > 0;
        }
        if (mode === 'important') {
          return (item.unread_count ?? 0) > 0;
        }
        return true;
      });
    }

    return sorted.filter((item) => {
      const haystack = `${item.counterparty_name ?? ''} ${item.task_title ?? ''}`.toLowerCase();
      const matchesQuery = haystack.includes(normalizedQuery);
      const matchesMode =
        mode === 'all' ||
        mode === 'important' ||
        (mode === 'unread' && (item.unread_count ?? 0) > 0);

      return matchesQuery && matchesMode;
    });
  }, [conversations, mode, search]);

  const formatTimestamp = useCallback((value?: string) => {
    if (!value) return '';
    const timestamp = new Date(value);
    const diff = Date.now() - timestamp.getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    if (diff < oneDay) {
      return timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }

    return timestamp.toLocaleDateString();
  }, []);

  const filterBar = (
    <View style={styles.headerShell}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>{t('shared.inbox.title', 'Мессеж')}</Text>
        <Pressable style={styles.headerIconButton} accessibilityRole="button">
          <Search size={20} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.chipRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setMode('all')}
          style={[styles.chip, mode === 'all' && styles.chipActive]}
        >
          <Text style={[styles.chipLabel, mode === 'all' && styles.chipLabelActive]}>
            {t('shared.inbox.all', 'Бүх мессеж')}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setMode('unread')}
          style={[styles.chip, mode === 'unread' && styles.chipActive]}
        >
          <Text style={[styles.chipLabel, mode === 'unread' && styles.chipLabelActive]}>
            {t('shared.inbox.unread', 'Уншаагүй')}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setMode('important')}
          style={[styles.chip, mode === 'important' && styles.chipActive]}
        >
          <Text style={[styles.chipLabel, mode === 'important' && styles.chipLabelActive]}>
            {t('shared.inbox.important', 'Чухал')}
          </Text>
        </Pressable>
      </View>

      <View style={styles.searchShell}>
        <Search size={18} color={colors.textTertiary} />
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder={t('shared.inbox.searchPlaceholder', 'Хайх...')}
          placeholderTextColor={colors.textTertiary}
          style={styles.searchInput}
          testID="conversation-search-input"
        />
      </View>
    </View>
  );

  const renderItem = useCallback(
    (item: ConversationItem) => {
      const title =
        item.counterparty_name ?? item.task_title ?? t('messaging.taskDiscussion', 'Чат');
      const isUnread = (item.unread_count ?? 0) > 0;
      return (
        <Pressable
          testID={`conversation-row-${item.id}`}
          style={[styles.row, isUnread ? styles.rowUnread : styles.rowRead]}
          onPress={() => router.push(`/inbox/${item.id}`)}
          accessibilityRole="button"
        >
          <View style={styles.avatarShell}>
            <ProfileAvatar uri={item.counterparty_avatar_url ?? undefined} name={title} size="md" />
          </View>
          <View style={styles.content}>
            <View style={styles.topRow}>
              <Text style={[styles.name, isUnread && styles.nameUnread]} numberOfLines={1}>
                {title}
              </Text>
              {item.last_message_at && (
                <Text style={[styles.timestamp, isUnread && styles.timestampUnread]}>
                  {formatTimestamp(item.last_message_at)}
                </Text>
              )}
            </View>
            {item.last_message_preview && (
              <Text style={styles.preview} numberOfLines={1}>
                {item.last_message_preview}
              </Text>
            )}
          </View>
          {isUnread && (
            <View style={styles.unreadDotWrap}>
              <View style={styles.unreadDot} />
            </View>
          )}
        </Pressable>
      );
    },
    [formatTimestamp, router, t],
  );

  return (
    <FeedListTemplate
      testID="conversation-list"
      data={filteredConversations}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      isLoading={isLoading}
      isError={isError}
      isEmpty={filteredConversations.length === 0}
      onRefresh={refetch}
      isRefreshing={isRefetching}
      onRetry={refetch}
      emptyTitle={t('shared.inbox.emptyTitle', 'Мессеж байхгүй')}
      emptyDescription={t(
        'shared.inbox.emptyDescription',
        'Захиалга хийсний дараа энд мессежүүд харагдана',
      )}
      errorMessage={t('shared.inbox.errorMessage', 'Мессежүүдийг ачаалж чадсангүй')}
      retryLabel={t('shared.inbox.retry', 'Дахин оролдох')}
      filterBar={filterBar}
    />
  );
}

const styles = StyleSheet.create({
  headerShell: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipLabel: {
    fontSize: typography.label,
    color: colors.foreground,
    fontWeight: '600',
  },
  chipLabelActive: {
    color: colors.primaryForeground,
  },
  searchShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...elevations.card,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.body,
    color: colors.foreground,
    paddingVertical: 0,
  },
  headerTitle: {
    fontSize: typography.heading,
    fontWeight: '800',
    color: colors.primaryDeep,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  rowUnread: {
    backgroundColor: colors.muted,
  },
  rowRead: {
    backgroundColor: colors.background,
  },
  avatarShell: {
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.foreground,
    flex: 1,
    marginRight: spacing.sm,
  },
  nameUnread: {
    color: colors.primaryDeep,
    fontWeight: '700',
  },
  timestamp: {
    fontSize: typography.micro,
    color: colors.mutedForeground,
  },
  timestampUnread: {
    color: colors.primaryDeep,
    fontWeight: '700',
  },
  preview: {
    fontSize: typography.label,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  unreadDotWrap: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
  },
});
