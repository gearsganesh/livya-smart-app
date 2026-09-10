$ErrorActionPreference = 'Stop'

Write-Host '== LIVYA mobile E2E deployment checks =='
npm install
npx expo doctor
npm run typecheck
npx expo config --type public

Write-Host '== Development builds =='
eas build --profile development --platform android --non-interactive
eas build --profile development --platform ios --non-interactive

Write-Host '== QA APK =='
eas build --profile preview --platform android --non-interactive

Write-Host '== Production Android AAB =='
eas build --profile production --platform android --non-interactive

Write-Host '== Production iOS IPA =='
eas build --profile production --platform ios --non-interactive

Write-Host 'Build commands completed. Install development builds and run the manual payment/push/biometric checklist in docs/NATIVE_AND_PAYMENTS.md.'
