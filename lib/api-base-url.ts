import Constants from 'expo-constants';
import { Platform } from 'react-native';

const readExpoHost = () => {
  const expoHost =
    Constants.expoConfig?.hostUri ||
    (Constants as unknown as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } })
      .manifest2?.extra?.expoGo?.debuggerHost ||
    null;

  if (!expoHost) {
    return null;
  }

  const host = expoHost.split(':')[0];
  return host || null;
};

export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }

  const envBaseUrl =
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    process.env.EXPO_PUBLIC_RORK_API_BASE_URL;

  if (envBaseUrl) {
    return envBaseUrl;
  }

  if (__DEV__) {
    const expoHost = readExpoHost();
    if (expoHost) {
      return `http://${expoHost}:3000`;
    }

    return (
      Platform.select({
        web: 'http://localhost:3000',
        android: 'http://10.0.2.2:3000',
        default: 'http://localhost:3000',
      }) ?? 'http://localhost:3000'
    );
  }

  return 'http://localhost:3000';
};
