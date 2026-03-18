import { GestureHandlerRootView } from 'react-native-gesture-handler'
import '@truckmitr/src/i18n/i18n';
import { Provider } from "react-redux";
import store from '@truckmitr/redux/store';
import Routes from '@truckmitr/routes/index';
import { PaperProvider } from 'react-native-paper';
import { I18nextProvider } from 'react-i18next';
import i18n from '@truckmitr/src/i18n/i18n';
import { TourGuideProvider } from 'rn-tourguide';
import { useEffect } from 'react';
import { initAnalyticsWithDeviceInfo } from './app/functions/init.analytics';
import { AppEventsLogger, Settings } from 'react-native-fbsdk-next';
import { LogBox } from 'react-native';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { initPusher, connectPusher } from './services/pusher';
import NetworkBar from './components/NetworkBar';
import UploadProgressBar from './components/UploadProgressBar';

export default function App() {

    useEffect(() => {
        LogBox.ignoreAllLogs(true)
        Settings.setAdvertiserTrackingEnabled(true);
        Settings.setAutoLogAppEventsEnabled(true);
        Settings.setAppID('1045443160897702');
        Settings.setClientToken('fe87da28dc4fe0e8b325d9df7604c1fe');
        Settings.setDataProcessingOptions([]);
        Settings.initializeSDK();
        initAnalyticsWithDeviceInfo();

        // Initialize Pusher at root level
        const setupPusher = async () => {
            try {
                await initPusher();
                await connectPusher();
                console.log('✅ Global Pusher connected');
            } catch (error) {
                console.error('❌ Global Pusher init error:', error);
            }
        };
        setupPusher();
    }, []);


    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Provider store={store}>
                <PaperProvider>
                    <I18nextProvider i18n={i18n}>
                        <BottomSheetModalProvider>
                            <TourGuideProvider preventOutsideInteraction androidStatusBarVisible={true} {...{}}>
                                <NetworkBar />
                                <UploadProgressBar />
                                <Routes />
                            </TourGuideProvider>
                        </BottomSheetModalProvider>
                    </I18nextProvider>
                </PaperProvider>
            </Provider>
        </GestureHandlerRootView>
    )
}