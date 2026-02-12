import { render, screen } from "@testing-library/react";
import { App } from "./App";

describe("App", () => {
  it("TID-TASK-000-WEB-UNIT renders the Tasky web scaffold", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Tasky Web" })).toBeInTheDocument();
    expect(screen.getByText(/OpenAPI SDK binding loaded:/)).toBeInTheDocument();
  });
});
