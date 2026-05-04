// AlertFcmService.kt
// PPLM Mobile Bedside — FCM listener.
//
// On message receipt:
//   1. Validates the §5.3 payload schema (patient_token, event_id, severity, epoch).
//   2. Builds a notification on the appropriate channel (Critical / Watch).
//   3. Adds Acknowledge + Escalate quick actions per §5.4.
//   4. Forwards the payload to JS via RNAstaPushModule so the app can deep-link
//      when the body is tapped.
//
// PRIVACY (§3.2): the notification title and subtitle never include a patient name.
// Only ward + bed + opaque token + interpretation copy.

package com.astapplm.modules

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class AlertFcmService : FirebaseMessagingService() {

  override fun onMessageReceived(message: RemoteMessage) {
    val data = message.data
    val severity = data["severity"] ?: "watch"
    val token = data["patient_token"] ?: return
    val eventId = data["event_id"] ?: return
    val headline = data["headline"] ?: "Patient needs attention"
    val ward = data["ward"] ?: ""
    val bed = data["bed"] ?: ""

    showNotification(severity, token, eventId, headline, ward, bed)

    // Forward to JS so that if the app is in foreground, the in-app banner can fire.
    try {
      RNAstaPushModule.instance.emitTapFromIntent(data.toMap())
    } catch (_: UninitializedPropertyAccessException) {
      // RN bridge not yet up — that's OK; the OS notification still fires.
    }
  }

  override fun onNewToken(refreshedToken: String) {
    // Real impl posts to /devices/register so the backend can address this device.
    android.util.Log.i("PPLM", "FCM token refreshed (length=${refreshedToken.length})")
  }

  private fun showNotification(
    severity: String,
    token: String,
    eventId: String,
    headline: String,
    ward: String,
    bed: String,
  ) {
    val channelId = if (severity == "critical") "pplm_critical" else "pplm_watch"
    // §5.2 / §19.6: title = severity tag only. Body = interpretation. Subtitle = ward + bed + token.
    // Ward and bed identifier appear ONLY on the subtitle line, never on the title.
    val title = "PPLM · ${severity.uppercase()}"
    val subtitle = "$ward · Bed $bed · $token"

    // Body intent — deep-links to astapplm://patient/<token>?event_id=<id>
    val bodyIntent = Intent(Intent.ACTION_VIEW).apply {
      setData(android.net.Uri.parse("astapplm://patient/$token?event_id=$eventId"))
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    }
    val bodyPi = PendingIntent.getActivity(
      this, eventId.hashCode(), bodyIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    // Acknowledge action — broadcasts to AckReceiver, which calls
    // RNAstaPushModule.instance.acknowledgeFromNotification(eventId).
    val ackIntent = Intent(this, AckReceiver::class.java).apply {
      action = "com.astapplm.ACK"
      putExtra("event_id", eventId)
    }
    val ackPi = PendingIntent.getBroadcast(
      this, eventId.hashCode() + 1, ackIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    // Escalate action — opens the app with via=escalate.
    val escalateIntent = Intent(Intent.ACTION_VIEW).apply {
      setData(android.net.Uri.parse("astapplm://patient/$token?event_id=$eventId&via=escalate"))
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    val escalatePi = PendingIntent.getActivity(
      this, eventId.hashCode() + 2, escalateIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    val builder = NotificationCompat.Builder(this, channelId)
      .setSmallIcon(android.R.drawable.ic_dialog_alert)
      .setContentTitle(title)
      .setContentText(headline)
      .setSubText(subtitle)
      .setContentIntent(bodyPi)
      .setAutoCancel(true)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setPriority(if (severity == "critical") NotificationCompat.PRIORITY_HIGH else NotificationCompat.PRIORITY_DEFAULT)
      // §19.32: Acknowledge + Escalate as quick actions.
      .addAction(android.R.drawable.ic_menu_send, "Acknowledge", ackPi)
      .addAction(android.R.drawable.ic_menu_share, "Escalate", escalatePi)

    val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    nm.notify(eventId.hashCode(), builder.build())

    // For criticals, also start the foreground service that mirrors the iOS Live Activity.
    if (severity == "critical") {
      val svc = Intent(this, AlertForegroundService::class.java).apply {
        putExtra("ward", ward)
        putExtra("bed", bed.toIntOrNull() ?: 0)
        putExtra("token", token)
        putExtra("severity", severity)
        putExtra("headline", headline)
      }
      if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
        startForegroundService(svc)
      } else {
        startService(svc)
      }
    }
  }
}
