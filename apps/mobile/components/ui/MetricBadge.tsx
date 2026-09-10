import { StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../../lib/design-system';

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'indigo';
type Props = { label: string; value: string | number; tone?: Tone; unit?: string };

const tones = {
  success: { bg: 'rgba(16,185,129,0.12)', fg: colors.green },
  warning: { bg: 'rgba(245,158,11,0.12)', fg: colors.amber },
  danger: { bg: 'rgba(239,68,68,0.12)', fg: colors.red },
  neutral: { bg: 'rgba(100,116,139,0.12)', fg: colors.secondary },
  indigo: { bg: 'rgba(99,102,241,0.14)', fg: colors.indigo },
} as const;

export function MetricBadge({ label, value, tone = 'neutral', unit }: Props) {
  const t = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.value, { color: t.fg }]}>{value}</Text>
      {unit ? <Text style={[styles.unit, { color: t.fg }]}>{unit}</Text> : null}
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { minHeight: 32, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, paddingHorizontal: 10, borderRadius: radii.pill },
  value: { fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] },
  unit: { fontSize: 10, fontWeight: '700' },
  label: { color: colors.secondary, fontSize: 11, fontWeight: '600' },
});
