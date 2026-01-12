import {
    ActivityIndicator,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    StyleSheet,
    Animated,
    Linking,
    Platform,
    PermissionsAndroid,
    Alert,
} from 'react-native';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useColor, useResponsiveScale, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Space } from '@truckmitr/src/app/components';
import { hitSlop, isIOS } from '@truckmitr/src/app/functions';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { FlatList } from 'react-native';
import { Image } from 'react-native';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import RNFetchBlob from 'react-native-blob-util';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

// Get Plan Display Name
const getPlanDisplayName = (planName: string) => {
    switch (planName) {
        case 'standard_job':
            return 'Standard';
        case 'premium_job':
            return 'Premium';
        case 'super_premium_job':
            return 'Super Premium';
        default:
            return planName?.replace(/_/g, ' ')?.replace(/\b\w/g, c => c.toUpperCase()) || 'N/A';
    }
};

// Get Plan Style
const getPlanStyle = (planName: string) => {
    switch (planName) {
        case 'premium_job':
            return {
                backgroundColor: 'rgba(255, 215, 0, 0.15)',
                textColor: '#B8860B',
                badgeColor: '#FFD700',
            };
        case 'super_premium_job':
            return {
                backgroundColor: 'rgba(225, 173, 1, 0.15)',
                textColor: '#E1AD01',
                badgeColor: '#E1AD01',
            };
        default:
            return {
                backgroundColor: 'rgba(0, 122, 255, 0.1)',
                textColor: '#007AFF',
                badgeColor: '#007AFF',
            };
    }
};

