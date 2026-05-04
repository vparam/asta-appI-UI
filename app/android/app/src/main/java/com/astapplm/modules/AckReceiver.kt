// AckReceiver.kt
// Receives the Acknowledge quick action from the FCM-built notification.
// Forwards to RNAstaPushModule which writes the audit row (§5.4) and emits
// PushTapped to JS so any open patient screen can dismiss the alert strip.

package com.astapplm.modules

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class AckReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val eventId = intent.getStringExtra("event_id") ?: return
    try {
      RNAstaPushModule.instance.acknowledgeFromNotification(eventId)
    } catch (_: UninitializedPropertyAccessException) {
      // RN bridge not loaded; the audit row will be written when the app
      // next boots and drains the offline queue.
    }
    // Cancel the notification.
    val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    nm.cancel(eventId.hashCode())
  }
}
