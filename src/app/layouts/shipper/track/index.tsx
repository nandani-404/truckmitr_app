import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const ShipperTrack = () => {
    return (
        <View style={styles.container}>
            <Ionicons name="location-outline" size={64} color="#ccc" />
            <Text style={styles.title}>Track Shipment</Text>
            <Text style={styles.subtitle}>Track your ongoing shipments in real-time</Text>
            <Text style={styles.coming_soon}>Coming Soon</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 16,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 8,
    },
    coming_soon: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 4,
        fontStyle: 'italic',
    },
});

export default ShipperTrack;
