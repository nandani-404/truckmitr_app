import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Dimensions,
    ScrollView,
    Platform,
    Image,
} from 'react-native';
import { 
    GestureHandlerRootView, 
    TouchableOpacity as GHTouchableOpacity 
} from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { STACKS, NavigatorParams } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import * as TYPES from '@truckmitr/redux/actions/types';
import { ModuleType } from '@truckmitr/redux/reducers/global/app.reducer';
import { useTranslation } from 'react-i18next';
import { useColor, useImage } from '@truckmitr/src/app/hooks';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';

const { width } = Dimensions.get('window');

const ROLE_DATA = [
    {
        id: 'driver',
        titleKey: 'module_selection_driver',
        subtitleKey: 'module_selection_new_driver_subtitle',
        descKey: 'module_selection_new_driver_desc',
        ctaKey: 'module_selection_new_driver_cta',
        icon: 'account-tie',
        module: 'hiring'
    },
    {
        id: 'transporter',
        titleKey: 'module_selection_transporter',
        subtitleKey: 'module_selection_new_transporter_subtitle',
        descKey: 'module_selection_new_transporter_desc',
        ctaKey: 'module_selection_new_transporter_cta',
        icon: 'truck',
        module: 'hiring'
    },
    {
        id: 'foreman',
        titleKey: 'module_selection_driver_foreman',
        subtitleKey: 'module_selection_new_foreman_subtitle',
        descKey: 'module_selection_new_foreman_desc',
        ctaKey: 'module_selection_new_foreman_cta',
        icon: 'account-hard-hat',
        module: 'foreman'
    },
    // {
    //     id: 'shipper',
    //     titleKey: 'module_selection_shipper',
    //     subtitleKey: 'module_selection_new_shipper_subtitle',
    //     descKey: 'module_selection_new_shipper_desc',
    //     ctaKey: 'module_selection_new_shipper_cta',
    //     icon: 'package-variant-closed',
    //     module: 'shipper'
    // },
    {
        id: 'association',
        titleKey: 'module_selection_driver_association',
        subtitleKey: 'module_selection_new_association_subtitle',
        descKey: 'module_selection_new_association_desc',
        ctaKey: 'module_selection_new_association_cta',
        icon: 'account-group',
        module: 'association'
    },
    {
        id: 'dhaba',
        titleKey: 'module_selection_dhaba_sathi',
        subtitleKey: 'module_selection_new_dhaba_subtitle',
        descKey: 'module_selection_new_dhaba_desc',
        ctaKey: 'module_selection_new_dhaba_cta',
        icon: 'pot-steam',
        module: 'dhaba'
    },
    {
        id: 'puncture',
        titleKey: 'module_selection_puncture_point',
        subtitleKey: 'module_selection_new_puncture_subtitle',
        descKey: 'module_selection_new_puncture_desc',
        ctaKey: 'module_selection_new_puncture_cta',
        icon: 'tire',
        module: 'puncture_shop'
    },
];

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

