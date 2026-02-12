import type { paths } from "@tasky/sdk";
import { Button } from "./components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";

export function App() {
  const typedContractLoaded: boolean = typeof ({} as paths) === "object";

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/30 px-6 py-10">
      <section className="mx-auto grid max-w-3xl gap-6">
        <Card className="border-border/70 shadow-xl shadow-foreground/5">
          <CardHeader className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Tasky Web Intake
            </p>
            <CardTitle>Post A Domestic Task</CardTitle>
            <CardDescription>
              Shadcn component baseline is active. OpenAPI SDK binding loaded:{" "}
              {String(typedContractLoaded)}.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" placeholder="Apartment cleaning" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="budget">Budget (MNT)</Label>
              <Input id="budget" inputMode="numeric" placeholder="120000" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="details">Task details</Label>
              <Textarea
                id="details"
                placeholder="1-bedroom apartment, vacuum and bathroom cleaning needed."
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-3">
            <Button variant="secondary">Save Draft</Button>
            <Button>Continue</Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}
