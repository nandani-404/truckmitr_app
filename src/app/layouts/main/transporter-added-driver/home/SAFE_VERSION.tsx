import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import { useColor, useResponsiveScale } from '@truckmitr/src/app/hooks';

const TransporterAddedDriverHome = React.forwardRef((props, ref) => {
    const colors = useColor();
    const { responsiveFontSize } = useResponsiveScale();
    
    // Safe state access
    const userState = useSelector((state: any) => state?.user);
    const user = userState?.user;
    
    const [isReady, setIsReady] = useState(false);
    
    useEffect(() => {
        console.log('[SAFE] Component mounted, user:', user?.id);
        if (user?.id) {
            setIsReady(true);
        }
    }, [user?.id]);
    
    if (!isReady || !user) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                <ActivityIndicator size="large" color="#4044ae" />
                <Text style={{ marginTop: 16, fontSize: 16 }}>Loading...</Text>
            </View>
        );
    }
    
    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={{ padding: 20 }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
                    Welcome, {user?.name || 'Driver'}
                </Text>
                <Text style={{ fontSize: 16, marginTop: 10 }}>
                    ID: {user?.unique_id || 'N/A'}
                </Text>
            </View>
        </ScrollView>
    );
});

export default TransporterAddedDriverHome;
