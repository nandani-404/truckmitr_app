import { ActivityIndicator, Linking, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useColor, useImage, useResponsiveScale, useShadow, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Space } from '@truckmitr/src/app/components';
import Ionicons from 'react-native-vector-icons/Ionicons'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import { FlatList } from 'react-native';
import { Image } from 'react-native';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { BASE_URL, END_POINTS } from '@truckmitr/src/utils/config';
import { useTranslation } from 'react-i18next';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import { hitSlop } from '@truckmitr/src/app/functions';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

interface Transporter {
    id: number;
    unique_id: string;
    name: string;
    mobile: string;
    images?: string;
    avatar?: string;
    Transport_Name?: string;
    Fleet_Size?: string;
    Operational_Segment?: string;
}

interface Job {
    id: number;
    job_id: string;
    job_title: string;
    job_location: string;
    Required_Experience: string;
    Salary_Range: string;
    Type_of_License: string;
    vehicle_type: string;
    number_of_drivers_required: number;
    Preferred_Skills: string
}

interface InviteItem {
    id: number;
    transporter_id: number;
    job_id: string;
    driver_id: number;
    status: string;
    created_at: string;
    updated_at: string;
    transporter: Transporter;
    job: Job;
}

const RenderInviteItem: React.FC<{ item: InviteItem; fetchInvites: () => void }> = ({ item, fetchInvites }) => {
    const { t } = useTranslation();
    const colors = useColor();
    const { shadow } = useShadow()
    const { responsiveWidth, responsiveFontSize, responsiveHeight } = useResponsiveScale();
    const [actionLoading, setActionLoading] = useState<'accept' | 'reject' | null>(null);
    const [checkBoxSelect, setCheckBoxSelect] = useState<{ [id: number]: boolean }>({});
    const [errors, setErrors] = useState<{ [id: number]: { checkBox?: string } }>({});
    const navigation = useNavigation<NavigatorProp>();

    const validate = (id: number): boolean => {
        let valid = true;
        const newErrors: { [key: string]: string } = {};

        if (!checkBoxSelect[id]) {
            newErrors.checkBox = t(`youNeedToAcceptTruckMitr`);
            valid = false;
        }
        setErrors(prev => ({ ...prev, [id]: newErrors }));
        return valid;
    };


    const handleAccept = async () => {
        if (!validate(item?.id)) return;
        try {
            setActionLoading('accept');
            const data = new FormData();
            data.append('invite_id', item.id);
            data.append('status', 'accepted')
            const response = await axiosInstance.post(
                END_POINTS.RESPOND_INVITE,
                data
            );
            if (response.data.status) {
                showToast(response.data.message);
                fetchInvites();
            } else {
                showToast(response.data.message);
            }
        } catch (error: any) {
            showToast(error?.response?.data?.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async () => {
        try {
            setActionLoading('reject');
            const data = new FormData();
            data.append('invite_id', item.id);
            data.append('status', 'rejected');

            const response = await axiosInstance.post(
                END_POINTS.RESPOND_INVITE,
                data
            );
            if (response.data.status) {
                showToast(t(response.data.message));
                fetchInvites();
            } else {
                showToast(response.data.message);
            }
        } catch (error: any) {
            showToast(error?.response?.data?.message);
        } finally {
            setActionLoading(null);
        }
    };

    const getTransporterImage = () => {
        if (item.transporter?.images) {
            return `${BASE_URL}public/${item.transporter.images}`;
        }
        if (item.transporter?.avatar) {
            return `${BASE_URL}public/${item.transporter.avatar}`;
        }
        return 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png';
    };


    // 👉 Get Status Config
    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'accepted':
                return {
                    backgroundColor: '#E8F5E8',
                    color: '#2E7D32',
                    icon: 'check-circle',
                    text: t('accepted')
                };
            case 'pending':
                return {
                    backgroundColor: '#FFF3E0',
                    color: '#F57C00',
                    icon: 'clock-o',
                    text: t('pending')
                };
            case 'rejected':
                return {
                    backgroundColor: '#FFF3E0',
                    color: 'red',
                    icon: 'close',
                    text: t('rejected')
                };
            default:
                return {
                    backgroundColor: '#F5F5F5',
                    color: '#757575',
                    icon: 'question-circle',
                    text: t('unknown')
                };
        }
    };
    // 👉 Parse Preferred Skills from JSON string
    const getPreferredSkills = () => {
        try {
            if (item.job?.Preferred_Skills) {
                const skills = JSON.parse(item.job.Preferred_Skills);
                if (Array.isArray(skills) && skills.length > 0) {
                    return skills.join(', ');
                }
            }
            return t('notAvailable');
        } catch (error) {
            return item.job?.Preferred_Skills || t('notAvailable');
        }
    };

    const _onpressCheckBox = (id: number) => {
        setCheckBoxSelect(prev => ({ ...prev, [id]: !prev[id] }));
        setErrors(prev => ({ ...prev, [id]: { checkBox: undefined } }));
    };

    const callToTransporter = async (item: any) => {
        try {
            Linking.openURL(`tel:${item.transporter?.mobile}`)
            const formData = new FormData();
            formData.append('id', item.transporter?.id);
            formData.append('job_id', item.job?.job_id);
            const response: any = await axiosInstance.post(END_POINTS?.CALL_TRANSPORTER, formData);
            if (response?.data?.status) {
                console.log(response, "response")
            }
        } catch (error) {
            console.log(error)
        }
    }

    const statusConfig = getStatusConfig(item.status);

    return (
        <View style={{
            width: responsiveWidth(94),
            backgroundColor: colors.white,
            padding: responsiveFontSize(2),
            borderRadius: 12,
            marginBottom: responsiveFontSize(1.5),
            ...shadow,
            borderLeftWidth: 4,
            borderLeftColor: colors.royalBlue,
        }}>
            {/* Header Section */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: responsiveFontSize(1.5)
            }}>
                <Image
                    style={{
                        height: responsiveFontSize(8),
                        width: responsiveFontSize(8),
                        borderRadius: 100,
                        borderWidth: 2,
                        borderColor: colors.royalBlue + '20',
                    }}
                    source={{ uri: getTransporterImage() }}
                />
                <View style={{
                    flex: 1,
                    marginLeft: responsiveFontSize(2),
                }}>
                    <Text style={{
                        color: colors.black,
                        fontSize: responsiveFontSize(2.2),
                        fontWeight: '700',
                        marginBottom: responsiveFontSize(0.5)
                    }}>
                        {item.transporter?.name || t('notAvailable')}
                    </Text>
                    <Text style={{
                        color: colors.royalBlue,
                        fontSize: responsiveFontSize(1.6),
                        fontWeight: '600',
                    }}>
                        {item.transporter?.unique_id || t('notAvailable')}
                    </Text>
                </View>

                {/* Status Badge */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: statusConfig.backgroundColor,
                    paddingHorizontal: responsiveFontSize(1.2),
                    paddingVertical: responsiveFontSize(0.6),
                    borderRadius: 16,
                }}>
                    <FontAwesome
                        name={statusConfig.icon}
                        size={responsiveFontSize(1.4)}
                        color={statusConfig.color}
                        style={{ marginRight: responsiveFontSize(0.3) }}
                    />
                    <Text
                        style={{
                            color: statusConfig.color,
                            fontSize: responsiveFontSize(1.4),
                            fontWeight: "600",
                        }}
                    >
                        {statusConfig.text}
                    </Text>
                </View>
            </View>

            {/* Job Details Section */}
            <View style={{
                backgroundColor: colors.royalBlue + '08',
                padding: responsiveFontSize(1.3),
                borderRadius: 8,
                marginBottom: responsiveFontSize(1.3)
            }}>
                {/* Job Title and Location */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginBottom: responsiveFontSize(1.2)
                }}>
                    <View style={{ flex: 1, marginRight: responsiveFontSize(1) }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: responsiveFontSize(0.5) }}>
                            <FontAwesome name='briefcase' size={14} color={colors.royalBlue} />
                            <Text style={{
                                color: colors.royalBlue, fontSize: responsiveFontSize(2), fontWeight: '500', marginStart: responsiveFontSize(.5)
                            }}>
                                {t('job')}
                            </Text>
                        </View>
                        <Text style={{
                            color: colors.blackOpacity(.8), fontSize: responsiveFontSize(1.8), fontWeight: '400',
                            marginLeft: responsiveFontSize(2.1)
                        }}>
                            {item.job?.job_title || t('notAvailable')}
                        </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: responsiveFontSize(1) }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: responsiveFontSize(0.5) }}>
                            <FontAwesome name='map-marker' size={14} color={colors.royalBlue} />
                            <Text style={{
                                color: colors.royalBlue, fontSize: responsiveFontSize(2), fontWeight: '500', marginStart: responsiveFontSize(.5)
                            }}>
                                {t('location')}
                            </Text>
                        </View>
                        <Text style={{
                            color: colors.blackOpacity(.8), fontSize: responsiveFontSize(1.8), fontWeight: '400',
                            marginLeft: responsiveFontSize(2.1)
                        }}>
                            {item.job?.job_location || t('notAvailable')}
                        </Text>
                    </View>
                </View>

                {/* Experience and Drivers Required */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginBottom: responsiveFontSize(1.2)
                }}>
                    <View style={{ flex: 1, marginRight: responsiveFontSize(1) }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: responsiveFontSize(0.5) }}>
                            <FontAwesome name='star' size={14} color={colors.royalBlue} />
                            <Text style={{
                                color: colors.royalBlue, fontSize: responsiveFontSize(2), fontWeight: '500', marginStart: responsiveFontSize(.5)
                            }}>
                                {t('experience')}
                            </Text>
                        </View>
                        <Text style={{
                            color: colors.blackOpacity(.8), fontSize: responsiveFontSize(1.8), fontWeight: '400',
                            marginLeft: responsiveFontSize(2.1)
                        }}>
                            {item.job?.Required_Experience ? `${item.job.Required_Experience} years` : t('notAvailable')}
                        </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: responsiveFontSize(1) }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: responsiveFontSize(0.5) }}>
                            <FontAwesome name='users' size={14} color={colors.royalBlue} />
                            <Text style={{
                                color: colors.royalBlue, fontSize: responsiveFontSize(2), fontWeight: '500', marginStart: responsiveFontSize(.5)
                            }}>
                                {t('driversRequired')}
                            </Text>
                        </View>
                        <Text style={{
                            color: colors.blackOpacity(.8), fontSize: responsiveFontSize(1.8), fontWeight: '400',
                            marginLeft: responsiveFontSize(2.1)
                        }}>
                            {item.job?.number_of_drivers_required ? `${item.job.number_of_drivers_required}` : t('notAvailable')}
                        </Text>
                    </View>
                </View>

                {/* Salary and License */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginBottom: responsiveFontSize(1.2)
                }}>
                    <View style={{ flex: 1, marginRight: responsiveFontSize(1) }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: responsiveFontSize(0.5) }}>
                            <FontAwesome name='money' size={14} color={colors.royalBlue} />
                            <Text style={{
                                color: colors.royalBlue, fontSize: responsiveFontSize(2), fontWeight: '500', marginStart: responsiveFontSize(.5)
                            }}>
                                {t('salary')}
                            </Text>
                        </View>
                        <Text style={{
                            color: colors.blackOpacity(.8), fontSize: responsiveFontSize(1.8), fontWeight: '400',
                            marginLeft: responsiveFontSize(2.1)
                        }}>
                            {item.job?.Salary_Range ? `₹${item.job.Salary_Range}` : t('notAvailable')}
                        </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: responsiveFontSize(1) }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: responsiveFontSize(0.5) }}>
                            <FontAwesome name='id-card' size={14} color={colors.royalBlue} />
                            <Text style={{
                                color: colors.royalBlue, fontSize: responsiveFontSize(2), fontWeight: '500', marginStart: responsiveFontSize(.5)
                            }}>
                                {t('license')}
                            </Text>
                        </View>
                        <Text style={{
                            color: colors.blackOpacity(.8), fontSize: responsiveFontSize(1.8), fontWeight: '400',
                            marginLeft: responsiveFontSize(2.1)
                        }}>
                            {item.job?.Type_of_License || t('notAvailable')}
                        </Text>
                    </View>
                </View>
                {/* Vehicle Type and Preferred Skills */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                }}>
                    <View style={{ flex: 1, marginRight: responsiveFontSize(1) }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: responsiveFontSize(0.5) }}>
                            <FontAwesome name='truck' size={14} color={colors.royalBlue} />
                            <Text style={{
                                color: colors.royalBlue, fontSize: responsiveFontSize(2), fontWeight: '500', marginStart: responsiveFontSize(.5)
                            }}>
                                {t('vehicleType')}
                            </Text>
                        </View>
                        <Text style={{
                            color: colors.blackOpacity(.8), fontSize: responsiveFontSize(1.8), fontWeight: '400',
                            marginLeft: responsiveFontSize(2.1)
                        }}>
                            {item.job?.vehicle_type || t('notAvailable')}
                        </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: responsiveFontSize(1) }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: responsiveFontSize(0.5) }}>
                            <FontAwesome name='cogs' size={14} color={colors.royalBlue} />
                            <Text style={{
                                color: colors.royalBlue, fontSize: responsiveFontSize(2), fontWeight: '500', marginStart: responsiveFontSize(.5)
                            }}>
                                {t('preferredSkills')}
                            </Text>
                        </View>
                        <Text style={{
                            color: colors.blackOpacity(.8), fontSize: responsiveFontSize(1.8), fontWeight: '400',
                            marginLeft: responsiveFontSize(2.1)
                        }}>
                            {getPreferredSkills()}
                        </Text>
                    </View>
                </View>
            </View>
            {item.status === "pending" && <> <Space height={responsiveHeight(2)} /> <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity activeOpacity={1} onPress={() => _onpressCheckBox(item.id)}>
                    <MaterialCommunityIcons
                        name={checkBoxSelect[item.id] ? 'checkbox-marked' : 'checkbox-blank-outline'}
                        size={24}
                        color={colors.royalBlue}
                    />
                </TouchableOpacity>
                <Text style={{ color: colors.blackOpacity(0.7), marginStart: responsiveFontSize(1), flexShrink: 1, flexWrap: 'wrap' }}>
                    {t(`iAgreeToTruckMitr`)}
                    <Text onPress={() => navigation.navigate(STACKS?.DRIVER_CONSENT)} style={{ color: colors.royalBlue, fontWeight: '500' }}> {t(`driverConsent`)}</Text>
                    {t(`applyJobPolicy`)}

                </Text>
            </View> </>}
            {errors[item.id]?.checkBox && (
                <View style={{ flexDirection: 'row', marginTop: responsiveHeight(1) }}>
                    <Text style={{ color: colors.error, fontSize: responsiveFontSize(1.7), marginLeft: responsiveFontSize(0.5) }}>
                        {errors[item.id]?.checkBox}
                    </Text>
                </View>
            )}
            <Space height={responsiveHeight(2)} />
            {/* Action Buttons or Contact Info */}
            {item.status === 'pending' ? (
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    gap: responsiveFontSize(1)
                }}>
                    <TouchableOpacity
                        style={{
                            backgroundColor: actionLoading === 'accept' ? colors.blackOpacity(0.3) : colors.green,
                            paddingVertical: responsiveFontSize(1.2),
                            paddingHorizontal: responsiveFontSize(2.2),
                            borderRadius: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flex: 1,
                            ...shadow,
                        }}
                        onPress={handleAccept}
                        disabled={actionLoading !== null}
                    >
                        {actionLoading === 'accept' ? (
                            <ActivityIndicator
                                color={colors.white}
                                size="small"
                                style={{ marginRight: responsiveFontSize(0.8) }}
                            />
                        ) : (
                            <FontAwesome
                                name="check"
                                size={responsiveFontSize(1.6)}
                                color={colors.white}
                                style={{ marginRight: responsiveFontSize(0.8) }}
                            />
                        )}
                        <Text style={{
                            color: colors.white,
                            fontSize: responsiveFontSize(1.6),
                            fontWeight: '700'
                        }}>
                            {actionLoading === 'accept' ? t('accepting') : t('accept')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{
                            backgroundColor: actionLoading === 'reject' ? colors.blackOpacity(0.3) : colors.roseRed,
                            paddingVertical: responsiveFontSize(1.2),
                            paddingHorizontal: responsiveFontSize(2.2),
                            borderRadius: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flex: 1,
                            ...shadow,
                        }}
                        onPress={handleReject}
                        disabled={actionLoading !== null}
                    >
                        {actionLoading === 'reject' ? (
                            <ActivityIndicator
                                color={colors.white}
                                size="small"
                                style={{ marginRight: responsiveFontSize(0.8) }}
                            />
                        ) : (
                            <FontAwesome
                                name="times"
                                size={responsiveFontSize(1.6)}
                                color={colors.white}
                                style={{ marginRight: responsiveFontSize(0.8) }}
                            />
                        )}
                        <Text style={{
                            color: colors.white,
                            fontSize: responsiveFontSize(1.6),
                            fontWeight: '700'
                        }}>
                            {actionLoading === 'reject' ? t('rejecting') : t('reject')}
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : item.status === "accepted" && item.transporter?.mobile ? (
                <View style={{ alignItems: 'center', width: '100%' }}>
                    <TouchableOpacity
                        onPress={() => callToTransporter(item)}
                        style={{
                            flexDirection: 'row',
                            paddingHorizontal: 20,
                            height: responsiveHeight(4.5),
                            backgroundColor: colors.green,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 5
                        }}
                    >
                        <FontAwesome
                            name="phone"
                            size={responsiveFontSize(1.6)}
                            color={colors.white}
                            style={{ marginRight: responsiveFontSize(0.8) }}
                        />
                        <Text style={{ color: colors.white, fontSize: responsiveFontSize(1.8), fontWeight: '500' }}>
                            {t(`callToTransporter`)}
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : null}
        </View>
    );
}

