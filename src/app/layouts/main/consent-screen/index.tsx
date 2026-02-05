import React, { useEffect } from 'react';
import { View, BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ConsentModal from '@truckmitr/src/app/components/consent-modal';

const ConsentScreen = () => {
    const navigation = useNavigation();

    useEffect(() => {
        const backAction = () => {
            // Prevent back button execution
            return true;
        };

        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            backAction
        );

        return () => backHandler.remove();
    }, []);

    const handleConsentSuccess = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <ConsentModal
                visible={true}
                onConsentSuccess={handleConsentSuccess}
            />
        </View>
    );
};

export default ConsentScreen;
