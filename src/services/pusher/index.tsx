/**
 * PusherService
 *
 * Production-ready Pusher WebSocket service with:
 * - Connection state machine (disconnected → connecting → connected → reconnecting → error)
 * - Exponential backoff reconnection (1s → 2s → 4s → ... → 30s max)
 * - Channel subscribe / unsubscribe management
 * - External connection state change listeners
 */

import { Pusher, PusherChannel, PusherEvent } from '@pusher/pusher-websocket-react-native';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ConnectionState =
    | 'disconnected'
    | 'connecting'
    | 'connected'
    | 'reconnecting'
    | 'error';

export type ConnectionStateListener = (state: ConnectionState, error?: string) => void;

// ─── Constants ───────────────────────────────────────────────────────────────

const PUSHER_APP_KEY = '3e9ecb7f466b2ee2a0c6';
const PUSHER_CLUSTER = 'ap2';

const RECONNECT_BASE_DELAY_MS = 1000;    // 1 second
const RECONNECT_MAX_DELAY_MS = 30000;    // 30 seconds
const MAX_RECONNECT_ATTEMPTS = 15;

// ─── Singleton Service ───────────────────────────────────────────────────────

class PusherService {
    private static instance: PusherService;

    private pusher: Pusher;
    private initialized = false;
    private connectionState: ConnectionState = 'disconnected';

    // Reconnection
    private reconnectAttempts = 0;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private shouldReconnect = true;

    // Channels
    private subscribedChannels: Map<string, PusherChannel> = new Map();

    // External listeners
    private stateListeners: Set<ConnectionStateListener> = new Set();

    private constructor() {
        this.pusher = Pusher.getInstance();
    }

    static getInstance(): PusherService {
        if (!PusherService.instance) {
            PusherService.instance = new PusherService();
        }
        return PusherService.instance;
    }

    // ─── Initialization ──────────────────────────────────────────────────

    async init(): Promise<void> {
        if (this.initialized) {
            console.log('[PusherService] Already initialized');
            return;
        }

        try {
            await this.pusher.init({
                apiKey: PUSHER_APP_KEY,
                cluster: PUSHER_CLUSTER,
                onConnectionStateChange: this.handleConnectionStateChange,
                onError: this.handleError,
                onEvent: (event: PusherEvent) => {
                    console.log(`[PusherService] 📡 EVENT received:`);
                    console.log(`  → Channel: ${event.channelName}`);
                    console.log(`  → Event:   ${event.eventName}`);
                    console.log(`  → Data:    ${typeof event.data === 'string' ? event.data : JSON.stringify(event.data)}`);
                },
            });

            this.initialized = true;
            console.log('[PusherService] Initialized successfully');
        } catch (err) {
            console.error('[PusherService] Init failed:', err);
            throw err;
        }
    }

    // ─── Connect / Disconnect ────────────────────────────────────────────

    async connect(): Promise<void> {
        if (!this.initialized) {
            await this.init();
        }

        if (this.connectionState === 'connected') {
            console.log('[PusherService] Already connected');
            return;
        }

        this.shouldReconnect = true;
        this.setConnectionState('connecting');

        try {
            await this.pusher.connect();
            // State will be updated via onConnectionStateChange callback
        } catch (err: any) {
            console.error('[PusherService] Connect failed:', err);
            this.setConnectionState('error', err?.message);
            this.scheduleReconnect();
        }
    }

    async disconnect(): Promise<void> {
        this.shouldReconnect = false;
        this.clearReconnectTimer();
        this.reconnectAttempts = 0;

        // Unsubscribe from all channels
        for (const channelName of this.subscribedChannels.keys()) {
            try {
                await this.pusher.unsubscribe({ channelName });
            } catch (err) {
                console.warn(`[PusherService] Error unsubscribing from ${channelName}:`, err);
            }
        }
        this.subscribedChannels.clear();

        try {
            await this.pusher.disconnect();
        } catch (err) {
            console.warn('[PusherService] Disconnect error:', err);
        }

        this.setConnectionState('disconnected');
        console.log('[PusherService] Disconnected');
    }

    // ─── Channel Management ──────────────────────────────────────────────

    async subscribe(channelName: string): Promise<PusherChannel | null> {
        if (this.subscribedChannels.has(channelName)) {
            console.log(`[PusherService] Already subscribed to ${channelName}`);
            return this.subscribedChannels.get(channelName) || null;
        }

        try {
            const channel = await this.pusher.subscribe({
                channelName,
                onEvent: (event: PusherEvent) => {
                    console.log(`[PusherService] Event on ${channelName}:`, event.eventName);
                },
            });

            this.subscribedChannels.set(channelName, channel);
            console.log(`[PusherService] Subscribed to ${channelName}`);
            return channel;
        } catch (err) {
            console.error(`[PusherService] Subscribe to ${channelName} failed:`, err);
            return null;
        }
    }

    async unsubscribe(channelName: string): Promise<void> {
        if (!this.subscribedChannels.has(channelName)) {
            return;
        }

        try {
            await this.pusher.unsubscribe({ channelName });
            this.subscribedChannels.delete(channelName);
            console.log(`[PusherService] Unsubscribed from ${channelName}`);
        } catch (err) {
            console.error(`[PusherService] Unsubscribe from ${channelName} failed:`, err);
        }
    }