export default function DriverInvites() {
    const { t } = useTranslation();
    useStatusBarStyle('dark-content')
    const colors = useColor();
    const safeAreaInsets = useSafeAreaInsets();
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const navigation = useNavigation<NavigatorProp>();
    const [loading, setLoading] = useState(true)
    const [invites, setInvites] = useState<InviteItem[]>([])
    const images = useImage()

    const fetchInvites = async (showLoader: boolean = true) => {
        try {
            if (showLoader) setLoading(true);
            const response = await axiosInstance.get(END_POINTS?.DRIVER_INVITES);
            if (response.data.status && response.data.data) {
                const { pending = [], accepted = [], rejected = [] } = response.data.data;
                setInvites([...pending, ...accepted, ...rejected]);
            } else {
                setInvites([]);
            }
        } catch (error) {
            showToast('Failed to load invites');
            setInvites([]);
        } finally {
            if (showLoader) setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvites(true);
    }, []);

    const renderEmptyComponent = () => {
        if (loading) return null;

        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: responsiveHeight(10) }}>
                <Image
                    style={{
                        height: responsiveHeight(15),
                        width: responsiveWidth(80),
                        tintColor: colors.blackOpacity(.1)
                    }}
                    source={{ uri: 'https://truckmitr.com/public/images/preview.png' }}
                    resizeMode="contain"
                />
                <Text style={{
                    width: responsiveWidth(80),
                    color: colors.blackOpacity(.9),
                    fontSize: responsiveFontSize(1.9),
                    textAlign: 'center',
                    fontWeight: '500',
                    marginTop: responsiveHeight(2)
                }}>
                    {t(`noInvitesAvailable`)}
                </Text>
            </View>
        );
    };

    const _goback = () => {
        navigation.goBack()
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.white }}>
            <Space height={safeAreaInsets.top} />
            {/* Header */}
            <View style={{
                backgroundColor: colors.white,
                paddingHorizontal: responsiveWidth(4),
                paddingVertical: responsiveHeight(2),
                borderBottomWidth: 1,
                borderBottomColor: colors.blackOpacity(0.06),
                shadowColor: colors.black,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 3,
            }}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <TouchableOpacity
                        hitSlop={hitSlop(10)}
                        onPress={_goback}
                        style={{
                            position: 'absolute',
                            left: 0,
                            height: responsiveFontSize(5),
                            width: responsiveFontSize(5),
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: colors.royalBlue + '12',
                            borderRadius: responsiveFontSize(2.5),
                        }}
                    >
                        <Ionicons name={'chevron-back'} size={24} color={colors.royalBlue} />
                    </TouchableOpacity>

                    <Text style={{
                        fontSize: responsiveFontSize(2.4),
                        color: colors.black,
                        fontWeight: '700',
                        letterSpacing: -0.3
                    }}>
                        {t('transporterInvitations')}
                    </Text>
                </View>
            </View>

            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator color={colors.royalBlue} size="large" />
                </View>
            ) : (
                <FlatList
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    data={invites}
                    renderItem={({ item }) => (
                        <RenderInviteItem
                            item={item}
                            fetchInvites={fetchInvites}
                        />
                    )}
                    contentContainerStyle={{
                        flexGrow: 1,
                        paddingHorizontal: responsiveWidth(3),
                        paddingBottom: responsiveHeight(5),
                        paddingTop: responsiveHeight(2)
                    }}
                    keyExtractor={(item) => `invite-${item.id}`}
                    ListEmptyComponent={renderEmptyComponent}
                />
            )}
        </View>
    )
}