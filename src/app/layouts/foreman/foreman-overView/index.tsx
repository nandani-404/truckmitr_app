import React, { useCallback, useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    StyleSheet,
    ActivityIndicator,
    StatusBar,
    Platform,
} from 'react-native';
import { useColor, useResponsiveScale, useShadow, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Space } from '@truckmitr/src/app/components';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { BASE_URL, END_POINTS } from '@truckmitr/src/utils/config';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { userAction } from '@truckmitr/src/redux/actions/user.action';
import moment from 'moment';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

// Field Group Card Component
interface FieldGroupCardProps {
    title: string;
    icon?: string;
    iconLibrary?: 'Ionicons' | 'MaterialCommunityIcons' | 'Feather';
    fields: Array<{
        label: string;
        value: string | undefined;
        isImage?: boolean;
        imageUri?: string;
    }>;
    onEdit?: (stepId: number | string) => void;
    stepId: number | string;
}

const FieldGroupCard: React.FC<FieldGroupCardProps> = ({
    title,
    icon,
    iconLibrary = 'Ionicons',
    fields,
    onEdit,
    stepId,
}) => {
    const colors = useColor();
    const { responsiveFontSize } = useResponsiveScale();
    const { shadow } = useShadow();

    const renderIcon = () => {
        if (!icon) return null;
        const iconProps = { name: icon, size: 22, color: colors.royalBlue };
        switch (iconLibrary) {
            case 'MaterialCommunityIcons': return <MaterialCommunityIcons {...iconProps} />;
            case 'Feather': return <Feather {...iconProps} />;
            default: return <Ionicons {...iconProps} />;
        }
    };

    return (
        <View style={[styles.fieldCard, { backgroundColor: colors.white, ...shadow, marginHorizontal: 20, marginBottom: 16 }]}>
            <View style={[styles.cardHeader, { backgroundColor: colors.royalBlue + '08' }]}>
                <View style={styles.headerContent}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.royalBlue + '15' }]}>
                        {renderIcon()}
                    </View>
                    <Text style={[styles.groupTitle, { color: colors.royalBlue, fontSize: responsiveFontSize(1.8), fontWeight: '700' }]}>
                        {title}
                    </Text>
                </View>
                {onEdit && (
                    <TouchableOpacity onPress={() => onEdit(stepId)} style={[styles.editButton, { backgroundColor: colors.royalBlue + '12' }]}>
                        <Feather name="edit-2" size={16} color={colors.royalBlue} />
                    </TouchableOpacity>
                )}
            </View>
            <View style={styles.cardContent}>
                {fields.map((field, index) => (
                    <View key={index} style={[styles.fieldRow, index < fields.length - 1 && styles.fieldDivider]}>
                        <Text style={[styles.fieldLabel, { color: colors.blackOpacity(0.5), fontSize: responsiveFontSize(1.4) }]}>
                            {field.label.toUpperCase()}
                        </Text>
                        <View style={styles.fieldValueContainer}>
                            {field.isImage && field.imageUri ? (
                                <Image source={{ uri: field.imageUri }} style={styles.fieldImage} />
                            ) : (
                                <Text style={[styles.fieldValue, { color: colors.black, fontSize: responsiveFontSize(1.7) }]}>
                                    {field.value || 'Not Provided'}
                                </Text>
                            )}
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
};

const ProfileOverView = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const colors = useColor();
    const navigation = useNavigation<NavigatorProp>();
    const safeAreaInsets = useSafeAreaInsets();
    const { responsiveFontSize, responsiveHeight } = useResponsiveScale();
    const user = useSelector((state: any) => state.user?.user);
    const [loading, setLoading] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const fetchProfile = async () => {
                setLoading(true);
                try {
                    const response: any = await axiosInstance.get(END_POINTS.GET_PROFILE);
                    if (response?.data?.status) {
                        dispatch(userAction(response.data));
                    }
                } catch (error) {
                    console.error('Error fetching profile:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchProfile();
        }, [])
    );

    const navigateToEdit = (stepId: number | string) => {
        navigation.navigate(STACKS.FOREMAN_PROFILE_COMPLETION, { stepId });
    };

    const formatDate = (date: any) => date ? moment(date).format('DD MMM YYYY') : 'Not Provided';
    const formatExperience = (exp: string | undefined): string => {
        if (!exp) return 'Not Provided';
        const mapping: Record<string, string> = {
            '0': '0',
            'less_than_1': '0',
            '1': '1-2',
            '3': '3-5',
            '6': '6-10',
            '10': '10+',
            '10+': '10+',
        };
        return mapping[exp] || exp;
    };
    const getImageUri = (imagePath: string | undefined): string | undefined => {
        if (!imagePath) return undefined;
        return `${BASE_URL}public/${imagePath}`;
    };

    if (loading && !user) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.royalBlue} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="dark-content" />
            <Space height={safeAreaInsets.top} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={colors.black} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.black, fontSize: responsiveFontSize(2.2) }]}>
                    Profile Overview
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }}>
                <FieldGroupCard
                    title="Profile Photo"
                    icon="person-circle-outline"
                    stepId="avatar"
                    onEdit={navigateToEdit}
                    fields={[
                        {
                            label: "Profile Photo",
                            value: '',
                            isImage: true,
                            imageUri: getImageUri(user?.images),
                        }
                    ]}
                />

                <FieldGroupCard
                    title="Personal Details"
                    icon="person-outline"
                    stepId={1}
                    onEdit={navigateToEdit}
                    fields={[
                        { label: 'Date of Birth', value: formatDate(user?.dob || user?.DOB) },
                        { label: 'Years of Experience', value: formatExperience(user?.driving_experience || user?.Driving_Experience) },
                    ]}
                />

                <FieldGroupCard
                    title="License Details"
                    icon="card-outline"
                    stepId={2}
                    onEdit={navigateToEdit}
                    fields={[
                        { label: 'License Number', value: user?.license_number || user?.License_Number },
                        { label: 'Expiry Date', value: formatDate(user?.expiry_date_of_license || user?.Expiry_date_of_License) },
                    ]}
                />

                <FieldGroupCard
                    title="PAN Details"
                    icon="document-text-outline"
                    stepId={3}
                    onEdit={navigateToEdit}
                    fields={[
                        { label: 'PAN Number', value: user?.pan_number || user?.PAN_Number },
                    ]}
                />
                <View style={[styles.infoBox, { backgroundColor: colors.royalBlue + '08' }]}>
                    <Ionicons name="information-circle-outline" size={18} color={colors.royalBlue} />
                    <Text style={[styles.infoText, { color: colors.royalBlue, fontSize: responsiveFontSize(1.3) }]}>
                        PAN is required for commission payouts
                    </Text>
                </View>


            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 56,
    },
    headerTitle: { fontWeight: '700' },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    fieldCard: { borderRadius: 16, overflow: 'hidden' },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerContent: { flexDirection: 'row', alignItems: 'center' },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    groupTitle: { letterSpacing: 0.3 },
    editButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContent: { padding: 16 },
    fieldRow: { paddingVertical: 8 },
    fieldValueContainer: { marginTop: 4 },
    fieldImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F3F4F6',
    },
    fieldDivider: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        marginBottom: 8,
        paddingBottom: 12,
    },
    fieldLabel: { fontWeight: '600', marginBottom: 4, letterSpacing: 0.5 },
    fieldValue: { fontWeight: '500' },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        marginTop: -8,
    },
    infoText: { marginLeft: 8, fontWeight: '500' },
});

export default ProfileOverView;
