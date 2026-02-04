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
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useTranslation } from 'react-i18next';

// Puncture Tabs
import BasicInfoTab from './tabs/BasicInfoTab';
import LocationDetailsTab from './tabs/LocationDetailsTab';
import OperationalDetailsTab from './tabs/OperationalDetailsTab';
import ServicesTab from './tabs/ServicesTab';
import VehicleCoverageTab from './tabs/VehicleCoverageTab';
import PhotosTab from './tabs/PhotosTab';

const Tab = createMaterialTopTabNavigator();

const TABS = {
    BASIC_INFO: 'Basic Info',
    LOCATION: 'Location',
    OPERATIONAL: 'Operational',
    SERVICES: 'Services',
    VEHICLE_COVERAGE: 'Vehicle Coverage',
    PHOTOS: 'Photos'
};

const PunctureMyShopContent = () => {
    const navigation = useNavigation();
    const { t } = useTranslation();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <SafeAreaView style={{ backgroundColor: '#fff' }}>
                <View style={[styles.header, { paddingTop: (Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0) + 12 }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>{t('puncture_my_shop') || "My Shop"}</Text>
                        <Text style={styles.headerSubtitle}>{t('puncture_manage_profile') || "Manage Profile & Photos"}</Text>
                    </View>
                </View>
            </SafeAreaView>

            <Tab.Navigator
                screenOptions={{
                    tabBarScrollEnabled: true,
                    tabBarLabelStyle: { fontSize: 13, fontWeight: '600', textTransform: 'none', letterSpacing: 0.3 },
                    tabBarItemStyle: { width: 'auto', paddingHorizontal: 16 },
                    tabBarIndicatorStyle: { backgroundColor: '#246BFD', height: 3 },
                    tabBarStyle: { elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#fff' },
                    tabBarActiveTintColor: '#246BFD',
                    tabBarInactiveTintColor: '#9CA3AF',
                    lazy: true,
                }}
            >
                <Tab.Screen name={TABS.BASIC_INFO} component={BasicInfoTab} options={{ title: t('puncture_basic_info') || "Basic Info" }} />
                <Tab.Screen name={TABS.LOCATION} component={LocationDetailsTab} options={{ title: t('puncture_location_address') || "Location" }} />
                <Tab.Screen name={TABS.OPERATIONAL} component={OperationalDetailsTab} options={{ title: t('puncture_operational_details') || "Operational" }} />
                <Tab.Screen name={TABS.SERVICES} component={ServicesTab} options={{ title: t('puncture_services_offered') || "Services" }} />
                <Tab.Screen name={TABS.VEHICLE_COVERAGE} component={VehicleCoverageTab} options={{ title: t('puncture_vehicle_coverage') || "Vehicle Coverage" }} />
                <Tab.Screen name={TABS.PHOTOS} component={PhotosTab} options={{ title: t('puncture_shop_photos') || "Photos" }} />
            </Tab.Navigator>

        </View>
    );
};

const PunctureMyShop = () => {
    return (
        <PunctureMyShopContent />
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: '#fff',
        zIndex: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backBtn: {
        padding: 4,
        marginRight: 8,
    },
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
});

export default PunctureMyShop;

