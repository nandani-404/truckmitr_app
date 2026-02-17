// storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveUserData = async (token: string) => {
    try {
        await AsyncStorage.setItem('@user_token', token);
        console.log(`User data saved successfully. Token length: ${token.length}`);
    } catch (error) {
        console.log('Error saving data to AsyncStorage:', error);
    }
};

export const getUserData = async (): Promise<string | null> => {
    try {
        const token = await AsyncStorage.getItem('@user_token');
        return token;
    } catch (error) {
        console.log('Error retrieving data from AsyncStorage:', error);
        return null;
    }
};

export const deleteUserData = async () => {
    try {
        // Clear all user-related data from AsyncStorage
        await AsyncStorage.multiRemove([
            '@user_token',
            'subscription_modal_closed_count',
            'app_session_active',
            'SELECTED_MODULE',
            'PENDING_NOTIFICATION_SCREEN',
            'signup_incomplete',
        ]);
        console.log('User data and cache deleted successfully.');
    } catch (error) {
        console.log('Error deleting data from AsyncStorage:', error);
    }
};