const ModuleSelectionNew = () => {
    const { t } = useTranslation();
    const colors = useColor();
    const images = useImage();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NavigatorProp>();
    const dispatch = useDispatch();
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['50%'], []);

    const selectedRole = useMemo(() =>
        ROLE_DATA.find(r => r.id === selectedRoleId),
        [selectedRoleId]);

    const handleRoleSelect = (roleId: string) => {
        setSelectedRoleId(roleId);
        bottomSheetRef.current?.snapToIndex(0);
    };

    const handleContinue = async () => {
        if (!selectedRole) return;

        if (selectedRole.module) {
            const module = selectedRole.module as ModuleType;
            await AsyncStorage.setItem('SELECTED_MODULE', module as string);
            dispatch({ type: TYPES.SET_MODULE, payload: module });
        }

        navigation.navigate(STACKS.SIGNUP as any, { preSelectedRole: selectedRole.id });
    };

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.5}
            />
        ),
        []
    );

    const renderRoleCard = (item: typeof ROLE_DATA[0]) => {
        const isSelected = selectedRoleId === item.id;
        return (
            <GHTouchableOpacity
                key={item.id}
                style={[
                    styles.card,
                    isSelected && styles.selectedCard
                ]}
                onPress={() => handleRoleSelect(item.id)}
                activeOpacity={0.7}
            >
                <View style={[styles.iconContainer, isSelected && styles.selectedIconContainer]}>
                    <MaterialCommunityIcons
                        name={item.icon}
                        size={24}
                        color={isSelected ? '#FFFFFF' : '#1E40AF'}
                    />
                </View>
                <View style={styles.cardTextContainer}>
                    <Text style={[styles.cardTitle, isSelected && styles.selectedCardTitle]}>
                        {t(item.titleKey)}
                    </Text>
                    <Text style={[styles.cardSubtitle, isSelected && styles.selectedCardSubtitle]} numberOfLines={2}>
                        {t(item.subtitleKey)}
                    </Text>
                </View>
            </GHTouchableOpacity>
        );
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <View style={[styles.headerTop, { justifyContent: 'center' }]}>
                    <Image
                        source={images.TRUCKMITR_HORIZONTAL}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                </View>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.contentHeader}>
                    <Text style={styles.mainTitle}>Choose your role</Text>
                    <Text style={styles.subTitle}>Choose the profile that best describes your needs.</Text>
                </View>

                <View style={styles.grid}>
                    {ROLE_DATA.map(item => renderRoleCard(item))}
                </View>
            </ScrollView>

            <BottomSheet
                ref={bottomSheetRef}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose={true}
                backdropComponent={renderBackdrop}
                backgroundStyle={{ borderRadius: 24 }}
            >
                <BottomSheetView style={[styles.sheetContent, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                    {selectedRole ? (
                        <>
                            <View style={styles.sheetIconContainer}>
                                <MaterialCommunityIcons
                                    name={selectedRole.icon}
                                    size={44}
                                    color="#1E40AF"
                                />
                            </View>
                            <Text style={styles.sheetTitle}>{t(selectedRole.titleKey)}</Text>
                            <Text style={styles.sheetSubtitle}>{t(selectedRole.subtitleKey)}</Text>
                            <Text style={styles.sheetDescription}>{t(selectedRole.descKey)}</Text>

                            <TouchableOpacity
                                style={styles.sheetContinueButton}
                                onPress={handleContinue}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.sheetContinueText}>{t(selectedRole.ctaKey)}</Text>
                            </TouchableOpacity>
                        </>
                    ) : null}
                </BottomSheetView>
            </BottomSheet>
            </View>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 20,
        paddingBottom: 15,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logoImage: {
        width: 140,
        height: 40,
    },
    scrollContent: {
        paddingHorizontal: 16,
    },
    contentHeader: {
        marginTop: 20,
        marginBottom: 24,
    },
    mainTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 8,
    },
    subTitle: {
        fontSize: 15,
        color: '#64748B',
        lineHeight: 22,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
    },
    card: {
        width: (width - 56) / 2, // 2 columns with better spacing
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
        elevation: 1,
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    selectedCard: {
        borderColor: '#1E40AF',
        backgroundColor: '#F0F9FF',
        shadowOpacity: 0.1,
        elevation: 3,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    selectedIconContainer: {
        backgroundColor: '#1E40AF',
    },
    cardTextContainer: {
        minHeight: 60,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 2,
    },
    selectedCardTitle: {
        color: '#1E40AF',
    },
    cardSubtitle: {
        fontSize: 11,
        color: '#64748B',
        lineHeight: 14,
        fontWeight: '500',
    },
    selectedCardSubtitle: {
        color: '#3B82F6',
    },
    sheetContent: {
        paddingHorizontal: 24,
        paddingTop: 8,
        alignItems: 'center',
    },
    sheetIconContainer: {
        width: 72,
        height: 72,
        borderRadius: 20,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    sheetTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 12,
    },
    sheetSubtitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E40AF',
        textAlign: 'center',
        marginBottom: 12,
        paddingHorizontal: 12,
    },
    sheetDescription: {
        fontSize: 14,
        color: '#475569',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    sheetContinueButton: {
        backgroundColor: '#1E40AF',
        width: '100%',
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#1E40AF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    sheetContinueText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default ModuleSelectionNew;
