import { ActivityIndicator, Text, TextInput, TouchableOpacity, View, StyleSheet, Animated } from 'react-native'
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useColor, useResponsiveScale, useShadow, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Space, Switch } from '@truckmitr/src/app/components';
import { hitSlop, isIOS } from '@truckmitr/src/app/functions';
import Ionicons from 'react-native-vector-icons/Ionicons'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6'
import Feather from 'react-native-vector-icons/Feather'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { FlatList } from 'react-native';
import { Image } from 'react-native';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import moment from 'moment';
import { jobAddAction, subscriptionModalAction } from '@truckmitr/src/redux/actions/user.action';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

// Apple-style Job Card Component
const AppleJobCard = ({ item, index, locations }: any) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const colors = useColor();
    const navigation = useNavigation<NavigatorProp>();
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const [jobStatusToggle, setJobStatusToggle] = useState(-1);
    const [jobStatus, setJobStatus] = useState(Number(item?.active_inactive));
    const { subscriptionDetails, subscriptionModal, isTransporter } = useSelector((state: any) => state?.user);

    // Animation
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.98,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            useNativeDriver: true,
        }).start();
    };

    const _onPressToggle = async () => {
        const newToggle = item?.id === jobStatusToggle ? -1 : item?.id;
        setJobStatusToggle(newToggle);

        const formData = new FormData();
        formData.append('job_id', item?.job_id);

        try {
            const response: any = await axiosInstance.post(END_POINTS.JOB_UPDATE_STATUS, formData);
            if (response?.data?.status) {
                const updatedStatus = Number(response?.data?.data?.active_inactive);
                setJobStatus(updatedStatus);
            }
        } catch (error: any) {
            console.log('Job status update error:', error);
            showToast(error.message || 'Something went wrong');
        }
    };

    const _jobActiveOrInactive = () => jobStatus === 1;

    const _navigateEditJob = () => {
        dispatch(jobAddAction({ ...item }));
        // navigation.navigate(STACKS?.ADD_JOB);
        navigation.navigate(STACKS?.JOB_SUMMARY);

    };

    const _sendDriverInvite = () => {
        if (subscriptionDetails?.showSubscriptionModel && isTransporter) {
            !subscriptionModal && dispatch(subscriptionModalAction(true));
        } else {
            navigation.navigate(STACKS.ALLDRIVER_LIST_WITH_TABS, {
                job_id: item?.id
            });
        }
    };

    const getLocationName = () => {
        const location = locations?.find((state: any) =>
            item?.job_location &&
            (state.name.toLowerCase() === item?.job_location.toLowerCase() ||
                state.id === Number(item?.job_location))
        );
        return location?.name || '';
    };

    // Info Row Component
    const InfoRow = ({ icon, label, value, iconColor = colors.royalBlue }: any) => (
        <View style={styles.infoRow}>
            <View style={[styles.infoIconContainer, { backgroundColor: colors.royalBlueOpacity(0.08) }]}>
                {icon}
            </View>
            <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: colors.royalBlue, fontSize: responsiveFontSize(1.4) }]}>
                    {label}
                </Text>
                <Text style={[styles.infoValue, { color: colors.black, fontSize: responsiveFontSize(1.8) }]}>
                    {value}
                </Text>
            </View>
        </View>
    );

    // Status Badge Component
    const StatusBadge = ({ isActive, label }: { isActive: boolean; label: string }) => (
        <View style={[
            styles.statusBadge,
            { backgroundColor: isActive ? 'rgba(52, 199, 89, 0.12)' : 'rgba(255, 149, 0, 0.12)' }
        ]}>
            <View style={[
                styles.statusDot,
                { backgroundColor: isActive ? '#34C759' : '#FF9500' }
            ]} />
            <Text style={[
                styles.statusText,
                {
                    color: isActive ? '#34C759' : '#FF9500',
                    fontSize: responsiveFontSize(1.5)
                }
            ]}>
                {label}
            </Text>
        </View>
    );

    const getSubscriptionType = () => {
        const plan = item?.subscription_plan_name;
        if (plan === 'premium_job') return 'PREMIUM';
        if (plan === 'super_premium_job') return 'SUPER PREMIUM';
        return 'STANDARD';
    };

    const getSubscriptionStyle = () => {
        const type = getSubscriptionType();
        switch (type) {
            case 'PREMIUM':
                return {
                    borderColor: '#FFD700',
                    borderWidth: 1.5,
                    badgeColor: '#FFD700',
                    textColor: '#000000',
                };
            case 'SUPER PREMIUM':
                return {
                    borderColor: '#E1AD01', // Richer gold/platinum look
                    borderWidth: 2,
                    badgeColor: '#E1AD01',
                    textColor: '#FFFFFF',
                };
            default:
                return {
                    borderColor: 'transparent',
                    borderWidth: 0,
                    badgeColor: colors.blackOpacity(0.05),
                    textColor: colors.blackOpacity(0.6),
                };
        }
    };

    const subStyle = getSubscriptionStyle();

    return (
        <Animated.View style={[
            styles.cardContainer,
            {
                transform: [{ scale: scaleAnim }],
                backgroundColor: colors.white,
                marginBottom: responsiveFontSize(1.5),
                borderColor: subStyle.borderColor,
                borderWidth: subStyle.borderWidth,
            }
        ]}>
            <TouchableOpacity
                activeOpacity={1}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
            >
                {/* Subscription Badge */}
                <View style={[
                    styles.subscriptionBadge,
                    { backgroundColor: subStyle.badgeColor }
                ]}>
                    <Text style={[
                        styles.subscriptionBadgeText,
                        { color: subStyle.textColor, fontSize: responsiveFontSize(1.2) }
                    ]}>
                        {getSubscriptionType()}
                    </Text>
                </View>

                {/* Card Header */}
                <View style={styles.cardHeader}>
                    <View style={styles.cardTitleContainer}>
                        <Text style={[styles.cardTitle, { color: colors.black, fontSize: responsiveFontSize(2.3) }]}>
                            {item.job_title}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                            <Text style={[styles.jobIdText, { color: colors.blackOpacity(0.4), fontSize: responsiveFontSize(1.5) }]}>
                                {item?.job_id}
                            </Text>
                            <Text style={[styles.jobIdText, { color: colors.blackOpacity(0.4), fontSize: responsiveFontSize(1.5), marginLeft: 5 }]}>
                                • {moment(item?.Created_at).format("DD MMM YYYY")}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.cardActions}>
                        {Number(item?.status) === 0 && (
                            <TouchableOpacity
                                onPress={_navigateEditJob}
                                style={[styles.editButton, { backgroundColor: colors.blackOpacity(0.04) }]}
                            >
                                <Feather name="edit-2" size={16} color={colors.blackOpacity(0.6)} />
                            </TouchableOpacity>
                        )}
                        <Switch
                            value={_jobActiveOrInactive()}
                            onPress={_onPressToggle}
                            trackColors={{ on: colors.royalBlue, off: colors.blackOpacity(0.1) }}
                            style={{ height: responsiveFontSize(3), width: responsiveFontSize(5.5), padding: responsiveFontSize(0.4) }}
                        />
                    </View>
                </View>

                {/* Divider */}
                <View style={[styles.divider, { backgroundColor: colors.blackOpacity(0.06) }]} />

                {/* Info Grid */}
                <View style={styles.infoGrid}>
                    <View style={styles.infoGridRow}>
                        <InfoRow
                            icon={<FontAwesome name='rupee' size={12} color={colors.royalBlue} />}
                            label={t('salary')}
                            value={item?.Salary_Range}
                        />
                        <InfoRow
                            icon={<FontAwesome6 name='location-dot' size={12} color={colors.royalBlue} />}
                            label={t('location')}
                            value={getLocationName()}
                        />
                    </View>
                    <View style={styles.infoGridRow}>
                        <InfoRow
                            icon={<FontAwesome6 name='user-tie' size={12} color={colors.royalBlue} />}
                            label={t('noOfDrivers')}
                            value={item?.number_of_drivers_required}
                        />
                        <InfoRow
                            icon={<FontAwesome name='calendar-o' size={12} color={colors.royalBlue} />}
                            label={t('expiryDate')}
                            value={(item?.Application_Deadline || item?.application_deadline) ? moment(item?.Application_Deadline || item?.application_deadline, ["DD-MM-YYYY", "YYYY-MM-DD", moment.ISO_8601]).format("DD MMM YYYY") : 'N/A'}
                        />
                    </View>
                </View>

                {/* Status Section */}
                <View style={styles.statusSection}>
                    <View style={styles.statusItem}>
                        <Text style={[styles.statusLabel, { color: colors.royalBlue, fontSize: responsiveFontSize(1.4) }]}>
                            {t('jobStatus')}
                        </Text>
                        <StatusBadge
                            isActive={_jobActiveOrInactive()}
                            label={_jobActiveOrInactive() ? t('active') : t('inactive')}
                        />
                    </View>
                    <View style={styles.statusItem}>
                        <Text style={[styles.statusLabel, { color: colors.royalBlue, fontSize: responsiveFontSize(1.4) }]}>
                            {t('jobApproval')}
                        </Text>
                        <StatusBadge
                            isActive={Number(item?.status) === 1}
                            label={Number(item?.status) ? t('approved') : t('pending')}
                        />
                    </View>
                </View>

                {/* Invite Driver Button */}
                {Number(item?.status) && _jobActiveOrInactive() ? (
                    <TouchableOpacity
                        onPress={_sendDriverInvite}
                        activeOpacity={0.8}
                        style={styles.inviteButton}
                    >
                        <LinearGradient
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFillObject}
                            colors={['#084489', '#0c78f0']}
                        />
                        <FontAwesome name="user-plus" size={16} color="#FFFFFF" />
                        <Text style={[styles.inviteButtonText, { fontSize: responsiveFontSize(1.7) }]}>
                            {t('inviteDrivers')}
                        </Text>
                    </TouchableOpacity>
                ) : null}
            </TouchableOpacity>
        </Animated.View>
    );
};

