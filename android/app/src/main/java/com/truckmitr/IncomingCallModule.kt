package com.truckmitr

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import androidx.core.app.NotificationCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.truckmitr.utils.ApiUtils

class IncomingCallModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    @ReactMethod
    fun endCall(callId: String) {
        Log.d(TAG, "endCall called from JS: callId=$callId")
        ApiUtils.endCall(reactContext, callId)
    }

    @ReactMethod
    fun canUseFullScreenIntent(promise: Promise) {
        if (Build.VERSION.SDK_INT < 34) {
            promise.resolve(true)
            return
        }
        val notificationManager = reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        promise.resolve(notificationManager.canUseFullScreenIntent())
    }

    @ReactMethod
    fun openFullScreenIntentSettings() {
        if (Build.VERSION.SDK_INT >= 34) {
            try {
                val intent = Intent(android.provider.Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT)
                intent.data = android.net.Uri.parse("package:${reactContext.packageName}")
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                reactContext.startActivity(intent)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to open Full Screen Intent settings", e)
                // Fallback to app details
                val intent = Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
                intent.data = android.net.Uri.parse("package:${reactContext.packageName}")
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                reactContext.startActivity(intent)
            }
        }
    }

    companion object {
        const val TAG = "IncomingCallModule"
        const val CHANNEL_ID = "incoming_calls"
        const val NOTIFICATION_ID = 9999
        var activeCallData: Bundle? = null

        /**
         * Static helper to show the incoming call notification.
         * Can be called from the Module (React Native side) or the FCM Service (native side).
         */
        fun showIncomingCallNotification(
            context: Context,
            callerName: String,
            callId: String,
            channelName: String,
            agoraToken: String
        ) {
            Log.d(TAG, "🔔 showIncomingCallNotification starting for: $callerName (callId: $callId)")

            // Store call data globally so RN can retrieve it via getCallData()
            activeCallData = Bundle().apply {
                putString("caller_name", callerName)
                putString("call_id", callId)
                putString("channel_name", channelName)
                putString("agora_token", agoraToken)
            }

            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            createNotificationChannel(notificationManager)

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

            // Start the non-dismissable foreground service instead of just posting a notification
            try {
                val serviceIntent = Intent(context, IncomingCallService::class.java).apply {
                    action = "START"
                    putExtra("callerName", callerName)
                    putExtra("callId", callId)
                    putExtra("channelName", channelName)
                    putExtra("agoraToken", agoraToken)
                }

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent)
                } else {
                    context.startService(serviceIntent)
                }
                Log.d(TAG, "✅ IncomingCallService started successfully")
            } catch (e: Exception) {
                Log.e(TAG, "❌ Failed to start IncomingCallService: ${e.message}")
            }
        }

        /**
         * Stops the foreground service and removes the notification.
         */
        fun stopCallService(context: Context) {
            val serviceIntent = Intent(context, IncomingCallService::class.java).apply {
                action = "STOP"
            }
            context.startService(serviceIntent)
            Log.d(TAG, "🛑 Stop signal sent to IncomingCallService")
        }

        private fun createNotificationChannel(notificationManager: NotificationManager) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val existingChannel = notificationManager.getNotificationChannel(CHANNEL_ID)
                if (existingChannel != null) return

                val ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
                val audioAttributes = AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()

                val channel = NotificationChannel(
                    CHANNEL_ID,
                    "Incoming Calls",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Notifications for incoming video calls"
                    setSound(ringtoneUri, audioAttributes)
                    enableVibration(true)
                    vibrationPattern = longArrayOf(0, 1000, 500, 1000, 500, 1000)
                    lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
                    setBypassDnd(true)
                }
                notificationManager.createNotificationChannel(channel)
            }
        }

        /**
         * Sends a broadcast to dismiss the IncomingCallActivity.
         */
        fun dismissIncomingCallActivity(context: Context) {
            val intent = Intent("com.truckmitr.DISMISS_CALL_ACTIVITY")
            context.sendBroadcast(intent)
            Log.d(TAG, "Dismiss broadcast sent from static helper")
        }
    }

    override fun getName(): String = "IncomingCallModule"

    @ReactMethod
    fun getCallData(promise: Promise) {
        val data = activeCallData
        if (data != null) {
            val map = Arguments.createMap()
            map.putString("callerName", data.getString("caller_name"))
            map.putString("callId", data.getString("call_id"))
            map.putString("channelName", data.getString("channel_name"))
            map.putString("agoraToken", data.getString("agora_token"))
            promise.resolve(map)
        } else {
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun clearCallData() {
        activeCallData = null
        Log.d(TAG, "Call data cleared")
    }

    @ReactMethod
    fun dismissIncomingCallActivity() {
        val intent = Intent("com.truckmitr.DISMISS_CALL_ACTIVITY")
        reactContext.sendBroadcast(intent)
        Log.d(TAG, "Dismiss broadcast sent")
    }

    @ReactMethod
    fun showIncomingCall(callerName: String, callId: String, channelName: String, agoraToken: String) {
        showIncomingCallNotification(reactContext.applicationContext, callerName, callId, channelName, agoraToken)
    }

    @ReactMethod
    fun cancelCallNotification() {
        val notificationManager = reactContext.applicationContext
            .getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.cancel(NOTIFICATION_ID)
        stopCallService(reactContext.applicationContext)
        Log.d(TAG, "Call notification cancelled and service stopped")
    }
}
