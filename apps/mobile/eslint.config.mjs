import expoFlat from 'eslint-config-expo/flat.js';
import { baseConfig, mobileOverrides } from '@tasky/tooling-config/eslint/react-native';

// Filter out Expo's top-level typescript-eslint config entry to avoid
// plugin redefinition conflict with our shared base config.
// Expo defines @typescript-eslint in a global config object — we keep
// file-scoped entries but drop the unscoped one.
const expoWithoutTs = expoFlat.filter(
  (entry) =>
    !(entry.plugins && entry.plugins['@typescript-eslint']) ||
    entry.files,
);

export default [
  ...expoWithoutTs,
  ...baseConfig,
  ...mobileOverrides,
  { ignores: ['.expo/', 'dist/', 'coverage/'] },
];
