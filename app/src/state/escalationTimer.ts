/**
 * 90s auto-escalation — spec §5.5 + §19.33.
 *
 * Hook started when an unacknowledged critical alert is on screen. After 90s
 * of inaction the routing chain advances to the next role; the
 * PatientScreen re-renders with the new recipient marked as `isCurrent`,
 * and a telemetry event fires.
 *
 * Timer is best-effort client-side. The server-side audit log records
 * `auto_escalated` when the API endpoint receives the recipient swap.
 */

import { useEffect } from 'react';
import { AlertEvent } from '@/data/types';
import { telemetry } from './telemetry';

const AUTO_ESCALATE_MS = 90_000;

export function useAutoEscalation(
  event: AlertEvent | undefined,
  acknowledged: boolean,
  onAutoEscalate: (nextRole: string) => void
): void {
  useEffect(() => {
    if (!event || acknowledged) return;
    if (event.severity !== 'critical') return;
    const next = event.routingChain.find((r) => !r.isCurrent);
    if (!next) return;
    const timer = setTimeout(() => {
      telemetry.emit('alert_auto_escalated', { eventId: event.id, toRole: next.role });
      onAutoEscalate(next.role);
    }, AUTO_ESCALATE_MS);
    return () => clearTimeout(timer);
  }, [event, acknowledged, onAutoEscalate]);
}
