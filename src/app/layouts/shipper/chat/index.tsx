import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ShipperChat = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Chat Screen Placeholder</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    text: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
    },
});

export default ShipperChat;
