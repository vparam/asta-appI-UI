import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, View } from 'react-native';
import { useTokens } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';
import { triggerHaptic } from '@/native/haptics';

type Variant = 'primary' | 'outlined' | 'critical' | 'stable' | 'ghost';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  /** Haptic to fire on press. Default 'light'. */
  haptic?: 'light' | 'medium' | 'heavy' | 'paired-heavy' | 'tick' | 'none';
  fullWidth?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  haptic = 'light',
  fullWidth,
  style,
  icon,
}: Props) {
  const t = useTokens();

  const palette: Record<Variant, { bg: string; fg: string; border: string }> = {
    primary: { bg: t.accent.accent, fg: '#FFFFFF', border: t.accent.accent },
    outlined: { bg: 'transparent', fg: t.text.body, border: t.surface.hairline },
    critical: { bg: 'transparent', fg: t.severity.critical, border: t.severity.critical },
    stable: { bg: t.severity.stable, fg: '#FFFFFF', border: t.severity.stable },
    ghost: { bg: 'transparent', fg: t.text.mute, border: 'transparent' },
  };

  const p = palette[variant];

  return (
    <Pressable
      onPress={() => {
        if (haptic !== 'none') triggerHaptic(haptic);
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: p.bg,
          borderColor: p.border,
          borderWidth: variant === 'primary' || variant === 'stable' ? 0 : 1,
          width: fullWidth ? '100%' : undefined,
          opacity: pressed ? 0.8 : 1,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {icon ? <View style={{ marginRight: 8 }}>{icon}</View> : null}
      <Text style={[type.bodySemibold, { color: p.fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
});
