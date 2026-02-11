import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Feather, MaterialIcons, Ionicons, FontAwesome } from '@expo/vector-icons';
import { userAuthenticatedAction } from '@truckmitr/src/redux/actions/user.action';
import { deleteUserData } from '@truckmitr/src/utils/config/token';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { BASE_URL, END_POINTS } from '@truckmitr/src/utils/config';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import { AppleConfirmDialog, Space } from '@truckmitr/src/app/components';
import { useTranslation } from 'react-i18next';

// Design Tokens
const C = {
    bg: '#FFFFFF',
    text: '#1C1C1E',
    textSec: '#6B7280',
    primary: '#2563EB',
    border: '#E5E7EB',
    danger: '#DC2626',
    surfaceAlt: '#F9FAFB',
};

const TruckerProfileScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<any>();
    const dispatch = useDispatch();
    const { user } = useSelector((state: any) => state?.user);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await axiosInstance.post(END_POINTS?.LOGOUT);
        } catch (error) {
            console.warn('Logout API error', error);
        }
        await deleteUserData();
        dispatch(userAuthenticatedAction(false));
        setShowLogoutDialog(false);
        setLoggingOut(false);
    };

    const MenuItem = ({ icon, label, onPress, danger }: any) => (
        <TouchableOpacity style={s.menuItem} onPress={onPress}>
            <View style={[s.menuIcon, danger && { backgroundColor: '#FEE2E2' }]}>
                {icon}
            </View>
            <Text style={[s.menuLabel, danger && { color: C.danger }]}>{label}</Text>
            <Feather name="chevron-right" size={20} color="#9CA3AF" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={s.container}>
            <ScrollView contentContainerStyle={s.content}>

                {/* Header Profile Info */}
                <View style={s.profileHeader}>
                    <View style={s.avatarContainer}>
                        {user?.images ? (
                            <Image
                                source={{ uri: `${BASE_URL}public/${user.images}` }}
                                style={s.avatar}
                            />
                        ) : (
                            <View style={[s.avatar, { backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center' }]}>
                                <Text style={{ fontSize: 24, fontWeight: '700', color: C.primary }}>
                                    {user?.name?.charAt(0)?.toUpperCase()}
                                </Text>
                            </View>
                        )}
                        {/* <TouchableOpacity style={s.editBadge}>
                            <Feather name="edit-2" size={12} color="white" />
                        </TouchableOpacity> */}
                    </View>
                    <Text style={s.userName}>{user?.name || 'Trucker'}</Text>
                    <Text style={s.userPhone}>{user?.mobile}</Text>
                    {user?.driver_rating && (
                        <View style={s.ratingBadge}>
                            <FontAwesome name="star" size={12} color="#F59E0B" />
                            <Text style={s.ratingText}>{user.driver_rating}</Text>
                        </View>
                    )}
                </View>

                {/* Profile Completion Card (Commented Out as per original) */}
                {/* <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('profileCompletion')}
                    style={s.completionCard}
                >
                    <View style={s.completionLeft}>
                        <View style={s.completionIconBg}>
                            <Text style={{ fontSize: 18 }}>📋</Text>
                        </View>
                        <View style={s.completionInfo}>
                            <Text style={s.completionTitle}>Complete Your Profile</Text>
                            <Text style={s.completionSub}>4 steps to start getting loads</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color="#6B7280" />
                    </View>
                </TouchableOpacity> */}

                <Space height={24} />

                {/* Menu */}
                <Text style={s.sectionTitle}>Account</Text>
                <View style={s.menuContainer}>
                    {/* <MenuItem 
                        icon={<Feather name="user" size={20} color={C.primary} />}
                        label="My Profile"
                        onPress={() => {}}
                    /> */}
                    <MenuItem
                        icon={<Feather name="file-text" size={20} color={C.primary} />}
                        label="My Documents"
                        onPress={() => { }}
                    />
                    <MenuItem
                        icon={<Feather name="settings" size={20} color={C.primary} />}
                        label="Settings"
                        onPress={() => { }}
                    />
                    <MenuItem
                        icon={<Feather name="help-circle" size={20} color={C.primary} />}
                        label="Help & Support"
                        onPress={() => { }}
                    />
                </View>

                <Space height={24} />

                <Text style={s.sectionTitle}>More</Text>
                <View style={s.menuContainer}>
                    <MenuItem
                        icon={<Feather name="info" size={20} color="#4B5563" />}
                        label="Terms & Conditions"
                        onPress={() => { }}
                    />
                    <MenuItem
                        icon={<Feather name="log-out" size={20} color={C.danger} />}
                        label="Logout"
                        danger
                        onPress={() => setShowLogoutDialog(true)}
                    />
                </View>

                <Space height={40} />
            </ScrollView>

            {/* Logout Confirmation */}
            <AppleConfirmDialog
                visible={showLogoutDialog}
                title={t('logout') || "Logout"} // Fallback string if key missing
                message={t('areYouSureLogout') || "Are you sure you want to logout?"}
                onConfirm={handleLogout}
                onCancel={() => setShowLogoutDialog(false)}
                confirmText={t('yes') || "Yes"}
                cancelText={t('cancel') || "Cancel"}
                loading={loggingOut}
            />

        </SafeAreaView>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    content: { padding: 20 },

    profileHeader: { alignItems: 'center', marginBottom: 20 },
    avatarContainer: { position: 'relative', marginBottom: 12 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F3F4F6' },
    editBadge: {
        position: 'absolute', bottom: 0, right: 0,
        backgroundColor: C.primary, width: 24, height: 24, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'white'
    },
    userName: { fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 4 },
    userPhone: { fontSize: 14, color: C.textSec, marginBottom: 8 },
    ratingBadge: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7',
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4
    },
    ratingText: { fontSize: 12, fontWeight: '700', color: '#D97706' },

    completionCard: {
        backgroundColor: C.surfaceAlt, borderRadius: 12, padding: 16,
        borderWidth: 1, borderColor: C.border
    },
    completionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    completionIconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
    completionInfo: { flex: 1 },
    completionTitle: { fontSize: 16, fontWeight: '600', color: C.text },
    completionSub: { fontSize: 13, color: C.textSec },

    sectionTitle: { fontSize: 14, fontWeight: '600', color: C.textSec, marginBottom: 12, marginLeft: 4 },
    menuContainer: { backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
    menuItem: {
        flexDirection: 'row', alignItems: 'center', padding: 16,
        borderBottomWidth: 1, borderBottomColor: C.surfaceAlt, gap: 12
    },
    menuIcon: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFF6FF',
        alignItems: 'center', justifyContent: 'center'
    },
    menuLabel: { flex: 1, fontSize: 16, fontWeight: '500', color: C.text },
});

export default TruckerProfileScreen;
