/**
 * useTruckLocation Hook
 *
 * React hook for real-time truck location tracking via Pusher.
 *
 * Usage:
 *   const { location, connectionStatus, error } = useTruckLocation('truck-location.123');
 *
 * - Initializes Pusher connection if not already connected
 * - Subscribes to the given channel on mount
 * - Listens for location events and updates state
 * - Unsubscribes on unmount
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import pusherService, {
    ConnectionState,
    connectPusher,
    subscribeToEvent,
    addPusherStateListener,
} from '@truckmitr/src/services/pusher';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TruckLocation {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    lastUpdated: Date;
}

export interface UseTruckLocationReturn {
    /** Current truck location, null until first event received */
    location: TruckLocation | null;

    /** Pusher connection status */
    connectionStatus: ConnectionState;

    /** Error message if any */
    error: string | null;

    /** Whether we have received at least one location update */
    isTracking: boolean;
}

// ─── Default event name (update when backend confirms) ───────────────────────

const DEFAULT_EVENT_NAME = 'location-updated';

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useTruckLocation(
    channelName: string,
    eventName: string = DEFAULT_EVENT_NAME,
): UseTruckLocationReturn {
    const [location, setLocation] = useState<TruckLocation | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionState>('disconnected');
    const [error, setError] = useState<string | null>(null);
    const [isTracking, setIsTracking] = useState(false);

    // Keep a ref to the cleanup function so we can call it on unmount
    const cleanupRef = useRef<(() => void) | null>(null);
    const mountedRef = useRef(true);

    // ─── Handle incoming location data ───────────────────────────────────

    const handleLocationEvent = useCallback((data: any) => {
        if (!mountedRef.current) return;

        try {
            const truckLocation: TruckLocation = {
                latitude: parseFloat(data.latitude ?? data.lat),
                longitude: parseFloat(data.longitude ?? data.lng ?? data.lon),
                heading: data.heading != null ? parseFloat(data.heading) : undefined,
                speed: data.speed != null ? parseFloat(data.speed) : undefined,
                lastUpdated: new Date(),
            };

            // Validate coordinates
            if (isNaN(truckLocation.latitude) || isNaN(truckLocation.longitude)) {
                console.warn('[useTruckLocation] Invalid coordinates received:', data);
                return;
            }

            setLocation(truckLocation);
            setIsTracking(true);
            setError(null);
        } catch (err) {
            console.error('[useTruckLocation] Error parsing location data:', err);
        }
    }, []);

    // ─── Connect & Subscribe ─────────────────────────────────────────────

    useEffect(() => {
        mountedRef.current = true;

        const setup = async () => {
            try {
                // 1. Connect to Pusher (no-op if already connected)
                await connectPusher();

                // 2. Subscribe to channel + event
                if (channelName && mountedRef.current) {
                    const cleanup = await subscribeToEvent(channelName, eventName, handleLocationEvent);
                    cleanupRef.current = cleanup;
                    console.log(`[useTruckLocation] Listening on ${channelName} → ${eventName}`);
                }
            } catch (err: any) {
                console.error('[useTruckLocation] Setup error:', err);
                if (mountedRef.current) {
                    setError(err?.message || 'Failed to connect');
                }
            }
        };

        setup();

        // Listen to connection state changes
        const removeStateListener = addPusherStateListener((state, errorMsg) => {
            if (!mountedRef.current) return;

            setConnectionStatus(state);

            if (state === 'error' && errorMsg) {
                setError(errorMsg);
            } else if (state === 'connected') {
                setError(null);
            }
        });

        // ─── Cleanup on unmount ──────────────────────────────────────────
        return () => {
            mountedRef.current = false;
            removeStateListener();

            if (cleanupRef.current) {
                cleanupRef.current();
                cleanupRef.current = null;
            }
        };
    }, [channelName, eventName, handleLocationEvent]);

    return {
        location,
        connectionStatus,
        error,
        isTracking,
    };
}

export default useTruckLocation;
