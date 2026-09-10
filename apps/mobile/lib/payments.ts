import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';

export const ENTITLEMENTS = {
  essential: 'essential',
  plus: 'plus',
  elite: 'elite',
} as const;

let configured = false;

function apiKeyForPlatform() {
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
    default: undefined,
  });
}

export async function configurePayments(appUserId?: string) {
  if (configured) {
    if (appUserId) await Purchases.logIn(appUserId);
    return;
  }
  const apiKey = apiKeyForPlatform();
  if (!apiKey) throw new Error('RevenueCat API key is not configured for this platform');

  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey, appUserID: appUserId });
  configured = true;
}

export async function identifyPurchaser(appUserId: string) {
  await configurePayments(appUserId);
  return Purchases.logIn(appUserId);
}

export async function getOfferings() {
  await configurePayments();
  return Purchases.getOfferings();
}

export async function purchasePackage(pkg: PurchasesPackage) {
  await configurePayments();
  const result = await Purchases.purchasePackage(pkg);
  return result.customerInfo;
}

export async function restorePurchases() {
  await configurePayments();
  return Purchases.restorePurchases();
}

export function hasEntitlement(info: CustomerInfo, entitlement: string) {
  return Boolean(info.entitlements.active[entitlement]);
}

export async function logoutPurchaser() {
  if (!configured) return;
  try {
    await Purchases.logOut();
  } catch {
    // RevenueCat may already be anonymous. Nothing else needs to happen locally.
  }
}
