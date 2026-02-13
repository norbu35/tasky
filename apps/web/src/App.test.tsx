import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { App } from "./App";

describe("App", () => {
  it("TID-TASK-000-WEB-UNIT renders the web shell with SDK wiring baseline", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Post A Domestic Task" })).toBeInTheDocument();
    expect(screen.getByText(/OpenAPI SDK binding loaded:/)).toBeInTheDocument();
    expect(screen.getByLabelText("Category")).toBeInTheDocument();
  });

  it("TID-TASK-070-WEB-SHADCN-PRIMITIVES initializes shadcn primitives under components/ui", () => {
    render(
      <div>
        <Button>Primary Action</Button>
        <Input aria-label="Sample input" />
      </div>
    );

    expect(screen.getByRole("button", { name: "Primary Action" })).toBeInTheDocument();
    expect(screen.getByLabelText("Sample input")).toBeInTheDocument();
  });

  it("TID-TASK-070-WEB-TOKEN-BINDING binds shared tokens to tailwind theme variables", () => {
    const stylesSource = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");
    const sharedTokenSource = readFileSync(
      resolve(process.cwd(), "../../packages/design-tokens/tokens.css"),
      "utf8"
    );
    const tailwindConfigSource = readFileSync(resolve(process.cwd(), "tailwind.config.ts"), "utf8");

    expect(stylesSource).toContain("@import \"../../../packages/design-tokens/tokens.css\"");
    expect(stylesSource).toContain("--background: var(--tasky-color-background);");
    expect(sharedTokenSource).toContain("--tasky-color-primary:");
    expect(tailwindConfigSource).toContain("background: \"hsl(var(--background))\"");
  });

  it("TID-TASK-070-WEB-COMPONENT-USAGE-COMPLIANCE renders intake screen with shadcn components", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Post A Domestic Task" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Draft" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
    expect(screen.getByLabelText("Category")).toBeInTheDocument();
  });
});
