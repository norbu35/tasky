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
            files: ["src/app/**/*.{ts,tsx}"],
            rules: {
                "no-restricted-imports": ["error", {
                    paths: [{
                        name: "react-native",
                        importNames: ["SafeAreaView", "TextInput", "TouchableOpacity", "TouchableHighlight", "TouchableWithoutFeedback"],
                        message: "Use shared shells/primitives (`ScreenContainer`, `Input`, `Pressable`) instead of route-local primitives."
                    }]
                }]
            }
        },
        {
            files: ["src/app/(auth)/otp.tsx"],
            rules: {
                "no-restricted-imports": "off"
            }
        },
        {
            files: ["__tests__/**/*.{ts,tsx}"],
            rules: {
                "@typescript-eslint/no-require-imports": "off"
            }
        }
    ]
};
