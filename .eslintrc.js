/* eslint-env node */
require("@archmagefi/eslint-config")

module.exports = {
    root: true,
    extends: [
        "@archmagefi/eslint-config",
    ],
    rules: {
        "prettier/prettier": ["error", {}, { usePrettierrc: true }],
    },
    overrides: [
        {
            files: [
                "**/__tests__/*.{j,t}s?(x)",
                "**/tests/unit/**/*.spec.{j,t}s?(x)",
            ],
            env: {
                jest: true,
            },
        },
    ],
}
