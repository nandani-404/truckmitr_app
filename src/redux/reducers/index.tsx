import { combineReducers } from 'redux';
import userReducer from '@truckmitr/redux/reducers/user.reducer';
import jobReducer from '@truckmitr/redux/reducers/job.reducer';
import driverReducer from '@truckmitr/redux/reducers/driver.reducer';
import pilotsReducer from '@truckmitr/redux/slices/pilotsSlice';

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
    pilots: pilotsReducer
})

const rootReducer = (state: any, action: any) => {
    return appCombinedReducer(state, action)
}

export default rootReducer