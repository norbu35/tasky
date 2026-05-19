import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { useAppContext } from '../../context/AppContext';
import { useAdminApiClient } from '../../lib/adminApiClient';
import type { User, Message } from '../../lib/apiClient';
import { formatDateTime } from '../../lib/formatDate';

export function AdminUsersPage() {
  const { t } = useTranslation();
  const { session } = useAppContext();
  const adminApiClient = useAdminApiClient();

  // ── Search state ─────────────────────────────────────────────────
  const [phone, setPhone] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // ── Ban dialog state ─────────────────────────────────────────────
  const [banTarget, setBanTarget] = useState<User | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banBusy, setBanBusy] = useState(false);

  // ── Flagged messages state ───────────────────────────────────────
  const [flaggedMessages, setFlaggedMessages] = useState<Message[]>([]);
  const [flaggedLoading, setFlaggedLoading] = useState(false);
  const [flaggedError, setFlaggedError] = useState<string | null>(null);
  const [flaggedLoaded, setFlaggedLoaded] = useState(false);

  // ── Search handler ───────────────────────────────────────────────
  const doSearch = useCallback(async () => {
    if (!session) return;
    setSearchLoading(true);
    setSearchError(null);
    setHasSearched(true);
    try {
      const result = await adminApiClient.adminSearchUsers(session.accessToken, phone);
      setUsers(result.data);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : t('admin.users.searchError'));
    } finally {
      setSearchLoading(false);
    }
  }, [adminApiClient, session, phone, t]);

  // ── Ban handler ──────────────────────────────────────────────────
  const handleBan = async () => {
    if (!banTarget || !session) return;
    setBanBusy(true);
    try {
      const updated = await adminApiClient.adminBanUser(
        session.accessToken,
        banTarget.id,
        banReason,
      );
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast.success(t('admin.users.banSuccess'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('admin.users.banError'));
    } finally {
      setBanBusy(false);
      setBanTarget(null);
      setBanReason('');
    }
  };

  // ── Unban handler ────────────────────────────────────────────────
  const handleUnban = async (userId: string) => {
    if (!session) return;
    try {
      const updated = await adminApiClient.adminUnbanUser(session.accessToken, userId);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast.success(t('admin.users.unbanSuccess'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('admin.users.unbanError'));
    }
  };

  // ── Fetch flagged messages ───────────────────────────────────────
  const fetchFlagged = useCallback(async () => {
    if (!session) return;
    setFlaggedLoading(true);
    setFlaggedError(null);
    try {
      const result = await adminApiClient.adminListFlaggedMessages(session.accessToken);
      setFlaggedMessages(result.data);
    } catch (err) {
      setFlaggedError(err instanceof Error ? err.message : t('admin.users.loadFlaggedError'));
    } finally {
      setFlaggedLoading(false);
      setFlaggedLoaded(true);
    }
  }, [adminApiClient, session, t]);

  const [activeTab, setActiveTab] = useState('search');

  useEffect(() => {
    if (activeTab === 'flagged' && !flaggedLoaded) {
      fetchFlagged();
    }
  }, [activeTab, flaggedLoaded, fetchFlagged]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        {t('admin.users.title')}
      </h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="search">{t('admin.users.searchTab')}</TabsTrigger>
          <TabsTrigger value="flagged">{t('admin.users.flaggedTab')}</TabsTrigger>
        </TabsList>

        {/* ── Search Users Tab ─────────────────────────────────────── */}
        <TabsContent value="search">
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-2 mb-6">
                <Input
                  placeholder={t('admin.users.phonePlaceholder')}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <Button onClick={doSearch} disabled={searchLoading}>
                  {t('admin.users.search')}
                </Button>
              </div>

              {searchLoading && (
                <div data-testid="users-loading" className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              )}

              {searchError && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <p className="text-body-sm text-destructive">{t('admin.users.searchError')}</p>
                  <Button variant="outline" size="sm" onClick={doSearch}>
                    {t('admin.users.retry')}
                  </Button>
                </div>
              )}

              {!searchLoading && !searchError && hasSearched && users.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-body-sm text-muted-foreground">{t('admin.users.noResults')}</p>
                </div>
              )}

              {!searchLoading && !searchError && users.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-border/40">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/40 bg-muted/30">
                        <th className="px-4 py-3 text-left text-label font-medium uppercase tracking-caps text-muted-foreground">
                          {t('admin.users.colPhone')}
                        </th>
                        <th className="px-4 py-3 text-left text-label font-medium uppercase tracking-caps text-muted-foreground">
                          {t('admin.users.colRole')}
                        </th>
                        <th className="px-4 py-3 text-left text-label font-medium uppercase tracking-caps text-muted-foreground">
                          {t('admin.users.colStatus')}
                        </th>
                        <th className="px-4 py-3 text-left text-label font-medium uppercase tracking-caps text-muted-foreground">
                          {t('admin.users.colCreated')}
                        </th>
                        <th className="px-4 py-3 text-left text-label font-medium uppercase tracking-caps text-muted-foreground">
                          {t('admin.users.colActions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr
                          key={user.id}
                          className="border-b border-border/30 last:border-0 transition-colors hover:bg-muted/20"
                          data-testid={`user-row-${user.id}`}
                        >
                          <td className="px-4 py-3 text-body-sm font-medium">
                            {user.phone ?? '—'}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-badge-text">
                              {user.role}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {user.status === 'BANNED' ? (
                              <Badge variant="destructive" className="uppercase tracking-caps">
                                {user.status}
                              </Badge>
                            ) : user.status === 'ACTIVE' ? (
                              <Badge variant="verified" className="uppercase tracking-caps">
                                {user.status}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="uppercase tracking-caps">
                                {user.status}
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-body-sm text-muted-foreground">
                            {formatDateTime(user.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            {user.status === 'BANNED' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnban(user.id)}
                              >
                                {t('admin.users.unban')}
                              </Button>
                            ) : (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setBanTarget(user)}
                              >
                                {t('admin.users.ban')}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Flagged Messages Tab ─────────────────────────────────── */}
        <TabsContent value="flagged">
          {flaggedLoading && (
            <div data-testid="flagged-loading" className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {flaggedError && (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-8">
                <p className="text-body-sm text-destructive">{flaggedError}</p>
                <Button variant="outline" size="sm" onClick={fetchFlagged}>
                  {t('admin.users.retry')}
                </Button>
              </CardContent>
            </Card>
          )}

          {!flaggedLoading && !flaggedError && flaggedLoaded && flaggedMessages.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-body-sm text-muted-foreground">{t('admin.users.noFlagged')}</p>
              </CardContent>
            </Card>
          )}

          {!flaggedLoading && !flaggedError && flaggedMessages.length > 0 && (
            <div className="space-y-3">
              {flaggedMessages.map((msg) => (
                <Card key={msg.id} data-testid={`flagged-msg-${msg.id}`}>
                  <CardHeader className="p-4 pb-2">
                    <p className="text-body-sm">{msg.content}</p>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-badge-text text-muted-foreground">
                      {t('admin.users.sender')}: {msg.sender_id} &middot;{' '}
                      {formatDateTime(msg.sent_at)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Ban Confirmation Dialog ──────────────────────────────── */}
      <Dialog
        open={banTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setBanTarget(null);
            setBanReason('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.users.banDialogTitle')}</DialogTitle>
            <DialogDescription>{t('admin.users.banDialogDesc')}</DialogDescription>
          </DialogHeader>
          <Input
            placeholder={t('admin.users.banReasonPlaceholder')}
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
          />
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setBanTarget(null);
                setBanReason('');
              }}
              disabled={banBusy}
            >
              {t('admin.users.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleBan}
              disabled={banBusy || !banReason.trim()}
            >
              {t('admin.users.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
