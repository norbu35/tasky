import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "../../src/components/ui/button";
import { Input } from "../../src/components/ui/input";

describe("Shadcn Primitives", () => {
    it("TID-TASK-070-WEB-SHADCN-PRIMITIVES initializes shadcn primitives under components/ui", () => {
        render(
            <div>
                <Button>Primary Action</Button>
                <Input aria-label="Sample input"/>
            </div>
        );

        expect(screen.getByRole("button", {name: "Primary Action"})).toBeInTheDocument();
        expect(screen.getByLabelText("Sample input")).toBeInTheDocument();
    });
});
