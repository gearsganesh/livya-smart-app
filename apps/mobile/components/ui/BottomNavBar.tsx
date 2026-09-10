import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, shadows } from '../../lib/design-system';

type NavItem = { key: string; label: string; icon: ReactNode };
type Props = { items: NavItem[]; activeKey: string; onChange: (key: string) => void; action?: ReactNode };

export function BottomNavBar({ items, activeKey, onChange, action }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.anchor, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.row}>
        {items.map((item) => {
          const active = item.key === activeKey;
          return (
            <Pressable key={item.key} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => onChange(item.key)} style={styles.item}>
              <View style={[styles.icon, active && styles.activeIcon]}>{item.icon}</View>
              <Text style={[styles.label, active && styles.activeLabel]}>{item.label}</Text>
              {active ? <View style={styles.dot} /> : <View style={styles.dotPlaceholder} />}
            </Pressable>
          );
        })}
        {action ? <View style={styles.action}>{action}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: { position: 'absolute', left: 12, right: 12, bottom: 0 },
  row: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    borderRadius: radii['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(28,40,66,0.96)',
    backgroundColor: 'rgba(19,27,46,0.94)',
    ...shadows.card,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 60, paddingVertical: 5 },
  icon: { width: 36, height: 28, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center' },
  activeIcon: { backgroundColor: 'rgba(99,102,241,0.16)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.45)' },
  label: { marginTop: 3, color: colors.muted, fontSize: 10, fontWeight: '600' },
  activeLabel: { color: colors.white },
  dot: { marginTop: 3, width: 4, height: 4, borderRadius: 2, backgroundColor: colors.violet },
  dotPlaceholder: { marginTop: 3, width: 4, height: 4 },
  action: { marginLeft: 4 },
});
