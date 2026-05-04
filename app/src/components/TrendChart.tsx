import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Line, Path, Rect, Text as SvgText, G } from 'react-native-svg';
import { useTokens } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';
import { VitalLane, ForecastSample } from '@/data/types';

type Sample = { tMin: number; value: number };

type Props = {
  lane: VitalLane;
  history: Sample[];
  forecast?: ForecastSample[];
  width: number;
  height: number;
  /** Y-axis labels — three: lower threshold, baseline mid, upper threshold. */
  thresholds: { lower: number; baseline: number; upper: number };
};

/**
 * Custom SVG chart per spec §8.
 * - Past is solid; future is dotted (stroke-dasharray).
 * - Forecast band exists right of the now line.
 * - "now" hairline at the right edge of the past trace.
 * - Tabular figures on numeric axis labels.
 *
 * Sync-scrub (§7.5) is hooked up at the carousel level via a shared
 * gesture context, not in this component.
 */
export function TrendChart({ lane, history, forecast, width, height, thresholds }: Props) {
  const t = useTokens();
  const padTop = 8;
  const padBottom = 24;
  const padLeft = 32;
  const padRight = 12;

  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const allSamples: Sample[] = useMemo(() => {
    const f = forecast?.map((s) => ({ tMin: s.tMin, value: s.value })) ?? [];
    return [...history, ...f];
  }, [history, forecast]);

  const yMin = Math.min(thresholds.lower - 5, ...allSamples.map((s) => s.value));
  const yMax = Math.max(thresholds.upper + 5, ...allSamples.map((s) => s.value));
  const xMin = Math.min(...allSamples.map((s) => s.tMin));
  const xMax = Math.max(...allSamples.map((s) => s.tMin));

  const x = (t0: number) => padLeft + ((t0 - xMin) / (xMax - xMin || 1)) * innerW;
  const y = (v: number) => padTop + (1 - (v - yMin) / (yMax - yMin || 1)) * innerH;

  const pastPath = history
    .map((s, i) => `${i === 0 ? 'M' : 'L'} ${x(s.tMin).toFixed(2)} ${y(s.value).toFixed(2)}`)
    .join(' ');

  const futurePath =
    forecast && forecast.length
      ? `M ${x(history[history.length - 1]?.tMin ?? 0).toFixed(2)} ${y(history[history.length - 1]?.value ?? 0).toFixed(2)} ` +
        forecast.map((s) => `L ${x(s.tMin).toFixed(2)} ${y(s.value).toFixed(2)}`).join(' ')
      : '';

  const nowX = x(0);
  const laneColour = t.vital[lane];

  return (
    <View>
      <Svg width={width} height={height}>
        {/* Y-axis threshold labels */}
        {[thresholds.upper, thresholds.baseline, thresholds.lower].map((v) => (
          <G key={v}>
            <SvgText x={4} y={y(v) + 4} fontSize={10} fill={t.text.mute}>
              {v}
            </SvgText>
            <Line x1={padLeft} x2={width - padRight} y1={y(v)} y2={y(v)} stroke={t.surface.hairline} strokeWidth={0.5} />
          </G>
        ))}

        {/* Forecast confidence band (light wash right of now) */}
        {forecast && forecast.length > 0 && (
          <Rect
            x={nowX}
            y={padTop}
            width={width - padRight - nowX}
            height={innerH}
            fill={laneColour}
            opacity={0.08}
          />
        )}

        {/* Past trace — solid */}
        <Path d={pastPath} fill="none" stroke={laneColour} strokeWidth={1.5} />

        {/* Forecast trace — dotted */}
        {futurePath && (
          <Path d={futurePath} fill="none" stroke={laneColour} strokeWidth={1.5} strokeDasharray="4,3" />
        )}

        {/* "now" hairline — non-negotiable per §8 */}
        <Line x1={nowX} y1={padTop} x2={nowX} y2={padTop + innerH} stroke={t.text.mute} strokeWidth={0.5} />
        <SvgText x={nowX + 2} y={padTop + 10} fontSize={9} fill={t.text.mute}>
          now
        </SvgText>
      </Svg>
    </View>
  );
}

export const trendChartStyles = StyleSheet.create({
  caption: { ...type.metadata },
});
