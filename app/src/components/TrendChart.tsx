import React, { useMemo } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';
import Svg, { Line, Path, Rect, Text as SvgText, G, Circle } from 'react-native-svg';
import { useTokens } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';
import { VitalLane, ForecastSample } from '@/data/types';
import { useScrub } from '@/state/scrub';

type Sample = { tMin: number; value: number };

type Props = {
  lane: VitalLane;
  history: Sample[];
  forecast?: ForecastSample[];
  width: number;
  height: number;
  /** Y-axis labels — three: lower threshold, baseline mid, upper threshold. */
  thresholds: { lower: number; baseline: number; upper: number };
  /**
   * Optional staleness in seconds since last sync. If >120s the forecast
   * region is ERASED (not faded) per §19.28.
   */
  syncedSecondsAgo?: number;
  /** When false, this chart's gestures don't update the shared scrub context. */
  participatesInScrub?: boolean;
  /**
   * §19.34 accessibility — supply the latest reading and clinical interpretation
   * so VoiceOver/TalkBack expose a structured summary, not just a sample count.
   */
  reading?: { value: number; unit: string; direction: 'stable' | 'falling' | 'rising'; interpretation: string };
};

/**
 * Custom SVG chart per spec §8.
 * - Past is solid; future is dotted (stroke-dasharray).
 * - Forecast band exists right of the now line.
 * - "now" hairline at the right edge of the past trace.
 * - Tabular figures on numeric axis labels.
 *
 * §19.27 sync-scrub: pan gestures update a shared zustand store; every
 * chart in the carousel reads the same `scrubMin` and renders its time
 * index marker at the same horizontal position.
 *
 * §19.28 stale forecast erasure: when `syncedSecondsAgo > 120`, the
 * forecast trace + confidence band are removed entirely.
 */
