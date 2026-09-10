import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications() {
  if (!Constants.isDevice) throw new Error('Push notifications require a physical device');

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== 'granted') throw new Error('Push notification permission was not granted');

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'LIVYA Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366f1',
    });
  }
  return token.data;
}

export async function requestNotificationPermission() {
  return registerForPushNotifications();
}

export async function successHaptic() {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export async function selectionHaptic() {
  await Haptics.selectionAsync();
}

export async function authenticateBiometric(reason = 'Authenticate to access your LIVYA account') {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (!compatible || !enrolled) return { success: false, unavailable: true } as const;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
    biometricsSecurityLevel: 'strong',
  });
  return { success: result.success, unavailable: false } as const;
}

export async function getBiometricTypes() {
  return LocalAuthentication.supportedAuthenticationTypesAsync();
}
