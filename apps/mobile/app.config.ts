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
const nativeFirebaseEnabled = Boolean(
  optionalEnvFromSources('GOOGLE_SERVICES_JSON', process.env, appLocalEnv) ||
  optionalEnvFromSources('GOOGLE_SERVICE_INFO_PLIST', process.env, appLocalEnv) ||
  fs.existsSync(path.resolve(__dirname, 'android/app/google-services.json')) ||
  fs.existsSync(path.resolve(__dirname, 'ios/GoogleService-Info.plist')),
);

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Tasky',
  slug: 'tasky',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/app-icon.png',
  scheme: 'tasky',
  ios: {
    bundleIdentifier: 'mn.tasky.mobile',
    icon: './assets/app-icon.png',
  },
  android: {
    package: 'mn.tasky.mobile',
    icon: './assets/app-icon.png',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#004AAD',
    },
  },
  web: {
    bundler: 'metro',
  },
  splash: {
    image: './assets/splash-logo.png',
    resizeMode: 'contain',
    backgroundColor: '#FFFFFF',
  },
  extra: {
    ...config.extra,
    googleMapsSdk: {
      androidEnabled: Boolean(googleMapsApiKeys.androidApiKey),
      iosEnabled: Boolean(googleMapsApiKeys.iosApiKey),
    },
    nativeFirebase: {
      enabled: nativeFirebaseEnabled,
    },
  },
  userInterfaceStyle: 'light',
  assetBundlePatterns: ['**/*'],
  plugins: [
    'expo-asset',
    'expo-router',
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