export default function AvailableJob() {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    useStatusBarStyle('dark-content');
    const colors = useColor();
    const safeAreaInsets = useSafeAreaInsets();
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const navigation = useNavigation<NavigatorProp>();

    const [loading, setloading] = useState(true);
    const [jobList, setjobList] = useState([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [search, setsearch] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);

    // Extract job fetching logic into a separate function
    const fetchJobs = useCallback(async (searchTerm: string = '') => {
        try {
            setloading(true);
            const response: any = await axiosInstance.get(END_POINTS?.TRANSPORTER_ALL_JOBS(searchTerm));
            if (response?.data?.status) {
                console.log('-------------response?.data?.data-----', response?.data?.data);
                setjobList(response?.data?.data);
            } else {
                setjobList([]);
            }
        } catch (error) {
            console.error("Error fetching jobs:", error);
            setjobList([]);
        } finally {
            setloading(false);
        }
    }, []);

    // Refresh jobs when screen comes into focus (after editing)
    useFocusEffect(
        useCallback(() => {
            fetchJobs(search);
        }, [fetchJobs, search])
    );

    useEffect(() => {
        if (search.length === 0) {
            // For empty search, fetch immediately
            fetchJobs(search);
        } else {
            // For search terms, debounce the API call
            setloading(true);
            const timer = setTimeout(() => {
                fetchJobs(search);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [search, fetchJobs]);

    const getLocation = async () => {
        try {
            const response = await axiosInstance.get(END_POINTS.GETSTATES);
            if (response?.data?.status) {
                setLocations(response?.data?.data);
            }
        } catch (error: any) {
            console.log('Error fetching locations:', error);
            showToast(error);
        }
    };

    useEffect(() => {
        getLocation();
    }, []);

    const _goback = () => navigation.goBack();
    const _navigateAddJob = () => {
        // Clear any existing job data from Redux
        dispatch(jobAddAction({}));
        navigation.navigate(STACKS?.ADD_JOB);
    };

    // Empty State Component
    const EmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.royalBlueOpacity(0.08) }]}>
                <MaterialCommunityIcons name="briefcase-outline" size={48} color={colors.royalBlueOpacity(0.4)} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.black, fontSize: responsiveFontSize(2) }]}>
                {search ? t('noJobsFound') : t('noJobsYet')}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.blackOpacity(0.5), fontSize: responsiveFontSize(1.5) }]}>
                {search
                    ? `${t('trySearchingDifferentKeyword')}`
                    : t('youHaventPostedAnyJobsYetPleaseAddJobNow')
                }
            </Text>
            {/* {!search && (
                <TouchableOpacity
                    onPress={_navigateAddJob}
                    activeOpacity={0.8}
                    style={[styles.emptyButton, { marginTop: responsiveFontSize(2) }]}
                >
                    <LinearGradient
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFillObject}
                        colors={['#084489', '#0c78f0']}
                    />
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                    <Text style={[styles.emptyButtonText, { fontSize: responsiveFontSize(1.6) }]}>
                        {t('addJob')}
                    </Text>
                </TouchableOpacity>
            )} */}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.white }]}>
            <Space height={safeAreaInsets.top} />

            {/* Apple-style Header */}
            <View style={[styles.header, { paddingHorizontal: responsiveFontSize(2) }]}>
                <TouchableOpacity
                    hitSlop={hitSlop(10)}
                    onPress={_goback}
                    style={[styles.backButton, { backgroundColor: colors.blackOpacity(0.05) }]}
                >
                    <Ionicons name={'chevron-back'} size={22} color={colors.royalBlue} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.black, fontSize: responsiveFontSize(2.2) }]}>
                    {t('jobsList')} ({jobList.length})
                </Text>
                {/* Invoice Button */}
                <TouchableOpacity
                    hitSlop={hitSlop(10)}
                    onPress={() => navigation.navigate(STACKS.PURCHASE_INVOICES)}
                    style={[styles.invoiceButton, { backgroundColor: colors.royalBlueOpacity(0.1) }]}
                >
                    <MaterialCommunityIcons name={'receipt'} size={20} color={colors.royalBlue} />
                </TouchableOpacity>
            </View>

            {/* Apple-style Search Bar */}
            <View style={[styles.searchContainer, { marginHorizontal: responsiveFontSize(2) }]}>
                <View style={[
                    styles.searchBar,
                    {
                        backgroundColor: colors.blackOpacity(0.04),
                        borderColor: searchFocused ? colors.royalBlueOpacity(0.3) : 'transparent',
                    }
                ]}>
                    <Feather name={'search'} size={18} color={colors.blackOpacity(0.4)} />
                    <TextInput
                        value={search}
                        onChangeText={setsearch}
                        placeholder={t('searchJobs')}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        style={[
                            styles.searchInput,
                            {
                                color: colors.black,
                                fontSize: responsiveFontSize(1.7),
                            }
                        ]}
                        placeholderTextColor={colors.blackOpacity(0.4)}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setsearch('')}>
                            <Ionicons name="close-circle" size={18} color={colors.blackOpacity(0.3)} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <Space height={responsiveFontSize(1)} />

            {/* Content */}
            {(loading && !search.length) ? (
                <View style={styles.loadingContainer}>
                    <View style={[styles.loadingIconContainer, { backgroundColor: colors.royalBlueOpacity(0.08) }]}>
                        <Image
                            style={{ height: responsiveHeight(8), width: responsiveWidth(50), tintColor: colors.blackOpacity(0.08) }}
                            source={{ uri: 'https://truckmitr.com/public/images/preview.png' }}
                        />
                    </View>
                </View>
            ) : loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator color={colors.royalBlue} size="small" />
                </View>
            ) : !jobList?.length ? (
                <EmptyState />
            ) : (
                <FlatList
                    showsVerticalScrollIndicator={false}
                    data={jobList}
                    renderItem={({ item, index }) => (
                        <AppleJobCard key={index} item={item} index={index} locations={locations} />
                    )}
                    contentContainerStyle={{
                        paddingHorizontal: responsiveFontSize(2),
                        paddingBottom: responsiveHeight(12),
                        paddingTop: responsiveFontSize(1)
                    }}
                    keyExtractor={(item, index) => index.toString()}
                />
            )}

            {/* Floating Add Button */}
            <TouchableOpacity
                onPress={_navigateAddJob}
                activeOpacity={0.9}
                style={[styles.fab, { bottom: safeAreaInsets.bottom + responsiveFontSize(2) }]}
            >
                <LinearGradient
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                    colors={['#084489', '#0c78f0']}
                />
                <Ionicons name="add" size={24} color="#FFFFFF" />
                <Text style={[styles.fabText, { fontSize: responsiveFontSize(1.6) }]}>
                    {t('addJob')}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    invoiceButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontWeight: '700',
    },
    searchContainer: {
        marginTop: 8,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1.5,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        padding: 0,
    },

    // Card Styles
    cardContainer: {
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardTitleContainer: {
        flex: 1,
        marginRight: 12,
    },
    cardTitle: {
        fontWeight: '600',
        marginBottom: 4,
    },
    jobIdText: {
        fontWeight: '500',
    },
    cardActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    editButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    divider: {
        height: 1,
        marginVertical: 14,
    },

    // Info Grid
    infoGrid: {
        gap: 12,
    },
    infoGridRow: {
        flexDirection: 'row',
        gap: 12,
    },
    infoRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoTextContainer: {
        marginLeft: 10,
        flex: 1,
    },
    infoLabel: {
        fontWeight: '400',
        marginBottom: 2,
    },
    infoValue: {
        fontWeight: '500',
    },

    // Status Section
    statusSection: {
        flexDirection: 'row',
        marginTop: 14,
        gap: 12,
    },
    statusItem: {
        flex: 1,
    },
    statusLabel: {
        fontWeight: '400',
        marginBottom: 6,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 20,
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontWeight: '600',
    },

    // Invite Button
    inviteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        paddingVertical: 12,
        borderRadius: 10,
        overflow: 'hidden',
        gap: 8,
    },
    inviteButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },

    // Empty State
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptySubtitle: {
        textAlign: 'center',
        lineHeight: 22,
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        overflow: 'hidden',
        gap: 6,
    },
    emptyButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },

    // Loading State
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingIconContainer: {
        padding: 20,
        borderRadius: 16,
    },

    // FAB
    fab: {
        position: 'absolute',
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 28,
        overflow: 'hidden',
        gap: 8,
        shadowColor: '#084489',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    fabText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    subscriptionBadge: {
        alignSelf: 'flex-end',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 4,
    },
    subscriptionBadgeText: {
        fontWeight: '700',
    },
});
