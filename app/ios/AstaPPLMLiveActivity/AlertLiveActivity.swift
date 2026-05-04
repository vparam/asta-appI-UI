// AlertLiveActivity.swift
// PPLM Mobile Bedside — Live Activity widget per spec §12.1.
// Renders the active alert on the lock screen and Dynamic Island.
// PRIVACY (§3.2): no patient name appears anywhere in this widget.
//
// This file is a separate Xcode target. Add to the project as
// "PPLM Live Activity" → check "Embed in Containing App".

import ActivityKit
import SwiftUI
import WidgetKit

/// State carried by every Live Activity update. Matches the wire contract used by
/// the push payload — bed identifier and severity, never PII.
public struct AlertActivityAttributes: ActivityAttributes {
  public typealias ContentState = LiveContent

  public struct LiveContent: Codable, Hashable {
    public var severity: String       // "watch" | "critical"
    public var headline: String       // generated from §7.2 actionLine
    public var ward: String           // "Trail ward"
    public var bed: Int               // 4
    public var token: String          // PT-9K2X
    public var firedAtEpoch: Int      // for the time-since-fire countdown
  }

  public var alertId: String
}

@available(iOS 16.1, *)
struct AlertLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: AlertActivityAttributes.self) { context in
      LockScreenView(state: context.state)
        .activityBackgroundTint(.black.opacity(0.85))
        .activitySystemActionForegroundColor(.white)
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          severityPill(context.state.severity)
        }
        DynamicIslandExpandedRegion(.trailing) {
          Text("Bed \(context.state.bed)").font(.headline)
        }
        DynamicIslandExpandedRegion(.bottom) {
          Text(context.state.headline).font(.body)
        }
      } compactLeading: {
        severityPill(context.state.severity)
      } compactTrailing: {
        Text("Bed \(context.state.bed)").font(.caption2)
      } minimal: {
        severityPill(context.state.severity)
      }
    }
  }

  private func severityPill(_ s: String) -> some View {
    let color: Color = s == "critical" ? .red : .orange
    return Circle().fill(color).frame(width: 10, height: 10)
  }
}

@available(iOS 16.1, *)
private struct LockScreenView: View {
  let state: AlertActivityAttributes.LiveContent

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack {
        Circle()
          .fill(state.severity == "critical" ? Color.red : Color.orange)
          .frame(width: 10, height: 10)
        Text("PPLM · \(state.severity.uppercased()) · Bed \(state.bed)")
          .font(.headline).foregroundColor(.white)
        Spacer()
        Text(timeSince(state.firedAtEpoch))
          .font(.caption).foregroundColor(.gray)
      }
      Text(state.headline)
        .font(.body).foregroundColor(.white)
      Text("\(state.ward) · Bed \(state.bed) · \(state.token)")
        .font(.caption).foregroundColor(.gray)
    }
    .padding(16)
  }

  private func timeSince(_ epoch: Int) -> String {
    let elapsed = Int(Date().timeIntervalSince1970) - epoch
    let mm = elapsed / 60
    let ss = elapsed % 60
    return String(format: "%dm %02ds", mm, ss)
  }
}
