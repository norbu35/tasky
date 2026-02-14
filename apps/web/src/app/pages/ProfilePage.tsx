import {useEffect, useState} from "react";
import {Button} from "../../components/ui/button";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "../../components/ui/card";
import {Input} from "../../components/ui/input";
import {Label} from "../../components/ui/label";
import {useAppContext} from "../context/AppContext";
import {ScreenFrame} from "../layout/ScreenFrame";
import {parseError} from "../utils/errorHandling";

export function ProfilePage() {
  const {
    apiClient,
    session,
    profile,
    profileError,
    setProfile,
    setProfileError,
    refreshProfile,
    updateSessionUser
  } = useAppContext();

  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [contentType, setContentType] = useState<"image/jpeg" | "image/png" | "image/webp">("image/png");
  const [generatedStorageKey, setGeneratedStorageKey] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setAvatarUrl(profile?.avatar_url ?? "");
  }, [profile]);

  const generateAvatarUploadUrl = async (): Promise<void> => {
    if (!session) {
      return;
    }
    setWorking(true);
    setSuccessMessage(null);
    setProfileError(null);
    try {
      const response = await apiClient.getAvatarUploadUrl(session.accessToken, contentType);
      setGeneratedStorageKey(response.storageKey);
      setAvatarUrl(`https://cdn.tasky.local/${response.storageKey}`);
      setSuccessMessage("Avatar upload slot issued. Upload the file to the returned URL, then save profile.");
    } catch (error) {
      setProfileError(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  const saveProfile = async (): Promise<void> => {
    if (!session) {
      return;
    }

    setWorking(true);
    setSuccessMessage(null);
    setProfileError(null);
    try {
      const updated = await apiClient.updateMyProfile(session.accessToken, {
        full_name: fullName.trim(),
        avatar_url: avatarUrl.trim().length > 0 ? avatarUrl.trim() : null
      });
      setProfile(updated);
      setSuccessMessage("Profile saved.");
    } catch (error) {
      setProfileError(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  const activateTaskerRole = async (): Promise<void> => {
    if (!session) {
      return;
    }

    setWorking(true);
    setSuccessMessage(null);
    setProfileError(null);
    try {
      const user = await apiClient.activateTaskerRole(session.accessToken);
      updateSessionUser(user);
      await refreshProfile();
      setSuccessMessage("Tasker role activated.");
    } catch (error) {
      setProfileError(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  return (
    <ScreenFrame>
      <Card className="border-border/70 shadow-xl shadow-foreground/5">
        <CardHeader>
          <CardTitle>Profile setup and updates</CardTitle>
          <CardDescription>
            Status: <span className="font-medium">{profile?.status ?? "UNKNOWN"}</span> | Role:{" "}
            <span className="font-medium">{profile?.role ?? "UNKNOWN"}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="full-name">Full name</Label>
            <Input
              id="full-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Бат-Эрдэнэ"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="avatar-content-type">Avatar content type</Label>
            <select
              id="avatar-content-type"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={contentType}
              onChange={(event) => {
                setContentType(event.target.value as "image/jpeg" | "image/png" | "image/webp");
              }}
            >
              <option value="image/png">image/png</option>
              <option value="image/jpeg">image/jpeg</option>
              <option value="image/webp">image/webp</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="avatar-url">Avatar URL</Label>
            <Input
              id="avatar-url"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              placeholder="https://cdn.tasky.local/uploads/..."
            />
          </div>
          {generatedStorageKey ? (
            <p className="text-sm text-muted-foreground">Issued avatar storage key: {generatedStorageKey}</p>
          ) : null}
          {profileError ? <p className="text-sm text-destructive">{profileError}</p> : null}
          {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}
        </CardContent>
        <CardFooter className="flex flex-wrap justify-end gap-3">
          <Button disabled={working} onClick={generateAvatarUploadUrl} variant="secondary">
            Generate avatar upload URL
          </Button>
          <Button disabled={working} onClick={saveProfile}>
            Save profile
          </Button>
          {profile?.role === "CUSTOMER" ? (
            <Button disabled={working} onClick={activateTaskerRole} variant="ghost">
              Activate tasker role
            </Button>
          ) : null}
        </CardFooter>
      </Card>
    </ScreenFrame>
  );
}
