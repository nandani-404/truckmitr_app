import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useColor, useShadow } from '@truckmitr/src/app/hooks';
import { DhabhaProfileProvider } from './DhabhaProfileContext';

// Tabs
import BasicInfoTab from './tabs/BasicInfoTab';
import LocationDetailsTab from './tabs/LocationDetailsTab';
import OperationalDetailsTab from './tabs/OperationalDetailsTab';
import FoodAvailableTab from './tabs/FoodAvailableTab';
import FacilitiesTab from './tabs/FacilitiesTab';
import PhotosTab from './tabs/PhotosTab';
import DriverOfferTab from './tabs/DriverOfferTab';

const Tab = createMaterialTopTabNavigator();

const DhabhaMyProfileContent = () => {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const colors = useColor();
    const { shadow } = useShadow();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <SafeAreaView style={{ backgroundColor: '#fff' }}>
                <View style={[styles.header, shadow, { paddingTop: (Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0) + 12 }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>{t('myDhaba')}</Text>
                        <Text style={styles.headerSubtitle}>{t('manageProfileAndPhotos')}</Text>
                    </View>

                </View>
            </SafeAreaView>

            {/* Top Tab Navigator */}
            <Tab.Navigator
                screenOptions={{
                    tabBarScrollEnabled: true,
                    tabBarLabelStyle: { fontSize: 13, fontWeight: '600', textTransform: 'none' },
                    tabBarItemStyle: { width: 'auto', paddingHorizontal: 12 },
                    tabBarIndicatorStyle: { backgroundColor: colors.royalBlue, height: 3 },
                    tabBarStyle: { elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
                    tabBarActiveTintColor: colors.royalBlue,
                    tabBarInactiveTintColor: '#6B7280',
                    lazy: true,
                }}
            >
                <Tab.Screen name={t('basicInfoTab')} component={BasicInfoTab} />
                <Tab.Screen name={t('locationTab')} component={LocationDetailsTab} />
                <Tab.Screen name={t('operationalTab')} component={OperationalDetailsTab} />
                <Tab.Screen name={t('foodTab')} component={FoodAvailableTab} />
                <Tab.Screen name={t('facilitiesTab')} component={FacilitiesTab} />
                <Tab.Screen name={t('photosTabTitle')} component={PhotosTab} />
                {/* <Tab.Screen name={t('driverOffer')} component={DriverOfferTab} /> */}
            </Tab.Navigator>
        </View>
    );
};

const DhabhaMyProfile = () => {
    return (
        <DhabhaProfileProvider>
            <DhabhaMyProfileContent />
        </DhabhaProfileProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#fff',
        zIndex: 10,
    },
    backBtn: {
        padding: 4,
    },
    headerTitleContainer: {
        flex: 1,
        marginLeft: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#6B7280',
    },
    saveHeaderBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#EFF6FF',
        borderRadius: 20,
    },
    saveBtnText: {
        fontSize: 14,
        fontWeight: '600',
    },
});

export default DhabhaMyProfile;
