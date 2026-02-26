package com.truckmitr

import android.os.Bundle
import android.util.Log
import android.view.View
import android.view.WindowManager
import android.app.Activity
import android.widget.TextView
import android.widget.LinearLayout
import androidx.appcompat.widget.AppCompatButton
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.BroadcastReceiver
import android.os.Build
import android.app.KeyguardManager
import android.app.NotificationManager
import android.media.Ringtone
import android.media.RingtoneManager
import android.os.Vibrator
import android.os.VibrationEffect
import java.util.*

class IncomingCallActivity : Activity() {

    private var timer: Timer? = null
    private var secondsElapsed = 0
    private var ringtone: Ringtone? = null
    private var vibrator: Vibrator? = null

    companion object {
        const val TAG = "IncomingCallActivity"
    }

    private val dismissReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == "com.truckmitr.DISMISS_CALL_ACTIVITY") {
                Log.d(TAG, "Dismissing activity via broadcast")
                handleDecline()
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Ensure this activity shows over the lock screen
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
            )
        }

        setContentView(R.layout.activity_incoming_call)
        
        // Register dismiss receiver
        val filter = IntentFilter("com.truckmitr.DISMISS_CALL_ACTIVITY")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(dismissReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(dismissReceiver, filter)
        }

        Log.d(TAG, "onCreate, action: ${intent.action}")

        // Initialize Ringtone and Vibration
        startRingtone()

        val callerName = intent.getStringExtra("caller_name") ?: "Unknown"
        val tvCallerName = findViewById<TextView>(R.id.tvCallerName)
        tvCallerName.text = callerName

        // Cancel the notification and stop the foreground service
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.cancel(IncomingCallModule.NOTIFICATION_ID)
        IncomingCallModule.stopCallService(this)

        val layoutIncoming = findViewById<LinearLayout>(R.id.layoutIncoming)
        val layoutActive = findViewById<LinearLayout>(R.id.layoutActive)
        val btnAccept = findViewById<AppCompatButton>(R.id.btnAccept)
        val btnDecline = findViewById<AppCompatButton>(R.id.btnDecline)
        val btnEndCall = findViewById<AppCompatButton>(R.id.btnEndCall)

        btnAccept.setOnClickListener { handleAccept() }
        btnDecline.setOnClickListener { handleDecline() }
        btnEndCall.setOnClickListener { handleDecline() }

        when (intent.action) {
            "ACTION_ACCEPT_CALL" -> handleAccept()
            "ACTION_DECLINE_CALL" -> handleDecline()
            "ACTION_FULL_SCREEN_CALL" -> {
                layoutIncoming.visibility = View.VISIBLE
                layoutActive.visibility = View.GONE
            }
            else -> {
                Log.w(TAG, "Unknown action: ${intent.action}")
                layoutIncoming.visibility = View.VISIBLE
            }
        }
    }

    private fun startRingtone() {
        try {
            val ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            ringtone = RingtoneManager.getRingtone(applicationContext, ringtoneUri)
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                ringtone?.audioAttributes = android.media.AudioAttributes.Builder()
                    .setUsage(android.media.AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                    .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
            }
            
            ringtone?.play()

            vibrator = getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator?.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 1000, 500, 1000), 0))
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(longArrayOf(0, 1000, 500, 1000), 0)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error starting ringtone: ${e.message}")
        }
    }

    private fun stopRingtone() {
        try {
            ringtone?.stop()
            vibrator?.cancel()
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping ringtone: ${e.message}")
        }
    }

    private fun handleAccept() {
        stopRingtone()
        
        val callerName = intent.getStringExtra("caller_name") ?: "Unknown"
        val callId = intent.getStringExtra("call_id") ?: ""
        val channelName = intent.getStringExtra("channel_name") ?: ""
        val agoraToken = intent.getStringExtra("agora_token") ?: ""

        Log.d(TAG, "Call accepted: caller=$callerName, callId=$callId")

        // Switch UI to Active State
        findViewById<LinearLayout>(R.id.layoutIncoming).visibility = View.GONE
        findViewById<LinearLayout>(R.id.layoutActive).visibility = View.VISIBLE
        findViewById<TextView>(R.id.tvTimer).visibility = View.VISIBLE
        findViewById<TextView>(R.id.tvCallStatus).text = "In Call"
        
        startTimer()

        // Sync with Module so RN can get data
        IncomingCallModule.activeCallData = Bundle().apply {
            putString("caller_name", callerName)
            putString("call_id", callId)
            putString("channel_name", channelName)
            putString("agora_token", agoraToken)
        }

        // 1. Start MainActivity to prepare RN
        val mainIntent = Intent(this, MainActivity::class.java).apply {
            action = "ACTION_ACCEPT_CALL"
            putExtra("caller_name", callerName)
            putExtra("call_id", callId)
            putExtra("channel_name", channelName)
            putExtra("agora_token", agoraToken)
            // Use NEW_TASK and CLEAR_TOP to ensure the app comes to the foreground from killed state
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }
        
        Log.d(TAG, "Launching MainActivity to bring app to foreground")
        startActivity(mainIntent)

        // 2. Dismiss Keyguard so the app opens or prompts for unlock
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            val keyguardManager = getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
            keyguardManager.requestDismissKeyguard(this, object : KeyguardManager.KeyguardDismissCallback() {
                override fun onDismissSucceeded() {
                    super.onDismissSucceeded()
                    Log.d(TAG, "Keyguard dismissal succeeded, finishing native activity to show app")
                    finish()
                }

                override fun onDismissCancelled() {
                    super.onDismissCancelled()
                    Log.d(TAG, "Keyguard dismissal cancelled")
                }

                override fun onDismissError() {
                    super.onDismissError()
                    Log.e(TAG, "Keyguard dismissal error")
                }
            })
        } else {
            // On older versions, we already added flags in onCreate, but let's finish to be safe 
            // if we want to show the app immediately.
            // finish()
        }
        
        // We stay in this activity if dismissal is still pending (e.g. user needs to enter PIN)
    }

    private fun startTimer() {
        timer = Timer()
        val tvTimer = findViewById<TextView>(R.id.tvTimer)
        timer?.scheduleAtFixedRate(object : TimerTask() {
            override fun run() {
                secondsElapsed++
                runOnUiThread {
                    val minutes = secondsElapsed / 60
                    val seconds = secondsElapsed % 60
                    tvTimer.text = String.format("%02d:%02d", minutes, seconds)
                }
            }
        }, 1000, 1000)
    }

    private fun handleDecline() {
        stopRingtone()
        val callId = intent.getStringExtra("call_id") ?: ""
        Log.d(TAG, "Call declined/ended: callId=$callId")
        timer?.cancel()
        IncomingCallModule.activeCallData = null
        finish()
    }

    override fun onDestroy() {
        super.onDestroy()
        stopRingtone()
        try {
            unregisterReceiver(dismissReceiver)
        } catch (e: Exception) {}
        timer?.cancel()
    }
}
