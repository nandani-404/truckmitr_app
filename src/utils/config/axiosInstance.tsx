import axios from 'axios';
import { BASE_URL } from "src/utils/config/index";
import { getUserData } from './token';
import crashlytics from '@react-native-firebase/crashlytics';

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
});

// Set default headers
axiosInstance.defaults.headers.common['Content-Type'] = 'multipart/form-data';

// Axios request interceptor
axiosInstance.interceptors.request.use(
    async (config) => {
        try {
            const token = await getUserData();
            config.headers['Authorization'] = `Bearer ${token}`;

            // Log the request to Crashlytics
            crashlytics().log(`Request: ${config.method?.toUpperCase()} ${config.url}`);
        } catch (error: any) {
            console.error("Error getting device info:", error);
            crashlytics().recordError(error);  // Log this error
        }
        return config;
    },
    (error) => {
        crashlytics().recordError(error);  // Log request errors
        return Promise.reject(error);
    }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
    (response) => {
        // Safe logging - avoid JSON.stringify on large objects
        const responseSize = JSON.stringify(response?.data || {}).length;
        console.log(`[Axios] Response from ${response.config.url} - Status: ${response.status} - Size: ${responseSize} bytes`);
        
        crashlytics().log(`Response: ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
        return response;
    },
    (error) => {
        const errorStatus = error?.response?.status || 'Unknown';
        console.log(`[Axios] Request Error - Status: ${errorStatus}`);

        if (error.response) {
            // Log response error details to Crashlytics
            const { config, status, data } = error.response;
            crashlytics().log(`Response Error: ${config?.method?.toUpperCase()} ${config?.url} - Status: ${status}`);
            crashlytics().recordError(new Error(`HTTP ${status} - ${JSON.stringify(data)}`));

            return error.response;
        }

        // Log network or unknown errors
        crashlytics().recordError(error);
        return Promise.reject(error);
    }
);

export default axiosInstance;
