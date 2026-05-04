// RNAstaPushModule.kt
// PPLM Mobile Bedside — FCM bridge per spec §12.2.
// Three notification channels: Critical / Watch / Digest.

package com.astapplm.modules

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class RNAstaPushModule(private val ctx: ReactApplicationContext) :
  ReactContextBaseJavaModule(ctx) {

  companion object { lateinit var instance: RNAstaPushModule }

  init { instance = this }

  override fun getName(): String = "RNAstaPush"

  @ReactMethod
  fun registerForRemoteNotifications(promise: Promise) {
    createChannels()
    // Real impl uses FirebaseMessaging.getInstance().token; stubbed for the MVP.
    promise.resolve("pending")
  }

  @ReactMethod
  fun acknowledgeFromNotification(eventId: String) {
    // Audit row — see §5.4. Real impl posts to /alerts/:id/ack.
    android.util.Log.i("PPLM", "ack from notification quick action — event=$eventId")
    val map = Arguments.createMap().apply {
      putString("event_id", eventId)
      putString("via", "notification")
    }
    emit("PushTapped", map)
  }

  fun emitTapFromIntent(payload: Map<String, Any?>) {
    val map = Arguments.createMap()
    payload.forEach { (k, v) ->
      when (v) {
        is String -> map.putString(k, v)
        is Int -> map.putInt(k, v)
        is Double -> map.putDouble(k, v)
        else -> map.putString(k, v?.toString())
      }
    }
    emit("PushTapped", map)
  }

  private fun emit(name: String, body: WritableMap) {
    ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(name, body)
  }

  private fun createChannels() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    listOf(
      NotificationChannel("pplm_critical", "PPLM Critical", NotificationManager.IMPORTANCE_HIGH).apply {
        description = "Patient at critical risk; ignores Do Not Disturb."
        setBypassDnd(true)
      },
      NotificationChannel("pplm_watch", "PPLM Watch", NotificationManager.IMPORTANCE_DEFAULT).apply {
        description = "Patient needs attention; respects quiet hours."
      },
      NotificationChannel("pplm_digest", "PPLM Digest", NotificationManager.IMPORTANCE_LOW).apply {
        description = "Roll-up of suppressed watch alerts."
      },
    ).forEach { nm.createNotificationChannel(it) }
  }
}
