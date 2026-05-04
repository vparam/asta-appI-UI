// RNAstaPush.swift
// PPLM Mobile Bedside — APNs registration, deep-link handoff, ack from notification.
// Spec §5 (push pipeline), §5.3 (payload schema), §5.4 (acknowledge / escalate).
//
// IMPORTANT (spec §5.2): the notification body NEVER contains a patient name.
// Title:     "PPLM · WATCH · Bed 4"
// Body:      "Possible early sepsis pattern — monitor lactate, BP, urine"
// Subtitle:  "Trail ward · Bed 4 · Risk 19/100 · PT-9K2X"
// All three are populated server-side. This module only routes events.

import Foundation
import UIKit
import UserNotifications
import React

@objc(RNAstaPush)
class RNAstaPush: RCTEventEmitter {

  static var shared: RNAstaPush?

  override init() {
    super.init()
    RNAstaPush.shared = self
  }

  override static func requiresMainQueueSetup() -> Bool { return true }

  override func supportedEvents() -> [String]! {
    return ["PushTapped", "PushRegistered"]
  }

  // MARK: registration

  @objc(registerForRemoteNotifications:rejecter:)
  func registerForRemoteNotifications(_ resolve: @escaping RCTPromiseResolveBlock,
                                      rejecter reject: @escaping RCTPromiseRejectBlock) {
    let center = UNUserNotificationCenter.current()
    // Request critical alert + time sensitive — Time Sensitive needs the Time Sensitive
    // entitlement, Critical needs Apple's special entitlement (assume 4 weeks lead time).
    var options: UNAuthorizationOptions = [.alert, .badge, .sound]
    if #available(iOS 15.0, *) {
      options.insert(.criticalAlert)
    }
    center.requestAuthorization(options: options) { granted, err in
      if let e = err {
        reject("permission_denied", e.localizedDescription, e); return
      }
      guard granted else { resolve(NSNull()); return }
      DispatchQueue.main.async {
        UIApplication.shared.registerForRemoteNotifications()
      }
      // The actual APNs token arrives in AppDelegate's didRegisterForRemoteNotifications;
      // the resolver returns a stub here — the real token is forwarded via the
      // PushRegistered event.
      resolve("pending")
    }
  }

  // MARK: ack from notification

  @objc(acknowledgeFromNotification:)
  func acknowledgeFromNotification(_ eventId: NSString) {
    // Audit row written here — spec §5.4 requires action_source to be recorded.
    // In production this calls the audit endpoint. For the MVP we just log.
    NSLog("[PPLM] ack from notification quick action — event=\(eventId)")
    // Forward to JS so the UI dismisses the alert strip if open.
    self.sendEvent(withName: "PushTapped", body: ["event_id": eventId, "via": "notification"])
  }

  // MARK: AppDelegate hooks

  @objc func appDelegateDidRegister(_ token: Data) {
    let hex = token.map { String(format: "%02.2hhx", $0) }.joined()
    sendEvent(withName: "PushRegistered", body: ["token": hex])
  }

  @objc func appDelegateDidReceive(_ userInfo: [AnyHashable: Any]) {
    // Validate payload shape before forwarding.
    guard
      let payload = userInfo as? [String: Any],
      let token = payload["patient_token"] as? String,
      let eventId = payload["event_id"] as? String,
      let severity = payload["severity"] as? String
    else { return }
    let body: [String: Any] = [
      "patient_token": token,
      "event_id": eventId,
      "severity": severity,
      "epoch": payload["epoch"] ?? Int(Date().timeIntervalSince1970)
    ]
    sendEvent(withName: "PushTapped", body: body)
  }
}
