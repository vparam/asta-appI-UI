// AlertFcmService.kt
// PPLM Mobile Bedside — FCM listener.
// On message receipt, validates the payload and forwards to JS via RNAstaPushModule.

package com.astapplm.modules

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat

// Implementation note: this would extend FirebaseMessagingService in production.
// We keep the imports out so the file compiles without the firebase-messaging
// dependency installed; uncomment when wiring real FCM.
//
// class AlertFcmService : com.google.firebase.messaging.FirebaseMessagingService() {
//   override fun onMessageReceived(message: com.google.firebase.messaging.RemoteMessage) {
//     val data = message.data
//     val severity = data["severity"] ?: "watch"
//     val token = data["patient_token"] ?: return
//     val eventId = data["event_id"] ?: return
//
//     // Show the notification, then forward the payload to JS.
//     showNotification(severity, token, eventId, data["headline"] ?: "Alert")
//     RNAstaPushModule.instance.emitTapFromIntent(data.toMap())
//   }
//
//   private fun showNotification(severity: String, token: String, eventId: String, headline: String) {
//     val channel = if (severity == "critical") "pplm_critical" else "pplm_watch"
//     val notif = NotificationCompat.Builder(this, channel)
//       .setSmallIcon(android.R.drawable.ic_dialog_alert)
//       .setContentTitle("PPLM · ${severity.uppercase()} · $token")
//       .setContentText(headline)
//       .setAutoCancel(true)
//       .build()
//     val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
//     nm.notify(eventId.hashCode(), notif)
//   }
// }
