import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen } from "@testing-library/react-native";
import App from "../App";
import { mobileTheme } from "../src/design/tokenAdapter";
import { designTokens } from "../../../packages/design-tokens/tokens";

describe("App", () => {
  it("TID-TASK-000-MOBILE-UNIT renders the mobile shell with SDK wiring baseline", () => {
    render(<App />);
    expect(screen.getByText("Tasky Mobile Intake")).toBeTruthy();
    expect(screen.getByText(/Shared token adapter active:/)).toBeTruthy();
    expect(screen.getByText(/Native parity components are ready/)).toBeTruthy();
  });

  it("TID-TASK-071-MOBILE-TOKEN-ADAPTER consumes shared design tokens via adapter", () => {
    expect(mobileTheme.colors.background).toBe(designTokens.colors.background.hex);
    expect(mobileTheme.colors.primary).toBe(designTokens.colors.primary.hex);

    render(<App />);
    expect(screen.getByText("Tasky Mobile Intake")).toBeTruthy();
    expect(screen.getByText(/Shared token adapter active:/)).toBeTruthy();
  });

  it("TID-TASK-071-MOBILE-COMPONENT-PARITY-BASE renders core parity components and states", () => {
    render(<App />);

    const categoryInput = screen.getByLabelText("Category input");
    fireEvent.changeText(categoryInput, "Window cleaning");
    fireEvent.press(screen.getByRole("button", { name: "Preview" }));

    expect(screen.getByText("Task Preview")).toBeTruthy();
    expect(screen.getByText("Category: Window cleaning")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save Draft" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Close" })).toBeTruthy();
  });

  it("TID-TASK-071-MOBILE-STATE-SEMANTIC-PARITY enforces parity matrix documentation linkage", () => {
    const parityMatrix = readFileSync(resolve(process.cwd(), "../../docs/UI_PARITY_MATRIX.md"), "utf8");
    const architectureDoc = readFileSync(resolve(process.cwd(), "../../docs/ARCHITECTURE.md"), "utf8");

    expect(parityMatrix).toContain("Button");
    expect(parityMatrix).toContain("Modal/Sheet");
    expect(architectureDoc).toContain("docs/UI_PARITY_MATRIX.md");
  });
});
