import type { paths } from "@tasky/sdk";

export function App() {
  const typedContractLoaded: boolean = typeof ({} as paths) === "object";

  return (
    <main className="shell">
      <h1>Tasky Web</h1>
      <p>React web scaffold is ready.</p>
      <p>OpenAPI SDK binding loaded: {String(typedContractLoaded)}</p>
    </main>
  );
}
