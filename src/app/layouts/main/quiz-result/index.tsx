import { FlatList, Image, Text, TouchableOpacity, View, Alert, ActivityIndicator, Platform, PermissionsAndroid } from 'react-native'
import React, { useCallback, useState } from 'react'
import { useColor, useResponsiveScale, useShadow, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Space, ScreenHeader } from '@truckmitr/src/app/components';
import CertificateActionModal from '@truckmitr/src/app/components/certificate-action-modal';
import Svg, { Circle } from "react-native-svg";
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import Ionicons from 'react-native-vector-icons/Ionicons'
import Feather from 'react-native-vector-icons/Feather'
import { isIOS } from '@truckmitr/src/app/functions';
import { useSelector } from 'react-redux';
import { BASE_URL, END_POINTS } from '@truckmitr/src/utils/config';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { useTranslation } from 'react-i18next';
import RNFetchBlob from 'react-native-blob-util';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import LinearGradient from 'react-native-linear-gradient';
import FileViewer from 'react-native-file-viewer';
import Share from 'react-native-share';
import { getUserBadgeText } from '@truckmitr/src/utils/global/userBadge';
type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

const capitalizeFirst = (str: string): string => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
};

export default function QuizResult() {
    const { t } = useTranslation();
    useStatusBarStyle('dark-content')
    const colors = useColor();
    const { shadow } = useShadow()
    const { responsiveWidth, responsiveFontSize, responsiveHeight } = useResponsiveScale();
    const navigation = useNavigation<NavigatorProp>();

    const { user, profileCompletion, rank, star_rating, isDriver, isTransporter, subscriptionDetails } = useSelector((state: any) => { return state?.user }) || {};

    // Check if a subscription is active
    const isSubscriptionActive = (item: any) => {
        if (!item) return false;
        if (!item.end_at) return false;

        // Convert epoch seconds → milliseconds
        const endDate = new Date(item.end_at * 1000);
        const now = new Date();

        return endDate > now;
    };

    // Get active plan name with subscription tier
    const getActivePlanName = () => {
        let activeSub = null;
        if (Array.isArray(subscriptionDetails)) {
            activeSub = subscriptionDetails.find((item: any) => isSubscriptionActive(item));
        } else if (subscriptionDetails && isSubscriptionActive(subscriptionDetails)) {
            activeSub = subscriptionDetails;
        }

        // Use the centralized utility
        return getUserBadgeText({
            user: user,
            subscriptionDetails: activeSub,
            isDriver: isDriver
        });
    };

    // Get subscription tier color - always dark blue
    const getSubscriptionBadgeColor = () => {
        return { bg: 'rgba(8, 68, 137, 0.1)', text: '#084489' }; // Dark blue for all
    };

    const progress = profileCompletion || 0; // Profile completion percentage
    const size = responsiveFontSize(11); // Size of the circle
    const strokeWidth = 7;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progressOffset = circumference - (progress / 100) * circumference;

    const [loading, setloading] = useState(true)
    const [generatingCertificate, setGeneratingCertificate] = useState<number | null>(null)
    const [quizResult, setquizResult] = useState([])
    const [showCertificateModal, setShowCertificateModal] = useState(false)
    const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null)

    const _navigateProfileEdit = () => {
        if (isDriver) navigation.navigate(STACKS.PROFILE_EDIT);
        if (isTransporter) navigation.navigate(STACKS.PROFILE_EDIT_TRANSPORTER);
    };

    useFocusEffect(
        useCallback(() => {
            const _fetchQuizResult = async () => {
                try {
                    const response: any = await axiosInstance.post(END_POINTS?.QUIZ_RESULT);
                    if (response?.data?.status) {
                        setquizResult(response?.data?.result)
                    }
                } catch (error) {
                    console.error('Error fetching quiz result:', error);
                } finally {
                    setloading(false)
                }
            };
            _fetchQuizResult()
        }, [])
    );

    // Request storage permission for Android
    const requestStoragePermission = async () => {
        if (Platform.OS !== 'android') return true;
        try {
            // For Android API 33+ we need to request READ_MEDIA_IMAGES instead of WRITE_EXTERNAL_STORAGE
            let permission;
            if (Platform.Version >= 33) {
                permission = PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES;
            } else {
                permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
            }
            const granted = await PermissionsAndroid.request(
                permission,
                {
                    title: 'Storage Permission',
                    message: 'App needs access to storage to download files',
                    buttonPositive: 'OK',
                }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) {
            console.warn('Permission error:', err);
            return false;
        }
    };

    const generateCertificate = async (moduleId: number) => {
        try {
            setGeneratingCertificate(moduleId);

            const hasPermission = await requestStoragePermission();
            if (!hasPermission) {
                Alert.alert(
                    'Permission Denied',
                    'Storage permission is required to download certificates',
                    [{ text: 'OK' }]
                );
                return;
            }

            const response: any = await axiosInstance.get(END_POINTS?.GENERATECERTIFICATE(moduleId));

            if (response?.data?.status) {
                const base64PDF = response.data.data.certificate;
                const fileName = response.data.data.file_name || `Certificate_Module_${moduleId}_${user?.unique_id || 'unknown'}.pdf`;
                if (!base64PDF) {
                    throw new Error('Certificate data is empty');
                }
                const { fs } = RNFetchBlob;
                const path = Platform.select({
                    ios: `${fs.dirs.DocumentDir}/${fileName}`,       // iOS private Documents
                    android: `${fs.dirs.DownloadDir}/${fileName}`,  // 👈 Android public Downloads folder
                });

                if (!path) {
                    throw new Error('Failed to determine file path');
                }

                // Write base64 directly to file
                await fs.writeFile(path, base64PDF, 'base64');
                if (Platform.OS === 'android') {
                    RNFetchBlob.android.addCompleteDownload({
                        title: fileName,
                        description: 'Certificate download',
                        mime: 'application/pdf',
                        path,
                        showNotification: true,
                    });
                }
                showToast(
                    `${fileName} ${t('CertificateDownloadedSuccessfully') || 'downloaded successfully'}`
                );
            } else {
                throw new Error(response?.data?.message || 'Failed to generate certificate');
            }
        } catch (error: any) {
            showToast(error.message || 'Download failed');
        } finally {
            setGeneratingCertificate(null);
        }
    };

    const viewCertificate = async (moduleId: number) => {
        try {
            const response: any = await axiosInstance.get(END_POINTS?.GENERATECERTIFICATE(moduleId));

            if (response?.data?.status) {
                const base64PDF = response.data.data.certificate;
                const fileName = response.data.data.file_name || `Certificate_Module_${moduleId}_${user?.unique_id || 'unknown'}.pdf`;

                if (!base64PDF) {
                    throw new Error('Certificate data is empty');
                }

                const { fs } = RNFetchBlob;
                const path = Platform.select({
                    ios: `${fs.dirs.DocumentDir}/${fileName}`,
                    android: `${fs.dirs.DocumentDir}/${fileName}`,
                });

                if (!path) {
                    throw new Error('Failed to determine file path');
                }

                // Write base64 directly to file
                await fs.writeFile(path, base64PDF, 'base64');

                // Open the file with FileViewer
                await FileViewer.open(path, {
                    showOpenWithDialog: true,
                    showAppsSuggestions: true,
                });
            } else {
                throw new Error(response?.data?.message || 'Failed to generate certificate');
            }
        } catch (error: any) {
            showToast(error.message || 'Failed to view certificate');
        }
    };

    const shareCertificate = async (moduleId: number) => {
        try {
            const response: any = await axiosInstance.get(END_POINTS?.GENERATECERTIFICATE(moduleId));

            if (response?.data?.status) {
                const base64PDF = response.data.data.certificate;
                const fileName = response.data.data.file_name || `Certificate_Module_${moduleId}_${user?.unique_id || 'unknown'}.pdf`;

                if (!base64PDF) {
                    throw new Error('Certificate data is empty');
                }

                const { fs } = RNFetchBlob;

                // ✅ Use cache dir (important for Android sharing)
                const path = Platform.select({
                    ios: `${fs.dirs.DocumentDir}/${fileName}`,
                    android: `${fs.dirs.CacheDir}/${fileName}`,
                });

                if (!path) {
                    throw new Error('Failed to determine file path');
                }

                // Write base64 directly to file
                await fs.writeFile(path, base64PDF, 'base64');

                // Custom share message
                const shareMessage =
                    "I have earned a training certificate! You can also improve your driving and life skills by completing the TruckMitr Training.\n\nDownload the TruckMitr app:\nhttps://play.google.com/store/apps/details?id=com.truckmitr";

                // Share the file
                const shareOptions = {
                    title: t('shareCertificate') || 'Share Certificate',
                    message: shareMessage,
                    url: `file://${path}`,
                    type: 'application/pdf',
                    failOnCancel: false,
                };

                await Share.open(shareOptions);
            } else {
                throw new Error(response?.data?.message || 'Failed to generate certificate');
            }
        } catch (error: any) {
            if (error.message !== 'User did not share') {
                showToast(error.message || 'Failed to share certificate');
            }
        }
    };

    const openCertificateModal = (moduleId: number) => {
        setSelectedModuleId(moduleId);
        setShowCertificateModal(true);
    };

    const closeCertificateModal = () => {
        setShowCertificateModal(false);
        setSelectedModuleId(null);
    };

    // Action handlers
    const handleViewCertificate = async () => {
        if (selectedModuleId) {
            await viewCertificate(selectedModuleId);
        }
    };

    const handleDownloadCertificate = async () => {
        if (selectedModuleId) {
            await generateCertificate(selectedModuleId);
        }
    };

    const handleShareCertificate = async () => {
        if (selectedModuleId) {
            await shareCertificate(selectedModuleId);
        }
    };

    const _goback = () => {
        navigation.goBack()
    }
    return (
        <View style={{ flex: 1, backgroundColor: colors.white }}>
            <ScreenHeader
                title={t(`quizResult`)}
            />
            <View style={{ flex: 1, alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', padding: responsiveWidth(5), paddingVertical: responsiveWidth(2.5) }}>
                    <View style={{ alignItems: 'center', }}>
                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                            <Svg width={size} height={size} style={{ position: "absolute" }}>
                                {/* Background Circle */}
                                <Circle
                                    cx={size / 2}
                                    cy={size / 2}
                                    r={radius}
                                    stroke={colors.blackOpacity(.07)}
                                    strokeWidth={strokeWidth}
                                    fill="none"
                                />
                                {/* Progress Circle */}
                                <Circle
                                    cx={size / 2}
                                    cy={size / 2}
                                    r={radius}
                                    stroke={colors.royalBlue}
                                    strokeWidth={strokeWidth}
                                    fill="none"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={progressOffset}
                                    strokeLinecap="round"
                                    rotation="90"
                                    origin={`${size / 2}, ${size / 2}`}
                                />
                            </Svg>
                            <Image style={{ height: size - strokeWidth, width: size - strokeWidth, borderRadius: 100, backgroundColor: colors.white }} source={{ uri: user?.images ? `${BASE_URL}public/${user?.images}` : `https://cdn-icons-png.flaticon.com/512/3177/3177440.png` }} />
                            <View style={{ backgroundColor: colors.whiteOpacity(1), paddingHorizontal: responsiveFontSize(1.8), paddingVertical: responsiveFontSize(.24), borderRadius: 100, position: 'absolute', bottom: -10, ...shadow }}>
                                <Text style={{ fontSize: responsiveFontSize(1.4), color: 'green', fontWeight: '700' }}>{`${profileCompletion}%`}</Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', marginTop: responsiveFontSize(2.5) }}>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <FontAwesome
                                    key={i}
                                    name={'star'}
                                    size={14}
                                    color={i < star_rating ? colors.royalBlue : colors.blackOpacity(.2)}
                                    style={{ marginEnd: responsiveFontSize(.5) }}
                                />
                            ))}
                        </View>
                    </View>
                    <View style={{ marginStart: responsiveFontSize(2.5) }}>
                        <Text style={{ color: colors.black, fontSize: responsiveFontSize(2.6), fontWeight: '500' }}>{`${user?.name || ''}`}</Text>
                        <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.6), fontWeight: '400' }}>{`${user?.unique_id || ''}`}</Text>
                        <Text style={{ backgroundColor: getSubscriptionBadgeColor().bg, alignSelf: 'flex-start', color: getSubscriptionBadgeColor().text, fontSize: responsiveFontSize(1.7), fontWeight: '600', paddingVertical: responsiveFontSize(.2), paddingHorizontal: responsiveFontSize(2), borderRadius: 100 }}>{getActivePlanName()}</Text>
                        <View style={{ flexDirection: 'row', backgroundColor: colors.bronzeOpacity(.08), alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: responsiveFontSize(2), paddingVertical: responsiveFontSize(.2), marginTop: responsiveFontSize(1), borderRadius: 100 }}>
                            <Text style={{ color: colors.bronze, fontSize: responsiveFontSize(1.6), fontWeight: '500' }}>{rank}</Text>
                            <Image style={{ height: responsiveFontSize(2.6), width: responsiveFontSize(2.6) }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/11881/11881945.png' }} />
                        </View>
                    </View>
                    <View style={{ flex: 1 }} />
                </View>
                {/*  */}
                <Space height={responsiveFontSize(3)} />
                {Number(profileCompletion) !== 100 && <View style={{ width: responsiveWidth(90), alignSelf: 'center', borderRadius: 10, overflow: 'hidden' }}>
                    <LinearGradient start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: '100%', width: '100%', position: 'absolute' }} colors={['rgba(166, 205, 249, 0.3)', 'rgba(12, 120, 240, 0.3)']} />
                    <View style={{ padding: responsiveFontSize(2) }}>
                        <Text style={{ color: colors.black, fontSize: responsiveFontSize(2), fontWeight: '500' }}>{t('yourProfileIncomplete')}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: responsiveFontSize(.2) }}>
                            <Feather name={'info'} size={16} color={colors.black} />
                            <Text style={{ flex: 1, color: colors.blackOpacity(.5), marginStart: responsiveFontSize(1) }}>{t('profileIncompleteTitle')}</Text>
                        </View>
                        <TouchableOpacity onPress={_navigateProfileEdit} activeOpacity={.7} style={{ backgroundColor: colors.royalBlue, alignItems: 'center', justifyContent: 'center', padding: responsiveFontSize(1), marginTop: responsiveFontSize(2), borderRadius: 5 }}>
                            <Text style={{ color: colors.white, fontSize: responsiveFontSize(1.8), fontWeight: '500', }}>{t(`completeProfiles`)}</Text>
                        </TouchableOpacity>
                    </View>
                </View>}
                <Space height={responsiveFontSize(2)} />
                {quizResult?.length ? <FlatList
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    data={quizResult?.length ? quizResult?.sort((a: any, b: any) => (a.module === 1 ? -1 : b.module === 1 ? 1 : 0)) : []}
                    renderItem={({ item, index }) => {
                        return (
                            <View style={{ width: responsiveWidth(100), alignItems: 'center', marginBottom: responsiveHeight(3) }}>
                                <View style={{ width: responsiveWidth(90), backgroundColor: colors.white, padding: responsiveFontSize(2), borderRadius: 10, borderColor: colors.blackOpacity(.05), borderWidth: 1, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(2.4), fontWeight: '600', textDecorationLine: 'underline' }}>{`Module ${item?.module}`}</Text>
                                        <Space style={{ flex: 1 }} />
                                        <View style={{ height: responsiveFontSize(7), width: responsiveFontSize(7), backgroundColor: colors.blackOpacity(.03), alignItems: 'center', justifyContent: 'center', borderRadius: 100 }}>
                                            <Image style={{ height: responsiveFontSize(5), width: responsiveFontSize(5) }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/5182/5182538.png' }} />
                                        </View>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={{ color: colors.black, fontSize: responsiveFontSize(2.2), fontWeight: '500', }}>{t(`rating`)}</Text>
                                        <View style={{ flexDirection: 'row', marginStart: responsiveFontSize(2) }}>
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <FontAwesome
                                                    key={i}
                                                    name={'star'}
                                                    size={14}
                                                    color={i < item?.star_rating ? colors.royalBlue : colors.blackOpacity(.2)}
                                                    style={{ marginEnd: responsiveFontSize(.5) }}
                                                />
                                            ))}

                                        </View>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={{ color: colors.black, fontSize: responsiveFontSize(2.2), fontWeight: '500', }}>{t('ranking')}</Text>
                                        <View style={{ flexDirection: 'row', backgroundColor: colors.bronzeOpacity(.08), alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: responsiveFontSize(2), paddingVertical: responsiveFontSize(.2), marginStart: responsiveFontSize(2), borderRadius: 100 }}>
                                            <Text style={{ color: colors.bronze, fontSize: responsiveFontSize(1.6), fontWeight: '500' }}>{item?.rank}</Text>
                                            <Image style={{ height: responsiveFontSize(2.6), width: responsiveFontSize(2.6) }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/11881/11881945.png' }} />
                                        </View>
                                    </View>
                                    {/* Certificate Action Button */}
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: colors.royalBlue,
                                            padding: responsiveFontSize(1),
                                            borderRadius: 8,
                                            alignItems: 'center',
                                            marginTop: responsiveFontSize(2),
                                            flexDirection: 'row',
                                            justifyContent: 'center'
                                        }}
                                        onPress={() => openCertificateModal(item.module)}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="document-text-outline" size={responsiveFontSize(2)} color={colors.white} />
                                        <Text style={{ color: colors.white, fontSize: responsiveFontSize(1.8), fontWeight: '600', marginLeft: responsiveFontSize(1) }}>
                                            {t('certificateOptions')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )
                    }}
                    keyExtractor={(item: any) => item?.module.toString()}
                    ListFooterComponent={() => {
                        return (
                            <Space height={responsiveHeight(10)} />
                        )
                    }} /> : <View style={{ flex: 1, alignItems: 'center' }}>
                    <Space height={responsiveHeight(20)} />
                    <Image style={{ height: responsiveHeight(15), width: responsiveWidth(80), tintColor: colors.blackOpacity(.1) }} source={{ uri: 'https://truckmitr.com/public/images/preview.png' }} />
                    {!loading && <Text style={{ width: responsiveWidth(80), color: colors.blackOpacity(.9), fontSize: responsiveFontSize(1.8), fontWeight: '500', textAlign: 'center' }}>{t(`noQuizResultsFound`)}</Text>}
                </View>}

                {/* Certificate Action Modal */}
                <CertificateActionModal
                    visible={showCertificateModal}
                    onClose={closeCertificateModal}
                    onView={handleViewCertificate}
                    onDownload={handleDownloadCertificate}
                    onShare={handleShareCertificate}
                    isGenerating={generatingCertificate === selectedModuleId}
                    moduleId={selectedModuleId || 0}
                />
            </View>
        </View>
    )
}