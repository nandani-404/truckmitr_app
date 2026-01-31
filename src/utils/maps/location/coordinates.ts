import Geolocation from '@react-native-community/geolocation';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import { locationPermission } from './permission';


// Define types for the location data.
interface Coordinates {
    latitude: number | null;
    longitude: number | null;
}

interface LocationResponse {
    coords: Coordinates;
    error: string | null;
}

// Function to fetch current location coordinates.
export const currentCoordinates = async (): Promise<LocationResponse> => {
    const hasLocationPermission = await locationPermission();
    if (!hasLocationPermission) {
        return { coords: { latitude: null, longitude: null }, error: 'Location permission denied' };
    }
    try {
        return new Promise((resolve, reject) => {
            Geolocation.getCurrentPosition(
                (position) => {
                    console.log('GPS Success:', position);
                    const location = {
                        coords: {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                        },
                        error: null,
                    };
                    resolve(location);
                },
                (error) => {
                    console.log('GPS Error:', error);
                    showToast(error.message);
                    reject({ coords: { latitude: null, longitude: null }, error: error.message });
                },
                { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
            );
        });
    } catch (err) {
        return { coords: { latitude: null, longitude: null }, error: 'Error retrieving location' };
    }
};