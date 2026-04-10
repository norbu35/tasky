// apps/mobile/.eslintrc.cjs
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
            // Screen-level rules (Phase 2: warnings, Phase 3: errors)
            files: ["src/app/**/*.{ts,tsx}"],
            rules: {
                "no-restricted-imports": ["warn", {
                    paths: [
                        {
                            name: "react-native",
                            importNames: ["SafeAreaView", "TextInput", "TouchableOpacity", "TouchableHighlight", "TouchableWithoutFeedback", "Pressable"],
                            message: "Use shared primitives (ScreenContainer, Input, Button, Touchable, PressableCard) instead of raw RN components."
                        }
                    ]
                }],
                "no-restricted-syntax": ["warn",
                    {
                        selector: "CallExpression[callee.object.name='StyleSheet'][callee.property.name='create']",
                        message: "Screens must use NativeWind className instead of StyleSheet.create. See docs/superpowers/specs/2026-04-08-mobile-ui-centralization-design.md"
                    },
                    {
                        selector: "Property[key.name='fontSize'][value.type!='MemberExpression']",
                        message: "Use typography classes (text-body, font-screen-card-title, etc.) instead of inline fontSize. See apps/mobile/src/design/tailwind-screen-typography.ts"
                    }
                ]
            }
        },
        {
            // Escape hatches for known false positives
            files: ["src/app/(tabs)/_layout.tsx"],
            rules: {
                "no-restricted-imports": "off"
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
