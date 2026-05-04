// RNAstaHaptics.swift
// PPLM Mobile Bedside — native haptics per spec §13.6.
//
// Pattern map:
//   light        → Acknowledge action
//   medium       → Escalate action
//   tick         → Scrub crossing an event marker
//   heavy        → (reserved)
//   paired-heavy → Critical alert arrival (two pulses, ~80ms apart)

import Foundation
import UIKit
import React

@objc(RNAstaHaptics)
class RNAstaHaptics: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool { return false }

  @objc(trigger:)
  func trigger(_ pattern: NSString) {
    DispatchQueue.main.async {
      switch pattern as String {
      case "light":
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
      case "medium":
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
      case "heavy":
        UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
      case "tick":
        UISelectionFeedbackGenerator().selectionChanged()
      case "paired-heavy":
        let g = UIImpactFeedbackGenerator(style: .heavy)
        g.impactOccurred()
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.08) {
          g.impactOccurred()
        }
      default:
        break
      }
    }
  }
}
