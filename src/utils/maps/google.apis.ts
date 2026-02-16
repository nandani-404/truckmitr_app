import { SECURE_CONFIG } from "../static";


// Define types for coordinates and place ID response
interface Coordinates {
    latitude: number;
    longitude: number;
}

interface ServiceResponse {
    status: number;
    data: any;
    result?: any;
}

// Define the error message
export const serviceError = {
    NETWORK_ERROR: 'Sorry, something went wrong, please try again in sometime.',
    CATCH_ERROR: 'Something went wrong, please try again'
}

// Common error handler
const handleError = (error: any): ServiceResponse => {
    console.error('Error occurred: ', error); // Improved error logging for debugging
    return {
        status: 900,
        data: { message: serviceError['NETWORK_ERROR'] }
    };
};

// Common function to fetch data from API
const fetchData = async (url: string): Promise<ServiceResponse> => {
    try {
        const response = await fetch(url);
        const data = await response.json();
        return {
            status: data.status,
            data,
            result: data.results || data.result || data
        };
    } catch (error) {
        return handleError(error);
    }
};

// Reverse geocode function
const reverseGeocode = (coordinates: Coordinates): Promise<ServiceResponse> => {
    const url = `${SECURE_CONFIG.REVERSE_GEOCODE_URL}${coordinates.latitude},${coordinates.longitude}&key=${SECURE_CONFIG.GOOGLE_API_KEY}`;
    return fetchData(url);
};

// Place details function
const placeDetails = (placeId: string, sessionToken?: string): Promise<ServiceResponse> => {
    let url = `${SECURE_CONFIG.PLACE_DETAIL_URL}${placeId}&key=${SECURE_CONFIG.GOOGLE_API_KEY}`;
    if (sessionToken) {
        url += `&sessiontoken=${sessionToken}`;
    }
    return fetchData(url);
};

// Distance matrix function
const distanceMatrix = (origin: Coordinates, destination: Coordinates): Promise<ServiceResponse> => {
    const url = `${SECURE_CONFIG.DISTANCE_MATRIX_URL}${origin.latitude},${origin.longitude}&destinations=${destination.latitude},${destination.longitude}&key=${SECURE_CONFIG.GOOGLE_API_KEY}`;
    return fetchData(url);
};

// Autocomplete for India only
const autocompletePlaces = async (input: string, sessionToken?: string): Promise<ServiceResponse> => {
    let url = `${SECURE_CONFIG.AUTOCOMPLETE_URL}?input=${encodeURIComponent(input)}&components=country:in&key=${SECURE_CONFIG.GOOGLE_API_KEY}`;
    if (sessionToken) {
        url += `&sessiontoken=${sessionToken}`;
    }
    return fetchData(url);
};

// Simple visual UUID generator for session tokens
export const generateSessionToken = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0,
            v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};



export { reverseGeocode, placeDetails, distanceMatrix, autocompletePlaces };