// RNAstaBiometric.swift
// PPLM Mobile Bedside — Face ID / Touch ID gate per spec §12.1.
// Cold launch requires biometric unlock before patient data is revealed.
// Notification quick actions bypass this — they call ackFromNotification only.

import Foundation
import LocalAuthentication
import React

@objc(RNAstaBiometric)
class RNAstaBiometric: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool { return false }

  @objc(authenticate:resolver:rejecter:)
  func authenticate(_ reason: NSString, resolver resolve: @escaping RCTPromiseResolveBlock,
                    rejecter reject: @escaping RCTPromiseRejectBlock) {
    let ctx = LAContext()
    var err: NSError?

    guard ctx.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &err) else {
      // No biometric enrolment — fall back to passcode.
      ctx.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: reason as String) { ok, _ in
        resolve(ok)
      }
      return
    }

    ctx.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: reason as String) { ok, e in
      if let e = e {
        reject("auth_failed", e.localizedDescription, e)
        return
      }
      resolve(ok)
    }
  }
}
