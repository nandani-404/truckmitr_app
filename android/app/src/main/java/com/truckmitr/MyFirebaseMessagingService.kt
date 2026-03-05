package com.truckmitr

import android.util.Log
import com.google.firebase.messaging.RemoteMessage
import io.invertase.firebase.messaging.ReactNativeFirebaseMessagingService

class MyFirebaseMessagingService : ReactNativeFirebaseMessagingService() {

    companion object {
        private const val TAG = "MyFirebaseMessagingService"
    }

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "🚀 MyFirebaseMessagingService Created")
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        val data = remoteMessage.data
        
        // --- CRITICAL DEBUG LOGS ---
        Log.d(TAG, "--------------------------------------------------")
        Log.d(TAG, "✉️ NATIVE MESSAGE RECEIVED (onMessageReceived)")
        Log.d(TAG, "Priority: ${remoteMessage.priority} (Expected: 1 for High)")
        Log.d(TAG, "Data: $data")
        Log.d(TAG, "--------------------------------------------------")

        // If it's a video call, handle natively and DO NOT call super
        if (data.containsKey("type") && data["type"] == "VIDEO_CALL") {
            Log.d(TAG, "✅ Handling Video Call natively...")
            
            val callerName = data["callerName"] ?: "Unknown"
            val callId = data["call_id"] ?: data["callId"] ?: ""
            val channelName = data["channelName"] ?: ""
            val agoraToken = data["agoraToken"] ?: ""

            IncomingCallModule.showIncomingCallNotification(
                this.applicationContext,
                callerName,
                callId,
                channelName,
                agoraToken
            )
            // DO NOT call super.onMessageReceived(remoteMessage) here.
            // This prevents the RN Firebase library from trying to start the Headless JS service.
        } else if (data.containsKey("type") && data["type"] == "CALL_ENDED") {
            Log.d(TAG, "🤙 CALL_ENDED received. Dismissing native call UI...")
            IncomingCallModule.stopCallService(this.applicationContext)
            IncomingCallModule.dismissIncomingCallActivity(this.applicationContext)
            // No need to forward CALL_ENDED to standard RN handler if native dismisses it
        } else {
            Log.d(TAG, "Forwarding to standard RN handler...")
            super.onMessageReceived(remoteMessage)
        }
    }
}
