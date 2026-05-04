import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTokens } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';

type Props = {
  text: string;
  /** Directive register uses a slightly heavier callout. Both registers wear the same accent. */
  register?: 'monitoring' | 'directive';
};

/**
 * Clinical Action Line — §7.2.
 * Accent-tinted callout, semibold body weight. ≤15-word cap enforced via
 * a __DEV__ warning so copy authors notice immediately.
 */
export function ActionLine({ text, register = 'monitoring' }: Props) {
  const t = useTokens();

  if (__DEV__ && text.split(/\s+/).length > 15) {
    console.warn(`[ActionLine] text exceeds 15-word cap (§7.2): "${text}"`);
  }

  return (
    <View
      style={[
        styles.callout,
        {
          backgroundColor: t.accent.accentBg,
          borderLeftColor: t.accent.accentRule,
        },
      ]}
    >
      <Text
        style={[
          type.bodySemibold,
          { color: t.accent.accent, fontWeight: register === 'directive' ? '700' : '600' },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  callout: {
    borderLeftWidth: 3,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginVertical: 8,
  },
});
