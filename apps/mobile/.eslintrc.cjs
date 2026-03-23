module.exports = {
    root: true,
    extends: ["expo"],
    ignorePatterns: [".expo", "dist", "coverage"],
    rules: {
        "@typescript-eslint/no-unused-vars": ["warn", {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
            destructuredArrayIgnorePattern: "^_"
        }]
    },
    overrides: [
        {
            files: ["__tests__/**/*.{ts,tsx}"],
            rules: {
                "@typescript-eslint/no-require-imports": "off"
            }
        }
    ]
};
