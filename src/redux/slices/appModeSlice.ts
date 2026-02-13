/**
 * App Mode Slice (Redux Toolkit)
 * 
 * Manages the application layout mode (transporter vs trucker).
 * Replaces the previous Zustand store with Redux for consistency
 * with the rest of the app's state management.
 * 
 * Architecture supports future roles:
 * type AppMode = 'transporter' | 'trucker' | 'broker' | 'admin'
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Extensible type - add new roles here
export type AppMode = 'transporter' | 'trucker';

const APP_MODE_STORAGE_KEY = '@truckmitr_app_mode';

interface AppModeState {
    /** Current application mode */
    mode: AppMode;
    /** Whether the persisted mode has been restored */
    isHydrated: boolean;
    /** Whether a mode transition animation is in progress */
    isTransitioning: boolean;
}

const initialState: AppModeState = {
    mode: 'transporter',
    isHydrated: false,
    isTransitioning: false,
};

const appModeSlice = createSlice({
    name: 'appMode',
    initialState,
    reducers: {
        setAppMode: (state, action: PayloadAction<AppMode>) => {
            if (state.mode === action.payload) return;
            state.mode = action.payload;
            // Persist asynchronously
            AsyncStorage.setItem(APP_MODE_STORAGE_KEY, action.payload).catch((err) => {
                console.error('❌ Failed to persist app mode:', err);
            });
        },
        toggleAppMode: (state) => {
            const newMode: AppMode = state.mode === 'transporter' ? 'trucker' : 'transporter';
            state.mode = newMode;
            // Persist asynchronously
            AsyncStorage.setItem(APP_MODE_STORAGE_KEY, newMode).catch((err) => {
                console.error('❌ Failed to persist app mode:', err);
            });
        },
        setAppModeHydrated: (state, action: PayloadAction<{ mode: AppMode; isHydrated: boolean }>) => {
            state.mode = action.payload.mode;
            state.isHydrated = action.payload.isHydrated;
        },
        setAppModeTransitioning: (state, action: PayloadAction<boolean>) => {
            state.isTransitioning = action.payload;
        },
    },
});

export const {
    setAppMode,
    toggleAppMode,
    setAppModeHydrated,
    setAppModeTransitioning,
} = appModeSlice.actions;

/**
 * Thunk action to hydrate the app mode from AsyncStorage.
 * Call this on app launch.
 */
export const hydrateAppMode = () => async (dispatch: any) => {
    try {
        const stored = await AsyncStorage.getItem(APP_MODE_STORAGE_KEY);
        if (stored && (stored === 'transporter' || stored === 'trucker')) {
            dispatch(setAppModeHydrated({ mode: stored as AppMode, isHydrated: true }));
        } else {
            dispatch(setAppModeHydrated({ mode: 'transporter', isHydrated: true }));
        }
    } catch (err) {
        console.error('❌ Failed to hydrate app mode:', err);
        dispatch(setAppModeHydrated({ mode: 'transporter', isHydrated: true }));
    }
};

export default appModeSlice.reducer;
