import { render, screen } from "@testing-library/react-native";
import App from "../App";

describe("App", () => {
  it("TID-TASK-000-MOBILE-UNIT renders the Tasky mobile scaffold", () => {
    render(<App />);
    expect(screen.getByText("Tasky Mobile")).toBeTruthy();
    expect(screen.getByText("Expo scaffold is ready.")).toBeTruthy();
  });
});
