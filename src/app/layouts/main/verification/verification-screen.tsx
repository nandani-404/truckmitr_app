/**
 * Verification Screen
 * driver verification related id, address, court
 * @format
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import analytics from '@react-native-firebase/analytics';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import { encode } from 'base-64';
import { useTranslation } from 'react-i18next';
import { AppEventsLogger } from 'react-native-fbsdk-next';
import RazorpayCheckout from 'react-native-razorpay';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video, { VideoRef } from 'react-native-video';
import { useSelector } from 'react-redux';

import { Space } from '@truckmitr/src/app/components';
import DocumentUploadModal from '@truckmitr/src/app/components/document-upload-modal';
import VerificationStatusModal from '@truckmitr/src/app/components/verification-status-modal';
import { hitSlop } from '@truckmitr/src/app/functions';
import {
  useColor,
  useResponsiveScale,
} from '@truckmitr/src/app/hooks';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import { VIDEO } from '@truckmitr/src/res/video';
import { END_POINTS, STATICS } from '@truckmitr/src/utils/config';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';

export default function Verification({ navigation }: any) {
  const { t } = useTranslation();
  const colors = useColor();
  const safeAreaInsets = useSafeAreaInsets();
  const { responsiveHeight, responsiveWidth, responsiveFontSize } =
    useResponsiveScale();
  const isFocused = useIsFocused();
  const videoRef = useRef<VideoRef>(null);
  const { user } = useSelector((state: any) => state.user);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [apiData, setApiData] = useState<any>(null);
  const [documentUploadModal, setDocumentUploadModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [verificationStatusModal, setVerificationStatusModal] = useState(false);
  const [startingVerification, setStartingVerification] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const videoPaused = !isFocused || verificationStatusModal || documentUploadModal;
  const [verificationVideoUrl, setVerificationVideoUrl] = useState<string | null>(null);

  // Derived state from apiData
  const overallStatus = apiData?.overall_status || 'not_started';
  const paymentStatus = apiData?.payment || { is_paid: false };
  const documentStatus = apiData?.documents || {
    all_uploaded: false,
  };
  const verificationStatus = apiData?.verification || null;
  const canStartVerification = apiData?.can_start_verification || false;
  const nextAction = apiData?.next_action || null;

  const mediaHeight = responsiveHeight(22);
  const mediaWidth = responsiveWidth(95);

  const fetchVerificationVideo = async () => {
    try {
      const response = await axiosInstance.get(END_POINTS?.VERIFICATION_VIDEO);
      if (response?.data?.status && response?.data?.video_url) {
        setVerificationVideoUrl(response.data.video_url);
      }
    } catch (error) {
      console.log('Error fetching verification video:', error);
    }
  };


  // Shared function to fetch and update verification status
  const fetchVerificationStatus = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      const response: any = await axiosInstance.get(
        END_POINTS?.DRIVERVERIFICATIONSTATUS,
      );

      if (response?.data?.success && response?.data?.data) {
        const data = response.data.data;

        setApiData(data);
        // Update verification state based on verification status
        setIsVerified(data.verification?.final_status === 'completed');
      }
    } catch (error) {
      console.log('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVerificationStatus()
    fetchVerificationVideo()
  }, []);

  useEffect(() => {
    fetchVerificationVideo();
    fetchVerificationStatus();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Refresh verification status when screen comes into focus
      fetchVerificationStatus();

      // Pause video when screen loses focus
      return () => {
        if (videoRef.current) {
          videoRef.current.seek(0); // Reset to beginning
        }
      };
    }, [fetchVerificationStatus]),
  );

  const _startVerificationProcess = async () => {
    try {
      setStartingVerification(true);
      // Call start verification API
      const response = await axiosInstance.post(
        END_POINTS.DRIVERVERIFICATIONSTART,
      );

      if (response?.data?.success) {
        const successMessage =
          response?.data?.message || t('verificationStartedSuccessfully');
        showToast(successMessage);

        // Refresh verification status to get updated state
        await fetchVerificationStatus();
      } else {
        const errorMessage = response?.data?.message;
        showToast(errorMessage || t('verificationStartFailed'));
      }
    } catch (error: any) {
      console.log('Start verification error:', error);
      showToast(t('verificationStartFailed'));
    } finally {
      setStartingVerification(false);
    }
  };

  const _handlePayNow = () => {
    _generateOrderId();
  };

  const _closeDocumentUploadModal = () => {
    setDocumentUploadModal(false);
  };

  const _onDocumentUploadSuccess = () => {
    // Refresh verification status after successful document upload
    showToast(t('documentsUploadedSuccessfully'));
    setDocumentUploadModal(false);
    fetchVerificationStatus();
  };

  const _openVerificationStatusModal = () => {
    setVerificationStatusModal(true);
  };

  const _closeVerificationStatusModal = () => {
    setVerificationStatusModal(false);
  };

  // Capture payment and start verification process
  const _capturePaymentAndStartVerification = async (paymentData: any, orderId: string) => {
    try {
      const paymentId = paymentData?.razorpay_payment_id;
      const key_id = STATICS?.RAYZORPAY_KEY_ID;
      const key_secret = STATICS?.RAYZORPAY_SECRET;
      const authToken = encode(`${key_id}:${key_secret}`);

      // Verify payment with Razorpay
      const response = await axios.get(`https://api.razorpay.com/v1/payments/${paymentId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${authToken}`,
        },
      });

      if (response?.data?.status === "captured") {
        console.log('Payment captured successfully:', response.data);

        // Prepare payment details for backend
        const paymentDetails = {
          ...response.data,
          verification_amount: 1180 // ₹1180 verification fee
        };

        // Convert the created_at timestamp (in seconds) to a Date object
        const startTimestamp = response?.data?.created_at;
        const startDate = new Date(startTimestamp * 1000); // convert to milliseconds
        // Add 1 year to the start date
        const endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1);
        const endTimestamp = Math.floor(endDate.getTime() / 1000);

        // Send payment details to backend
        let bodyFormData = new FormData();
        bodyFormData.append('unique_id', user?.unique_id);
        bodyFormData.append('amount', '118000'); // Amount in paise
        bodyFormData.append('payment_id', paymentId);
        bodyFormData.append('order_id', orderId);
        bodyFormData.append('payment_status', response?.data?.status);
        bodyFormData.append('payment_details', JSON.stringify(paymentDetails));
        bodyFormData.append('payment_type', 'verification');
        bodyFormData.append('start_at', startTimestamp);
        bodyFormData.append('end_at', endTimestamp);

        // Send to verification payment capture endpoint
        const captureResponse = await axiosInstance.post(END_POINTS.PAYMENT_SUBSCRIPTION_CAPTURE, bodyFormData);

        if (captureResponse?.data?.status) {
          console.log('Payment captured in backend successfully');

          // Now start the verification process
          const verificationResponse = await axiosInstance.post(END_POINTS.DRIVERVERIFICATIONSTART);

          if (verificationResponse?.data?.success) {
            const successMessage = verificationResponse?.data?.message || t('verificationStartedSuccessfully');
            showToast(successMessage);
          } else {
            // Handle verification start errors
            const errorMessage = verificationResponse?.data?.message;
            if (errorMessage?.includes('documents must be uploaded')) {
              showToast(errorMessage);
              setDocumentUploadModal(true);
            } else {
              showToast(errorMessage || t('verificationStartFailed'));
            }
          }
          await fetchVerificationStatus();
        } else {
          showToast(t('paymentCaptureFailed'));
        }
      } else {
        showToast(t('paymentNotCaptured'));
      }
    } catch (error: any) {
      console.error('Payment capture error:', error.response?.data || error.message);
      showToast(t('paymentCaptureFailed'));
    }
  };

  // Razorpay payment functions
  const _generateOrderId = async () => {
    setProcessingPayment(true);
    try {
      const data = new FormData();
      data.append('amount', 118000)
      data.append('payment_type', 'verification');

      const response = await axiosInstance.post(END_POINTS.CREATE_ORDER, data)
      if (!!response?.data?.order?.id) {
        _onPressPayNow(response?.data?.order?.id)
      }
    } catch (error) {
      console.error('Error creating order:', error);
      showToast(t('paymentOrderCreationFailed'));
      setProcessingPayment(false);
    }
  };

  const _onPressPayNow = async (orderId: string) => {
    const options = {
      description: 'Verification Fee',
      image: 'https://truckmitr.com/public/front/assets/images/logotrick.png',
      currency: 'INR',
      key: STATICS?.RAYZORPAY_KEY_ID,
      amount: '118000', // ₹1180 (in paise)
      name: 'TruckMitr',
      order_id: orderId,
      notes: {
        unique_id: user?.unique_id,
        role: user?.role,
      },
      prefill: {
        email: user?.email,
        contact: Number(user?.mobile),
        name: user?.name,
      },
      theme: { color: colors.royalBlue },
    } as any;

    await RazorpayCheckout.open(options)
      .then(async data => {
        console.log(`Success: `, data);

        const eventData = {
          user_id: String(user?.id ?? ''),
          user_unique_id: user?.unique_id ?? '',
          user_name: user?.name ?? '',
          user_email: user?.email ?? '',
          user_role: user?.role ?? '',
          payment_order_id: data?.razorpay_order_id ?? '',
          payment_id: data?.razorpay_payment_id ?? '',
          payment_signature: data?.razorpay_signature ?? '',
          payment_amount: '1180', // ₹1180
          payment_currency: options.currency,
          payment_method: 'razorpay',
          status: 'success',
        };

        // 🔹 Firebase Analytics
        await analytics().logEvent('payment_success', eventData);

        // 🔹 Facebook Analytics (custom event)
        AppEventsLogger.logEvent('payment_success', eventData);

        // Capture payment and start verification process
        await _capturePaymentAndStartVerification(data, orderId);

        // After payment success, show document upload modal
        setTimeout(() => {
          setDocumentUploadModal(true);
        }, 1000);

      })
      .catch(async error => {
        console.log(`Error: `, error);
        showToast(t('oopsPaymentUnsuccessful'));

        const errorData = {
          user_id: String(user?.id ?? ''),
          user_unique_id: user?.unique_id ?? '',
          user_name: user?.name ?? '',
          user_email: user?.email ?? '',
          user_role: user?.role ?? '',
          payment_amount: '1180', // ₹1180
          payment_currency: options.currency,
          payment_method: 'razorpay',
          status: 'failed',
          error_code: error?.code,
          error_description: error?.description,
          error_reason: error?.reason,
        };

        // 🔹 Firebase Analytics
        await analytics().logEvent('payment_failure', errorData);

        // 🔹 Facebook Analytics (custom event)
        AppEventsLogger.logEvent('payment_failure', errorData);
      }).finally(() => {
        setProcessingPayment(false);
      });
  };

  const _goback = () => {
    navigation.goBack()
  }

  // Reusable back button component
  const BackButton = () => (
    <TouchableOpacity
      hitSlop={hitSlop(10)}
      onPress={_goback}
      style={{
        height: responsiveFontSize(4),
        width: responsiveFontSize(4),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.white,
        borderRadius: 100,
        zIndex: 100
      }}
    >
      <Ionicons name={'chevron-back'} size={24} color={colors.royalBlue} />
    </TouchableOpacity>
  )

  // Helper function to get status-specific content
  const getStatusContent = () => {
    // Status-based content mapping
    const statusConfig = {
      completed: { title: t('verificationCompleted'), buttonText: t('viewVerificationStatus'), action: _openVerificationStatusModal },
      verified: { title: t('verificationCompleted'), buttonText: t('viewVerificationStatus'), action: _openVerificationStatusModal },
      pending: { title: t('verificationInProgress'), buttonText: t('viewVerificationStatus'), action: _openVerificationStatusModal },
      rejected: { title: t('verificationRejected'), buttonText: t('reviewAndResubmit'), action: () => setDocumentUploadModal(true) },
      payment_required: { title: t('completeYourVerification'), buttonText: t('payNow'), action: _handlePayNow },
      documents_required: { title: t('documentsRequired'), buttonText: t('uploadDocuments'), action: () => setDocumentUploadModal(true) },
      ready_to_start: { title: t('readyToStart'), buttonText: t('startVerification'), action: () => _startVerificationProcess() },
    };

    // Use next_action message if available, otherwise fallback to status-based content
    if (nextAction?.message) {
      const config = statusConfig[overallStatus as keyof typeof statusConfig] || statusConfig.payment_required;
      return {
        title: nextAction.message,
        buttonText: config.buttonText,
        buttonAction: config.action,
      };
    }

    const config = statusConfig[overallStatus as keyof typeof statusConfig] || statusConfig.payment_required;
    return {
      title: config.title,
      buttonText: config.buttonText,
      buttonAction: config.action,
    };
  };




  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.white,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor={colors.white}
          translucent={false}
        />
        <Space height={safeAreaInsets.top} />
        <View style={{ position: 'absolute', top: safeAreaInsets.top, left: 0, right: 0 }}>
          <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', padding: responsiveWidth(3) }}>
            <BackButton />
            <Text style={{ width: responsiveWidth(100), fontSize: responsiveFontSize(2.2), color: colors.royalBlue, fontWeight: 'bold', textAlign: 'center', position: 'absolute', zIndex: 1 }}>{t(`getVerifiedNow`)}</Text>
          </View>
        </View>
        <ActivityIndicator size="large" color={colors.royalBlue} />
      </View>
    );
  }

  if (isVerified) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.white,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor={colors.white}
          translucent={false}
        />
        <Space height={safeAreaInsets.top} />
        <View style={{ position: 'absolute', top: safeAreaInsets.top, left: 0, right: 0 }}>
          <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', padding: responsiveWidth(3) }}>
            <BackButton />
            <Text style={{ width: responsiveWidth(100), fontSize: responsiveFontSize(2.2), color: colors.royalBlue, fontWeight: 'bold', textAlign: 'center', position: 'absolute', zIndex: 1 }}>{t(`verification`)}</Text>
          </View>
        </View>

        <View
          style={{
            alignItems: 'center',
            paddingHorizontal: responsiveWidth(5),
          }}
        >
          <Ionicons
            name="checkmark-circle"
            size={responsiveFontSize(8)}
            color={colors.royalBlue}
          />
          <Space height={responsiveFontSize(3)} />
          <Text
            style={{
              fontSize: responsiveFontSize(2.8),
              fontWeight: '600',
              color: colors.royalBlue,
              textAlign: 'center',
            }}
          >
            {t('verificationSuccessful')}
          </Text>
        </View>
      </View>
    );
  }

  const statusContent = getStatusContent();

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.white}
        translucent={false}
      />
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
            {t(`getVerifiedNow`)}
          </Text>

          <TouchableOpacity
            hitSlop={hitSlop(10)}
            onPress={onRefresh}
            disabled={refreshing}
            style={{
              position: 'absolute',
              right: 0,
              height: responsiveFontSize(5),
              width: responsiveFontSize(5),
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.royalBlue + '12',
              borderRadius: responsiveFontSize(2.5),
            }}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={colors.royalBlue} />
            ) : (
              <Ionicons name={'refresh'} size={24} color={colors.royalBlue} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: responsiveHeight(8) }} showsVerticalScrollIndicator={false}>

        <>

          {(overallStatus !== 'not_started' && overallStatus !== 'payment_required') && (
            <View style={{ paddingHorizontal: responsiveWidth(5), marginTop: responsiveFontSize(2) }}>
              <View style={{
                backgroundColor: overallStatus === 'rejected'
                  ? colors.blackOpacity(0.05)
                  : colors.royalBlueOpacity(0.05),
                borderRadius: 12,
                padding: responsiveFontSize(2),
                marginBottom: responsiveFontSize(2),
                borderWidth: overallStatus === 'rejected' ? 1 : 0,
                borderColor: overallStatus === 'rejected' ? colors.roseRedOpacity(0.3) : 'transparent'
              }}>
                <Text
                  style={{
                    fontSize: responsiveFontSize(2.2),
                    fontWeight: '600',
                    color: overallStatus === 'rejected' ? colors.roseRedOpacity(0.8) : colors.royalBlue,
                    textAlign: 'center',
                    marginBottom: responsiveFontSize(1)
                  }}>
                  {statusContent.title}
                </Text>
                <TouchableOpacity
                  onPress={statusContent.buttonAction}
                  disabled={startingVerification}
                  style={{
                    backgroundColor: startingVerification
                      ? colors.blackOpacity(0.3)
                      : overallStatus === 'rejected'
                        ? colors.roseRedOpacity(0.8)
                        : colors.royalBlue,
                    paddingVertical: responsiveFontSize(1.2),
                    borderRadius: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                  }}
                >
                  {startingVerification && (
                    <ActivityIndicator size="small" color={colors.white} style={{ marginRight: responsiveFontSize(1) }} />
                  )}
                  <Text style={{ color: colors.white, fontSize: responsiveFontSize(1.8), fontWeight: 'bold' }}>
                    {startingVerification ? t('processing') : statusContent.buttonText}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>

        {/* Status Information Section */}
        {apiData && (
          <View style={{ paddingHorizontal: responsiveWidth(5) }}>
            {/* Payment Status */}
            {paymentStatus?.is_paid && (
              <View
                style={{
                  backgroundColor: colors.greenOpacitiy(0.1),
                  padding: responsiveFontSize(1.5),
                  borderRadius: 8,
                  marginBottom: responsiveFontSize(1),
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.greenOpacitiy(1)}
                />
                <Text
                  style={{
                    color: colors.greenOpacitiy(1),
                    fontSize: responsiveFontSize(1.8),
                    fontWeight: '500',
                    marginLeft: responsiveFontSize(1),
                  }}
                >
                  {t('paymentCompleted')} - ₹{paymentStatus.amount}
                </Text>
              </View>
            )}

            {/* Document Status */}
            {documentStatus?.all_uploaded && (
              <View
                style={{
                  backgroundColor: colors.greenOpacitiy(0.1),
                  padding: responsiveFontSize(1.5),
                  borderRadius: 8,
                  marginBottom: responsiveFontSize(1),
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.greenOpacitiy(1)}
                />
                <Text
                  style={{
                    color: colors.greenOpacitiy(1),
                    fontSize: responsiveFontSize(1.8),
                    fontWeight: '500',
                    marginLeft: responsiveFontSize(1),
                  }}
                >
                  {t('documentsUploaded')}
                </Text>
              </View>
            )}

            {/* Verification Status */}
            {verificationStatus?.is_started && (
              <View
                style={{
                  backgroundColor: (overallStatus === 'completed' || overallStatus === 'verified' || verificationStatus?.final_status === 'completed')
                    ? colors.greenOpacitiy(0.1)
                    : overallStatus === 'rejected'
                      ? colors.roseRedOpacity(0.1)
                      : colors.royalBlueOpacity(0.1),
                  padding: responsiveFontSize(1.5),
                  borderRadius: 8,
                  marginBottom: responsiveFontSize(1),
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Ionicons
                  name={(overallStatus === 'completed' || overallStatus === 'verified' || verificationStatus?.final_status === 'completed')
                    ? "checkmark-circle"
                    : overallStatus === 'rejected'
                      ? "close-circle"
                      : "time"}
                  size={20}
                  color={(overallStatus === 'completed' || overallStatus === 'verified' || verificationStatus?.final_status === 'completed')
                    ? colors.greenOpacitiy(1)
                    : overallStatus === 'rejected'
                      ? colors.roseRedOpacity(1)
                      : colors.royalBlue}
                />
                <Text
                  style={{
                    color: (overallStatus === 'completed' || overallStatus === 'verified' || verificationStatus?.final_status === 'completed')
                      ? colors.greenOpacitiy(1)
                      : overallStatus === 'rejected'
                        ? colors.roseRedOpacity(1)
                        : colors.royalBlue,
                    fontSize: responsiveFontSize(1.8),
                    fontWeight: '500',
                    marginLeft: responsiveFontSize(1),
                  }}
                >
                  {(overallStatus === 'completed' || overallStatus === 'verified' || verificationStatus?.final_status === 'completed')
                    ? t('verificationCompleted')
                    : overallStatus === 'rejected'
                      ? t('verificationRejected')
                      : t('verificationInProgress')}
                </Text>
              </View>
            )}


            {/* Detailed Rejection Status */}
            {overallStatus === 'rejected' && verificationStatus && (
              <View style={{ marginTop: responsiveFontSize(1) }}>
                <Text
                  style={{
                    fontSize: responsiveFontSize(2.2),
                    fontWeight: '600',
                    color: colors.blackOpacity(0.8),
                    marginBottom: responsiveFontSize(1),
                    textAlign: 'center',
                  }}
                >
                  {t('rejectionDetails')}
                </Text>

                {/* ID Verification Status */}
                {verificationStatus.id_status && (
                  <View
                    style={{
                      backgroundColor: verificationStatus.id_status.status === 'verified'
                        ? colors.greenOpacitiy(0.1)
                        : verificationStatus.id_status.status === 'pending'
                          ? colors.royalBlueOpacity(0.1)
                          : colors.roseRedOpacity(0.1),
                      padding: responsiveFontSize(1.2),
                      borderRadius: 8,
                      marginBottom: responsiveFontSize(0.8),
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >

                    <Ionicons
                      name={verificationStatus.id_status.status === 'verified'
                        ? "checkmark-circle"
                        : verificationStatus.id_status.status === 'pending'
                          ? "time"
                          : "close-circle"}
                      size={18}
                      color={verificationStatus.id_status.status === 'verified'
                        ? colors.greenOpacitiy(1)
                        : verificationStatus.id_status.status === 'pending'
                          ? colors.royalBlue
                          : colors.roseRedOpacity(1)}
                    />

                    <Text
                      style={{
                        color: verificationStatus.id_status.status === 'verified'
                          ? colors.greenOpacitiy(1)
                          : verificationStatus.id_status.status === 'pending'
                            ? colors.royalBlue
                            : colors.roseRedOpacity(1),
                        fontSize: responsiveFontSize(1.6),
                        fontWeight: '500',
                        marginLeft: responsiveFontSize(0.8),
                        flex: 1,
                      }}
                    >
                      {t('idVerification')}: {verificationStatus.id_status.status === 'verified'
                        ? t('verified')
                        : verificationStatus.id_status.status === 'pending'
                          ? t('pending')
                          : t('rejected')}
                    </Text>
                  </View>
                )}

                {/* Address Verification Status */}
                {verificationStatus.address_status && (
                  <View
                    style={{
                      backgroundColor: verificationStatus.address_status.status === 'verified'
                        ? colors.greenOpacitiy(0.1)
                        : verificationStatus.address_status.status === 'pending'
                          ? colors.royalBlueOpacity(0.1)
                          : colors.roseRedOpacity(0.1),
                      padding: responsiveFontSize(1.2),
                      borderRadius: 8,
                      marginBottom: responsiveFontSize(0.8),
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >

                    <Ionicons
                      name={verificationStatus.address_status.status === 'verified'
                        ? "checkmark-circle"
                        : verificationStatus.address_status.status === 'pending'
                          ? "time"
                          : "close-circle"}
                      size={18}
                      color={verificationStatus.address_status.status === 'verified'
                        ? colors.greenOpacitiy(1)
                        : verificationStatus.address_status.status === 'pending'
                          ? colors.royalBlue
                          : colors.roseRedOpacity(1)}
                    />
                    <Text
                      style={{
                        color: verificationStatus.address_status.status === 'verified'
                          ? colors.greenOpacitiy(1)
                          : verificationStatus.address_status.status === 'pending'
                            ? colors.royalBlue
                            : colors.roseRedOpacity(1),
                        fontSize: responsiveFontSize(1.6),
                        fontWeight: '500',
                        marginLeft: responsiveFontSize(0.8),
                        flex: 1,
                      }}
                    >
                      {t('addressVerification')}: {verificationStatus.address_status.status === 'verified'
                        ? t('verified')
                        : verificationStatus.address_status.status === 'pending'
                          ? t('pending')
                          : t('rejected')}
                    </Text>
                  </View>
                )}

                {/* Court Check Status */}
                {verificationStatus.court_check_status && (
                  <View
                    style={{
                      backgroundColor: verificationStatus.court_check_status.status === 'verified'
                        ? colors.greenOpacitiy(0.1)
                        : verificationStatus.court_check_status.status === 'pending'
                          ? colors.royalBlueOpacity(0.1)
                          : colors.roseRedOpacity(0.1),
                      padding: responsiveFontSize(1.2),
                      borderRadius: 8,
                      marginBottom: responsiveFontSize(0.8),
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons
                      name={verificationStatus.court_check_status.status === 'verified'
                        ? "checkmark-circle"
                        : verificationStatus.court_check_status.status === 'pending'
                          ? "time"
                          : "close-circle"}
                      size={18}
                      color={verificationStatus.court_check_status.status === 'verified'
                        ? colors.greenOpacitiy(1)
                        : verificationStatus.court_check_status.status === 'pending'
                          ? colors.royalBlue
                          : colors.roseRedOpacity(1)}
                    />
                    <Text
                      style={{
                        color: verificationStatus.court_check_status.status === 'verified'
                          ? colors.greenOpacitiy(1)
                          : verificationStatus.court_check_status.status === 'pending'
                            ? colors.royalBlue
                            : colors.roseRedOpacity(1),
                        fontSize: responsiveFontSize(1.6),
                        fontWeight: '500',
                        marginLeft: responsiveFontSize(0.8),
                        flex: 1,
                      }}
                    >
                      {t('courtCheck')}: {verificationStatus.court_check_status.status === 'verified'
                        ? t('verified')
                        : verificationStatus.court_check_status.status === 'pending'
                          ? t('pending')
                          : t('rejected')}
                    </Text>
                  </View>
                )}

                {/* Rejection Notes */}
                {verificationStatus.notes && (
                  <View
                    style={{
                      backgroundColor: colors.blackOpacity(0.05),
                      padding: responsiveFontSize(1.5),
                      borderRadius: 8,
                      borderLeftWidth: 4,
                      borderLeftColor: colors.roseRedOpacity(0.8),
                      marginTop: responsiveFontSize(1),
                    }}
                  >
                    <Text
                      style={{
                        color: colors.blackOpacity(0.8),
                        fontSize: responsiveFontSize(1.6),
                        fontWeight: '600',
                        marginBottom: responsiveFontSize(0.5),
                        textAlign: 'center',
                      }}
                    >
                      {t('rejectionReason')}
                    </Text>
                    <Text
                      style={{
                        color: colors.blackOpacity(0.9),
                        fontSize: responsiveFontSize(1.6),
                        fontWeight: '500',
                        textAlign: 'center',
                      }}
                    >
                      {verificationStatus.notes}
                    </Text>
                  </View>
                )}

                {/* Rejection Message */}
                <View
                  style={{
                    backgroundColor: colors.blackOpacity(0.05),
                    padding: responsiveFontSize(1.5),
                    borderRadius: 8,
                    borderLeftWidth: 4,
                    borderLeftColor: colors.roseRedOpacity(0.8),
                    marginTop: responsiveFontSize(1),
                  }}
                >
                  <Text
                    style={{
                      color: colors.blackOpacity(0.8),
                      fontSize: responsiveFontSize(1.6),
                      fontWeight: '500',
                      textAlign: 'center',
                    }}
                  >
                    {t('verificationRejectedMessage')}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}


        <Space height={responsiveFontSize(2)} />
        {/* Payment Required Section */}
        {/* Payment Features */}
        <View
          style={{
            marginHorizontal: responsiveWidth(3),
            backgroundColor: colors.white,
            borderRadius: 12,
            padding: responsiveFontSize(1.5),
            marginBottom: responsiveFontSize(3.5),
            borderWidth: 1,
            borderColor: colors.blackOpacity(0.1),
          }}
        >
          <Text
            style={{
              color: colors.black,
              fontSize: responsiveFontSize(2),
              fontWeight: 'bold',
              marginBottom: responsiveFontSize(1.2),
              textAlign: 'center'
            }}
          >
            {t('whyGetVerified')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                height: responsiveFontSize(3.2),
                width: responsiveFontSize(3.2),
                backgroundColor: colors.blackOpacity(0.03),
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 100,
                marginRight: responsiveFontSize(1),
                marginBottom: 3
              }}
            >
              <Image
                style={{
                  height: responsiveFontSize(2),
                  width: responsiveFontSize(2),
                }}
                source={{
                  uri: 'https://cdn-icons-png.flaticon.com/512/10703/10703030.png',
                }}
              />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{
                color: colors.blackOpacity(0.8),
                fontSize: responsiveFontSize(1.8),
                fontWeight: '500',
              }}>
                {t('increaseYourChances')}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                height: responsiveFontSize(3.2),
                width: responsiveFontSize(3.2),
                backgroundColor: colors.blackOpacity(0.03),
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 100,
                marginRight: responsiveFontSize(1),
              }}
            >
              <Image
                style={{
                  height: responsiveFontSize(2),
                  width: responsiveFontSize(2),
                }}
                source={{
                  uri: 'https://cdn-icons-png.flaticon.com/512/10703/10703030.png',
                }}
              />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{
                color: colors.blackOpacity(0.8),
                fontSize: responsiveFontSize(1.8),
                fontWeight: '500',
              }}>
                {t('buildCredibility')}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 2 }}>
            <View
              style={{
                height: responsiveFontSize(3.2),
                width: responsiveFontSize(3.2),
                backgroundColor: colors.blackOpacity(0.03),
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 100,
                marginRight: responsiveFontSize(1),
              }}
            >
              <Image
                style={{
                  height: responsiveFontSize(2),
                  width: responsiveFontSize(2),
                }}
                source={{
                  uri: 'https://cdn-icons-png.flaticon.com/512/10703/10703030.png',
                }}
              />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{
                color: colors.blackOpacity(0.8),
                fontSize: responsiveFontSize(1.8),
                fontWeight: '500',
              }}>
                {t('accessPremiumFeatures')}
              </Text>
            </View>
          </View>
        </View>
        {verificationVideoUrl && <>
          {/* Watch Tutorial Section */}
          <View style={{ paddingHorizontal: responsiveWidth(5) }}>
            {/* Video Heading */}
            <Text
              style={{
                color: colors.black,
                fontSize: responsiveFontSize(2),
                fontWeight: '600',
                textAlign: 'center',
                marginBottom: responsiveFontSize(1),
              }}>
              {t('learnVerificationProcess')}
            </Text>

            {/* Video Container */}
            <View
              style={[
                {
                  borderRadius: 12,
                  overflow: 'hidden',
                  alignSelf: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#000',
                  shadowColor: '#000',
                  shadowOffset: {
                    width: 0,
                    height: 4,
                  },
                  shadowOpacity: 0.15,
                  shadowRadius: 6,
                  elevation: 8,
                },
                { width: mediaWidth, height: mediaHeight },
              ]}
            >
              <Video
                ref={videoRef}
                source={{ uri: verificationVideoUrl }}
                style={[{ width: mediaWidth, height: mediaHeight }]}
                resizeMode="contain"
                repeat={false}
                paused={videoPaused}
                controls
              />
            </View>
          </View>
          <Space height={responsiveFontSize(3)} />
        </>}
        {/* Verification Process Section */}
        <View
          style={{
            marginHorizontal: responsiveWidth(3),
            backgroundColor: colors.white,
            borderRadius: 12,
            padding: responsiveFontSize(1.5),
            marginBottom: responsiveFontSize(3.5),
            borderWidth: 1,
            borderColor: colors.blackOpacity(0.1),
          }}
        >
          <Text style={{
            color: colors.black,
            fontSize: responsiveFontSize(2),
            fontWeight: 'bold',
            marginBottom: responsiveFontSize(2),
            textAlign: 'center'
          }}>
            {t('verificationProcess')}
          </Text>

          {/* Compact Process Layout */}
          <View style={{ marginBottom: responsiveFontSize(1) }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: responsiveFontSize(1.6) }}>
              <View
                style={{
                  height: responsiveFontSize(3.2),
                  width: responsiveFontSize(3.2),
                  backgroundColor: colors.blackOpacity(0.03),
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 100,
                  marginRight: responsiveFontSize(1),
                }}
              >
                <Image
                  style={{
                    height: responsiveFontSize(2),
                    width: responsiveFontSize(2),
                  }}
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/10703/10703030.png',
                  }}
                />
              </View>

              {/* Step Content */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: responsiveFontSize(0.3) }}>
                  <Text
                    style={{
                      fontSize: responsiveFontSize(1.8),
                      fontWeight: '600',
                      color: colors.black,
                    }}
                  >
                    {t('watchVideoTutorial')}
                  </Text>
                </View>
                <Text style={{
                  color: colors.blackOpacity(0.8),
                  fontSize: responsiveFontSize(1.4),
                  fontWeight: '500',
                }}>
                  {t('watchVideoDescription')}
                </Text>
              </View>
            </View>

            {/* Step 2: Pay Verification Charges */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: responsiveFontSize(1.6) }}>
              <View
                style={{
                  height: responsiveFontSize(3.2),
                  width: responsiveFontSize(3.2),
                  backgroundColor: colors.blackOpacity(0.03),
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 100,
                  marginRight: responsiveFontSize(1),
                }}
              >
                <Image
                  style={{
                    height: responsiveFontSize(2),
                    width: responsiveFontSize(2),
                  }}
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/10703/10703030.png',
                  }}
                />
              </View>

              {/* Step Content */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: responsiveFontSize(0.3) }}>
                  <Text
                    style={{
                      fontSize: responsiveFontSize(1.8),
                      fontWeight: '600',
                      color: colors.black,
                    }}
                  >
                    {t('payVerificationCharges')}
                  </Text>
                </View>
                <Text style={{
                  color: colors.blackOpacity(0.8),
                  fontSize: responsiveFontSize(1.4),
                  fontWeight: '500',
                }}>
                  {t('verificationChargesDescription')}
                </Text>
              </View>
            </View>

            {/* Step 3: Upload Documents */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: responsiveFontSize(1.6) }}>
              <View
                style={{
                  height: responsiveFontSize(3.2),
                  width: responsiveFontSize(3.2),
                  backgroundColor: colors.blackOpacity(0.03),
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 100,
                  marginRight: responsiveFontSize(1),
                }}
              >
                <Image
                  style={{
                    height: responsiveFontSize(2),
                    width: responsiveFontSize(2),
                  }}
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/10703/10703030.png',
                  }}
                />
              </View>

              {/* Step Content */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: responsiveFontSize(0.3) }}>
                  <Text
                    style={{
                      fontSize: responsiveFontSize(1.8),
                      fontWeight: '600',
                      color: colors.black,
                    }}
                  >
                    {t('uploadRequiredDocuments')}
                  </Text>
                </View>
                <Text style={{
                  color: colors.blackOpacity(0.8),
                  fontSize: responsiveFontSize(1.4),
                  fontWeight: '500',
                }}>
                  {t('uploadDocumentsDescription')}
                </Text>
              </View>
            </View>

            {/* Step 4: Verification Process */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: responsiveFontSize(1.6) }}>
              <View
                style={{
                  height: responsiveFontSize(3.2),
                  width: responsiveFontSize(3.2),
                  backgroundColor: colors.blackOpacity(0.03),
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 100,
                  marginRight: responsiveFontSize(1),
                }}
              >
                <Image
                  style={{
                    height: responsiveFontSize(2),
                    width: responsiveFontSize(2),
                  }}
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/10703/10703030.png',
                  }}
                />
              </View>

              {/* Step Content */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: responsiveFontSize(0.3) }}>
                  <Text
                    style={{
                      fontSize: responsiveFontSize(1.8),
                      fontWeight: '600',
                      color: colors.black,
                    }}
                  >
                    {t('completeVerification')}
                  </Text>
                </View>
                <Text style={{
                  color: colors.blackOpacity(0.8),
                  fontSize: responsiveFontSize(1.4),
                  fontWeight: '500',
                }}>
                  {t('completeVerificationDescription')}
                </Text>
              </View>
            </View>

            {/* Step 5: Report Upload */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: responsiveFontSize(0.5) }}>
              <View
                style={{
                  height: responsiveFontSize(3.2),
                  width: responsiveFontSize(3.2),
                  backgroundColor: colors.blackOpacity(0.03),
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 100,
                  marginRight: responsiveFontSize(1),
                }}
              >
                <Image
                  style={{
                    height: responsiveFontSize(2),
                    width: responsiveFontSize(2),
                  }}
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/10703/10703030.png',
                  }}
                />
              </View>

              {/* Step Content */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text
                    style={{
                      fontSize: responsiveFontSize(1.8),
                      fontWeight: '600',
                      color: colors.black,
                    }}
                  >
                    {t('verificationReportUpload')}
                  </Text>
                </View>
                <Text style={{
                  color: colors.blackOpacity(0.8),
                  fontSize: responsiveFontSize(1.4),
                  fontWeight: '500',
                }}>
                  {t('verificationReportDescription')}
                </Text>
              </View>
            </View>
          </View>
        </View>
        \

        {/* Pay Now Button Section - Only show for initial payment */}
        {(overallStatus === 'not_started' || overallStatus === 'payment_required') && (
          <View style={{ paddingHorizontal: responsiveWidth(3) }}>
            <View style={{ backgroundColor: colors.royalBlueOpacity(0.05), borderRadius: 16, padding: responsiveFontSize(3), borderWidth: 2, borderColor: colors.royalBlueOpacity(0.1) }}>
              <Text style={{ fontSize: responsiveFontSize(2), fontWeight: '700', color: colors.royalBlue, textAlign: 'center', marginBottom: responsiveFontSize(1) }}>
                {t('verificationFee')}
              </Text>

              <Text style={{ fontSize: responsiveFontSize(3.5), fontWeight: '800', color: colors.royalBlue, textAlign: 'center', marginBottom: responsiveFontSize(1.5) }}>
                ₹1,180
              </Text>

              {/* Pay Now Button */}
              <TouchableOpacity onPress={_handlePayNow} disabled={processingPayment} style={{ backgroundColor: colors.royalBlue, paddingVertical: responsiveFontSize(1.3), borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: colors.royalBlue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6, flexDirection: 'row' }}>
                {processingPayment && (<ActivityIndicator size="small" color={colors.white} style={{ marginRight: responsiveFontSize(1) }} />)}
                <Text style={{ color: colors.white, fontSize: responsiveFontSize(1.8), fontWeight: '700' }}>
                  {processingPayment ? t('processing') : t('payNow')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )
        }
      </ScrollView >
      {/* Render the DocumentUploadModal */}
      < DocumentUploadModal
        visible={documentUploadModal}
        onClose={_closeDocumentUploadModal}
        onSuccess={_onDocumentUploadSuccess}
      />

      {/* Render the VerificationStatusModal */}
      < VerificationStatusModal
        visible={verificationStatusModal}
        onClose={_closeVerificationStatusModal}
        verificationData={apiData}
      />
    </View >
  );
}
