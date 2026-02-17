import {useCallback, useEffect, useState} from "react";
import type {Conversation, Message} from "../../lib/apiClient";
import {Button} from "../../components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "../../components/ui/card";
import {Input} from "../../components/ui/input";
import {Label} from "../../components/ui/label";
import {Textarea} from "../../components/ui/textarea";
import {useAppContext} from "../context/AppContext";
import {ScreenFrame} from "../layout/ScreenFrame";
import {parseError} from "../utils/errorHandling";

export function MessagingNotificationsPage() {
    const {apiClient, session} = useAppContext();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [conversationId, setConversationId] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageDraft, setMessageDraft] = useState("");
    const [deviceToken, setDeviceToken] = useState("");
    const [working, setWorking] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const loadConversations = useCallback(async (): Promise<void> => {
        if (!session) {
            return;
        }
        setWorking(true);
        setStatusMessage(null);
        try {
            const response = await apiClient.listConversations(session.accessToken);
            setConversations(response.data);
            setConversationId((previous) => previous || response.data[0]?.id || "");
            setStatusMessage(`Loaded ${response.data.length} conversation(s).`);
        } catch (error) {
            setStatusMessage(parseError(error));
        } finally {
            setWorking(false);
        }
    }, [apiClient, session]);

    useEffect(() => {
        void loadConversations();
    }, [loadConversations]);

    const loadMessages = async (): Promise<void> => {
        if (!session || !conversationId.trim()) {
            setStatusMessage("Conversation ID is required.");
            return;
        }
        setWorking(true);
        setStatusMessage(null);
        try {
            const response = await apiClient.listMessages(session.accessToken, conversationId.trim());
            setMessages(response.data);
            setStatusMessage(`Loaded ${response.data.length} message(s).`);
        } catch (error) {
            setStatusMessage(parseError(error));
        } finally {
            setWorking(false);
        }
    };

    const sendMessage = async (): Promise<void> => {
        if (!session || !conversationId.trim()) {
            setStatusMessage("Conversation ID is required.");
            return;
        }
        if (messageDraft.trim().length < 1) {
            setStatusMessage("Message content is required.");
            return;
        }
        setWorking(true);
        setStatusMessage(null);
        try {
            const sent = await apiClient.sendMessage(session.accessToken, conversationId.trim(), messageDraft.trim());
            setMessages((previous) => [sent, ...previous]);
            setMessageDraft("");
            setStatusMessage("Message sent.");
        } catch (error) {
            setStatusMessage(parseError(error));
        } finally {
            setWorking(false);
        }
    };

    const registerDevice = async (): Promise<void> => {
        if (!session || !deviceToken.trim()) {
            setStatusMessage("Device token is required.");
            return;
        }
        setWorking(true);
        setStatusMessage(null);
        try {
            const result = await apiClient.registerDevice(session.accessToken, {
                token: deviceToken.trim(),
                platform: "WEB"
            });
            setStatusMessage(result);
        } catch (error) {
            setStatusMessage(parseError(error));
        } finally {
            setWorking(false);
        }
    };

    const unregisterDevice = async (): Promise<void> => {
        if (!session || !deviceToken.trim()) {
            setStatusMessage("Device token is required.");
            return;
        }
        setWorking(true);
        setStatusMessage(null);
        try {
            await apiClient.unregisterDevice(session.accessToken, deviceToken.trim());
            setStatusMessage("Device unregistered.");
        } catch (error) {
            setStatusMessage(parseError(error));
        } finally {
            setWorking(false);
        }
    };

    return (
        <ScreenFrame>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <Card className="border-border/70 shadow-xl shadow-foreground/5">
                    <CardHeader>
                        <CardTitle>Messaging and notifications</CardTitle>
                        <CardDescription>
                            REST fallback messaging and push token registration for booking milestones.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                            <div className="grid gap-2">
                                <Label htmlFor="conversation-id">Conversation ID</Label>
                                <Input
                                    id="conversation-id"
                                    value={conversationId}
                                    onChange={(event) => setConversationId(event.target.value)}
                                    placeholder="conversation-uuid"
                                />
                            </div>
                            <Button disabled={working} onClick={() => void loadConversations()} variant="secondary">
                                Refresh conversations
                            </Button>
                        </div>
                        <div className="flex justify-end">
                            <Button disabled={working || !conversationId.trim()} onClick={() => void loadMessages()}
                                    variant="secondary">
                                Load messages
                            </Button>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="message-content">Message content</Label>
                            <Textarea
                                id="message-content"
                                value={messageDraft}
                                onChange={(event) => setMessageDraft(event.target.value)}
                                placeholder="Send a message to update booking progress."
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button disabled={working || !conversationId.trim()} onClick={() => void sendMessage()}>
                                Send message
                            </Button>
                        </div>
                        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
                            <div className="grid gap-2">
                                <Label htmlFor="push-device-token">Push device token</Label>
                                <Input
                                    id="push-device-token"
                                    value={deviceToken}
                                    onChange={(event) => setDeviceToken(event.target.value)}
                                    placeholder="ExponentPushToken[...] or web token"
                                />
                            </div>
                            <Button disabled={working || !deviceToken.trim()} onClick={() => void registerDevice()}>
                                Register device
                            </Button>
                            <Button
                                disabled={working || !deviceToken.trim()}
                                onClick={() => void unregisterDevice()}
                                variant="secondary"
                            >
                                Unregister device
                            </Button>
                        </div>
                        {statusMessage ? <p className="text-sm text-muted-foreground">{statusMessage}</p> : null}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Conversation snapshot</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        <div>
                            <p className="text-sm font-medium">Conversations</p>
                            {conversations.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No conversations loaded.</p>
                            ) : (
                                conversations.map((conversation) => (
                                    <p className="text-sm text-muted-foreground" key={conversation.id}>
                                        {conversation.id}: {conversation.task_title ?? "Task conversation"}
                                    </p>
                                ))
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-medium">Messages</p>
                            {messages.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No messages loaded.</p>
                            ) : (
                                messages.map((message) => (
                                    <p className="text-sm text-muted-foreground" key={message.id}>
                                        {message.sender_id}: {message.content}
                                    </p>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </ScreenFrame>
    );
}
