import { Client } from '@stomp/stompjs';
import { Bell, BellOff, MessageSquareText, Search, Send } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SockJS from 'sockjs-client';
import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAppContext } from '../context/AppContext';
import { ScreenFrame } from '../layout/ScreenFrame';
import { buildSocketBaseUrl, type Conversation, type Message } from '../lib/apiClient';
import { parseError } from '../lib/errorHandling';

function orderMessagesChronologically(messages: Message[]): Message[] {
  return [...messages].sort((a, b) => {
    const timeDelta = new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime();
    if (timeDelta !== 0) {
      return timeDelta;
    }
    return a.id.localeCompare(b.id);
  });
}

function upsertMessage(messages: Message[], message: Message): Message[] {
  const byId = new Map(messages.map((item) => [item.id, item]));
  byId.set(message.id, message);
  return Array.from(byId.values());
}

export function MessagingNotificationsPage() {
  const { apiClient, session, profile } = useAppContext();
  const { t } = useTranslation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // UI states
  const [messageDraft, setMessageDraft] = useState('');
  const [pushEnabled, setPushEnabled] = useState(false);
  const [working, setWorking] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const stompClientRef = useRef<Client | null>(null);

  const loadConversations = useCallback(async (): Promise<void> => {
    if (!session) return;
    setWorking(true);
    try {
      const response = await apiClient.listConversations(session.accessToken);
      setConversations(response.data);
      if (!selectedConvId && response.data.length > 0) {
        setSelectedConvId(response.data[0].id);
      }
    } catch (error) {
      toast.error(parseError(error));
    } finally {
      setWorking(false);
    }
  }, [apiClient, session, selectedConvId]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  const loadMessages = useCallback(
    async (convId: string): Promise<void> => {
      if (!session) return;
      setWorking(true);
      try {
        const response = await apiClient.listMessages(session.accessToken, convId);
        setMessages(response.data);
        scrollToBottom();
      } catch (error) {
        toast.error(parseError(error));
      } finally {
        setWorking(false);
      }
    },
    [apiClient, session],
  );

  useEffect(() => {
    if (selectedConvId && session) {
      void loadMessages(selectedConvId);

      if (import.meta.env.MODE === 'test') {
        return;
      }

      const socketUrl = buildSocketBaseUrl();

      const client = new Client({
        webSocketFactory: () => new SockJS(socketUrl),
        connectHeaders: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        onConnect: () => {
          client.subscribe(`/topic/conversations/${selectedConvId}`, (msg) => {
            try {
              const newMsg = JSON.parse(msg.body) as Message;
              setMessages((prev) => upsertMessage(prev, newMsg));
              scrollToBottom();
            } catch {
              /* no-op */
            }
          });
        },
        onStompError: () => {},
      });

      client.activate();
      stompClientRef.current = client;

      return () => {
        client.deactivate();
      };
    }
  }, [selectedConvId, loadMessages, session]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendMessage = async (e?: React.FormEvent): Promise<void> => {
    e?.preventDefault();
    if (!session || !selectedConvId || messageDraft.trim().length < 1) return;
    setWorking(true);
    try {
      const sent = await apiClient.sendMessage(
        session.accessToken,
        selectedConvId,
        messageDraft.trim(),
      );
      setMessages((prev) => upsertMessage(prev, sent));
      setMessageDraft('');
      scrollToBottom();
    } catch (error) {
      toast.error(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  const handlePushToggle = async (checked: boolean) => {
    if (!session) return;
    setPushEnabled(checked);
    setWorking(true);
    try {
      if (checked) {
        toast.success(t('messaging.pushEnabled'));
      } else {
        toast.success(t('messaging.pushDisabled'));
      }
    } catch (error) {
      toast.error(parseError(error));
      setPushEnabled(!checked);
    } finally {
      setWorking(false);
    }
  };

  const selectedConvData = conversations.find((c) => c.id === selectedConvId);
  const bookingId = (selectedConvData as Record<string, unknown> | undefined)?.['booking_id'] as
    | string
    | undefined;

  return (
    <ScreenFrame>
      <div className="h-[calc(100vh-140px)] flex flex-col items-center">
        <div className="w-full flex items-center justify-between mb-4">
          <h1 className="text-2xl font-display font-bold">{t('messaging.inboxTitle')}</h1>
          <button
            type="button"
            aria-label={t('messaging.notificationsLabel')}
            onClick={() => void handlePushToggle(!pushEnabled)}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            {pushEnabled ? (
              <Bell className="w-5 h-5 text-primary" />
            ) : (
              <BellOff className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </div>

        <p className="w-full mb-4 text-sm text-muted-foreground">
          {t('messaging.pushDescription')}
        </p>

        <div className="w-full flex-1 border rounded-lg overflow-hidden bg-card flex shadow-sm">
          {/* Sidebar / Left Pane */}
          <div className="w-full md:w-80 border-r flex flex-col bg-muted/20 flex-shrink-0">
            <div className="p-4 border-b bg-card">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="w-full pl-9 bg-background"
                  placeholder={t('messaging.searchPlaceholder')}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                  <MessageSquareText className="w-6 h-6 opacity-20" />
                  {t('messaging.noConversations')}
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`w-full text-left p-4 border-b flex items-start gap-3 transition-colors hover:bg-muted/50 ${selectedConvId === conv.id ? 'bg-muted/80 border-l-2 border-l-primary' : ''}`}
                  >
                    <Avatar className="w-10 h-10 border shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {conv.task_title?.charAt(0) || 'T'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                      <div className="font-medium text-sm truncate">
                        {conv.task_title || t('messaging.taskDiscussion')}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {conv.id.substring(0, 8)}...
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area / Right Pane */}
          <div className="hidden md:flex flex-col flex-1 bg-background relative">
            {selectedConvId ? (
              <>
                <div className="p-4 border-b bg-card/80 backdrop-blur-sm z-10 shadow-sm flex items-center justify-between">
                  <div className="font-medium">
                    {selectedConvData?.task_title || t('messaging.taskChat')}
                  </div>
                  {bookingId && (
                    <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      {t('messaging.bookingPrefix')}
                      {bookingId.substring(0, 6)}...
                    </div>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {orderMessagesChronologically(messages).map((msg, i) => {
                    const isMe = msg.sender_id === profile?.id;
                    return (
                      <div
                        key={msg?.id || i}
                        className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                            isMe
                              ? 'bg-primary text-primary-foreground rounded-tr-sm'
                              : 'bg-muted rounded-tl-sm'
                          }`}
                        >
                          {msg?.content || ''}
                          <div
                            className={`text-caption mt-1 ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'} text-right`}
                          >
                            {msg?.sent_at
                              ? new Date(msg.sent_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-4 bg-muted/20 border-t">
                  <form onSubmit={sendMessage} className="flex gap-2">
                    <Input
                      value={messageDraft}
                      onChange={(e) => setMessageDraft(e.target.value)}
                      placeholder={t('messaging.typeMessagePlaceholder')}
                      className="flex-1 bg-background"
                      disabled={working}
                    />
                    <Button
                      type="submit"
                      disabled={working || !messageDraft.trim()}
                      size="default"
                      className="px-3"
                    >
                      <Send className="w-4 h-4" />
                      <span className="sr-only">{t('messaging.sendAriaLabel')}</span>
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <MessageSquareText className="w-6 h-6 opacity-10 mb-4" />
                <p>{t('messaging.selectConversationPrompt')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ScreenFrame>
  );
}
