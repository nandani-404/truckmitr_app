import { View, Text, StyleSheet } from 'react-native'
import React from 'react'

export default function ShipperHome() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Shipper Home</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff'
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333'
    }
})
