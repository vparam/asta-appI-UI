// RNAstaLiveActivity.swift
// JS bridge for starting / updating / ending an Alert Live Activity.
// Spec §12.1 — Live Activity is published when an alert is unacknowledged
// and dismissed when acknowledged.

import Foundation
import ActivityKit
import React

@objc(RNAstaLiveActivity)
class RNAstaLiveActivity: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool { return false }

  @available(iOS 16.1, *)
  private var current: Activity<AlertActivityAttributes>?

  @objc(start:resolver:rejecter:)
  func start(_ payload: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock,
             rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard #available(iOS 16.1, *) else {
      reject("unsupported", "Live Activities require iOS 16.1+", nil); return
    }
    guard
      let alertId = payload["alertId"] as? String,
      let severity = payload["severity"] as? String,
      let headline = payload["headline"] as? String,
      let ward = payload["ward"] as? String,
      let bed = payload["bed"] as? Int,
      let token = payload["token"] as? String,
      let epoch = payload["firedAtEpoch"] as? Int
    else {
      reject("invalid_payload", "missing required fields", nil); return
    }

    let attrs = AlertActivityAttributes(alertId: alertId)
    let state = AlertActivityAttributes.LiveContent(
      severity: severity, headline: headline, ward: ward,
      bed: bed, token: token, firedAtEpoch: epoch
    )

    do {
      let activity = try Activity.request(
        attributes: attrs,
        content: .init(state: state, staleDate: nil),
        pushType: nil
      )
      self.current = activity
      resolve(activity.id)
    } catch {
      reject("start_failed", error.localizedDescription, error)
    }
  }

  @objc(end)
  func end() {
    guard #available(iOS 16.1, *) else { return }
    Task {
      await self.current?.end(nil, dismissalPolicy: .immediate)
      self.current = nil
    }
  }
}
