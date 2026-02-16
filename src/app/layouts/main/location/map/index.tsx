import { Image, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigatorParams } from '@truckmitr/src/stacks/stacks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import { Space } from '@truckmitr/src/app/components';
import Ionicons from 'react-native-vector-icons/Ionicons'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import { hitSlop, isAndroid } from '@truckmitr/src/app/functions';
import Feather from 'react-native-vector-icons/Feather'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { STACKS } from '@truckmitr/src/stacks/stacks';
import { placeDetails } from '@truckmitr/src/utils/maps/google.apis';
import { currentCoordinates } from '@truckmitr/src/utils/maps/location/coordinates';
import { fetchCompleteLocationDetails } from '@truckmitr/src/utils/maps/location/location.detail';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

interface initialRegionTyoe {
    latitude: number;
    longitude: number;
}

export default function LocationMap() {
    const { params } = useRoute<any>();
    const navigation = useNavigation<NavigatorProp>();
    const safeAreaInsets = useSafeAreaInsets();
    const colors = useColor();
    const { shadow } = useShadow()
    const { responsiveWidth, responsiveFontSize, responsiveHeight } = useResponsiveScale();
    const mapRef = React.useRef<MapView>(null);
    const [isMapReady, setssMapReady] = useState(false);
    const [initialRegion, setinitialRegion] = useState<initialRegionTyoe | null>(null);
    const [formatedAddress, setformatedAddress] = useState<any>({})


    const _placeDetails = async () => {
        const res = await placeDetails(params?.locationData?.place_id, params?.sessionToken);
        if (res?.result?.geometry?.location) {
            setinitialRegion({
                latitude: res.result.geometry.location.lat,
                longitude: res.result.geometry.location.lng,
            });
            const param = {
                latitude: res.result.geometry.location.lat,
                longitude: res.result.geometry.location.lng,
            }
            const completeLocationDetails = await fetchCompleteLocationDetails(param)
            setformatedAddress(completeLocationDetails)
        }
    };

    useEffect(() => {
        if (params?.locationData?.place_id) {
            _placeDetails();
        } else if (params?.initialLocation) {
            setinitialRegion({
                latitude: params.initialLocation.latitude,
                longitude: params.initialLocation.longitude,
            });
            const initLoc = async () => {
                const completeLocationDetails = await fetchCompleteLocationDetails({
                    latitude: params.initialLocation.latitude,
                    longitude: params.initialLocation.longitude,
                })
                if (completeLocationDetails) {
                    setformatedAddress(completeLocationDetails)
                } else {
                    setformatedAddress({
                        name: params.initialLocation.address,
                        displayName: params.initialLocation.address,
                        coords: {
                            latitude: params.initialLocation.latitude,
                            longitude: params.initialLocation.longitude,
                        }
                    });
                }
            }
            initLoc();
        } else {
            _fetchCurrentLocation();
        }
    }, []);

    const _fetchCurrentLocation = async () => {
        try {
            const location = await currentCoordinates() as any
            const coords = {
                latitude: location?.coords?.latitude,
                longitude: location?.coords?.longitude,
            };
            setinitialRegion(coords);

            const currLocationDetail = await fetchCompleteLocationDetails(coords);
            setformatedAddress(currLocationDetail)

            mapRef.current?.animateToRegion({
                latitude: location?.coords?.latitude,
                longitude: location?.coords?.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
            }, 500);
        } catch (error) {
            console.warn('Error fetching current location', error);
        }
    };

    const _movePinLocation = async (value: any) => {
        const param = {
            latitude: value.latitude,
            longitude: value.longitude
        }
        const completeLocationDetails = await fetchCompleteLocationDetails(param)
        setformatedAddress(completeLocationDetails)
    }

    const handleOnMapReady = () => {
        setssMapReady(true);
    };
    return (
        <View style={{ flex: 1, backgroundColor: colors.white, alignItems: 'center' }}>
            <Space height={safeAreaInsets.top} />
            <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', padding: responsiveWidth(3) }}>
                <TouchableOpacity hitSlop={hitSlop(10)} onPress={() => navigation.goBack()} style={{ height: responsiveFontSize(4), width: responsiveFontSize(4), alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, borderRadius: 100, zIndex: 100 }}>
                    <Ionicons name={'chevron-back'} size={24} color={colors.royalBlue} />
                </TouchableOpacity>
                <Text style={{ width: responsiveWidth(100), fontSize: responsiveFontSize(2.2), color: colors.royalBlue, fontWeight: 'bold', textAlign: 'center', position: 'absolute', zIndex: 1 }}>{`Add loading point`}</Text>
            </View>

            <View style={{ flex: 1, width: responsiveWidth(100), alignItems: 'center', justifyContent: 'center' }}>
                {initialRegion && <MapView
                    ref={mapRef}
                    provider={PROVIDER_GOOGLE}
                    style={{ flex: 1, width: responsiveWidth(100) }}
                    mapType={'standard'}
                    userInterfaceStyle='light'
                    showsUserLocation={isMapReady}
                    showsMyLocationButton={!isMapReady}
                    onMapReady={handleOnMapReady}
                    showsCompass={false}
                    zoomControlEnabled={false}
                    toolbarEnabled={false}
                    minZoomLevel={10}
                    maxZoomLevel={25}
                    initialRegion={{
                        ...initialRegion,
                        latitudeDelta: 0.005,
                        longitudeDelta: 0.005
                    }}
                    onRegionChangeComplete={_movePinLocation}
                />}
                <TouchableOpacity
                    onPress={() => navigation.navigate(STACKS.LOCATION_SEARCH, {
                        returnScreen: params?.returnScreen,
                        pointType: params?.pointType
                    })}
                    activeOpacity={0.8}
                    style={{ width: responsiveWidth(92), flexDirection: "row", height: responsiveHeight(5.8), alignItems: 'center', backgroundColor: colors.white, alignSelf: 'center', borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1.4, paddingHorizontal: responsiveWidth(2.5), ...shadow, shadowColor: colors.blackOpacity(isAndroid() ? .2 : .1), position: 'absolute', top: responsiveHeight(1) }}
                >
                    <Feather name={'search'} size={22} color={colors.black} />
                    <Text style={{ color: colors.blackOpacity(.7), marginLeft: responsiveWidth(2.5) }}>{'Search for building, street or area'}</Text>
                </TouchableOpacity>
                <View style={{ alignItems: 'center', position: 'absolute', marginBottom: responsiveHeight(11.5) }}>
                    <View style={{ alignItems: 'center' }}>
                        <View style={{ backgroundColor: colors.black, paddingVertical: responsiveHeight(1), paddingHorizontal: responsiveWidth(4), borderRadius: 8, zIndex: 10 }}>
                            <Text style={{ color: colors.white, fontSize: responsiveFontSize(1.5), fontWeight: '500' }}>{`Move pin to your exact load location`}</Text>
                        </View>
                        <View style={{ height: responsiveHeight(2), width: responsiveHeight(2), backgroundColor: colors.black, transform: [{ rotate: '45deg' }], borderRadius: 2, bottom: responsiveHeight(1.2) }} />
                    </View>
                    <Image
                        source={{ uri: `http://cdn-icons-png.flaticon.com/512/14416/14416547.png` }}
                        style={{ height: responsiveHeight(5), width: responsiveHeight(5), tintColor: colors.roseRed }} />
                </View>
                <TouchableOpacity onPress={_fetchCurrentLocation} activeOpacity={.7} style={{ flexDirection: 'row', backgroundColor: colors.white, borderRadius: 100, borderColor: colors.blackOpacity(.05), borderWidth: 1, paddingVertical: responsiveHeight(.5), paddingHorizontal: responsiveWidth(4), ...shadow, shadowColor: colors.blackOpacity(isAndroid() ? .2 : .1), position: 'absolute', bottom: responsiveHeight(1), }} >
                    <MaterialIcons name={'gps-fixed'} size={20} color={colors.royalBlue} />
                    <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(1.8), fontWeight: '500', marginLeft: responsiveWidth(1) }}>{`Use current location`}</Text>
                </TouchableOpacity>
            </View>

            <View style={{ padding: responsiveWidth(2.5) }}>
                <Space height={responsiveHeight(1)} />
                <View style={{ flexDirection: 'row' }}>
                    <Image source={{ uri: `http://cdn-icons-png.flaticon.com/512/14416/14416547.png` }}
                        style={{ height: responsiveHeight(2.8), width: responsiveHeight(2.8), tintColor: colors.royalBlue }} />
                    <View style={{ marginStart: responsiveWidth(1) }}>
                        <Text numberOfLines={1} style={{ width: responsiveWidth(80), color: colors.blackOpacity(1), fontWeight: '600', fontSize: responsiveFontSize(2) }}>{formatedAddress?.name}</Text>
                        <Text numberOfLines={4} style={{ minHeight: responsiveHeight(5), width: responsiveWidth(80), color: colors.blackOpacity(.5), fontWeight: '400', fontSize: responsiveFontSize(1.8) }}>{formatedAddress?.displayName}</Text>
                    </View>
                </View>
                <Space height={responsiveHeight(1.5)} />
                <TouchableOpacity
                    onPress={() => {
                        console.log('Pinned Location Data (Full):', JSON.stringify(formatedAddress, null, 2));
                        console.log(`[LocationMap] confirm location - City: ${formatedAddress?.city}, State: ${formatedAddress?.state}`);
                        if (params?.onSelect) {
                            params.onSelect(formatedAddress);
                            navigation.goBack();
                        } else {
                            navigation.navigate(STACKS.SHIPPER_BOTTOM_TAB, {
                                screen: STACKS.SHIPPER_POST_LOAD,
                                params: {
                                    selectedLocation: {
                                        pointType: params?.pointType,
                                        description: formatedAddress?.displayName,
                                        lat: String(formatedAddress?.coords?.latitude),
                                        lon: String(formatedAddress?.coords?.longitude),
                                        city: formatedAddress?.city,
                                        state: formatedAddress?.state,
                                    }
                                }
                            });
                        }
                    }}
                    style={{ height: responsiveHeight(5.6), width: responsiveWidth(92), backgroundColor: colors.royalBlue, alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}
                >
                    <Text style={{ color: colors.white, fontSize: responsiveFontSize(1.8), fontWeight: '500' }}>{`Confirm Location`}</Text>
                </TouchableOpacity>
            </View>
            <Space height={safeAreaInsets?.bottom} />
        </View>
    )
}