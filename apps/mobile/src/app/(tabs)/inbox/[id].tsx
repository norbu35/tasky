import React, { useCallback, useRef, useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMessages } from '../../../features/chat/hooks/useMessages';
import { useSendMessage } from '../../../features/chat/hooks/useSendMessage';
import { useAuthStore } from '../../../store/authStore';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

const PHONE_REGEX = /(\+?976)?[\s-]?\d{4}[\s-]?\d{4}|\d{8,}/;

interface MessageItem {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
}

export default function ChatDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { t } = useTranslation();
    const profile = useAuthStore((s) => s.profile);
    const myId = profile?.id;

    const { data, isLoading, isError, refetch } = useMessages(id ?? '');
    const { mutate: sendMessage, isPending } = useSendMessage();

    const [draft, setDraft] = useState('');
    const flatListRef = useRef<FlatList>(null);

    const messages: MessageItem[] = data?.data ?? [];
    const showPhoneWarning = PHONE_REGEX.test(draft);

    const handleSend = useCallback(() => {
        if (!id || draft.trim().length === 0) return;
        sendMessage({ conversationId: id, content: draft.trim() });
        setDraft('');
    }, [id, draft, sendMessage]);

    const renderMessage = useCallback(
        ({ item }: { item: MessageItem }) => {
            const isMine = item.sender_id === myId;
            return (
                <View
                    testID={`message-bubble-${item.id}`}
                    style={[styles.bubbleWrapper, isMine ? styles.bubbleRight : styles.bubbleLeft]}
                >
                    <View
                        testID={isMine ? `message-sent-${item.id}` : `message-received-${item.id}`}
                        style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}
                    >
                        <Text style={[styles.messageText, isMine ? styles.textMine : styles.textTheirs]}>
                            {item.content}
                        </Text>
                    </View>
                </View>
            );
        },
        [myId],
    );

    if (isLoading) {
        return (
            <View style={styles.center} testID="chat-loading">
                <Text style={styles.loadingText}>{t('common.loading', 'Loading...')}</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            testID="chat-detail"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backText}>{t('common.back', 'Back')}</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('chat.title', 'Chat')}</Text>
                <View style={{ width: 60 }} />
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.messageList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {showPhoneWarning && (
                <View testID="phone-warning" style={styles.phoneWarning}>
                    <Text style={styles.phoneWarningText}>
                        {t('shared.inbox.phoneWarning')}
                    </Text>
                </View>
            )}

            <View style={styles.inputBar}>
                <TextInput
                    testID="chat-input"
                    style={styles.input}
                    value={draft}
                    onChangeText={setDraft}
                    placeholder={t('shared.inbox.sendPlaceholder', 'Type a message...')}
                    placeholderTextColor={colors.mutedForeground}
                    maxLength={500}
                    multiline
                />
                <TouchableOpacity
                    testID="chat-send-button"
                    style={[styles.sendBtn, draft.trim().length === 0 && styles.sendBtnDisabled]}
                    onPress={handleSend}
                    disabled={draft.trim().length === 0 || isPending}
                >
                    <Text style={styles.sendBtnText}>{t('chat.send', 'Send')}</Text>
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
        backgroundColor: colors.background,
    },
    loadingText: {
        color: colors.mutedForeground,
        fontSize: typography.body,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingBottom: spacing.md,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backBtn: {
        width: 60,
    },
    backText: {
        color: colors.primary,
        fontSize: typography.body,
    },
    headerTitle: {
        fontSize: typography.title,
        fontWeight: '600',
        color: colors.foreground,
    },
    messageList: {
        padding: spacing.md,
        paddingBottom: spacing.xl,
    },
    bubbleWrapper: {
        width: '100%',
        marginBottom: spacing.sm,
        flexDirection: 'row',
    },
    bubbleRight: {
        justifyContent: 'flex-end',
    },
    bubbleLeft: {
        justifyContent: 'flex-start',
    },
    bubble: {
        maxWidth: '75%',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 20,
    },
    bubbleMine: {
        backgroundColor: colors.primary,
        borderBottomRightRadius: 4,
    },
    bubbleTheirs: {
        backgroundColor: colors.muted,
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: typography.body,
        lineHeight: 20,
    },
    textMine: {
        color: colors.primaryForeground,
    },
    textTheirs: {
        color: colors.foreground,
    },
    phoneWarning: {
        backgroundColor: colors.secondary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    phoneWarningText: {
        fontSize: typography.label,
        color: colors.foreground,
        textAlign: 'center',
    },
    inputBar: {
        flexDirection: 'row',
        padding: spacing.sm,
        paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.sm,
        backgroundColor: colors.card,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: colors.muted,
        borderRadius: 20,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontSize: typography.body,
        color: colors.foreground,
        maxHeight: 100,
    },
    sendBtn: {
        marginLeft: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.primary,
        borderRadius: 20,
        justifyContent: 'center',
    },
    sendBtnDisabled: {
        opacity: 0.5,
    },
    sendBtnText: {
        color: colors.primaryForeground,
        fontWeight: '700',
        fontSize: typography.body,
    },
});
