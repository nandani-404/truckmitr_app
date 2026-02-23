import { Platform } from "react-native";

export const SECURE_CONFIG = {
    ENCRYPTION_KEY: `8a8eeb4851261c4e34e0e10c0b9fd405bfead5230fef6264944f2e5ccaada64a8b5965d3cc6542cf369dbf9718f59046ef4ed4cbe08c2988be91e72e215c95a06774a98e45ea695608d9b6ab5cc4e8e725b0e71eafd54f6559c18acde88b4371a6133902fa2b6716e7ce130011cd9580d7f8bf561f9a4a8cdc916febfc8c029f`,
    MAP_SEARCH_URL: Platform.select({
        android: 'http://maps.google.com/maps?q=',
        ios: 'http://maps.apple.com/?ll='
    }),
    REVERSE_GEOCODE_URL: 'https://maps.googleapis.com/maps/api/geocode/json?latlng=',
    PLACE_DETAIL_URL: 'https://maps.googleapis.com/maps/api/place/details/json?place_id=',
    DISTANCE_MATRIX_URL: 'https://maps.googleapis.com/maps/api/distancematrix/json?origins=',
    AUTOCOMPLETE_URL: 'https://maps.googleapis.com/maps/api/place/autocomplete/json',
    DIRECTIONS_URL: 'https://maps.googleapis.com/maps/api/directions/json',

    GOOGLE_API_KEY: Platform.select({
        ios: 'AIzaSyCrCdzmSHRs7IkE-n9LMs11_D7R70qcT84',
        android: 'AIzaSyCjnRRjhyPaOnsCsAuwKCCNIYfxo8Q8os0'
    }),
}