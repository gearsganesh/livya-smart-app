# LIVYA Native + Payments Deployment Guide

## 1. RevenueCat / IAP

LIVYA uses RevenueCat as the mobile subscription abstraction. Apple App Store and Google Play remain the actual stores. Do not put Razorpay secrets in the mobile app.

Create these RevenueCat entitlements:

- `essential`
- `plus`
- `elite`

Configure matching products in App Store Connect and Google Play, then map them to the RevenueCat entitlements. The mobile SDK uses the public platform API keys through `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` and `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`.

RevenueCat requires a development build for real native purchases; Expo Go only provides Preview API behavior. See the official Expo integration documentation: https://www.revenuecat.com/docs/getting-started/installation/expo

### Backend secrets

Set on the FastAPI service, never in the mobile app:

```env
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
REVENUECAT_WEBHOOK_SECRET=...
```

Razorpay webhook:

```text
POST /api/v1/webhooks/razorpay
```

RevenueCat webhook:

```text
POST /api/v1/webhooks/revenuecat
```

Both endpoints validate the raw request body before JSON parsing and persist an idempotent webhook event before changing subscription state. RevenueCat HMAC requests use `X-RevenueCat-Webhook-Signature` with `t=<timestamp>,v1=<hmac>`.

For Razorpay, configure a webhook secret in Dashboard > Account & Settings > Webhooks and subscribe to the payment/subscription events needed by the business. Razorpay signs the raw body with HMAC-SHA256 and sends `X-Razorpay-Signature`; duplicate deliveries are identified with `x-razorpay-event-id`.

## 2. Expo / native permissions

`app.json` configures:

- `expo-notifications` for remote push notifications
- `expo-local-authentication` with an iOS Face ID usage string
- Android `POST_NOTIFICATIONS`
- iOS remote-notification background mode
- Apple Sign In

Push registration is in `lib/native.ts` and returns an Expo push token. Use a physical device for remote push testing. Android remote push is not available in Expo Go from SDK 53 onward, and Face ID testing on iOS requires a development build.

### Credentials

Run:

```bash
npx eas login
npx eas init
npx eas credentials
```

For iOS, enable **In-App Purchase** for the `com.livya.app` App ID in Apple Developer/App Store Connect. RevenueCat also requires the corresponding App Store Connect configuration.

For Android, create the `com.livya.app` application in Google Play Console, configure subscriptions, and connect it to RevenueCat.

## 3. Environment

Mobile public values:

```env
EXPO_PUBLIC_API_BASE_URL=https://api.example.com/api/v1
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=YOUR_PUBLIC_RC_IOS_KEY
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=YOUR_PUBLIC_RC_ANDROID_KEY
EAS_PROJECT_ID=YOUR_EAS_PROJECT_UUID
```

Only public/client-safe values belong in the mobile environment. Razorpay secrets, RevenueCat webhook signing secrets, database credentials, and service-role keys belong only on the API/server.

## 4. End-to-end deployment test

From the repository root:

```bash
cd apps/mobile
npm install
npx expo doctor
npm run typecheck
npx expo config --type public
```

### Development builds

```bash
eas build --profile development --platform android
eas build --profile development --platform ios
```

Install the resulting development builds on physical devices. Test:

1. Login/logout and session restoration.
2. Biometric prompt on enrolled Face ID/Fingerprint devices.
3. Push permission prompt and token registration.
4. Foreground notification handling.
5. Haptic success/selection feedback.
6. RevenueCat offerings load.
7. Sandbox/test purchase for each tier.
8. Restore purchases.
9. Cancellation/expiration and entitlement changes through RevenueCat webhook.
10. Razorpay test webhook signature rejection/acceptance and duplicate-event idempotency.

### Android APK for QA

```bash
eas build --profile preview --platform android
```

The `preview` profile produces an installable APK.

### Production Android AAB

```bash
eas build --profile production --platform android
```

The production Android profile uses `app-bundle` and is intended for Google Play submission.

### Production iOS IPA

```bash
eas build --profile production --platform ios
```

The production iOS profile produces the signed iOS archive/IPA through EAS. Submit with:

```bash
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

## 5. Payment acceptance checklist

Never grant an entitlement solely because the mobile client reports success. The backend should treat RevenueCat/Razorpay server notifications as the authoritative lifecycle signal, use idempotency keys/event IDs, and keep secrets server-side.

For Razorpay Checkout payments, server-side payment signature verification must also use the trusted order ID created by the server. Do not trust a client-supplied order ID for signature generation.
