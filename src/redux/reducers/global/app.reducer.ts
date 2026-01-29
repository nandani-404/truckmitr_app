import * as TYPES from '@truckmitr/redux/actions/types';

export type ModuleType = 'hiring' | 'foreman' | 'associate' | 'association' | null;

interface AppState {
    selectedModule: ModuleType;
    appReady: boolean;
    language: string;
}

const initialState: AppState = {
    selectedModule: null, // Will be set on first screen before auth
    appReady: false,
    language: 'en',
};

const appReducer = (state = initialState, action: any): AppState => {
    const { type, payload } = action;

    switch (type) {
        case TYPES['SET_MODULE']:
            return { ...state, selectedModule: payload };
        case TYPES['SET_APP_READY']:
            return { ...state, appReady: payload };
        case TYPES['SET_LANGUAGE']:
            return { ...state, language: payload };
        default:
            return state;
    }
};

export default appReducer;
