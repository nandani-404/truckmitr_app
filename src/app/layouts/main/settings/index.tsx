import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { useColor, useResponsiveScale } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Space } from '@truckmitr/src/app/components';
import Ionicons from 'react-native-vector-icons/Ionicons'
import { useNavigation } from '@react-navigation/native';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { hitSlop } from '@truckmitr/src/app/functions';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { deleteUserData } from '@truckmitr/src/utils/config/token';
import { subscriptionDetailsAction, userAuthenticatedAction } from '@truckmitr/src/redux/actions/user.action';
import { END_POINTS } from '@truckmitr/src/utils/config';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import analytics from '@react-native-firebase/analytics';
import { AppEventsLogger } from 'react-native-fbsdk-next';
// import { onUserLogout } from '@truckmitr/src/utils/zegoService';
import { AppleConfirmDialog } from '@truckmitr/src/app/components';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

export default function Settings() {
  const { t } = useTranslation();
  const colors = useColor();
  const safeAreaInsets = useSafeAreaInsets();
  const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();
  const navigation = useNavigation<NavigatorProp>();
  const dispatch = useDispatch();
  const { user, isDriver, isTransporter, subscriptionDetails } = useSelector((state: any) => state.user);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [showCancelMembershipDialog, setShowCancelMembershipDialog] = useState(false);

  const deleteAccount = async () => {
    setIsDeleting(true);
    const userinfo = {
      id: user?.id ?? '',
      unique_id: user?.unique_id ?? '',
      name: user?.name ?? '',
      mobile: user?.mobile ?? '',
      email: user?.email ?? '',
      role: user?.role ?? '',
    };

    const eventParams = {
      user_id: String(userinfo.id),
      user_unique_id: userinfo.unique_id,
      user_name: userinfo.name,
      user_email: userinfo.email,
      user_role: userinfo.role,
      method: 'user_requested',
    };

    try {
      // await onUserLogout()
      const response: any = await axiosInstance.post(END_POINTS?.DELETE_ACCOUNT);

      if (response?.data?.status) {
        await analytics().logEvent('delete_account', eventParams);
        AppEventsLogger.logEvent('delete_account', eventParams);
        await new Promise<void>(res => setTimeout(() => res(), 500));
        dispatch(userAuthenticatedAction(false));
        deleteUserData();
        showToast(response?.data?.message);
      }
    } catch (error) {
      console.warn('Delete account error:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const getPaidAmount = (): number => {
    // If no subscription details valid-like object, return 0
    if (!subscriptionDetails || Object.keys(subscriptionDetails).length === 0) {
      return 0;
    }

    // Amount is stored directly on subscription object as string (e.g., "99.00")
    if (subscriptionDetails?.amount) {
      return parseFloat(subscriptionDetails.amount);
    }
    // Fallback to payment_details.amount (in paise, needs /100)
    if (subscriptionDetails?.payment_details?.amount) {
      return subscriptionDetails.payment_details.amount / 100;
    }
    // Default fallback
    return 0;
  };

  const handleCancelMembership = async () => {
    try {
      setCancellingSubscription(true);
      setShowCancelMembershipDialog(false);

      // Prioritize Razorpay ID ("sub_...") as verified by API testing
      const targetId = subscriptionDetails?.subscription_id || subscriptionDetails?.id;

      if (!targetId) {
        showToast(t('subscriptionIdNotFound') || 'Subscription ID not found');
        return;
      }

      const payload = {
        subscription_id: String(targetId)
      };

      const response: any = await axiosInstance.post(END_POINTS.CANCEL_SUBSCRIPTION, payload);

      if (response?.data?.status) {
        showToast(t('membershipCancelledSuccessfully') || 'Membership cancelled successfully');

        // Refresh subscription details
        const subscriptionResponse: any = await axiosInstance.get(END_POINTS?.PAYMENT_SUBSCRIPTION_DETAILS);
        if (subscriptionResponse?.data?.status) {
          const subscriptionData = subscriptionResponse?.data?.data || [];
          dispatch(subscriptionDetailsAction(subscriptionData));
        } else {
          dispatch(subscriptionDetailsAction([]));
        }
      } else {
        showToast(response?.data?.message || t('failedToCancelMembership') || 'Failed to cancel membership');
      }
    } catch (error: any) {
      console.error('Cancel membership error:', error);
      showToast(error?.message || t('failedToCancelMembership') || 'Failed to cancel membership');
    } finally {
      setCancellingSubscription(false);
    }
  };

  const _goback = () => {
    navigation.goBack()
  }
  const _navigateLanguage = () => {
    navigation.navigate(STACKS.LANGUAGE_MAIN)
  }
  const _navigatePreferredColour = () => {
    navigation.navigate(STACKS.PREFERRED_COLOR)
  }
  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <Space height={safeAreaInsets.top} />
      <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', padding: responsiveWidth(3) }}>
        <TouchableOpacity hitSlop={hitSlop(10)} onPress={_goback} style={{ height: responsiveFontSize(4), width: responsiveFontSize(4), alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, borderRadius: 100, zIndex: 100 }}>
          <Ionicons name={'chevron-back'} size={24} color={colors.royalBlue} />
        </TouchableOpacity>
        <Text style={{ width: responsiveWidth(100), fontSize: responsiveFontSize(2.2), color: colors.royalBlue, fontWeight: 'bold', textAlign: 'center', position: 'absolute', zIndex: 1 }}>{t(`settings`)}</Text>
      </View>
      <Space height={responsiveHeight(1)} />

      <TouchableOpacity onPress={_navigateLanguage} style={{ width: responsiveWidth(100), flexDirection: 'row', alignItems: 'center', paddingHorizontal: responsiveWidth(5), paddingVertical: responsiveFontSize(2) }}>
        <Ionicons name={'language'} size={22} color={colors.black} />
        <Text style={{ flex: 1, color: colors.black, fontSize: responsiveFontSize(2), fontWeight: '400', marginHorizontal: responsiveFontSize(2.5) }}>{t('language')}</Text>
        <MaterialIcons name={'keyboard-arrow-right'} size={24} color={colors.blackOpacity(.3)} />
      </TouchableOpacity>

      {(isDriver || isTransporter) && getPaidAmount() > 0 && (
        <TouchableOpacity onPress={() => setShowCancelMembershipDialog(true)} style={{ width: responsiveWidth(100), flexDirection: 'row', alignItems: 'center', paddingHorizontal: responsiveWidth(5), paddingVertical: responsiveFontSize(2) }}>
          {cancellingSubscription
            ? <ActivityIndicator size="small" color="#FF3B30" />
            : <MaterialCommunityIcons name="card-remove-outline" size={22} color="#FF3B30" />
          }
          <Text style={{ flex: 1, color: '#FF3B30', fontSize: responsiveFontSize(2), fontWeight: '400', marginHorizontal: responsiveFontSize(2.5) }}>{t('cancelMembership') || 'Cancel Membership'}</Text>
          <MaterialIcons name={'keyboard-arrow-right'} size={24} color={colors.blackOpacity(.3)} />
        </TouchableOpacity>
      )}
      {/* <TouchableOpacity onPress={_navigatePreferredColour} style={{ width: responsiveWidth(100), flexDirection: 'row', alignItems: 'center', paddingHorizontal: responsiveWidth(5), paddingVertical: responsiveFontSize(2) }}>
        <Ionicons name={'color-palette-outline'} size={22} color={colors.black} />
        <Text style={{ flex: 1, color: colors.black, fontSize: responsiveFontSize(2), fontWeight: '400', marginHorizontal: responsiveFontSize(2.5) }}>{t('preferredColour')}</Text>
        <MaterialIcons name={'keyboard-arrow-right'} size={24} color={colors.blackOpacity(.3)} />
      </TouchableOpacity> */}


      <AppleConfirmDialog
        visible={showCancelMembershipDialog}
        title={t('cancelMembership') || 'Cancel Membership'}
        message={t('areYouSureCancelMembership') || 'Are you sure you want to cancel your membership? You will lose access to premium features.'}
        confirmText={t('cancelMembership') || 'Cancel Membership'}
        cancelText={t('keepMembership') || 'Keep Membership'}
        isDestructive={true}
        onConfirm={handleCancelMembership}
        onCancel={() => setShowCancelMembershipDialog(false)}
      />

      <AppleConfirmDialog
        visible={showDeleteDialog}
        title={t('deleteAccount')}
        message={t('areYouSureDeleteAccount') || 'This action cannot be undone. All your data will be permanently deleted.'}
        confirmText={t('delete') || 'Delete'}
        cancelText={t('cancel')}
        isDestructive={true}
        onConfirm={deleteAccount}
        onCancel={() => setShowDeleteDialog(false)}
        loading={isDeleting}
      />

      <TouchableOpacity onPress={() => setShowDeleteDialog(true)} style={{ width: responsiveWidth(100), flexDirection: 'row', alignItems: 'center', paddingHorizontal: responsiveWidth(5), paddingVertical: responsiveFontSize(2), marginTop: responsiveFontSize(2) }}>
        <MaterialCommunityIcons name={'delete-outline'} size={22} color={'#FF3B30'} />
        <Text style={{ flex: 1, color: '#FF3B30', fontSize: responsiveFontSize(2), fontWeight: '400', marginHorizontal: responsiveFontSize(2.5) }}>{t('deleteAccount')}</Text>
        <MaterialIcons name={'keyboard-arrow-right'} size={24} color={colors.blackOpacity(.3)} />
      </TouchableOpacity>

      <Space style={{ flex: 1 }} />
      <View style={{ backgroundColor: colors.royalBlue }}>
        <Text style={{ color: colors.white, fontSize: responsiveFontSize(1.6), textAlign: 'center', margin: responsiveFontSize(1.5) }}>{`© 2026 TruckMitr Corporate Services Private Limited. \nAll Rights Reserved.`}</Text>
        <Space height={safeAreaInsets.bottom} />
      </View>
    </View>
  )
}