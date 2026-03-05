package com.truckmitr.utils

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.util.Log

object StorageUtils {
    private const val TAG = "StorageUtils"
    private const val DB_NAME = "RKStorage"
    private const val TABLE_NAME = "catalystLocalStorage"
    private const val COLUMN_KEY = "key"
    private const val COLUMN_VALUE = "value"

    /**
     * Retrieves the @user_token from React Native's AsyncStorage (SQLite).
     * This allows native code to access the user's session token even in Kill Mode.
     */
    fun getUserToken(context: Context): String? {
        var db: SQLiteDatabase? = null
        var token: String? = null
        try {
            val dbPath = context.getDatabasePath(DB_NAME).absolutePath
            db = SQLiteDatabase.openDatabase(dbPath, null, SQLiteDatabase.OPEN_READONLY)
            
            val query = "SELECT $COLUMN_VALUE FROM $TABLE_NAME WHERE $COLUMN_KEY = ?"
            val cursor = db.rawQuery(query, arrayOf("@user_token"))
            
            if (cursor.moveToFirst()) {
                token = cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_VALUE))
            }
            cursor.close()
            Log.d(TAG, "Successfully retrieved token from SQLite. Length: ${token?.length ?: 0}")
        } catch (e: Exception) {
            Log.e(TAG, "Error reading AsyncStorage from SQLite: ${e.message}")
        } finally {
            db?.close()
        }
        return token
    }
}
