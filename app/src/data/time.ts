/**
 * Relative-time helpers — spec §3.2 forbids absolute timestamps on patient
 * surfaces (re-identification vector in small wards). Everything visible to
 * a clinician on a patient view goes through these.
 *
 * The audit log on the server still records ISO timestamps — those are not
 * patient-visible.
 */

export function relativeFromNow(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const secs = Math.max(0, Math.round(ms / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `~${days}d ago`;
}

export function relativeFromEpoch(epochSec: number): string {
  return relativeFromNow(new Date(epochSec * 1000).toISOString());
}
