import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from "../../components/ui/card";

export function LoadingCard({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/30 px-4 py-8 sm:px-6">
      <section className="mx-auto grid w-full max-w-xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading</CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
        </Card>
      </section>
    </main>
  );
}
