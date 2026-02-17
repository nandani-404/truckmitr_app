# Logout Cache Clear Fix

## Problem
When a user logged out and then logged in with a different role (e.g., logout as Trucker, login as Driver), the app would still show the previous user's home screen (Trucker home) instead of the correct role-based screen. This was caused by cached data in AsyncStorage and Redux state not being properly cleared on logout.

## Root Cause
1. **Incomplete AsyncStorage cleanup**: Only `@user_token` and `subscription_modal_closed_count` were being cleared, leaving other cached data like `SELECTED_MODULE`, `app_session_active`, etc.
2. **Redux state not reset**: The Redux store maintained the previous user's state even after logout
3. **Module selection persisting**: The `SELECTED_MODULE` in AsyncStorage was not cleared, causing the app to navigate to the wrong stack

## Solution Implemented

### 1. Enhanced AsyncStorage Cleanup (`src/utils/config/token.tsx`)
Updated `deleteUserData()` to clear all user-related data:
```typescript
export const deleteUserData = async () => {
    try {
        // Clear all user-related data from AsyncStorage
        await AsyncStorage.multiRemove([
            '@user_token',
            'subscription_modal_closed_count',
            'app_session_active',
            'SELECTED_MODULE',
            'PENDING_NOTIFICATION_SCREEN',
            'signup_incomplete',
        ]);
        console.log('User data and cache deleted successfully.');
    } catch (error) {
        console.log('Error deleting data from AsyncStorage:', error);
    }
};
```

### 2. Redux State Reset (`src/redux/reducers/index.tsx`)
Added logic to reset all Redux state to initial values on logout:
```typescript
const rootReducer = (state: any, action: any) => {
    // Reset all state to initial values on logout
    if (action.type === 'AUTH_LOGOUT' || action.type === 'USER_AUTHENTICATED' && action.payload === false) {
        state = undefined;
    }
    return appCombinedReducer(state, action)
}
```

### 3. Updated All Logout Handlers
Modified logout handlers in all profile screens to:
1. Clear AsyncStorage data first
2. Dispatch `AUTH_LOGOUT` action to reset Redux state
3. Dispatch `userAuthenticatedAction(false)` to trigger navigation to login

**Files Updated:**
- `src/app/layouts/Trucker/Profile/index.tsx`
- `src/app/layouts/main/profile/index.tsx`
- `src/app/layouts/foreman/foreman-home/foreman-profile/index.tsx`
- `src/app/layouts/association/driver-association-profile/index.tsx`
- `src/app/layouts/dhaba/dhabha-my-profile/index.tsx`
- `src/app/layouts/puncture/puncture-my-profile/index.tsx`

**Updated Pattern:**
```typescript
const handleLogoutConfirm = async () => {
    // ... analytics logging ...
    
    // Clear all user data and caches
    await deleteUserData();
    
    // Dispatch logout action to reset Redux state
    dispatch({ type: 'AUTH_LOGOUT' });
    dispatch(userAuthenticatedAction(false));
    
    setShowLogoutDialog(false);
};
```

## What Gets Cleared on Logout

### AsyncStorage Keys Removed:
- `@user_token` - Authentication token
- `subscription_modal_closed_count` - Subscription modal state
- `app_session_active` - Session flag
- `SELECTED_MODULE` - Module selection (hiring/foreman/association/etc.)
- `PENDING_NOTIFICATION_SCREEN` - Pending notification navigation
- `signup_incomplete` - Incomplete signup tracking

### Redux State Reset:
- All reducers return to their initial state
- User data cleared
- Subscription details cleared
- Job data cleared
- Driver data cleared
- App mode reset
- Auth state reset

## Testing
To verify the fix:
1. Login as a Trucker user
2. Navigate to Profile and logout
3. Login as a Driver user
4. Verify that the Driver home screen is shown (not Trucker home)
5. Repeat with different role combinations

## Impact
- ✅ Prevents wrong home screen after role switch
- ✅ Clears all cached user data
- ✅ Resets Redux state completely
- ✅ Ensures clean slate for new user login
- ✅ No data leakage between user sessions

## Related Files
- `src/utils/config/token.tsx` - AsyncStorage cleanup
- `src/redux/reducers/index.tsx` - Redux state reset
- `src/redux/actions/types.tsx` - Action types (AUTH_LOGOUT)
- All profile screens with logout functionality
