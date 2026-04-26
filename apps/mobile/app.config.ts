import fs from 'node:fs';
import path from 'node:path';

import { ConfigContext, ExpoConfig } from 'expo/config';

type EnvSource = Record<string, string | undefined>;

const parseEnvFile = (contents: string): EnvSource => {
  return contents.split(/\r?\n/).reduce<EnvSource>((env, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return env;
    }

    const separator = trimmed.indexOf('=');
    if (separator <= 0) {
      return env;
    }

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    env[key] = rawValue.replace(/^(['"])(.*)\1$/, '$2');
    return env;
  }, {});
};

const readEnvFile = (filePath: string): EnvSource => {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  return parseEnvFile(fs.readFileSync(filePath, 'utf8'));
};

const optionalEnv = (env: EnvSource, name: string): string | undefined => {
  const value = env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
};

const optionalEnvFromSources = (
  name: string,
  processEnv: EnvSource,
  appLocalEnv: EnvSource,
): string | undefined => {
  return optionalEnv(processEnv, name) ?? optionalEnv(appLocalEnv, name);
};

export const resolveGoogleMapsApiKeys = (
  processEnv: EnvSource,
  appLocalEnv: EnvSource,
  ..._ignoredEnvSources: EnvSource[]
) => {
  const sharedApiKey = optionalEnvFromSources('GOOGLE_MAPS_API_KEY', processEnv, appLocalEnv);
  return {
    androidApiKey:
      optionalEnvFromSources('GOOGLE_MAPS_ANDROID_API_KEY', processEnv, appLocalEnv) ??
      sharedApiKey,
    iosApiKey:
      optionalEnvFromSources('GOOGLE_MAPS_IOS_API_KEY', processEnv, appLocalEnv) ?? sharedApiKey,
  };
};

const appLocalEnv = readEnvFile(path.resolve(__dirname, '.env'));
const googleMapsApiKeys = resolveGoogleMapsApiKeys(process.env, appLocalEnv);

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Tasky',
  slug: 'tasky',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: 'tasky',
  ios: {
    bundleIdentifier: 'mn.tasky.mobile',
  },
  android: {
    package: 'mn.tasky.mobile',
  },
  web: {
    bundler: 'metro',
  },
  extra: {
    ...config.extra,
    googleMapsSdk: {
      androidEnabled: Boolean(googleMapsApiKeys.androidApiKey),
      iosEnabled: Boolean(googleMapsApiKeys.iosApiKey),
    },
  },
  userInterfaceStyle: 'light',
  assetBundlePatterns: ['**/*'],
  plugins: [
    [
      'expo-font',
      {
        fonts: [
          './assets/fonts/PlusJakartaSans_400Regular.ttf',
          './assets/fonts/PlusJakartaSans_500Medium.ttf',
          './assets/fonts/PlusJakartaSans_600SemiBold.ttf',
          './assets/fonts/PlusJakartaSans_700Bold.ttf',
          './assets/fonts/Manrope_600SemiBold.ttf',
          './assets/fonts/Manrope_700Bold.ttf',
        ],
      },
    ],
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'Tasky uses your location to show nearby tasks and set task location.',
        locationWhenInUsePermission:
          'Tasky uses your location to show nearby tasks and set task location.',
      },
    ],
  ],
});
