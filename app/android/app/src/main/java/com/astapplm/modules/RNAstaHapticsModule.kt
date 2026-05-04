// RNAstaHapticsModule.kt
// PPLM Mobile Bedside — Android haptics per spec §13.6.

package com.astapplm.modules

import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class RNAstaHapticsModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "RNAstaHaptics"

  private fun vibrator(): Vibrator? {
    val ctx = reactApplicationContext
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      val vm = ctx.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
      vm.defaultVibrator
    } else {
      @Suppress("DEPRECATION")
      ctx.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
    }
  }

  @ReactMethod
  fun trigger(pattern: String) {
    val v = vibrator() ?: return
    when (pattern) {
      "light" -> v.vibrate(VibrationEffect.createOneShot(20, 80))
      "medium" -> v.vibrate(VibrationEffect.createOneShot(40, 160))
      "heavy" -> v.vibrate(VibrationEffect.createOneShot(60, 220))
      "tick" -> v.vibrate(VibrationEffect.createOneShot(10, 60))
      "paired-heavy" ->
        v.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 60, 80, 60), intArrayOf(0, 220, 0, 220), -1))
    }
  }
}
