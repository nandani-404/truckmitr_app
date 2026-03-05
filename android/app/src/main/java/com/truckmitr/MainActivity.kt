package com.truckmitr

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.zoontek.rnbootsplash.RNBootSplash

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "TruckMitr"

    override fun onCreate(savedInstanceState: Bundle?) {
        setTheme(R.style.MyTheme)
        RNBootSplash.init(this, R.style.BootTheme);
        super.onCreate(null)
        
        // Handle call acceptance if app was launched from killed state via notification
        if (intent?.action == "ACTION_ACCEPT_CALL") {
            android.util.Log.d("MainActivity", "📞 ACTION_ACCEPT_CALL received via onCreate")
            // The actual navigation will happen in Routes.tsx via getCallData()
            // but we can emit a backup event if needed.
        }
    }

    override fun onNewIntent(intent: android.content.Intent) {
        super.onNewIntent(intent)
        setIntent(intent) // Required for RN to see the latest intent
        
        // When an accept call intent arrives while app is in foreground,
        // emit an event so the RN side can navigate to the call screen
        if (intent.action == "ACTION_ACCEPT_CALL") {
            android.util.Log.d("MainActivity", "📞 ACTION_ACCEPT_CALL received via onNewIntent")
            try {
                val reactContext = reactInstanceManager?.currentReactContext
                reactContext?.getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    ?.emit("onCallAccepted", null)
            } catch (e: Exception) {
                android.util.Log.e("MainActivity", "Failed to emit onCallAccepted event: ${e.message}")
            }
        }
    }


    /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
