import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Image, PermissionsAndroid, ActivityIndicator, Linking } from 'react-native';
import { useColor, useResponsiveScale } from '@truckmitr/src/app/hooks';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import Contacts from 'react-native-contacts';
import { useTranslation } from 'react-i18next';
import { hitSlop } from '@truckmitr/src/app/functions';
import { Space } from '@truckmitr/src/app/components';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigatorParams } from '@truckmitr/stacks/stacks';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { END_POINTS } from '@truckmitr/src/utils/config';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { useSelector } from 'react-redux';

export const Referral = () => {
  const colors = useColor();
  const { responsiveFontSize, responsiveWidth, responsiveHeight } = useResponsiveScale();
  type ContactType = {
    id: string;
    name: string;
    phone: string;
    avatar?: string;
  };
  const { isDriver, subscriptionDetails, referral } = useSelector((state: any) => { return state?.user })
  const [selectedContacts, setSelectedContacts] = useState<{ id: string; phone: any }[]>([]);
  const { t } = useTranslation();
  const navigation = useNavigation<NavigatorProp>();
  const safeAreaInsets = useSafeAreaInsets();
  const [contacts, setContacts] = useState<ContactType[]>([]);
  const [search, setSearch] = useState('');
  const [filteredContacts, setFilteredContacts] = useState<ContactType[]>([]);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);

  useEffect(() => {
    const getContacts = async () => {
      const permission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        {
          title: t('contacts'),
          message: t('contactPermission'),
          buttonPositive: t('pleaseAccept')
        }
      );
      setPermissionStatus(permission);
      if (permission !== PermissionsAndroid.RESULTS.GRANTED) return;

      Contacts.getAll()
        .then(contactsList => {
          const formatted = contactsList
            .filter(c => c.phoneNumbers.length > 0)
            .map(c => ({
              id: c.recordID,
              name: c.displayName ?? '',
              phone: c.phoneNumbers[0]?.number,
              avatar: c.thumbnailPath,
            }));
          setContacts(formatted);
          setFilteredContacts(formatted);
        })
        .catch(e => {
          // handle error
        });
    };
    getContacts();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredContacts(contacts);
    } else {
      const lower = search.toLowerCase();
      setFilteredContacts(
        contacts.filter(
          c =>
            c.name?.toLowerCase().includes(lower) ||
            c.phone?.replace(/\s+/g, '').includes(lower.replace(/\s+/g, ''))
        )
      );
    }
  }, [search, contacts]);

  const _goback = () => {
    navigation.goBack();
  };

  const toggleContact = (id: string, phone: any) => {
    setSelectedContacts(prev =>
      prev.some(contact => contact.id === id)
        ? prev.filter(contact => contact.id !== id)
        : [...prev, { id, phone }]
    );
  };

  const sendRefer = async () => {
    const contacts = selectedContacts.map(item => item.phone);
    setLoading(true);
    try {
      const response: any = await axiosInstance.post(END_POINTS.REFERRAL, { contacts });
      if (response?.data) {
        showToast(response?.data.message || t('referralSent'))
        setSelectedContacts([]);
        _goback()
      }
    } catch (error: any) {
      console.log(error);
    }
    finally {
      setLoading(false);
    }
  }

  const renderContact = ({ item }: { item: any }) => {
    const isSelected = selectedContacts.some(e => e.id === item.id);
    const initials = item.name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <TouchableOpacity
        onPress={() => toggleContact(item.id, item.phone)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: responsiveHeight(1.2),
          paddingHorizontal: responsiveWidth(3),
          backgroundColor: isSelected ? colors.royalBlueOpacity(0.08) : colors.white,
          borderRadius: 10,
          marginBottom: responsiveHeight(0.8),
        }}
        activeOpacity={0.8}
      >
        {item.avatar ? (
          <Image
            source={{ uri: item.avatar }}
            style={{
              width: responsiveFontSize(4.5),
              height: responsiveFontSize(4.5),
              borderRadius: 100,
              marginRight: responsiveWidth(3),
            }}
          />
        ) : (
          <View
            style={{
              width: responsiveFontSize(4.5),
              height: responsiveFontSize(4.5),
              borderRadius: 100,
              backgroundColor: colors.royalBlueOpacity(0.15),
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: responsiveWidth(3),
            }}
          >
            <Text style={{ color: colors.royalBlue, fontWeight: 'bold', fontSize: responsiveFontSize(2) }}>
              {initials}
            </Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.9), fontWeight: '500' }}>
            {item.name}
          </Text>
          <Text style={{ color: colors.blackOpacity(0.7), fontSize: responsiveFontSize(1.7) }}>
            {item.phone}
          </Text>
        </View>
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: isSelected ? colors.royalBlue : colors.blackOpacity(0.15),
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isSelected ? colors.royalBlue : colors.white,
          }}
        >
          {isSelected && (
            <FontAwesome name="check" size={14} color={colors.white} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const referredDriversCount = referral.referral_success; // set actual referred count from user state

  // Determine message and progress
  const referralsNeeded = Math.max(0, referral.referral_bonus - referredDriversCount);
  const progressPercent = Math.min(100, (referredDriversCount / referral.referral_bonus) * 100);

  let rewardMessage = '';
  if (subscriptionDetails?.showSubscriptionModel && isDriver) {
    rewardMessage = referredDriversCount === referral.referral_bonus
      ? t('referralMessageCongs', { referral_bonus: referral.referral_bonus })
      : t('referralMessage', { referralsNeeded })
  }
  // else {
  //   rewardMessage = referral.referral_success === 5
  //     ? "Thank you for your support! You will receive a reward or coupon for referring 5 drivers."
  //     : `Refer ${referralsNeeded} more driver${referralsNeeded > 1 ? 's' : ''} to earn a reward or coupon.`;
  // }

  const gotoSetting = () => {
    _goback()
    Linking.openSettings()
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.white, padding: responsiveWidth(5) }}>
      <Space height={safeAreaInsets.top} />
      <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', padding: responsiveWidth(3) }}>
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
            zIndex: 100,
          }}>
          <Ionicons name={'chevron-back'} size={24} color={colors.royalBlue} />
        </TouchableOpacity>
        <Text
          style={{
            width: responsiveWidth(100),
            fontSize: responsiveFontSize(2.2),
            color: colors.royalBlue,
            fontWeight: 'bold',
            textAlign: 'center',
            position: 'absolute',
            zIndex: 1,
          }}>
          {t('referEarn')}
        </Text>
      </View>

      {/* Search Bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.blackOpacity(0.04),
          borderRadius: 10,
          paddingHorizontal: responsiveWidth(3),
          marginBottom: responsiveHeight(2),
        }}
      >
        <FontAwesome name="search" size={18} color={colors.royalBlue} />
        <TextInput
          style={{
            flex: 1,
            marginLeft: 10,
            fontSize: responsiveFontSize(1.9),
            color: colors.black,
            paddingVertical: 10,
          }}
          placeholder={t('searchContacts')}
          placeholderTextColor={colors.blackOpacity(0.4)}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Progress Bar & Info */}
      <View style={{ marginBottom: responsiveHeight(2), marginTop: responsiveHeight(1) }}>
        <View style={{
          height: 10,
          backgroundColor: colors.blackOpacity(0.08),
          borderRadius: 5,
          overflow: 'hidden',
        }}>
          <View style={{
            width: `${progressPercent}%`,
            height: '100%',
            backgroundColor: colors.royalBlue,
            borderRadius: 5,
          }} />
        </View>
        <Text style={{
          color: colors.royalBlue,
          fontWeight: 'bold',
          fontSize: responsiveFontSize(1.7),
          marginTop: 6,
        }}>
          {`${t('referred')} ${referredDriversCount} / ${referral.total_referrals}`}
        </Text>
        <Text style={{
          color: colors.blackOpacity(0.7),
          fontSize: responsiveFontSize(1.6),
          marginTop: 2,
        }}>
          {rewardMessage}
        </Text>
      </View>
      {permissionStatus === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN && (
        <View style={{ alignItems: 'center', marginVertical: 24 }}>
          <Text style={{ color: colors.roseRed, fontSize: responsiveFontSize(1.8), marginBottom: 12, textAlign: 'center' }}>
            {t('contactPermission')}
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: colors.royalBlue,
              borderRadius: 100,
              paddingVertical: responsiveHeight(1.2),
              paddingHorizontal: responsiveWidth(8),
              alignItems: 'center',
            }}
            onPress={gotoSetting}
          >
            <Text style={{ color: colors.white, fontWeight: 'bold', fontSize: responsiveFontSize(1.9) }}>
              {t('goToSettings')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      {/* Contact List */}
      <FlatList
        data={filteredContacts}
        keyExtractor={item => item.id}
        scrollEnabled
        renderItem={renderContact}
        style={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Send Invite Button */}
      <TouchableOpacity
        style={{
          backgroundColor: colors.royalBlue,
          borderRadius: 100,
          paddingVertical: responsiveHeight(1.7),
          alignItems: 'center',
          marginTop: responsiveHeight(1),
          opacity: selectedContacts.length === 0 || loading ? 0.5 : 1,
        }}
        activeOpacity={0.8}
        onPress={sendRefer}
        disabled={selectedContacts.length === 0 || loading}
      >
        {loading ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={{ color: colors.white, fontWeight: 'bold', fontSize: responsiveFontSize(2.1) }}>
          {t('sendInvite')}
        </Text>}
      </TouchableOpacity>

      {/* Info Section */}
      <Text
        style={{
          color: colors.blackOpacity(0.6),
          fontSize: responsiveFontSize(1.5),
          textAlign: 'center',
          marginTop: responsiveHeight(1.5),
        }}
      >
        {t('rarnFreeSubs')}
      </Text>
      <Space height={safeAreaInsets.bottom} />
    </View>
  );
};