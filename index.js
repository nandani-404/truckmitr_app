import { AppRegistry } from 'react-native';
import 'react-native-get-random-values'
import App from './src/App';
import { name as appName } from './app.json';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';

// Register FCM background handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('--- 🌙 Killed/Background FCM Received (index.js) ---');
    console.log('Full Message:', JSON.stringify(remoteMessage, null, 2));
});

// Register Notifee background handler
notifee.onBackgroundEvent(async ({ type, detail }) => {
    console.log('--- 🔔 Notifee Background Event (index.js) ---', type);
});

AppRegistry.registerComponent(appName, () => App);
