import { configureStore } from '@reduxjs/toolkit';
const createSagaMiddleware = require('redux-saga').default;
import rootSaga from '@truckmitr/redux/saga';
import rootReducer from '@truckmitr/redux/reducers/index';

// Create saga middleware
const sagaMiddleware = createSagaMiddleware();

// Configure store with root reducer, saga middleware, and Redux DevTools
const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: true,                 // Disable thunk middleware since we’re using sagas
      serializableCheck: true,      // Ensure actions and state are serializable
      immutableCheck: false,         // Ensure state is immutable
    }).concat(sagaMiddleware),
  // devTools: process.env.NODE_ENV !== 'production', // Enable Redux DevTools in development mode
});

// Run the root saga with error handling
try {
  sagaMiddleware.run(rootSaga);
} catch (error) {
  console.error('Saga middleware failed to start', error);
}

// TypeScript types for RootState and AppDispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
