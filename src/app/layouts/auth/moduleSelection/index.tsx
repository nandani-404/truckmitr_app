
import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Image,
    Dimensions,
    ScrollView,
    Animated,
    LayoutAnimation,
    Platform,
    UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { STACKS, NavigatorParams } from '@truckmitr/stacks/stacks';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import * as TYPES from '@truckmitr/redux/actions/types';
import { ModuleType } from '@truckmitr/redux/reducers/global/app.reducer';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

// Image source
const GROUP_IMAGE_SOURCE = require('@truckmitr/src/assets/role-selection-2.png');

import { useTranslation, Trans } from 'react-i18next';
import { useColor } from '@truckmitr/src/app/hooks/colors';

// Role definitions with specific colors and translation keys
const ROLE_DATA = [
    { id: 'driver', labelKey: 'module_selection_driver', color: '#4A90E2', icon: 'directions-car', module: 'hiring' }, // Blue
    { id: 'transporter', labelKey: 'module_selection_transporter', color: '#F5A623', icon: 'local-shipping', module: 'hiring' }, // Orange
    { id: 'foreman', labelKey: 'module_selection_driver_foreman', color: '#9013FE', icon: 'engineering', module: 'foreman' }, // Purple
    { id: 'association', labelKey: 'module_selection_driver_association', color: '#E74C3C', icon: 'groups', module: 'association' }, // Red
    { id: 'dhaba', labelKey: 'module_selection_dhaba_sathi', color: '#2ECC71', icon: 'restaurant', module: 'dhaba' }, // Green
    { id: 'puncture', labelKey: 'module_selection_puncture_point', color: '#F1C40F', icon: 'build', module: 'puncture_shop' }, // Yellow
    { id: 'shipper', labelKey: 'module_selection_shipper', color: '#FF4081', icon: 'local-shipping', module: 'shipper' }, // Pink
    { id: 'trucker', labelKey: 'module_selection_trucker', color: '#00BCD4', icon: 'directions-bus', module: 'trucker' }, // Cyan
];

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

const ModuleSelection = () => {
    const { t } = useTranslation();
    const colors = useColor();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NavigatorProp>();
    const dispatch = useDispatch();
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const scrollRef = useRef<ScrollView>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const handleRoleSelect = (roleId: string) => {
        // trigger layout animation
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSelectedRole(roleId);
    };

    const handleContinue = async () => {
        if (!selectedRole) return;
        console.log('Continuing with role:', selectedRole);

        // Check if role data exists
        const selectedRoleData = ROLE_DATA.find(r => r.id === selectedRole);

        if (selectedRoleData && selectedRoleData.module) {
            const module = selectedRoleData.module as ModuleType;
            // Persist to AsyncStorage for one-time selection
            await AsyncStorage.setItem('SELECTED_MODULE', module as string);
            // Dispatch selected module to Redux
            dispatch({ type: TYPES.SET_MODULE, payload: module });
            console.log('💾 Module saved:', module);
        }

        // Navigation logic based on role
        // For now, map all roles to SIGNUP with preSelectedRole
        navigation.navigate(STACKS.SIGNUP as any, { preSelectedRole: selectedRole });
    };

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" />

            {/* Navigation Header */}
            <View style={[styles.navHeader, { paddingTop: insets.top + 10, height: 60 + insets.top }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
            </View>

            <ScrollView
                ref={scrollRef}
                style={{ flex: 1 }}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                {/* Header Section */}
                <View style={styles.header}>
                    <Text style={styles.titleText}>
                        <Trans
                            i18nKey="module_selection_title"
                            components={{ 1: <Text style={{ color: colors.royalBlue }} /> }}
                        />
                    </Text>
                    <Text style={styles.subtitleText}>
                        {t('module_selection_subtitle')}
                    </Text>
                </View>

                {/* Role Selection Grid */}
                <View style={styles.gridContainer}>
                    {ROLE_DATA.map((item) => {
                        const isSelected = selectedRole === item.id;
                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={[
                                    styles.pill,
                                    isSelected ? {
                                        backgroundColor: item.color,
                                        borderColor: item.color,
                                        elevation: 4
                                    } : {
                                        borderColor: '#EFEFEF',
                                        backgroundColor: '#FFFFFF',
                                    }
                                ]}
                                onPress={() => handleRoleSelect(item.id)}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.roleLabel, isSelected && { color: '#FFF', fontWeight: '700' }]}>
                                    {t(item.labelKey)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Spacer */}
                <View style={{ height: 20 }} />
            </ScrollView>

            {/* Image Section - Fixed at bottom */}
            <View style={[styles.imageSection, { paddingBottom: insets.bottom }]}>
                <Image
                    source={GROUP_IMAGE_SOURCE}
                    style={styles.groupImage}
                    resizeMode="cover"
                />
            </View>




            {/* Fixed Footer for Continue Button */}
            {
                selectedRole && (
                    <View style={[styles.fixedFooter, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                        <TouchableOpacity
                            onPress={handleContinue}
                            activeOpacity={0.8}
                            style={[
                                styles.continueButton,
                                { backgroundColor: '#000080' }
                            ]}
                        >
                            <Text style={styles.continueButtonText}>{t('module_selection_continue')}</Text>
                            <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                )
            }
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 100, // Extra padding for fixed footer
    },
    navHeader: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 20 : 50, // Adjusted for status bar without SafeAreaView
        height: Platform.OS === 'android' ? 60 : 90,
        justifyContent: 'center',
    },
    backButton: {
        padding: 5,
        marginLeft: -5,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 0, // Reduced padding to shift title upper
        paddingBottom: 30,
    },
    titleText: {
        fontSize: 26,
        fontWeight: '700',
        color: '#1A1A1A',
        lineHeight: 34,
        letterSpacing: -0.5,
        marginBottom: 12,
    },
    subtitleText: {
        fontSize: 16,
        color: '#666666',
        lineHeight: 24,
        fontWeight: '400',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        gap: 12,
    },
    pill: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 50, // Full rounded pill
        marginBottom: 12,
        marginRight: 8,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    roleLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333333',
        textAlign: 'center',
    },
    imageSection: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 0, // Ensure no padding
        marginHorizontal: 0, // Ensure no margin,
    },
    groupImage: {
        width: width,
        height: 220, // Slightly Increased height
    },
    fixedFooter: {
        position: 'absolute',
        bottom: 10,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
        paddingHorizontal: 24,
        paddingTop: 0,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    continueButton: {
        flexDirection: 'row',
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 1,
        marginRight: 8,
    },
});

export default ModuleSelection;
