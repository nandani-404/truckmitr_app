import { ActivityIndicator, Modal, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useColor, useImage, useResponsiveScale, useShadow, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Space } from '@truckmitr/src/app/components';
import { hitSlop, isIOS } from '@truckmitr/src/app/functions';
import Ionicons from 'react-native-vector-icons/Ionicons'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { FlatList } from 'react-native';
import moment from 'moment';
import Feather from 'react-native-vector-icons/Feather'
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import { useDispatch, useSelector } from 'react-redux';
import { Image } from 'react-native';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import LottieView from 'lottie-react-native';
import { useTranslation } from 'react-i18next';
import Subscription from '../subscription';
import { subscriptionModalAction } from '@truckmitr/src/redux/actions/user.action';
import AlreadySelectedModal from '../job/AlreadySelectedModal';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

export default function AvailableJob() {
    const { t } = useTranslation();
    const dispatch = useDispatch()
    useStatusBarStyle('dark-content')
    const colors = useColor();
    const safeAreaInsets = useSafeAreaInsets();
    const { shadow } = useShadow()
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const navigation = useNavigation<NavigatorProp>();
    const [errors, setErrors] = useState<{ [jobId: number]: { checkBox?: string } }>({});
    const { isDriver, subscriptionDetails, subscriptionModal } = useSelector((state: any) => { return state?.user })
    const [checkBoxSelect, setCheckBoxSelect] = useState<{ [jobId: number]: boolean }>({});
    const [search, setsearch] = useState('')
    const [loadingApplyJob, setloadingApplyJob] = useState(-1)
    const [showLottie, setshowLottie] = useState(false)
    const [showAlreadySelectedJobModal, setShowAlreadySelectedJobModal] = useState(false);
    const [selectedJobId, setSelectedJobId] = useState('');

    const [searchJobsList, setsearchJobsList] = useState<any>()
    const [loading, setloading] = useState(false)

    useEffect(() => {
        search.length !== 0 && setloading(true);
        const timer = setTimeout(() => {
            const _fetchJobs = async () => {
                try {
                    const response: any = await axiosInstance.get(END_POINTS?.ALL_JOBS_AND_SEARCH(search));
                    if (response?.data?.status) {
                        setsearchJobsList(search.length === 0 ? [] : response?.data?.data);
                    } else {
                        setsearchJobsList(search.length === 0 ? undefined : []);
                    }
                } catch (error) {
                    console.error("Error searching jobs:", error);
                } finally {
                    setloading(false);
                }
            };
            _fetchJobs();
        }, 500); // debounce delay in ms

        return () => clearTimeout(timer); // cleanup on re-run
    }, [search]);

    const validate = (jobId: number): boolean => {
        let valid = true;
        const newErrors: { [key: string]: string } = {};

        if (!checkBoxSelect[jobId]) {
            newErrors.checkBox = t(`youNeedToAcceptTruckMitr`);
            valid = false;
        }
        setErrors(prev => ({ ...prev, [jobId]: newErrors }));
        return valid;
    };

    const _onpressCheckBox = (jobId: number) => {
        setCheckBoxSelect(prev => ({ ...prev, [jobId]: !prev[jobId] }));
        setErrors(prev => ({ ...prev, [jobId]: { checkBox: undefined } }));
    };


    const [expandedJobs, setExpandedJobs] = useState<{ [key: number]: boolean }>({});

    const toggleExpand = (id: number) => {
        setExpandedJobs((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };
    const _goback = () => {
        navigation.goBack()
    }
    const _applyJob = async (id: any) => {
        if (!validate(id)) return;
        if (subscriptionDetails?.showSubscriptionModel && isDriver) {
            !subscriptionModal && dispatch(subscriptionModalAction(true))
        } else {
            try {
                setloadingApplyJob(id)
                const FormData = require('form-data');
                let data = new FormData();
                // Set consent_visible_transporter to 1 if checked, 0 if unchecked
                data.append('consent_visible_transporter', checkBoxSelect[id] ? 1 : 0);

                const response: any = await axiosInstance.post(END_POINTS?.APPLY_JOB(id), data);
                if (response?.data?.status) {
                    setshowLottie(true)
                    setTimeout(() => {
                        setshowLottie(false)
                    }, 1200);
                } else {
                    const msg = response?.data?.message;
                    const statusCode = response?.data?.status_code;

                    if (statusCode === 1200) {
                        setSelectedJobId(response?.data?.job_id || '');
                        setShowAlreadySelectedJobModal(true);
                    } else {
                        if (msg === "You have reached your cumulative job application limit for your subscriptions.") {
                            dispatch(subscriptionModalAction(true));
                        }
                        showToast(msg)
                    }
                }
            } catch (error: any) {
                console.error("Error searching jobs:", error);
                const errorMsg = error?.response?.data?.message || error?.message;

                if (error?.response?.data?.status_code === 1200) {
                    setSelectedJobId(error?.response?.data?.job_id || '');
                    setShowAlreadySelectedJobModal(true);
                } else if (error?.response?.status === 403 || errorMsg?.includes("reached your job application limit") || errorMsg === "You have no subscription.") {
                    dispatch(subscriptionModalAction(true));
                } else {
                    showToast(errorMsg);
                }
            } finally {
                setloadingApplyJob(-1)
            }
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.white }}>
            <Space height={safeAreaInsets.top} />
            <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', padding: responsiveWidth(3) }}>
                <TouchableOpacity hitSlop={hitSlop(10)} onPress={_goback} style={{ height: responsiveFontSize(4), width: responsiveFontSize(4), alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, borderRadius: 100, zIndex: 100 }}>
                    <Ionicons name={'chevron-back'} size={24} color={colors.royalBlue} />
                </TouchableOpacity>
                <Text style={{ width: responsiveWidth(100), fontSize: responsiveFontSize(2.2), color: colors.royalBlue, fontWeight: 'bold', textAlign: 'center', position: 'absolute', zIndex: 1 }}>{t(`searchJobs`)}</Text>
            </View>
            <View style={{
                height: responsiveHeight(6),
                width: responsiveWidth(90),
                alignSelf: 'center',
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: responsiveFontSize(2),
                borderColor: colors.blackOpacity(.1),
                borderWidth: 1,
                borderRadius: 100,
                backgroundColor: colors.white
            }}>
                <TextInput
                    value={search}
                    onChangeText={setsearch}
                    placeholder={t(`searchJobs`)}
                    autoFocus
                    style={{
                        flex: 1,
                        padding: 0,
                        fontSize: responsiveFontSize(1.8),
                        color: colors.black
                    }}
                    placeholderTextColor={colors.blackOpacity(.8)}
                />
                <TouchableOpacity hitSlop={hitSlop(10)} onPress={() => setsearch('')}>
                    <Feather name={'search'} size={20} color={colors.royalBlueOpacity(1)} />
                </TouchableOpacity>
            </View>
            <Space height={responsiveHeight(1)} />
            {loading ?
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <ActivityIndicator color={colors.royalBlue} size="small" />
                </View>
                :
                !searchJobsList?.length ?
                    <View style={{ flex: 1, alignItems: 'center' }}>
                        <Space height={responsiveHeight(20)} />
                        <Image style={{ height: responsiveHeight(15), width: responsiveWidth(80), tintColor: colors.blackOpacity(.1) }} source={{ uri: 'https://truckmitr.com/public/images/preview.png' }} />
                        <Text style={{ width: responsiveWidth(80), color: colors.blackOpacity(.9), fontSize: responsiveFontSize(1.8), textAlign: 'center', fontWeight: '500', }}>{search ? `${t(`noJobsFound`)} "${search}" ${t(`trySearchingDifferentKeyword`)}` : t("noJobsAvailableCurrently")}</Text>
                    </View>
                    :
                    <View style={{ flex: 1 }}>
                        <FlatList
                            showsHorizontalScrollIndicator={false}
                            showsVerticalScrollIndicator={false}
                            data={searchJobsList}
                            renderItem={({ item }: any) => {
                                const isExpanded = expandedJobs[item.id] || false;
                                const shortDescription = item?.Job_Description.slice(0, 200) + "...";
                                let skills: string[] = [];
                                try {
                                    const parsed = JSON.parse(item?.Preferred_Skills);
                                    skills = Array.isArray(parsed) ? parsed : [parsed];
                                } catch (e) {
                                    skills = [item?.Preferred_Skills];
                                }
                                return (
                                    <View style={{ width: responsiveWidth(90), backgroundColor: colors.white, padding: responsiveFontSize(1.5), borderRadius: 10, marginBottom: responsiveFontSize(4), ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.2) : colors.blackOpacity(.4) }}>
                                        <Text style={{ fontSize: responsiveFontSize(2.2), color: colors.black, fontWeight: '500' }}>{item?.job_title}</Text>
                                        <Text style={{ fontSize: responsiveFontSize(1.8), color: colors.blackOpacity(.7), fontWeight: '400', marginTop: responsiveFontSize(1) }}>
                                            {isExpanded ? item?.Job_Description : shortDescription}
                                        </Text>
                                        <TouchableOpacity onPress={() => toggleExpand(item.id)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: responsiveFontSize(1) }}>
                                            <Text style={{ fontSize: responsiveFontSize(2), color: colors.royalBlue, fontWeight: '600' }}>
                                                {isExpanded ? t("showLess") : t("showMore")}
                                            </Text>
                                            <FontAwesome6 name={!isExpanded ? 'chevron-down' : 'chevron-up'} size={14} color={colors.royalBlue} style={{ marginHorizontal: responsiveFontSize(.7), marginTop: responsiveFontSize(.2) }} />
                                        </TouchableOpacity>
                                        <Space height={responsiveHeight(2)} />
                                        <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <View style={{ flex: 1.5 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <FontAwesome name='rupee' size={14} color={colors.royalBlue} />
                                                    <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(2), fontWeight: '500', marginStart: responsiveFontSize(.5) }}>{t(`salary`)}</Text>
                                                </View>
                                                <Text style={{ color: colors.blackOpacity(.8), fontSize: responsiveFontSize(1.8), fontWeight: '400' }}>{item?.Salary_Range}</Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <MaterialCommunityIcons name='license' size={14} color={colors.royalBlue} />
                                                    <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(2), fontWeight: '500', marginStart: responsiveFontSize(.5) }}>{t(`typeOfLicense`)}</Text>
                                                </View>
                                                <Text style={{ color: colors.blackOpacity(.8), fontSize: responsiveFontSize(1.8), fontWeight: '400' }}>{item?.Type_of_License}</Text>
                                            </View>
                                        </View>
                                        <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: responsiveFontSize(1) }}>
                                            <View style={{ flex: 1.5 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <FontAwesome6 name='location-dot' size={14} color={colors.royalBlue} />
                                                    <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(2), fontWeight: '500', marginStart: responsiveFontSize(.5) }}>{t(`location`)}</Text>
                                                </View>
                                                <Text style={{ color: colors.blackOpacity(.8), fontSize: responsiveFontSize(1.8), fontWeight: '400' }}>{item?.job_location}</Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <FontAwesome6 name='business-time' size={14} color={colors.royalBlue} />
                                                    <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(2), fontWeight: '500', marginStart: responsiveFontSize(.5) }}>{t(`noOfJobs`)}</Text>
                                                </View>
                                                <Text style={{ color: colors.blackOpacity(.8), fontSize: responsiveFontSize(1.8), fontWeight: '400' }}>{item?.Job_Management}</Text>
                                            </View>
                                        </View>
                                        <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: responsiveFontSize(1) }}>
                                            <View style={{ flex: 1.5 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <FontAwesome name='trophy' size={14} color={colors.royalBlue} />
                                                    <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(2), fontWeight: '500', marginStart: responsiveFontSize(.5) }}>{t(`experience`)}</Text>
                                                </View>
                                                <Text style={{ color: colors.blackOpacity(.8), fontSize: responsiveFontSize(1.8), fontWeight: '400' }}>{item?.Required_Experience}</Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <FontAwesome name='id-card-o' size={14} color={colors.royalBlue} />
                                                    <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(2), fontWeight: '500', marginStart: responsiveFontSize(.5) }}>{t(`jobId`)}</Text>
                                                </View>
                                                <Text style={{ color: colors.blackOpacity(.8), fontSize: responsiveFontSize(1.8), fontWeight: '400' }}>{item?.job_id}</Text>
                                            </View>
                                        </View>
                                        <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: responsiveFontSize(1) }}>
                                            <View style={{ flex: 1.5 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <FontAwesome name='calendar-o' size={14} color={colors.royalBlue} />
                                                    <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(2), fontWeight: '500', marginStart: responsiveFontSize(.5) }}>{t(`postDate`)}</Text>
                                                </View>
                                                <Text style={{ color: colors.blackOpacity(.8), fontSize: responsiveFontSize(1.8), fontWeight: '400' }}>{moment(item?.Created_at).format("DD-MM-YYYY")}</Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <FontAwesome name='calendar-minus-o' size={14} color={colors.royalBlue} />
                                                    <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(2), fontWeight: '500', marginStart: responsiveFontSize(.5) }}>{t(`lastDate`)}</Text>
                                                </View>
                                                <Text style={{ color: colors.blackOpacity(.8), fontSize: responsiveFontSize(1.8), fontWeight: '400' }}>{item?.Application_Deadline}</Text>
                                            </View>
                                        </View>
                                        <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: responsiveFontSize(1) }}>
                                            <View style={{ flex: 1.5 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <FontAwesome6 name='car-rear' size={14} color={colors.royalBlue} />
                                                    <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(2), fontWeight: '500', marginStart: responsiveFontSize(.5) }}>{t(`vehicleType`)}</Text>
                                                </View>
                                                <Text style={{ color: colors.blackOpacity(.8), fontSize: responsiveFontSize(1.8), fontWeight: '400' }}>{item?.vehicle_type}</Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <FontAwesome6 name='child-reaching' size={14} color={colors.royalBlue} />
                                                    <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(2), fontWeight: '500', marginStart: responsiveFontSize(.5) }}>{t(`preferredSkills`)}</Text>
                                                </View>
                                                <Text style={{ color: colors.blackOpacity(.8), fontSize: responsiveFontSize(1.8), fontWeight: '400' }}>{skills.join(", ")}</Text>
                                            </View>
                                        </View>
                                        <Space height={responsiveHeight(2)} />
                                        <View style={{ flexDirection: 'row' }}>
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
                                        </View>
                                        {errors[item.id]?.checkBox && (
                                            <View style={{ flexDirection: 'row', marginTop: responsiveHeight(1) }}>
                                                <Text style={{ color: colors.error, fontSize: responsiveFontSize(1.7), marginLeft: responsiveFontSize(0.5) }}>
                                                    {errors[item.id]?.checkBox}
                                                </Text>
                                            </View>
                                        )}
                                        <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: responsiveFontSize(1.5), borderTopColor: colors?.blackOpacity(.05), borderTopWidth: 1, paddingTop: responsiveFontSize(1.5) }}>
                                            <View style={{ flex: 1.5 }} />
                                            <View style={{ flex: 1 }}>
                                                <TouchableOpacity onPress={() => _applyJob(item?.id)} activeOpacity={.7} style={{ flex: 1, height: responsiveHeight(5), flexDirection: 'row', backgroundColor: colors.royalBlue, alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
                                                    {loadingApplyJob === item?.id ?
                                                        <ActivityIndicator color={colors.white} size="small" />
                                                        : <>
                                                            <Text style={{ color: colors.white, fontSize: responsiveFontSize(2), fontWeight: '500' }}>{t(`apply`)}</Text>
                                                            <Ionicons name='send' size={14} color={colors.white} style={{ marginLeft: responsiveFontSize(1), top: 2 }} />
                                                        </>}
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        <Space height={responsiveHeight(1)} />
                                    </View>
                                );
                            }}
                            contentContainerStyle={{ paddingHorizontal: responsiveWidth(5), paddingBottom: responsiveHeight(5), paddingTop: responsiveHeight(2) }}
                            keyExtractor={(item) => item.id.toString()}
                            ListFooterComponent={() => {
                                return (
                                    <Space height={responsiveHeight(10)} />
                                )
                            }} />
                    </View>}
            {showLottie && <View style={{ height: responsiveHeight(100), width: responsiveWidth(100), alignItems: 'center', justifyContent: 'center', position: 'absolute', pointerEvents: 'none' }}>
                <LottieView style={{ height: responsiveHeight(50), width: responsiveWidth(70) }} source={require('@truckmitr/res/lotties/boom.json')} autoPlay loop />
            </View>}
            <AlreadySelectedModal
                visible={showAlreadySelectedJobModal}
                jobId={selectedJobId}
                onClose={() => setShowAlreadySelectedJobModal(false)}
            />
        </View>
    )
}