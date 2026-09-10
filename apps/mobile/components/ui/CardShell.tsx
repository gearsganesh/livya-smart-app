import { ReactNode } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radii, shadows } from '../../lib/design-system';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  highlighted?: boolean;
};

export function CardShell({ children, style, onPress, highlighted = false }: Props) {
  const content = <View style={[styles.card, highlighted && styles.highlighted, style]}>{children}</View>;
  if (!onPress) return content;
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => pressed ? { opacity: 0.92 } : undefined}>{content}</Pressable>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardDark,
    padding: 16,
    ...shadows.card,
  },
  highlighted: { borderColor: 'rgba(99,102,241,0.55)' },
});
