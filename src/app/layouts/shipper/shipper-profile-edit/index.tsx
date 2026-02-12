import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Platform,
    Animated,
    StyleSheet,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useColor, useShadow } from '@truckmitr/src/app/hooks';
import { ShipperProfileProvider, useShipperProfile } from './ShipperProfileContext';
import { styles } from './styles';

// Tabs
import KycDetailsTab from './tabs/KycDetailsTab';
import BasicDetailsTab from './tabs/BasicDetailsTab';
import BusinessDetailsTab from './tabs/BusinessDetailsTab';
import PocDetailsTab from './tabs/PocDetailsTab';
import ProfileUploadTab from './tabs/ProfileUploadTab';

const Tab = createMaterialTopTabNavigator();

// Shimmer Skeleton Component
const ShimmerBlock = ({ width, height, style, shimmerAnim }: { width: number | string, height: number, style?: any, shimmerAnim: Animated.Value }) => {
    const opacity = shimmerAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.3, 0.7, 0.3],
    });

    return (
        <Animated.View
            style={[
                {
                    width: width as any,
                    height,
                    backgroundColor: '#E5E7EB',
                    borderRadius: 8,
                    opacity,
                },
                style,
            ]}
        />
    );
};

const ProfileEditSkeleton = () => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 1200,
                useNativeDriver: true,
            })
        );
        animation.start();
        return () => animation.stop();
    }, []);

    return (
        <View style={skeletonStyles.container}>
            {/* Fake tab bar */}
            <View style={skeletonStyles.tabBar}>
                {['KYC Details', 'Basic Details', 'Business', 'POC', 'Upload'].map((_, i) => (
                    <ShimmerBlock key={i} width={80} height={14} shimmerAnim={shimmerAnim} style={{ marginRight: 16 }} />
                ))}
            </View>

            {/* Card 1 - Registration Details */}
            <View style={skeletonStyles.card}>
                <ShimmerBlock width={140} height={16} shimmerAnim={shimmerAnim} style={{ marginBottom: 20 }} />
                <ShimmerBlock width={'100%'} height={14} shimmerAnim={shimmerAnim} style={{ marginBottom: 10 }} />
                <ShimmerBlock width={'100%'} height={44} shimmerAnim={shimmerAnim} style={{ marginBottom: 16, borderRadius: 10 }} />
                <ShimmerBlock width={'100%'} height={14} shimmerAnim={shimmerAnim} style={{ marginBottom: 10 }} />
                <ShimmerBlock width={'100%'} height={44} shimmerAnim={shimmerAnim} style={{ marginBottom: 16, borderRadius: 10 }} />
                <ShimmerBlock width={100} height={14} shimmerAnim={shimmerAnim} style={{ marginBottom: 10 }} />
                <ShimmerBlock width={100} height={100} shimmerAnim={shimmerAnim} style={{ borderRadius: 10 }} />
            </View>

            {/* Card 2 - GST Details */}
            <View style={skeletonStyles.card}>
                <ShimmerBlock width={120} height={16} shimmerAnim={shimmerAnim} style={{ marginBottom: 20 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <ShimmerBlock width={120} height={14} shimmerAnim={shimmerAnim} />
                    <ShimmerBlock width={44} height={24} shimmerAnim={shimmerAnim} style={{ borderRadius: 12 }} />
                </View>
                <ShimmerBlock width={'100%'} height={14} shimmerAnim={shimmerAnim} style={{ marginBottom: 10 }} />
                <ShimmerBlock width={'100%'} height={44} shimmerAnim={shimmerAnim} style={{ marginBottom: 16, borderRadius: 10 }} />
                <ShimmerBlock width={'100%'} height={14} shimmerAnim={shimmerAnim} style={{ marginBottom: 10 }} />
                <ShimmerBlock width={'100%'} height={44} shimmerAnim={shimmerAnim} style={{ borderRadius: 10 }} />
            </View>

            {/* Save button skeleton */}
            <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
                <ShimmerBlock width={'100%'} height={48} shimmerAnim={shimmerAnim} style={{ borderRadius: 12 }} />
            </View>
        </View>
    );
};

const skeletonStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    card: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
});

const ShipperProfileEditContent = () => {
    const navigation = useNavigation();
    const colors = useColor();
    const { shadow } = useShadow();
    const { fetching } = useShipperProfile();

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
                        <Text style={styles.headerTitle}>Edit Profile</Text>
                        <Text style={styles.headerSubtitle}>Update your details</Text>
                    </View>
                </View>
            </SafeAreaView>

            {fetching ? (
                <ProfileEditSkeleton />
            ) : (
                <Tab.Navigator
                    screenOptions={{
                        tabBarScrollEnabled: true,
                        tabBarLabelStyle: { fontSize: 13, fontWeight: '600', textTransform: 'none' },
                        tabBarItemStyle: { width: 'auto', paddingHorizontal: 16 },
                        tabBarIndicatorStyle: { backgroundColor: colors.royalBlue, height: 3 },
                        tabBarStyle: { elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
                        tabBarActiveTintColor: colors.royalBlue,
                        tabBarInactiveTintColor: '#6B7280',
                        lazy: true,
                    }}
                >
                    <Tab.Screen name="KYC Details" component={KycDetailsTab} />
                    <Tab.Screen name="Basic Details" component={BasicDetailsTab} />
                    <Tab.Screen name="Business Details" component={BusinessDetailsTab} />
                    <Tab.Screen name="POC Details" component={PocDetailsTab} />
                    <Tab.Screen name="Profile Upload" component={ProfileUploadTab} />
                </Tab.Navigator>
            )}
        </View>
    );
};

const ShipperProfileEdit = () => {
    return (
        <ShipperProfileProvider>
            <ShipperProfileEditContent />
        </ShipperProfileProvider>
    );
};

export default ShipperProfileEdit;

