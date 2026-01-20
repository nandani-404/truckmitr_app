import { combineReducers } from 'redux';
import appReducer from './app.reducer';
import authReducer from './auth.reducer';

const globalReducers = combineReducers({
    app: appReducer,
    auth: authReducer,
});

export default globalReducers;
