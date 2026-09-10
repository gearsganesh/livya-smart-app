import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radii, shadows } from '../../lib/design-system';

type Props = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  compact?: boolean;
  style?: ViewStyle;
};

export function GradientButton({ label, onPress, disabled = false, compact = false, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, compact && styles.compact, pressed && !disabled && styles.pressed, disabled && styles.disabled, style]}
    >
      <LinearGradient colors={[colors.indigo, colors.violet]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
        <Text style={styles.label}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { minHeight: 48, borderRadius: radii.xl, overflow: 'hidden', ...shadows.glow },
  compact: { minHeight: 40, borderRadius: radii.lg, shadowRadius: 10 },
  gradient: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  label: { color: colors.white, fontSize: 15, fontWeight: '700', letterSpacing: 0.1 },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.92 },
  disabled: { opacity: 0.45, shadowOpacity: 0 },
});
