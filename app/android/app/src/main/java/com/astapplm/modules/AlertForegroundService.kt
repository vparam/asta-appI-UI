// AlertForegroundService.kt
// PPLM Mobile Bedside — Android equivalent of iOS Live Activity per spec §12.2.
// While a critical alert is unacknowledged, a persistent foreground notification
// shows ward + bed + token + time-since-fire. NEVER displays a patient name.

package com.astapplm.modules

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

class AlertForegroundService : Service() {

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val ward = intent?.getStringExtra("ward") ?: "Trail ward"
    val bed = intent?.getIntExtra("bed", 0) ?: 0
    val token = intent?.getStringExtra("token") ?: ""
    val severity = intent?.getStringExtra("severity") ?: "watch"
    val headline = intent?.getStringExtra("headline") ?: ""

    // §5.2 / §19.6: title carries severity only; ward/bed/token live in the subText.
    val notif: Notification = NotificationCompat.Builder(this, "pplm_critical")
      .setSmallIcon(android.R.drawable.ic_dialog_alert)
      .setContentTitle("PPLM · ${severity.uppercase()}")
      .setContentText(headline)
      .setSubText("$ward · Bed $bed · $token")
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .build()

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(NOTIF_ID, notif, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
    } else {
      startForeground(NOTIF_ID, notif)
    }
    return START_STICKY
  }

  companion object {
    const val NOTIF_ID = 4242
  }
}
