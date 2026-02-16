
import { showToast } from '@truckmitr/src/app/hooks/toast';
import { currentCoordinates } from './coordinates';
import { placeDetails, reverseGeocode } from '../google.apis';

// --------------------------------------
// Types
// --------------------------------------
export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface LocationDetail {
  /** A short, user‑friendly title */
  name: string;
  /** Full formatted address */
  displayName: string;
  coords: LatLng;
  city?: string;
  state?: string;
  country?: {
    name: string;
    code: string;
  };
}

// --------------------------------------
// Helpers
// --------------------------------------

/**
 * Detect if the given name is too short / numeric‑only / otherwise unhelpful.
 */
const isUninformativeName = (name: string): boolean => {
  if (!name) return true;
  const trimmed = name.trim();
  return trimmed.length < 5 || /^[0-9/\s,.-]+$/.test(trimmed);
};

/**
 * Grab the first few chunks of the formatted address to craft a prettier fallback name.
 */
const prettifyAddress = (address: string, maxChunks = 3): string => {
  if (!address) return 'Unknown Location';
  return address.split(',').slice(0, maxChunks).join(',').trim();
};

/**
 * Extract a specific component from the address by type.
 */
const getAddressComponent = (components: any[], type: string): string | undefined => {
  return components.find((c: any) => c.types.includes(type))?.long_name;
};

// --------------------------------------
// Main API
// --------------------------------------

/**
 * Fetch detailed location information based on the user's current GPS coordinates.
 */
export const fetchCompleteLocationDetails = async (coords?: LatLng): Promise<LocationDetail | null> => {
  try {
    // Step 1: Use passed coords or fallback to current
    const finalCoords = coords ?? (await currentCoordinates())?.coords;

    if (!finalCoords) {
      showToast('Unable to access your location. Please try again.');
      return null;
    }

    const { latitude, longitude } = finalCoords;

    // Step 2: Reverse geocode
    const reverseResponse = await reverseGeocode({ latitude, longitude } as LatLng) as any;
    if (reverseResponse?.status !== 'OK') {
      console.warn('Reverse geocode failed:', reverseResponse);
      return null;
    }

    const placeId = reverseResponse?.data?.results?.[0]?.place_id;
    if (!placeId) return null;

    // Step 3: Get place details
    const placeResponse = await placeDetails(placeId) as any;
    if (placeResponse?.status !== 'OK') {
      console.warn('Place details fetch failed:', placeResponse);
      return null;
    }

    const result = placeResponse.result;
    const components = result.address_components ?? [];

    const rawName = result?.name ?? '';
    const formattedAddress = result?.formatted_address ?? '';
    const finalName = isUninformativeName(rawName)
      ? prettifyAddress(formattedAddress)
      : rawName;

    const resolvedCoords: LatLng = {
      latitude: result?.geometry?.location?.lat ?? latitude,
      longitude: result?.geometry?.location?.lng ?? longitude,
    };

    return {
      name: finalName,
      displayName: formattedAddress,
      coords: resolvedCoords,
      city: getAddressComponent(components, 'locality'),
      state: getAddressComponent(components, 'administrative_area_level_1'),
      country: (() => {
        const name = getAddressComponent(components, 'country');
        const code = components.find((c: any) => c.types.includes('country'))?.short_name;
        return name ? { name, code } : undefined;
      })(),
    };
  } catch (error) {
    console.error('[getLocationDetails] Unexpected error:', error);
    return null;
  }
};
