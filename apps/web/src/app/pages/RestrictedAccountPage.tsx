import { Button } from "../../components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "../../components/ui/card";
import { useAppContext } from "../context/AppContext";

export function RestrictedAccountPage() {
  const { profile, signOut } = useAppContext();

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/30 px-4 py-8 sm:px-6">
      <section className="mx-auto grid w-full max-w-xl gap-6">
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle>Account restricted</CardTitle>
            <CardDescription>
              This account is {profile?.status?.toLowerCase() ?? "restricted"}. Contact support for review.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={signOut}>Return to login</Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}