    // ─── Event Binding ───────────────────────────────────────────────────

    /**
     * Subscribe to a channel AND bind to a specific event.
     * Returns a cleanup function to unsubscribe.
     */
    async subscribeToEvent(
        channelName: string,
        eventName: string,
        callback: (data: any) => void,
    ): Promise<() => void> {
        try {
            const channel = await this.pusher.subscribe({
                channelName,
                onEvent: (event: PusherEvent) => {
                    if (event.eventName === eventName) {
                        try {
                            const parsedData = typeof event.data === 'string'
                                ? JSON.parse(event.data)
                                : event.data;
                            callback(parsedData);
                        } catch (parseErr) {
                            console.error(`[PusherService] Failed to parse event data:`, parseErr);
                            callback(event.data);
                        }
                    }
                },
            });

            this.subscribedChannels.set(channelName, channel);

            // Return cleanup function
            return () => {
                this.unsubscribe(channelName);
            };
        } catch (err) {
            console.error(`[PusherService] subscribeToEvent failed:`, err);
            return () => { }; // no-op cleanup
        }
    }

    // ─── Connection State Listeners ──────────────────────────────────────

    addStateListener(listener: ConnectionStateListener): () => void {
        this.stateListeners.add(listener);

        // Immediately notify the new listener of the current state
        listener(this.connectionState);

        // Return unsubscribe function
        return () => {
            this.stateListeners.delete(listener);
        };
    }

    getConnectionState(): ConnectionState {
        return this.connectionState;
    }

    isConnected(): boolean {
        return this.connectionState === 'connected';
    }

    // ─── Internal: Connection State Change Handler ───────────────────────

    private handleConnectionStateChange = (
        currentState: string,
        previousState: string,
    ): void => {
        console.log(`[PusherService] State: ${previousState} → ${currentState}`);

        switch (currentState) {
            case 'CONNECTED':
            case 'connected':
                this.setConnectionState('connected');
                this.reconnectAttempts = 0;
                this.clearReconnectTimer();
                break;

            case 'CONNECTING':
            case 'connecting':
                if (this.reconnectAttempts > 0) {
                    this.setConnectionState('reconnecting');
                } else {
                    this.setConnectionState('connecting');
                }
                break;

            case 'DISCONNECTED':
            case 'disconnected':
                this.setConnectionState('disconnected');
                if (this.shouldReconnect) {
                    this.scheduleReconnect();
                }
                break;

            case 'RECONNECTING':
            case 'reconnecting':
                this.setConnectionState('reconnecting');
                break;

            default:
                console.log(`[PusherService] Unknown state: ${currentState}`);
                break;
        }
    };

    // ─── Internal: Error Handler ─────────────────────────────────────────

    private handleError = (message: string, code: Number, error: any): void => {
        console.error(`[PusherService] Error [code=${code}]: ${message}`, error);
        this.setConnectionState('error', message);

        if (this.shouldReconnect) {
            this.scheduleReconnect();
        }
    };

    // ─── Internal: Reconnection with Exponential Backoff ─────────────────

    private scheduleReconnect(): void {
        if (!this.shouldReconnect) return;

        if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.error(`[PusherService] Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Giving up.`);
            this.setConnectionState('error', 'Max reconnect attempts reached');
            return;
        }

        this.clearReconnectTimer();

        // Exponential backoff: delay = base * 2^attempt, capped at max
        const delay = Math.min(
            RECONNECT_BASE_DELAY_MS * Math.pow(2, this.reconnectAttempts),
            RECONNECT_MAX_DELAY_MS,
        );

        this.reconnectAttempts += 1;
        console.log(`[PusherService] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);

        this.setConnectionState('reconnecting');

        this.reconnectTimer = setTimeout(async () => {
            try {
                await this.pusher.connect();
            } catch (err: any) {
                console.error('[PusherService] Reconnect attempt failed:', err);
                this.scheduleReconnect(); // try again
            }
        }, delay);
    }

    private clearReconnectTimer(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    // ─── Internal: State Management ──────────────────────────────────────

    private setConnectionState(state: ConnectionState, errorMessage?: string): void {
        if (this.connectionState === state) return;

        this.connectionState = state;

        // Notify all external listeners
        for (const listener of this.stateListeners) {
            try {
                listener(state, errorMessage);
            } catch (err) {
                console.error('[PusherService] State listener error:', err);
            }
        }
    }
}

// ─── Export singleton convenience functions ──────────────────────────────────

const pusherService = PusherService.getInstance();

export const initPusher = () => pusherService.init();
export const connectPusher = () => pusherService.connect();
export const disconnectPusher = () => pusherService.disconnect();
export const subscribeToPusherChannel = (channelName: string) => pusherService.subscribe(channelName);
export const unsubscribeFromPusherChannel = (channelName: string) => pusherService.unsubscribe(channelName);
export const subscribeToEvent = (channelName: string, eventName: string, callback: (data: any) => void) =>
    pusherService.subscribeToEvent(channelName, eventName, callback);
export const addPusherStateListener = (listener: ConnectionStateListener) => pusherService.addStateListener(listener);
export const getPusherConnectionState = () => pusherService.getConnectionState();
export const isPusherConnected = () => pusherService.isConnected();

export default pusherService;
