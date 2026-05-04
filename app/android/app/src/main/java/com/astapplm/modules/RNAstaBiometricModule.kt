// RNAstaBiometricModule.kt
// PPLM Mobile Bedside — Android biometric per spec §12.2.
// Strong biometric (Class 3) only. Falls back to device credential.

package com.astapplm.modules

import android.app.Activity
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.fragment.app.FragmentActivity
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.util.concurrent.Executors

class RNAstaBiometricModule(private val ctx: ReactApplicationContext) :
  ReactContextBaseJavaModule(ctx) {

  override fun getName(): String = "RNAstaBiometric"

  @ReactMethod
  fun authenticate(reason: String, promise: Promise) {
    val activity = currentActivity as? FragmentActivity
      ?: run {
        promise.reject("no_activity", "No FragmentActivity available")
        return
      }

    val executor = Executors.newSingleThreadExecutor()
    val prompt = BiometricPrompt(activity, executor, object : BiometricPrompt.AuthenticationCallback() {
      override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
        promise.resolve(true)
      }
      override fun onAuthenticationError(code: Int, err: CharSequence) {
        promise.resolve(false)
      }
      override fun onAuthenticationFailed() {
        // Allow retries — don't reject yet.
      }
    })

    val info = BiometricPrompt.PromptInfo.Builder()
      .setTitle("PPLM Bedside")
      .setSubtitle(reason)
      .setAllowedAuthenticators(
        BiometricManager.Authenticators.BIOMETRIC_STRONG or
          BiometricManager.Authenticators.DEVICE_CREDENTIAL
      )
      .build()

    activity.runOnUiThread { prompt.authenticate(info) }
  }
}
