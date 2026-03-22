import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAppContext } from "../../context/AppContext";
import type { User, Message } from "../../../lib/apiClient";
import { Card, CardContent } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Skeleton } from "../../../components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";

function formatTimestamp(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function AdminUsersPage() {
  const { t } = useTranslation();
  const { apiClient, session } = useAppContext();

  // ── Search state ─────────────────────────────────────────────────
  const [phone, setPhone] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // ── Ban dialog state ─────────────────────────────────────────────
  const [banTarget, setBanTarget] = useState<User | null>(null);
  const [banReason, setBanReason] = useState("");
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
      const result = await apiClient.adminSearchUsers(session.accessToken, phone);
      setUsers(result.data);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Failed to search users");
    } finally {
      setSearchLoading(false);
    }
  }, [apiClient, session, phone]);

  // ── Ban handler ──────────────────────────────────────────────────
  const handleBan = async () => {
    if (!banTarget || !session) return;
    setBanBusy(true);
    try {
      const updated = await apiClient.adminBanUser(
        session.accessToken,
        banTarget.id,
        banReason
      );
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast.success(t("admin.users.banSuccess", "User banned successfully"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to ban user");
    } finally {
      setBanBusy(false);
      setBanTarget(null);
      setBanReason("");
    }
  };

  // ── Unban handler ────────────────────────────────────────────────
  const handleUnban = async (userId: string) => {
    if (!session) return;
    try {
      const updated = await apiClient.adminUnbanUser(session.accessToken, userId);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast.success(t("admin.users.unbanSuccess", "User unbanned successfully"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to unban user");
    }
  };

  // ── Fetch flagged messages ───────────────────────────────────────
  const fetchFlagged = useCallback(async () => {
    if (!session) return;
    setFlaggedLoading(true);
    setFlaggedError(null);
    try {
      const result = await apiClient.adminListFlaggedMessages(session.accessToken);
      setFlaggedMessages(result.data);
    } catch (err) {
      setFlaggedError(err instanceof Error ? err.message : "Failed to load flagged messages");
    } finally {
      setFlaggedLoading(false);
      setFlaggedLoaded(true);
    }
  }, [apiClient, session]);

  const [activeTab, setActiveTab] = useState("search");

  useEffect(() => {
    if (activeTab === "flagged" && !flaggedLoaded) {
      fetchFlagged();
    }
  }, [activeTab, flaggedLoaded, fetchFlagged]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("admin.users.title", "Users")}</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="search">
            {t("admin.users.searchTab", "Search Users")}
          </TabsTrigger>
          <TabsTrigger value="flagged">
            {t("admin.users.flaggedTab", "Flagged Messages")}
          </TabsTrigger>
        </TabsList>

        {/* ── Search Users Tab ─────────────────────────────────────── */}
        <TabsContent value="search">
          <div className="flex gap-2 mb-4">
            <Input
              placeholder={t("admin.users.phonePlaceholder", "Phone number")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Button onClick={doSearch} disabled={searchLoading}>
              {t("admin.users.search", "Search")}
            </Button>
          </div>

          {searchLoading && (
            <div data-testid="users-loading" className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-5 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {searchError && (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 p-6">
                <p className="text-destructive">
                  {t("admin.users.searchError", "Failed to search users")}
                </p>
                <Button onClick={doSearch}>
                  {t("admin.users.retry", "Retry")}
                </Button>
              </CardContent>
            </Card>
          )}

          {!searchLoading && !searchError && hasSearched && users.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">
                  {t("admin.users.noResults", "No users found")}
                </p>
              </CardContent>
            </Card>
          )}

          {!searchLoading && !searchError && users.length > 0 && (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">
                      {t("admin.users.colPhone", "Phone")}
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      {t("admin.users.colRole", "Role")}
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      {t("admin.users.colStatus", "Status")}
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      {t("admin.users.colCreated", "Created")}
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      {t("admin.users.colActions", "Actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b last:border-0" data-testid={`user-row-${user.id}`}>
                      <td className="px-4 py-3">{user.phone ?? "—"}</td>
                      <td className="px-4 py-3">{user.role}</td>
                      <td className="px-4 py-3">{user.status}</td>
                      <td className="px-4 py-3">{formatTimestamp(user.created_at)}</td>
                      <td className="px-4 py-3">
                        {user.status === "BANNED" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnban(user.id)}
                          >
                            {t("admin.users.unban", "Unban")}
                          </Button>
                        ) : (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setBanTarget(user)}
                          >
                            {t("admin.users.ban", "Ban")}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ── Flagged Messages Tab ─────────────────────────────────── */}
        <TabsContent value="flagged">
          {flaggedLoading && (
            <div data-testid="flagged-loading" className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-5 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {flaggedError && (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 p-6">
                <p className="text-destructive">{flaggedError}</p>
                <Button onClick={fetchFlagged}>
                  {t("admin.users.retry", "Retry")}
                </Button>
              </CardContent>
            </Card>
          )}

          {!flaggedLoading && !flaggedError && flaggedLoaded && flaggedMessages.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">
                  {t("admin.users.noFlagged", "No flagged messages")}
                </p>
              </CardContent>
            </Card>
          )}

          {!flaggedLoading && !flaggedError && flaggedMessages.length > 0 && (
            <div className="space-y-3">
              {flaggedMessages.map((msg) => (
                <Card key={msg.id} data-testid={`flagged-msg-${msg.id}`}>
                  <CardContent className="p-4 space-y-1">
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("admin.users.sender", "Sender")}: {msg.sender_id} &middot; {formatTimestamp(msg.created_at)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Ban Confirmation Dialog ──────────────────────────────── */}
      <Dialog open={banTarget !== null} onOpenChange={(open) => { if (!open) { setBanTarget(null); setBanReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.users.banDialogTitle", "Ban User")}</DialogTitle>
            <DialogDescription>
              {t(
                "admin.users.banDialogDesc",
                "Provide a reason for banning this user. This action can be reversed."
              )}
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder={t("admin.users.banReasonPlaceholder", "Reason for ban")}
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
          />
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => { setBanTarget(null); setBanReason(""); }}
              disabled={banBusy}
            >
              {t("admin.users.cancel", "Cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleBan}
              disabled={banBusy || !banReason.trim()}
            >
              {t("admin.users.confirm", "Confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
