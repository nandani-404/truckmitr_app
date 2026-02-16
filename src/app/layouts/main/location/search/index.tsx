import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigatorParams, STACKS } from '@truckmitr/src/stacks/stacks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import { Space } from '@truckmitr/src/app/components';
import Ionicons from 'react-native-vector-icons/Ionicons'
import Feather from 'react-native-vector-icons/Feather'
import { hitSlop, isAndroid } from '@truckmitr/src/app/functions';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Octicons from 'react-native-vector-icons/Octicons';
import { autocompletePlaces, generateSessionToken, placeDetails } from '@truckmitr/src/utils/maps/google.apis';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

export default function LocationSearch() {
    const navigation = useNavigation<NavigatorProp>();
    const route = useRoute<any>();
    const params = route.params;
    const safeAreaInsets = useSafeAreaInsets();
    const colors = useColor();
    const { shadow } = useShadow()
    const { responsiveWidth, responsiveFontSize, responsiveHeight } = useResponsiveScale();

    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [sessionToken, setSessionToken] = useState<string>('');

    useEffect(() => {
        setSessionToken(generateSessionToken());
    }, []);

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            if (query.length > 1) {
                setLoading(true);
                autocompletePlaces(query, sessionToken)
                    .then((res: any) => {
                        if (res?.status === 'OK' && res?.result) {
                            setSuggestions(res?.result?.predictions);
                        } else {
                            setSuggestions([]);
                        }
                    })
                    .catch(error => {
                        console.error('API Error:', error);
                        setSuggestions([]);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
            } else {
                setSuggestions([]);
            }
        }, 400);
        return () => clearTimeout(delayDebounce);
    }, [query, sessionToken]);

    const _onPressMapView = async (item: any) => {
        navigation.navigate(STACKS.MAP_VIEW, {
            locationData: item,
            returnScreen: params?.returnScreen,
            pointType: params?.pointType,
            sessionToken: sessionToken
        })
    }
    return (
        <View style={{ flex: 1, backgroundColor: colors.white, alignItems: 'center' }}>
            <Space height={safeAreaInsets.top} />
            <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', padding: responsiveWidth(3) }}>
                <TouchableOpacity hitSlop={hitSlop(10)} onPress={() => navigation.goBack()} style={{ height: responsiveFontSize(4), width: responsiveFontSize(4), alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, borderRadius: 100, zIndex: 100 }}>
                    <Ionicons name={'chevron-back'} size={24} color={colors.royalBlue} />
                </TouchableOpacity>
                <Text style={{ width: responsiveWidth(100), fontSize: responsiveFontSize(2.2), color: colors.royalBlue, fontWeight: 'bold', textAlign: 'center', position: 'absolute', zIndex: 1 }}>{`Add loading point`}</Text>
            </View>
            <Space height={responsiveFontSize(1)} />

            <View style={{ width: responsiveWidth(92), flexDirection: "row", height: responsiveHeight(5.8), alignItems: 'center', backgroundColor: colors.white, alignSelf: 'center', borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1.4, paddingHorizontal: responsiveWidth(2.5), ...shadow, shadowColor: colors.blackOpacity(isAndroid() ? .2 : .1) }}>
                <Feather name={'search'} size={22} color={colors.black} />
                <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder='Search for building, street or area'
                    style={{ flex: 1, height: responsiveHeight(5.5), paddingHorizontal: responsiveWidth(2.5) }}
                />
                {loading ?
                    <ActivityIndicator color={colors.royalBlue} />
                    : query.length ? <TouchableOpacity onPress={() => setQuery('')} hitSlop={hitSlop(20)} style={{ height: responsiveFontSize(3), width: responsiveFontSize(3), alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blackOpacity(.02), borderRadius: 100 }}>
                        <Ionicons name={'close'} size={16} color={colors.black} />
                    </TouchableOpacity> : null}
            </View>
            <Space height={responsiveFontSize(1)} />
            <KeyboardAwareScrollView
                contentContainerStyle={{ flexGrow: 1, backgroundColor: colors.white, alignItems: 'center' }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                enableOnAndroid={true}
                extraScrollHeight={responsiveHeight(30)}>
                {!loading && query?.length === 0 && <View style={{ width: responsiveWidth(100), alignItems: 'center' }}>
                    <Space height={responsiveHeight(1.3)} />
                    <View style={{ width: '94%', backgroundColor: colors.white, paddingVertical: responsiveHeight(1.5), paddingHorizontal: responsiveWidth(3), ...shadow, shadowColor: colors.blackOpacity(isAndroid() ? .2 : .1), borderRadius: 10, }}>
                        <TouchableOpacity onPress={() => _onPressMapView({})} activeOpacity={.7} style={{ flexDirection: 'row', alignItems: 'center', }}>
                            <MaterialIcons name={'gps-fixed'} size={22} color={colors.royalBlue} />
                            <View style={{ flex: 1, paddingHorizontal: responsiveWidth(2) }}>
                                <Text style={{ color: colors.royalBlue, fontWeight: '500', fontSize: responsiveFontSize(2), }}>{`Use current location`}</Text>
                                <Text numberOfLines={3} style={{ color: colors.blackOpacity(.5), fontSize: responsiveFontSize(1.6), marginTop: responsiveHeight(.2) }}>{`Block c, Nawada, Extention, Nawada, Delhi Division, Delhi, 110059, india`}</Text>
                            </View>
                            <MaterialIcons name={'chevron-right'} size={24} color={colors.blackOpacity(.5)} />
                        </TouchableOpacity>
                        {/* <View style={{ height: responsiveHeight(.15), backgroundColor: colors.blackOpacity(.05), marginVertical: responsiveHeight(1.4), borderRadius: 100 }} />
                    <TouchableOpacity activeOpacity={.7} style={{ flexDirection: 'row', alignItems: 'center', }}>
                        <MaterialIcons name={'add'} size={24} color={colors.royalBlue} />
                        <Text style={{ flex: 1, color: colors.royalBlue,fontWeight:'500', fontSize: responsiveFontSize(2), marginHorizontal: responsiveWidth(2) }}>{`Add New Address`}</Text>
                        <MaterialIcons name={'chevron-right'} size={22} color={colors.blackOpacity(.5)} />
                    </TouchableOpacity> */}
                    </View>
                    {/* <Space height={responsiveHeight(2.6)} />
                <View style={{ width: '94%', backgroundColor: colors.white, paddingVertical: responsiveHeight(1.5), paddingHorizontal: responsiveWidth(3), ...shadow, shadowColor: colors.blackOpacity(isAndroid() ? .2 : .1), borderRadius: 10, }}>
                    <TouchableOpacity activeOpacity={.7} style={{ flexDirection: 'row', alignItems: 'center', }}>
                        <View style={{ height: responsiveFontSize(3.8), width: responsiveFontSize(3.8), backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center', borderRadius: 5 }}>
                            <Image style={{ height: responsiveFontSize(2.6), width: responsiveFontSize(2.6), resizeMode: 'contain', tintColor: colors.white }} source={{ uri: `https://cdn-icons-png.flaticon.com/512/1384/1384023.png` }} />
                        </View>
                        <Text style={{ flex: 1, color: colors.black, fontSize: responsiveFontSize(1.7), marginHorizontal: responsiveWidth(2), fontWeight:'500' }}>{`Reqest address from someone else`}</Text>
                        <MaterialIcons name={'chevron-right'} size={22} color={colors.blackOpacity(.5)} />
                    </TouchableOpacity>
                </View> */}
                    {/* <Space height={responsiveHeight(3)} />
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: responsiveWidth(4) }}>
                    <View style={{ flex: 1, height: responsiveHeight(.15), backgroundColor: colors.blackOpacity(.05), marginVertical: responsiveHeight(1.4), borderRadius: 100 }} />
                    <Text style={{ color: colors.blackOpacity(.5), fontSize: responsiveFontSize(1.6), textTransform: 'uppercase', letterSpacing: 3, marginHorizontal: responsiveWidth(2) }}>{`Saved Addresses`}</Text>
                    <View style={{ flex: 1, height: responsiveHeight(.15), backgroundColor: colors.blackOpacity(.05), marginVertical: responsiveHeight(1.4), borderRadius: 100 }} />
                </View> */}
                    <Space height={responsiveHeight(2)} />
                </View>}
                {!loading && query?.length !== 0 && <FlatList
                    data={suggestions}
                    keyExtractor={(item) => item.place_id}
                    keyboardShouldPersistTaps="always"
                    renderItem={({ item, index }) => (
                        <View style={{ width: responsiveWidth(100) }}>
                            <TouchableOpacity onPress={() => _onPressMapView(item)} activeOpacity={.7} style={[{ flexDirection: 'row', alignItems: 'center', padding: responsiveWidth(3) }, index < suggestions.length - 1 && {
                                borderBottomWidth: 1,
                                borderBottomColor: colors.blackOpacity(0.05),
                            },]}>
                                <Space width={responsiveWidth(3)} />
                                <Octicons name={'location'} size={22} color={colors.blackOpacity(.5)} style={{}} />
                                <Space width={responsiveWidth(3)} />
                                <View style={{ width: responsiveWidth(80) }}>
                                    <Text style={{ color: colors.blackOpacity(1), fontWeight: '500', fontSize: responsiveFontSize(1.8) }}>{item?.structured_formatting?.main_text}</Text>
                                    <Text style={{ color: colors.blackOpacity(.5), fontWeight: '400', fontSize: responsiveFontSize(1.6) }}>{item.description}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}
                    style={{ flexGrow: 0, backgroundColor: colors.white, ...shadow, shadowColor: colors.blackOpacity(isAndroid() ? .2 : .1), marginTop: responsiveHeight(2) }}
                />}
            </KeyboardAwareScrollView>
        </View>
    )
}