export function TrendChart({
  lane,
  history,
  forecast,
  width,
  height,
  thresholds,
  syncedSecondsAgo = 0,
  participatesInScrub = true,
  reading,
}: Props) {
  const t = useTokens();
  const padTop = 8;
  const padBottom = 24;
  const padLeft = 32;
  const padRight = 12;

  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const { scrubMin, setScrub } = useScrub();

  const stale = syncedSecondsAgo > 120;
  const effectiveForecast = stale ? undefined : forecast;

  const allSamples: Sample[] = useMemo(() => {
    const f = effectiveForecast?.map((s) => ({ tMin: s.tMin, value: s.value })) ?? [];
    return [...history, ...f];
  }, [history, effectiveForecast]);

  const yMin = Math.min(thresholds.lower - 5, ...allSamples.map((s) => s.value));
  const yMax = Math.max(thresholds.upper + 5, ...allSamples.map((s) => s.value));
  const xMin = Math.min(...allSamples.map((s) => s.tMin));
  const xMax = Math.max(...allSamples.map((s) => s.tMin));

  const x = (t0: number) => padLeft + ((t0 - xMin) / (xMax - xMin || 1)) * innerW;
  const y = (v: number) => padTop + (1 - (v - yMin) / (yMax - yMin || 1)) * innerH;
  const xToTime = (px: number) => xMin + ((px - padLeft) / innerW) * (xMax - xMin);

  const pastPath = history
    .map((s, i) => `${i === 0 ? 'M' : 'L'} ${x(s.tMin).toFixed(2)} ${y(s.value).toFixed(2)}`)
    .join(' ');

  const futurePath =
    effectiveForecast && effectiveForecast.length
      ? `M ${x(history[history.length - 1]?.tMin ?? 0).toFixed(2)} ${y(history[history.length - 1]?.value ?? 0).toFixed(2)} ` +
        effectiveForecast.map((s) => `L ${x(s.tMin).toFixed(2)} ${y(s.value).toFixed(2)}`).join(' ')
      : '';

  const nowX = x(0);
  const laneColour = t.vital[lane];

  // Scrub gestures — drag horizontally to inspect a time index.
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => participatesInScrub,
        onMoveShouldSetPanResponder: () => participatesInScrub,
        onPanResponderGrant: (e) => {
          setScrub(xToTime(e.nativeEvent.locationX));
        },
        onPanResponderMove: (e) => {
          setScrub(xToTime(e.nativeEvent.locationX));
        },
        onPanResponderRelease: () => setScrub(null),
        onPanResponderTerminate: () => setScrub(null),
      }),
    [participatesInScrub, setScrub, xMin, xMax]
  );

  // Find the value at the current scrub time index (for the marker dot).
  const scrubValue = useMemo(() => {
    if (scrubMin === null) return null;
    let nearest: Sample | null = null;
    let bestDelta = Infinity;
    for (const s of allSamples) {
      const d = Math.abs(s.tMin - scrubMin);
      if (d < bestDelta) {
        bestDelta = d;
        nearest = s;
      }
    }
    return nearest;
  }, [scrubMin, allSamples]);

  return (
    <View
      {...responder.panHandlers}
      accessible
      accessibilityRole="image"
      accessibilityLabel={
        // §19.34: structured chart summary — current value, direction, interpretation,
        // sample count, forecast availability. Read aloud by VoiceOver/TalkBack.
        reading
          ? `${lane.toUpperCase()} trend chart: latest ${reading.value} ${reading.unit}, ${reading.direction}. ${reading.interpretation}. ${history.length} samples retained.${
              stale ? ' Forecast unavailable — feed stale.' : forecast && forecast.length > 0 ? ' Forecast band present.' : ''
            }`
          : `${lane.toUpperCase()} trend chart, ${history.length} samples${
              stale ? ', forecast unavailable — feed stale' : ''
            }`
      }
    >
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

        {/* Forecast confidence band — erased entirely when feed is stale */}
        {effectiveForecast && effectiveForecast.length > 0 && (
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

        {/* Forecast trace — dotted, omitted when stale */}
        {futurePath && (
          <Path d={futurePath} fill="none" stroke={laneColour} strokeWidth={1.5} strokeDasharray="4,3" />
        )}

        {/* "now" hairline — non-negotiable per §8 */}
        <Line x1={nowX} y1={padTop} x2={nowX} y2={padTop + innerH} stroke={t.text.mute} strokeWidth={0.5} />
        <SvgText x={nowX + 2} y={padTop + 10} fontSize={9} fill={t.text.mute}>
          now
        </SvgText>

        {/* Sync-scrub indicator */}
        {scrubValue !== null && scrubMin !== null && (
          <G>
            <Line
              x1={x(scrubValue.tMin)}
              x2={x(scrubValue.tMin)}
              y1={padTop}
              y2={padTop + innerH}
              stroke={t.accent.accent}
              strokeWidth={1}
              strokeDasharray="2,2"
            />
            <Circle cx={x(scrubValue.tMin)} cy={y(scrubValue.value)} r={3} fill={t.accent.accent} />
            <SvgText x={x(scrubValue.tMin) + 4} y={padTop + 22} fontSize={10} fill={t.accent.accent}>
              {`${scrubValue.value.toFixed(0)} @ ${scrubValue.tMin > 0 ? '+' : ''}${Math.round(scrubValue.tMin)}m`}
            </SvgText>
          </G>
        )}

        {/* Stale-feed banner inside the chart */}
        {stale && (
          <G>
            <Rect x={nowX} y={padTop + innerH / 2 - 12} width={width - padRight - nowX} height={24} fill={t.severity.watchBg} opacity={0.9} />
            <SvgText x={nowX + 8} y={padTop + innerH / 2 + 4} fontSize={11} fill={t.severity.watch}>
              Forecast unavailable — feed stale
            </SvgText>
          </G>
        )}
      </Svg>
    </View>
  );
}

export const trendChartStyles = StyleSheet.create({
  caption: { ...type.metadata },
});
