
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    StyleSheet,
    ActivityIndicator,
} from 'react-native'
import React, { useCallback, useState, useEffect } from 'react'
import { useColor, useResponsiveScale, useShadow, useStatusBarStyle } from '@truckmitr/src/app/hooks'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Space } from '@truckmitr/src/app/components'
import Ionicons from 'react-native-vector-icons/Ionicons'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import Feather from 'react-native-vector-icons/Feather'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { BASE_URL, END_POINTS } from '@truckmitr/src/utils/config'
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance'
import { userAction } from '@truckmitr/src/redux/actions/user.action'
import moment from 'moment'

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>

// State ID to Name Mapping - Can be moved to utilities if shared properly, duplication for now
const STATE_ID_MAP: Record<string, string> = {
    '1': 'Andaman and Nicobar Islands',
    '2': 'Andhra Pradesh',
    '3': 'Arunachal Pradesh',
    '4': 'Assam',
    '5': 'Bihar',
    '6': 'Chandigarh',
    '7': 'Chhattisgarh',
    '8': 'Dadra and Nagar Haveli',
    '9': 'Delhi',
    '10': 'Goa',
    '11': 'Gujarat',
    '12': 'Haryana',
    '13': 'Himachal Pradesh',
    '14': 'Jammu and Kashmir',
    '15': 'Jharkhand',
    '16': 'Karnataka',
    '17': 'Kerala',
    '18': 'Ladakh',
    '19': 'Lakshadweep',
    '20': 'Madhya Pradesh',
    '21': 'Maharashtra',
    '22': 'Manipur',
    '23': 'Meghalaya',
    '24': 'Mizoram',
    '25': 'Nagaland',
    '26': 'Odisha',
    '27': 'Others',
    '28': 'Puducherry',
    '29': 'Punjab',
    '30': 'Rajasthan',
    '31': 'Sikkim',
    '32': 'Tamil Nadu',
    '33': 'Telangana',
    '34': 'Tripura',
    '35': 'Uttar Pradesh',
    '36': 'Uttarakhand',
    '37': 'West Bengal',
    '38': 'Daman and Diu'
}

// Helper function to get state name from ID
const getStateName = (stateValue: string | number | undefined): string => {
    if (!stateValue) return ''
    const stateStr = String(stateValue).trim()
    if (STATE_ID_MAP[stateStr]) {
        return STATE_ID_MAP[stateStr]
    }
    return stateStr
}

// Field Group Card Component
interface FieldGroupCardProps {
    title: string
    icon?: string
    iconLibrary?: 'Ionicons' | 'MaterialCommunityIcons' | 'Feather'
    fields: Array<{
        label: string
        value: string | undefined
        isImage?: boolean
        imageUri?: string
    }>
    onEdit?: (stepId?: string) => void
    stepId?: string
}

