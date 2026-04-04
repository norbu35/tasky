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
                }],
                "no-restricted-syntax": ["error",
                    {
                        selector: "CallExpression[callee.object.name='StyleSheet'][callee.property.name='create'] Property[key.type='Identifier'][key.name=/^(gap|paddingVertical|paddingHorizontal|marginTop|marginBottom|paddingTop|paddingBottom)$/] > Literal[value=/^[0-9]+$/]",
                        message: "Use tokenized spacing (`spacing.*` or `screenRhythm.*`) instead of raw numeric spacing literals in route styles."
                    }
                ]
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
