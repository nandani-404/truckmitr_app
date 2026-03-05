package com.truckmitr.utils

import android.content.Context
import android.util.Log
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException

object ApiUtils {
    private const val TAG = "ApiUtils"
    private const val BASE_URL = "https://devtruckmitr.in/"
    private val client = OkHttpClient()

    /**
     * Hits the rejection API natively.
     * Uses the token retrieved by StorageUtils.
     */
    fun rejectCall(context: Context, callId: String) {
        makeCallApi(context, "reject", callId)
    }

    /**
     * Hits the acceptance API natively.
     */
    fun acceptCall(context: Context, callId: String) {
        makeCallApi(context, "accept", callId)
    }

    /**
     * Hits the end API natively.
     */
    fun endCall(context: Context, callId: String) {
        makeCallApi(context, "end", callId)
    }

    private fun makeCallApi(context: Context, action: String, callId: String) {
        val token = StorageUtils.getUserToken(context)
        if (token == null) {
            Log.e(TAG, "Cannot $action call: Token is null")
            return
        }

        val url = "${BASE_URL}api/call/$action"
        
        val isNumeric = callId.toLongOrNull() != null
        val json = if (isNumeric) {
            """{"call_id": $callId}"""
        } else {
            """{"call_id": "$callId"}"""
        }
        
        val body = json.toRequestBody("application/json; charset=utf-8".toMediaType())

        val request = Request.Builder()
            .url(url)
            .post(body)
            .addHeader("Authorization", "Bearer $token")
            .addHeader("Accept", "application/json")
            .build()

        Log.d(TAG, "Sending $action request to: $url")

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e(TAG, "Failed to send $action: ${e.message}")
            }

            override fun onResponse(call: Call, response: Response) {
                response.use {
                    if (!response.isSuccessful) {
                        Log.e(TAG, "$action API failed with code: ${response.code}")
                        Log.e(TAG, "Error body: ${response.body?.string()}")
                    } else {
                        Log.d(TAG, "$action successful for callId: $callId")
                    }
                }
            }
        })
    }
}
