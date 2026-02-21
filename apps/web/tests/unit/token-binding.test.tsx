import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {describe, expect, it} from "vitest";

describe("Token Binding", () => {
    it("TID-TASK-070-WEB-TOKEN-BINDING binds shared tokens to tailwind theme variables", () => {
        const stylesSource = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");
        const sharedTokenSource = readFileSync(
            resolve(process.cwd(), "../../packages/design-tokens/tokens.css"),
            "utf8"
        );
        const tailwindConfigSource = readFileSync(resolve(process.cwd(), "tailwind.config.ts"), "utf8");

        expect(stylesSource).toContain('@import "../../../packages/design-tokens/tokens.css"');
        expect(stylesSource).toContain("--background: var(--tasky-color-background);");
        expect(sharedTokenSource).toContain("--tasky-color-primary:");
        expect(tailwindConfigSource).toContain('background: "hsl(var(--background))"');
    });
});