// Invoice Card Component
const InvoiceCard = ({ item, index }: { item: any; index: number }) => {
    const { t } = useTranslation();
    const colors = useColor();
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const [downloading, setDownloading] = useState(false);

    // Animation
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            delay: index * 100,
            useNativeDriver: true,
        }).start();
    }, []);

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

    const planStyle = getPlanStyle(item?.subscription_plan_name);

    // Download Invoice Handler - Direct download to device
    const _handleDownloadInvoice = async () => {
        if (!item?.invoice_path) {
            showToast(t('invoiceNotAvailable'));
            return;
        }

        try {
            setDownloading(true);

            const { config, fs, android, ios } = RNFetchBlob;
            const timestamp = new Date().getTime();
            const fileName = `Invoice_${item?.job_id || 'TM'}_${timestamp}.pdf`;

            // Determine download path based on platform
            const downloadDir = Platform.OS === 'ios'
                ? fs.dirs.DocumentDir
                : fs.dirs.DownloadDir;
            const filePath = `${downloadDir}/${fileName}`;

            // Configure download options
            const configOptions = Platform.select({
                ios: {
                    fileCache: true,
                    path: filePath,
                    notification: true,
                },
                android: {
                    addAndroidDownloads: {
                        useDownloadManager: true,
                        notification: true,
                        path: filePath,
                        description: t('downloadingInvoice') || 'Downloading Invoice',
                        title: fileName,
                        mime: 'application/pdf',
                        mediaScannable: true,
                    },
                },
            });

            const response = await config(configOptions as any)
                .fetch('GET', item.invoice_path);

            if (Platform.OS === 'android') {
                // Open the downloaded PDF on Android
                android.actionViewIntent(response.path(), 'application/pdf');
            } else {
                // Open the downloaded PDF on iOS
                ios.openDocument(response.path());
            }

            showToast(t('invoiceDownloadedSuccessfully') || 'Invoice downloaded successfully');
        } catch (error: any) {
            console.log('Download error:', error);
            Alert.alert(
                t('downloadFailed') || 'Download Failed',
                error?.message || 'Unable to download invoice. Please try again.'
            );
        } finally {
            setDownloading(false);
        }
    };

    // Info Row Component
    const InfoRow = ({ icon, label, value, valueColor }: any) => (
        <View style={styles.infoRow}>
            <View style={[styles.infoIconContainer, { backgroundColor: colors.royalBlueOpacity(0.08) }]}>
                {icon}
            </View>
            <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: colors.blackOpacity(0.5), fontSize: responsiveFontSize(1.3) }]}>
                    {label}
                </Text>
                <Text style={[styles.infoValue, { color: valueColor || colors.black, fontSize: responsiveFontSize(1.7) }]}>
                    {value}
                </Text>
            </View>
        </View>
    );

    return (
        <Animated.View
            style={[
                styles.cardContainer,
                {
                    transform: [{ scale: scaleAnim }],
                    opacity: fadeAnim,
                    backgroundColor: colors.white,
                    marginBottom: responsiveFontSize(1.5),
                    borderLeftWidth: 4,
                    borderLeftColor: planStyle.badgeColor,
                }
            ]}
        >
            <TouchableOpacity
                activeOpacity={1}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
            >
                {/* Header Section */}
                <View style={styles.cardHeader}>
                    <View style={styles.cardTitleContainer}>
                        <View style={styles.jobIdRow}>
                            <View style={[styles.invoiceIconWrapper, { backgroundColor: planStyle.backgroundColor }]}>
                                <MaterialCommunityIcons name="receipt" size={18} color={planStyle.textColor} />
                            </View>
                            <View style={{ marginLeft: 10 }}>
                                <Text style={[styles.jobIdText, { color: colors.blackOpacity(0.4), fontSize: responsiveFontSize(1.3) }]}>
                                    {t('jobId')}
                                </Text>
                                <Text style={[styles.cardTitle, { color: colors.black, fontSize: responsiveFontSize(2) }]}>
                                    {item?.job_id || 'N/A'}
                                </Text>
                            </View>
                        </View>
                    </View>
                    {/* Plan Badge */}
                    <View style={[styles.planBadge, { backgroundColor: planStyle.backgroundColor }]}>
                        <Text style={[styles.planBadgeText, { color: planStyle.textColor, fontSize: responsiveFontSize(1.2) }]}>
                            {getPlanDisplayName(item?.subscription_plan_name)}
                        </Text>
                    </View>
                </View>

                {/* Job Title */}
                <Text
                    numberOfLines={2}
                    style={[styles.jobTitle, { color: colors.black, fontSize: responsiveFontSize(1.8), marginTop: 12 }]}
                >
                    {item?.job_title || 'N/A'}
                </Text>

                {/* Divider */}
                <View style={[styles.divider, { backgroundColor: colors.blackOpacity(0.06) }]} />

                {/* Info Grid */}
                <View style={styles.infoGrid}>
                    <View style={styles.infoGridRow}>
                        <InfoRow
                            icon={<FontAwesome6 name="user-tie" size={12} color={colors.royalBlue} />}
                            label={t('numberOfDrivers')}
                            value={item?.number_of_drivers_required || 'N/A'}
                        />
                        <InfoRow
                            icon={<FontAwesome name="rupee" size={12} color={colors.royalBlue} />}
                            label={t('planAmount')}
                            value={`₹${item?.plan_amount || 0}`}
                        />
                    </View>
                    <View style={styles.infoGridRow}>
                        <InfoRow
                            icon={<MaterialCommunityIcons name="tag-outline" size={14} color={colors.royalBlue} />}
                            label={t('planType')}
                            value={getPlanDisplayName(item?.subscription_plan_name)}
                        />
                        <InfoRow
                            icon={<FontAwesome name="rupee" size={12} color={'#34C759'} />}
                            label={t('totalAmount')}
                            value={`₹${item?.amount || 0}`}
                            valueColor={'#34C759'}
                        />
                    </View>
                </View>

                {/* Purchase Date */}
                <View style={[styles.dateContainer, { backgroundColor: colors.blackOpacity(0.03) }]}>
                    <FontAwesome name="calendar-o" size={12} color={colors.blackOpacity(0.4)} />
                    <Text style={[styles.dateText, { color: colors.blackOpacity(0.5), fontSize: responsiveFontSize(1.3) }]}>
                        {t('purchaseDate')}: {item?.Created_at ? moment(item?.Created_at).format('DD MMM YYYY, hh:mm A') : 'N/A'}
                    </Text>
                </View>

                {/* Download Button */}
                {item?.invoice_path && (
                    <TouchableOpacity
                        onPress={_handleDownloadInvoice}
                        activeOpacity={0.8}
                        disabled={downloading}
                        style={styles.downloadButton}
                    >
                        <LinearGradient
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFillObject}
                            colors={['#084489', '#0c78f0']}
                        />
                        {downloading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <>
                                <Feather name="download" size={16} color="#FFFFFF" />
                                <Text style={[styles.downloadButtonText, { fontSize: responsiveFontSize(1.6) }]}>
                                    {t('downloadInvoice')}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

export default function PurchaseInvoices() {
    const { t } = useTranslation();
    useStatusBarStyle('dark-content');
    const colors = useColor();
    const safeAreaInsets = useSafeAreaInsets();
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const navigation = useNavigation<NavigatorProp>();

    const [loading, setLoading] = useState(true);
    const [invoiceList, setInvoiceList] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);

    // Fetch invoices (using jobs endpoint and filtering for ones with invoices)
    const fetchInvoices = useCallback(async (searchTerm: string = '') => {
        try {
            setLoading(true);
            const response: any = await axiosInstance.get(END_POINTS?.TRANSPORTER_ALL_JOBS(searchTerm));
            if (response?.data?.status) {
                // Filter jobs that have invoice_path
                const jobsWithInvoices = response?.data?.data?.filter((job: any) => job?.invoice_path);
                setInvoiceList(jobsWithInvoices || []);
            } else {
                setInvoiceList([]);
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
            setInvoiceList([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Refresh when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchInvoices(search);
        }, [fetchInvoices, search])
    );

    useEffect(() => {
        if (search.length === 0) {
            fetchInvoices(search);
        } else {
            setLoading(true);
            const timer = setTimeout(() => {
                fetchInvoices(search);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [search, fetchInvoices]);

    const _goback = () => navigation.goBack();

    // Calculate totals
    const totalAmount = invoiceList.reduce((sum, item) => sum + parseFloat(item?.amount || 0), 0);
    const totalInvoices = invoiceList.length;

    // Empty State Component
    const EmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.royalBlueOpacity(0.08) }]}>
                <MaterialCommunityIcons name="receipt-text-outline" size={48} color={colors.royalBlueOpacity(0.4)} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.black, fontSize: responsiveFontSize(2) }]}>
                {search ? t('noInvoicesFound') : t('noInvoicesYet')}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.blackOpacity(0.5), fontSize: responsiveFontSize(1.5) }]}>
                {search
                    ? t('trySearchingDifferentKeyword')
                    : t('noInvoicesDescription')
                }
            </Text>
        </View>
    );

    // Header Stats Component
    const HeaderStats = () => (
        <View style={[styles.statsContainer, { marginHorizontal: responsiveFontSize(2) }]}>
            <View style={[styles.statCard, { backgroundColor: colors.royalBlueOpacity(0.08) }]}>
                <View style={[styles.statIconWrapper, { backgroundColor: colors.royalBlueOpacity(0.15) }]}>
                    <MaterialCommunityIcons name="receipt" size={20} color={colors.royalBlue} />
                </View>
                <View>
                    <Text style={[styles.statValue, { color: colors.royalBlue, fontSize: responsiveFontSize(2.2) }]}>
                        {totalInvoices}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.blackOpacity(0.5), fontSize: responsiveFontSize(1.3) }]}>
                        {t('totalInvoices')}
                    </Text>
                </View>
            </View>
            <View style={[styles.statCard, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
                <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(52, 199, 89, 0.15)' }]}>
                    <FontAwesome name="rupee" size={18} color="#34C759" />
                </View>
                <View>
                    <Text style={[styles.statValue, { color: '#34C759', fontSize: responsiveFontSize(2.2) }]}>
                        ₹{totalAmount.toLocaleString('en-IN')}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.blackOpacity(0.5), fontSize: responsiveFontSize(1.3) }]}>
                        {t('totalSpent')}
                    </Text>
                </View>
            </View>
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
                    {t('purchaseInvoices')}
                </Text>
                <View style={{ width: responsiveFontSize(4) }} />
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
                        onChangeText={setSearch}
                        placeholder={t('searchInvoices')}
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
                        <TouchableOpacity onPress={() => setSearch('')}>
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
            ) : !invoiceList?.length ? (
                <EmptyState />
            ) : (
                <FlatList
                    showsVerticalScrollIndicator={false}
                    data={invoiceList}
                    ListHeaderComponent={<HeaderStats />}
                    renderItem={({ item, index }) => (
                        <InvoiceCard key={index} item={item} index={index} />
                    )}
                    contentContainerStyle={{
                        paddingHorizontal: responsiveFontSize(2),
                        paddingBottom: responsiveHeight(12),
                        paddingTop: responsiveFontSize(1)
                    }}
                    keyExtractor={(item, index) => index.toString()}
                />
            )}
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

    // Stats Container
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
        marginBottom: 8,
    },
    statCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        gap: 12,
    },
    statIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statValue: {
        fontWeight: '700',
    },
    statLabel: {
        fontWeight: '400',
        marginTop: 2,
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
    jobIdRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    invoiceIconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        fontWeight: '600',
    },
    jobIdText: {
        fontWeight: '500',
    },
    jobTitle: {
        fontWeight: '500',
    },
    planBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    planBadgeText: {
        fontWeight: '700',
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
        fontWeight: '600',
    },

    // Date Container
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 14,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        gap: 8,
    },
    dateText: {
        fontWeight: '500',
    },

    // Download Button
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 14,
        paddingVertical: 12,
        borderRadius: 10,
        overflow: 'hidden',
        gap: 8,
    },
    downloadButtonText: {
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
});
