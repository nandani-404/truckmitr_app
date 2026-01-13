import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useCallback, useState } from 'react'
import { useColor, useImage, useResponsiveScale, useShadow, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Space, ScreenHeader } from '@truckmitr/src/app/components';
import { Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons'
import { isIOS } from '@truckmitr/src/app/functions';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { BASE_URL, END_POINTS } from '@truckmitr/src/utils/config';
import { useTranslation } from 'react-i18next';
import Feather from 'react-native-vector-icons/Feather'
import { useDispatch, useSelector } from 'react-redux';
import { subscriptionModalAction } from '@truckmitr/src/redux/actions/user.action';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

export default function HealthHygiene() {
  const { t } = useTranslation();
  const dispatch = useDispatch()
  useStatusBarStyle('dark-content')
  const colors = useColor();
  const images = useImage()
  const { shadow } = useShadow()
  const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();
  const navigation = useNavigation<NavigatorProp>();
  const [theme, settheme] = useState('LIGHT')
  const { i18n } = useTranslation(); // Use translation hook from i18next

  const [healthHygiene, sethealthHygiene] = useState([])
  const [loading, setloading] = useState(true)
  const { subscriptionDetails, subscriptionModal } = useSelector((state: any) => { return state?.user })

  useFocusEffect(
    useCallback(() => {
      const _healthHygiene = async () => {
        try {
          const response: any = await axiosInstance.get(END_POINTS?.HEALTH_HYGINE);
          if (response?.data?.success) {
            sethealthHygiene(response?.data?.data);
          }
        } catch (error) {
          console.error("Error fetching health hygiene data:", error);
        } finally {
          setloading(false)
        }
      };
      _healthHygiene();
    }, [])
  );

  const LANGUAGES = [
    { name: 'हिन्दी', title: i18n.t(`hindi`), code: 'hi', },        // Hindi
    { name: 'English', title: i18n.t(`english`), code: 'en' },      // English
    { name: 'Hinglish', title: i18n.t(`hinglish`), code: 'hn' },     // Hinglish (custom/mixed language – no native script)
    { name: 'ਪੰਜਾਬੀ', title: i18n.t(`punjabi`), code: 'pa' },       // Punjabi
    { name: 'اردو', title: i18n.t(`urdu`), code: 'ur' },         // Urdu
  ];

  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const currentLang = i18n.language;
      const selected = LANGUAGES.find(l => l.code === currentLang);
      if (selected) {
        let displayName = selected.name;
        if (selected.name === 'English') displayName = 'Eng';
        if (selected.name === 'हिन्दी') displayName = 'Hi';
        setSelectedLanguage(displayName);
      }
    }, [])
  );


  const _onpressTheme = (value: any) => () => {
    settheme(value)
  }

  const _navigatePlayer = (item: any, index: any) => () => {
    if (subscriptionDetails?.showSubscriptionModel && index !== 0) {
      !subscriptionModal && dispatch(subscriptionModalAction(true))
    } else { navigation.navigate(STACKS.PLAYER, { item }) }

  }
  const _navigateLanguage = () => {
    navigation.navigate(STACKS.LANGUAGE_MAIN)
  }
  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <ScreenHeader
        title={t('healthHygiene')}
      />
      <Space height={responsiveFontSize(1)} />
      {loading ?
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Image style={{ height: responsiveHeight(22), width: responsiveWidth(50), borderTopLeftRadius: 10, borderTopRightRadius: 10, tintColor: colors.blackOpacity(.1) }} source={{ uri: 'https://truckmitr.com/public/images/preview.png' }} />
        </View>
        : <ScrollView style={{}}>
          <View style={{ width: responsiveWidth(100), marginBottom: responsiveFontSize(2) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: responsiveWidth(5), marginTop: responsiveFontSize(1), }}>
              <Text style={{ fontSize: responsiveFontSize(2), color: colors.black, fontWeight: '500' }}>{t('healthHygieneVideo')}</Text>
            </View>
            <FlatList
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              horizontal
              data={healthHygiene}
              renderItem={({ item, index }: any) => {
                return (
                  <TouchableOpacity onPress={_navigatePlayer(item, index)} activeOpacity={.7} style={{ width: responsiveWidth(50), backgroundColor: colors.white, marginTop: responsiveFontSize(1), marginRight: responsiveFontSize(2), borderRadius: 10, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.2) : colors.blackOpacity(.4), opacity: (subscriptionDetails?.showSubscriptionModel && index !== 0) ? .5 : 1 }}>
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                      <Image style={{ height: responsiveHeight(12), width: responsiveWidth(50), borderTopLeftRadius: 10, borderTopRightRadius: 10 }} source={{ uri: `${BASE_URL}public/${item.thumbnail_url}` || 'https://truckmitr.com/public/images/preview.png' }} />
                      <TouchableOpacity onPress={_navigatePlayer(item, index)} style={{ backgroundColor: colors.blackOpacity(.5), padding: responsiveFontSize(1.2), borderRadius: 100, position: 'absolute' }}>
                        <Ionicons name={"play"} size={20} color="white" />
                      </TouchableOpacity>
                    </View>
                    <Text style={{ color: colors.blackOpacity(.7), fontSize: responsiveFontSize(1.8), fontWeight: '500', margin: responsiveFontSize(1), marginTop: responsiveFontSize(1), marginBottom: responsiveFontSize(1.5) }}>{item?.video_topic_name}</Text>
                  </TouchableOpacity>
                )
              }}
              contentContainerStyle={{ paddingHorizontal: responsiveWidth(5), paddingBottom: responsiveHeight(5) }}
              keyExtractor={(item, index) => index.toString()}
            />
          </View>
        </ScrollView>}
    </View>
  )
}