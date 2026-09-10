import { useCallback, useEffect, useState } from 'react';
import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { configurePayments, getOfferings, hasEntitlement, purchasePackage, restorePurchases, ENTITLEMENTS } from '../lib/payments';

export function useSubscription() {
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await configurePayments();
      const [offerings, info] = await Promise.all([getOfferings(), restorePurchases()]);
      setOffering(offerings.current ?? null);
      setCustomerInfo(info);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load subscription status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const purchase = useCallback(async (pkg: PurchasesPackage) => {
    setError(null);
    try {
      const info = await purchasePackage(pkg);
      setCustomerInfo(info);
      return info;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Purchase failed';
      setError(message);
      throw e;
    }
  }, []);

  return {
    offering,
    customerInfo,
    loading,
    error,
    purchase,
    restore: refresh,
    isEssential: customerInfo ? hasEntitlement(customerInfo, ENTITLEMENTS.essential) : false,
    isPlus: customerInfo ? hasEntitlement(customerInfo, ENTITLEMENTS.plus) : false,
    isElite: customerInfo ? hasEntitlement(customerInfo, ENTITLEMENTS.elite) : false,
  };
}
