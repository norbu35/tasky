import Constants from 'expo-constants';

type NativeFirebaseExtra = {
  nativeFirebase?: {
    enabled?: boolean;
  };
  firebaseNativeEnabled?: boolean;
};

export function isNativeFirebaseAvailable(): boolean {
  if (Constants.executionEnvironment === 'storeClient') {
    return false;
  }

  const extra = Constants.expoConfig?.extra as NativeFirebaseExtra | undefined;
  return extra?.nativeFirebase?.enabled === true || extra?.firebaseNativeEnabled === true;
}
