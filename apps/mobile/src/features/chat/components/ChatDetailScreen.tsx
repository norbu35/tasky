import { Client } from '@stomp/stompjs';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import SockJS from 'sockjs-client';

import { mobileTheme } from '../../../design/tokenAdapter';
import { buildBaseUrl, createMobileApiClient, Message } from '../../../lib/mobileApiClient';
import { useAuthStore } from '../../../store/authStore';

const { colors, spacing } = mobileTheme;

// Base URL resolved from globalThis.__TASKY_API_BASE_URL__ (falls back to localhost:8080).
const API_BASE_URL = buildBaseUrl();

export function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session, profile } = useAuthStore();
  const { t } = useTranslation();

  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const stompClientRef = useRef<Client | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const loadMessages = useCallback(async () => {
    if (!session || !id) return;
    try {
      const client = createMobileApiClient();
      const res = await client.listMessages(session.accessToken, id);
      setMessages(res.data);
    } catch (err) {
      console.error(t('shared.inbox.errorMessages'), err);
    } finally {
      setIsLoading(false);
    }
  }, [session, id, t]);

  useEffect(() => {
    loadMessages();

    if (id && session) {
      const socketUrl = `${API_BASE_URL.replace('/api/v1', '')}/ws`;

      const client = new Client({
        webSocketFactory: () => new SockJS(socketUrl),
        connectHeaders: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        onConnect: () => {
          console.log(t('ChatDetailScreen.copy1'));
          client.subscribe(`/topic/conversations/${id}`, (msg) => {
            const newMsg = JSON.parse(msg.body) as Message;
            setMessages((prev) => [...prev, newMsg]);
          });
        },
        onStompError: (err) => console.error(t('ChatDetailScreen.copy2'), err),
      });

      client.activate();
      stompClientRef.current = client;

      return () => {
        client.deactivate();
      };
    }
  }, [id, loadMessages, session, t]);

  const sendMessage = async () => {
    if (!session || !id || draft.trim().length === 0) return;

    const payload = draft.trim();
    setDraft('');

    try {
      const client = createMobileApiClient();
      const sent = await client.sendMessage(session.accessToken, id, payload);
      setMessages((prev) => [...prev, sent]);
    } catch (err) {
      console.error(t('ChatDetailScreen.copy3'), err);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{t('chat.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('chat.title')}</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <FlatList
        style={{ flex: 1 }}
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => item.id || index.toString()}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const isMe = item.sender_id === profile?.id;
          return (
            <View
              style={[
                styles.messageBubbleWrapper,
                isMe ? styles.messageBubbleRight : styles.messageBubbleLeft,
              ]}
            >
              <View style={[styles.messageBubble, isMe ? styles.messageMe : styles.messageThem]}>
                <Text
                  style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextThem]}
                >
                  {item.content}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.inputBox}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder={t('chat.placeholder')}
          placeholderTextColor={colors.mutedForeground}
        />
        <TouchableOpacity
          style={styles.sendBtn}
          onPress={sendMessage}
          disabled={draft.trim().length === 0}
        >
          <Text style={styles.sendBtnText}>{t('chat.send')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 60,
  },
  backText: {
    color: colors.primary,
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.cardForeground,
  },
  headerRightPlaceholder: {
    width: 60,
  },
  messageList: {
    padding: 16,
    paddingBottom: 24,
  },
  messageBubbleWrapper: {
    alignSelf: 'stretch',
    marginBottom: 12,
    flexDirection: 'row',
  },
  messageBubbleRight: {
    justifyContent: 'flex-end',
  },
  messageBubbleLeft: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: 20,
  },
  messageMe: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  messageThem: {
    backgroundColor: colors.muted,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextMe: {
    color: colors.primaryForeground,
  },
  messageTextThem: {
    color: colors.foreground,
  },
  inputBox: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 12,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.muted + '40',
    borderRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.foreground,
    maxHeight: 100,
  },
  sendBtn: {
    marginLeft: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 20,
    justifyContent: 'center',
  },
  sendBtnText: {
    color: colors.primaryForeground,
    fontWeight: 'bold',
    fontSize: 15,
  },
});