const FieldGroupCard: React.FC<FieldGroupCardProps> = ({
    title,
    icon,
    iconLibrary = 'Ionicons',
    fields,
    onEdit,
    stepId,
}) => {
    const colors = useColor()
    const { responsiveFontSize } = useResponsiveScale()
    const { shadow } = useShadow()

    const renderIcon = () => {
        if (!icon) return null
        const iconProps = { name: icon, size: 22, color: colors.royalBlue }

        switch (iconLibrary) {
            case 'MaterialCommunityIcons':
                return <MaterialCommunityIcons {...iconProps} />
            case 'Feather':
                return <Feather {...iconProps} />
            default:
                return <Ionicons {...iconProps} />
        }
    }

    return (
        <View style={[
            styles.fieldCard,
            {
                backgroundColor: colors.white,
                ...shadow,
                shadowColor: colors.blackOpacity(0.12),
                marginHorizontal: responsiveFontSize(2),
                marginBottom: responsiveFontSize(2),
            }
        ]}>
            {/* Beautiful gradient header */}
            <View style={[
                styles.cardHeader,
                {
                    backgroundColor: colors.royalBlue + '08',
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16,
                }
            ]}>
                <View style={styles.headerContent}>
                    <View style={[
                        styles.iconContainer,
                        {
                            backgroundColor: colors.royalBlue + '15',
                        }
                    ]}>
                        {renderIcon()}
                    </View>
                    <Text style={[
                        styles.groupTitle,
                        {
                            color: colors.royalBlue,
                            fontSize: responsiveFontSize(1.9),
                            fontWeight: '700',
                        }
                    ]}>
                        {title}
                    </Text>
                </View>
                {onEdit && (
                    <TouchableOpacity
                        onPress={() => onEdit(stepId)}
                        style={[
                            styles.editButton,
                            {
                                backgroundColor: colors.royalBlue + '12',
                            }
                        ]}
                    >
                        <Feather name="edit-2" size={18} color={colors.royalBlue} />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.fieldCardContent}>
                {/* Fields */}
                <View style={styles.fieldsContainer}>
                    {fields.map((field, index) => (
                        <View key={index} style={[
                            styles.fieldRow,
                            index < fields.length - 1 && {
                                marginBottom: 16,
                                paddingBottom: 16,
                                borderBottomWidth: 1,
                                borderBottomColor: colors.blackOpacity(0.06),
                            }
                        ]}>
                            <Text style={[
                                styles.fieldLabel,
                                {
                                    color: colors.blackOpacity(0.7),
                                    fontSize: responsiveFontSize(1.4),
                                    fontWeight: '600',
                                    letterSpacing: 0.3,
                                }
                            ]}>
                                {field.label}
                            </Text>

                            <View style={styles.fieldValueContainer}>
                                {field.isImage && field.imageUri ? (
                                    <View style={styles.imageContainer}>
                                        <Image source={{ uri: field.imageUri }} style={styles.fieldImage} />
                                        <View style={[
                                            styles.imageOverlay,
                                            {
                                                backgroundColor: colors.blackOpacity(0.05),
                                            }
                                        ]} />
                                    </View>
                                ) : (
                                    <Text style={[
                                        styles.fieldValue,
                                        {
                                            color: field.value ? colors.black : colors.blackOpacity(0.5),
                                            fontSize: responsiveFontSize(1.7),
                                            fontWeight: field.value ? '500' : '400',
                                            lineHeight: responsiveFontSize(2.4),
                                        }
                                    ]}>
                                        {field.value || 'Not Provided'}
                                    </Text>
                                )}
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    )
}

export default function PunctureProfileOverview() {
    const { t } = useTranslation()
    const dispatch = useDispatch()
    useStatusBarStyle('dark-content')
    const { user } = useSelector((state: any) => state?.user) || {}
    const colors = useColor()
    const safeAreaInsets = useSafeAreaInsets()
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale()
    const navigation = useNavigation<any>() // Using any to sidestep specific stack types for custom routes

    const [loading, setLoading] = useState(false)

    // Fetch latest user data on focus
    useFocusEffect(
        useCallback(() => {
            const fetchUserData = async () => {
                setLoading(true)
                try {
                    const profile: any = await axiosInstance.get(END_POINTS?.GET_PROFILE)
                    if (profile?.data?.status) {
                        dispatch(userAction(profile?.data))
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error)
                } finally {
                    setLoading(false)
                }
            }
            fetchUserData()
        }, [])
    )

    const navigateToEdit = (stepId?: string) => {
        let tabName = 'Profile';
        if (stepId === 'basic_info') tabName = 'Basic Info';
        if (stepId === 'photos') tabName = 'Photos';

        navigation.navigate(STACKS.PUNCTURE_MY_SHOP, { initialTab: tabName });
    }

    const getImageUri = (imagePath: string | undefined): string | undefined => {
        if (!imagePath) return undefined
        return `${BASE_URL}public/${imagePath}`
    }

    const formatArray = (arr: any): string => {
        if (!arr) return 'Not Provided';
        if (Array.isArray(arr)) return arr.join(', ');
        if (typeof arr === 'string') {
            try {
                const parsed = JSON.parse(arr);
                if (Array.isArray(parsed)) return parsed.join(', ');
                return arr;
            } catch (e) {
                return arr;
            }
        }
        return String(arr);
    }

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <Space height={safeAreaInsets.top} />
                <ActivityIndicator size="large" color={colors.royalBlue} />
                <Text style={[styles.loadingText, { color: colors.blackOpacity(0.6) }]}>
                    {t('loadingProfile') || 'Loading Profile...'}
                </Text>
            </View>
        )
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.white }]}>
            <Space height={safeAreaInsets.top} />

            {/* Header */}
            <View style={{
                backgroundColor: colors.white,
                paddingHorizontal: responsiveWidth(4),
                paddingVertical: responsiveHeight(1.5),
                borderBottomWidth: 1,
                borderBottomColor: colors.blackOpacity(0.05),
                shadowColor: colors.black,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 2,
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Back Button */}
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{
                            height: responsiveFontSize(4.5),
                            width: responsiveFontSize(4.5),
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: colors.royalBlue + '12',
                            borderRadius: responsiveFontSize(2.25),
                        }}
                    >
                        <Ionicons name={'chevron-back'} size={22} color={colors.royalBlue} />
                    </TouchableOpacity>

                    {/* Centered Title */}
                    <Text style={{
                        fontSize: responsiveFontSize(2.2),
                        color: colors.black,
                        fontWeight: '700',
                        letterSpacing: -0.3,
                        flex: 1,
                        textAlign: 'center',
                    }}>
                        {t('punctureProfileOverview') || 'Profile Overview'}
                    </Text>

                    {/* Edit Button */}
                    <TouchableOpacity
                        onPress={() => navigateToEdit()}
                        activeOpacity={1}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: colors.royalBlue + '10',
                            paddingHorizontal: responsiveFontSize(1.5),
                            paddingVertical: responsiveFontSize(0.8),
                            borderRadius: responsiveFontSize(1),
                        }}
                    >
                        <Feather name={'edit-2'} size={18} color={colors.royalBlue} />
                        <Text style={{
                            color: colors.royalBlue,
                            fontSize: responsiveFontSize(1.6),
                            fontWeight: '600',
                            marginLeft: responsiveFontSize(0.5),
                        }}>
                            {t('edit') || 'Edit'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={{
                    backgroundColor: colors.background,
                    flex: 1,
                }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingBottom: responsiveHeight(4),
                    paddingTop: responsiveHeight(2),
                }}
            >
                {/* Profile Photo */}
                <FieldGroupCard
                    title={t('profilePhoto') || 'Profile Photo'}
                    icon="person-circle"
                    stepId="photos"
                    fields={[
                        {
                            label: t('profilePhoto') || 'Profile Photo',
                            value: '',
                            isImage: true,
                            imageUri: getImageUri(user?.images),
                        }
                    ]}
                    onEdit={navigateToEdit}
                />

                {/* Personal Information */}
                <FieldGroupCard
                    title={t('personalInformation') || 'Personal Information'}
                    icon="person"
                    stepId="basic_info"
                    fields={[
                        {
                            label: t('name') || 'Name',
                            value: user?.owner_name || user?.name,
                        },
                        {
                            label: t('mobileNumber') || 'Mobile Number',
                            value: user?.mobile,
                        },
                        {
                            label: t('email') || 'Email',
                            value: user?.email,
                        },
                        {
                            label: t('state') || 'State',
                            value: user?.state_name || getStateName(user?.states) || getStateName(user?.state),
                        },
                    ]}
                    onEdit={navigateToEdit}
                />

                {/* Using only Basic Info and Photo for now as starting point for Puncture */}

            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '500',
    },
    fieldCard: {
        borderRadius: 16,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 6,
        overflow: 'hidden',
    },
    cardHeader: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    groupTitle: {
        fontWeight: '700',
        letterSpacing: -0.2,
    },
    editButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fieldCardContent: {
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    fieldsContainer: {
        marginTop: 0,
    },
    fieldRow: {
        flexDirection: 'column',
    },
    fieldLabel: {
        fontWeight: '600',
        marginBottom: 8,
    },
    fieldValueContainer: {
        minHeight: 28,
        justifyContent: 'center',
    },
    fieldValue: {
        fontWeight: '500',
        lineHeight: 24,
    },
    imageContainer: {
        position: 'relative',
        alignSelf: 'flex-start',
    },
    fieldImage: {
        width: 100,
        height: 100,
        borderRadius: 12,
        backgroundColor: '#f8f9fa',
        borderWidth: 2,
        borderColor: '#e9ecef',
    },
    imageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 12,
    },
});
