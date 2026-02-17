import { combineReducers } from 'redux';
import userReducer from '@truckmitr/redux/reducers/user.reducer';
import jobReducer from '@truckmitr/redux/reducers/job.reducer';
import driverReducer from '@truckmitr/redux/reducers/driver.reducer';
import pilotsReducer from '@truckmitr/redux/slices/pilotsSlice';
import shipperReducer from '@truckmitr/redux/slices/shipperSlice';
import appModeReducer from '@truckmitr/redux/slices/appModeSlice';

// Global reducers (shared across all modules)
import appReducer from '@truckmitr/redux/reducers/global/app.reducer';
import authReducer from '@truckmitr/redux/reducers/global/auth.reducer';

const appCombinedReducer = combineReducers({
    // GLOBAL STATE - accessible across all modules
    app: appReducer,
    auth: authReducer,

    // EXISTING - keep as-is for backward compatibility
    // These will be refactored into module-specific reducers later
    user: userReducer,
    job: jobReducer,
    driver: driverReducer,
    pilots: pilotsReducer,
    shipper: shipperReducer,
    appMode: appModeReducer,
})

const rootReducer = (state: any, action: any) => {
    // Reset all state to initial values on logout
    if (action.type === 'AUTH_LOGOUT' || action.type === 'USER_AUTHENTICATED' && action.payload === false) {
        state = undefined;
    }
    return appCombinedReducer(state, action)
}

export default rootReducer