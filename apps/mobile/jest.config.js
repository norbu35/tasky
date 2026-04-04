module.exports = {
    preset: "jest-expo",
    setupFilesAfterEnv: [
        "@testing-library/jest-native/extend-expect",
        "<rootDir>/jest.setup.ts",
    ],
    testMatch: ["**/__tests__/**/*.test.ts?(x)"],
    transformIgnorePatterns: [
        "node_modules/(?!(?:.pnpm/)?((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@tasky/sdk))"
    ]
};
