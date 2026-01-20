import * as TYPES from '@truckmitr/redux/actions/types';

interface AuthState {
    isAuthenticated: boolean;
    token: string | null;
    tokenValidated: boolean;
}

const initialState: AuthState = {
    isAuthenticated: false,
    token: null,
    tokenValidated: false,
};

const authReducer = (state = initialState, action: any): AuthState => {
    const { type, payload } = action;

    switch (type) {
        case TYPES['AUTH_SET_AUTHENTICATED']:
            return { ...state, isAuthenticated: Boolean(payload) };
        case TYPES['AUTH_SET_TOKEN']:
            return { ...state, token: payload };
        case TYPES['AUTH_TOKEN_VALIDATED']:
            return { ...state, tokenValidated: payload };
        case TYPES['AUTH_LOGOUT']:
            return initialState;
        default:
            return state;
    }
};

export default authReducer;
