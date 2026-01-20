import * as TYPES from '@truckmitr/redux/actions/types';
import { ModuleType } from '@truckmitr/redux/reducers/global/app.reducer';

// ============================================
// App Actions
// ============================================
export const setModuleAction = (module: ModuleType) => ({
    type: TYPES.SET_MODULE,
    payload: module,
});

export const setAppReadyAction = (ready: boolean) => ({
    type: TYPES.SET_APP_READY,
    payload: ready,
});

export const setLanguageAction = (language: string) => ({
    type: TYPES.SET_LANGUAGE,
    payload: language,
});

// ============================================
// Auth Actions
// ============================================
export const authSetAuthenticatedAction = (isAuthenticated: boolean) => ({
    type: TYPES.AUTH_SET_AUTHENTICATED,
    payload: isAuthenticated,
});

export const authSetTokenAction = (token: string | null) => ({
    type: TYPES.AUTH_SET_TOKEN,
    payload: token,
});

export const authTokenValidatedAction = (validated: boolean) => ({
    type: TYPES.AUTH_TOKEN_VALIDATED,
    payload: validated,
});

export const authLogoutAction = () => ({
    type: TYPES.AUTH_LOGOUT,
});
