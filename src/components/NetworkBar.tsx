import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';

type NetworkStatus = 'none' | 'slow' | 'success' | 'hidden';

const NetworkBar: React.FC = () => {
    const insets = useSafeAreaInsets();
    const [status, setStatus] = useState<NetworkStatus>('hidden');
    const [message, setMessage] = useState('');
    
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const heightAnim = useRef(new Animated.Value(0)).current;
    const colorAnim = useRef(new Animated.Value(0)).current; // 0: Red, 1: Yellow, 2: Green

    const prevConnectedRef = useRef<boolean | null>(null);
    const statusRef = useRef<NetworkStatus>('hidden');
    const hideTimeoutRef = useRef<any>(null);

    const updateStatusState = (newStatus: NetworkStatus) => {
        statusRef.current = newStatus;
        setStatus(newStatus);
    };

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            const isConnected = state.isConnected && state.isInternetReachable !== false;
            const connectionType = state.type;
            const effectiveType = (state.details as any)?.cellularGeneration;

            console.log('[NetworkBar] NetInfo Event:', { isConnected, connectionType, effectiveType, prev: prevConnectedRef.current });

            if (!isConnected) {
                // Clear any pending hide timeout
                if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
                showStatus('none', 'No Internet Connection - Please Check');
            } else if (connectionType === 'cellular' && (effectiveType === '2g' || effectiveType === '3g')) {
                // Clear any pending hide timeout
                if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
                showStatus('slow', 'Slow Network - Connection May Be Unstable');
            } else {
                // We are CONNECTED and FAST
                // Show "Back Online" only if we are transitioning from a bad state
                if (prevConnectedRef.current === false || statusRef.current === 'slow' || statusRef.current === 'none') {
                    showStatus('success', 'Back Online - Connected Successfully');
                    
                    // Clear existing hides
                    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
                    
                    hideTimeoutRef.current = setTimeout(() => {
                        hideStatus();
                    }, 3000);
                } else if (statusRef.current !== 'success') {
                    // If we were already 'success' (the green bar is showing), don't hide it yet
                    // If we were hidden or something else, make sure it stays hidden or hides
                    hideStatus();
                }
            }
            
            prevConnectedRef.current = isConnected;
        });

        return () => {
            unsubscribe();
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        };
    }, []);

    const showStatus = (type: NetworkStatus, msg: string) => {
        updateStatusState(type);
        setMessage(msg);

        let targetColor = 0;
        if (type === 'slow') targetColor = 1;
        if (type === 'success') targetColor = 2;

        Animated.parallel([
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: false,
            }),
            Animated.timing(heightAnim, {
                toValue: 20,
                duration: 300,
                useNativeDriver: false,
            }),
            Animated.timing(colorAnim, {
                toValue: targetColor,
                duration: 300,
                useNativeDriver: false,
            })
        ]).start();
    };

    const hideStatus = () => {
        Animated.parallel([
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: false,
            }),
            Animated.timing(heightAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: false,
            })
        ]).start(() => updateStatusState('hidden'));
    };

    const backgroundColor = colorAnim.interpolate({
        inputRange: [0, 1, 2],
        outputRange: ['#EF4444', '#F59E0B', '#10B981'] // Red, Yellow, Green
    });

    if (status === 'hidden') return null;

    return (
        <Animated.View 
            style={[
                styles.container, 
                { 
                    top: insets.top, 
                    opacity: opacityAnim,
                    height: heightAnim,
                    backgroundColor 
                }
            ]}
        >
            <Text style={styles.text}>{message}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: 9999,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
    },
    text: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
});

export default NetworkBar;
