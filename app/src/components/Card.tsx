import React from 'react';
import { View, ViewProps, ViewStyle, StyleSheet } from 'react-native';
import { useTokens } from '@/theme/ThemeProvider';
import { compose, SeverityState } from '@/theme/severity';

type Props = ViewProps & {
  /** When set, applies the v2.7 severity treatment per §13.2. */
  severity?: SeverityState;
  /** Visual recess (sub-card on warm sand background). */
  recessed?: boolean;
  padded?: boolean;
};

export function Card({ severity, recessed, padded = true, style, children, ...rest }: Props) {
  const t = useTokens();
  const sev = severity ? compose(severity, t) : null;

  const base: ViewStyle = {
    backgroundColor: recessed ? t.surface.recess : t.surface.surface,
    borderRadius: 16,
    padding: padded ? 16 : 0,
    shadowColor: '#000',
    shadowOpacity: recessed ? 0 : 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: recessed ? 0 : 1,
  };

  return (
    <View style={[base, sev?.cardStyle, style]} {...rest}>
      {children}
    </View>
  );
}

export const cardStyles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
});
