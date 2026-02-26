package com.truckmitr

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat

/**
 * Foreground service that makes the incoming call notification non-dismissable.
 * Building the notification inside the service ensures startForeground() is called
 * immediately upon start, preventing the "Foreground Service did not start in time" crash.
 */
class IncomingCallService : Service() {

    companion object {
        const val TAG = "IncomingCallService"
        const val ACTION_STOP = "STOP"
        const val ACTION_START = "START"
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action

        if (action == ACTION_STOP) {
            Log.d(TAG, "Stopping foreground service")
            stopForeground(STOP_FOREGROUND_REMOVE)
            stopSelf()
            return START_NOT_STICKY
        }

        // Action is START or default
        val callerName = intent?.getStringExtra("callerName") ?: "Unknown"
        val callId = intent?.getStringExtra("callId") ?: ""
        val channelName = intent?.getStringExtra("channelName") ?: ""
        val agoraToken = intent?.getStringExtra("agoraToken") ?: ""

        Log.d(TAG, "Starting foreground service for call: $callId")
        
        val notification = buildCallNotification(callerName, callId, channelName, agoraToken)

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                startForeground(IncomingCallModule.NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SHORT_SERVICE)
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(IncomingCallModule.NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SHORT_SERVICE)
            } else {
                startForeground(IncomingCallModule.NOTIFICATION_ID, notification)
            }
            Log.d(TAG, "✅ startForeground called successfully")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to startForeground: ${e.message}")
            // Even if startForeground fails, we must try to stop self or it might hang
            stopSelf()
        }

        return START_NOT_STICKY
    }

    private fun buildCallNotification(
        callerName: String,
        callId: String,
        channelName: String,
        agoraToken: String
    ): Notification {
        val context = this
        val ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)

        // Intent for Accept action
        val acceptIntent = Intent(context, IncomingCallActivity::class.java).apply {
            action = "ACTION_ACCEPT_CALL"
            putExtra("caller_name", callerName)
            putExtra("call_id", callId)
            putExtra("channel_name", channelName)
            putExtra("agora_token", agoraToken)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val acceptPending = PendingIntent.getActivity(
            context, 1, acceptIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Intent for Decline action
        val declineIntent = Intent(context, IncomingCallActivity::class.java).apply {
            action = "ACTION_DECLINE_CALL"
            putExtra("call_id", callId)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        val declinePending = PendingIntent.getActivity(
            context, 2, declineIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Full-screen intent
        val fullScreenIntent = Intent(context, IncomingCallActivity::class.java).apply {
            action = "ACTION_FULL_SCREEN_CALL"
            putExtra("caller_name", callerName)
            putExtra("call_id", callId)
            putExtra("channel_name", channelName)
            putExtra("agora_token", agoraToken)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val fullScreenPending = PendingIntent.getActivity(
            context, 3, fullScreenIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(context, IncomingCallModule.CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("Incoming Video Call")
            .setContentText("$callerName is calling...")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setOngoing(true)
            .setAutoCancel(false)
            .setSound(ringtoneUri)
            .setVibrate(longArrayOf(0, 1000, 500, 1000, 500, 1000))
            .setFullScreenIntent(fullScreenPending, true)
            .addAction(android.R.drawable.ic_menu_call, "✅ Accept", acceptPending)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "❌ Decline", declinePending)
            .setTimeoutAfter(30000)
            .build()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "Service destroyed")
    }
}
