import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Image,
    ActivityIndicator,
    StatusBar,
    Keyboard
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import axiosInstance from '@truckmitr/utils/config/axiosInstance';
import { END_POINTS, BASE_URL } from '@truckmitr/src/utils/config';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import debounce from 'lodash.debounce';
import { STACKS } from '@truckmitr/stacks/stacks';

// Truck Images
const TruckImages = {
    cargoOpen: require('@truckmitr/src/assets/trucks/open_cargo.png'),
    cargoClosed: require('@truckmitr/src/assets/trucks/close_cargo.png'),
    tipper: require('@truckmitr/src/assets/trucks/tripper.png'),
    trailer: require('@truckmitr/src/assets/trucks/tailer.png'),
    tanker: require('@truckmitr/src/assets/trucks/tainkers.png'),
    carCarrier: require('@truckmitr/src/assets/trucks/car_carrier.png'),
    container: require('@truckmitr/src/assets/trucks/container.png'),
    reefer: require('@truckmitr/src/assets/trucks/refregerator.png'),
    pickUp: require('@truckmitr/src/assets/trucks/pickup_truck.png'),
};

const dummyVehicleTypes = [
    { label: 'Cargo Truck (Open)', value: '3', image: TruckImages.cargoOpen },
    { label: 'Cargo Truck (Closed)', value: '4', image: TruckImages.cargoClosed },
    { label: 'Tipper Trucks', value: '11', image: TruckImages.tipper },
    { label: 'Trailer / Semi-Trailer Trucks', value: '22', image: TruckImages.trailer },
    { label: 'Tankers', value: '10', image: TruckImages.tanker },
    { label: 'Car Carriers', value: '9', image: TruckImages.carCarrier },
    { label: 'Container Trucks', value: '1', image: TruckImages.container },
    { label: 'Refrigerator (Reefer) Trucks', value: '8', image: TruckImages.reefer },
];

const ForemanSearchScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const colors = useColor();
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const { shadow } = useShadow();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        // Focus input on mount
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
    }, []);

    const searchDrivers = async (query: string) => {
        if (!query.trim()) {
            setResults([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setHasSearched(true);
        try {
            const response = await axiosInstance.get(END_POINTS.FOREMAN_SEARCH_DRIVERS(query));
            if (response.data && response.data.success) {
                setResults(response.data.drivers || []);
            } else {
                setResults([]);
            }
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    // Debounce search to avoid too many API calls
    const debouncedSearch = useCallback(
        debounce((text: string) => {
            searchDrivers(text);
        }, 500),
        []
    );

    const handleSearchChange = (text: string) => {
        setSearchQuery(text);
        if (text.length > 0) {
            debouncedSearch(text);
        } else {
            setResults([]);
            setHasSearched(false);
            setLoading(false);
        }
    };

    const getVehicleLabel = (vehicleTypeStr: string | null | undefined) => {
        if (!vehicleTypeStr) return 'Vehicle type not available';
        try {
            // vehicle_type comes as a stringified array based on user's input: "[\"3\",\"1\"]"
            const types = JSON.parse(vehicleTypeStr);
            if (Array.isArray(types) && types.length > 0) {
                // Find first matching type
                const matched = dummyVehicleTypes.find(v => v.value === types[0]);
                return matched ? matched.label : 'Vehicle type not available';
            }
            return 'Vehicle type not available';
        } catch (e) {
            return 'Vehicle type not available';
        }
    };

    const getVehicleImage = (vehicleTypeStr: string | null | undefined) => {
        if (!vehicleTypeStr) return TruckImages.cargoOpen;
        try {
            const types = JSON.parse(vehicleTypeStr);
            if (Array.isArray(types) && types.length > 0) {
                const matched = dummyVehicleTypes.find(v => v.value === types[0]);
                return matched ? matched.image : TruckImages.cargoOpen;
            }
            return TruckImages.cargoOpen;
        } catch (e) {
            return TruckImages.cargoOpen;
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        return (
            <TouchableOpacity
                style={[styles.resultItem, shadow]}
                onPress={() => {
                    if (item.driver_id) {
                        navigation.navigate(STACKS.FOREMAN_DRIVER_DETAILS as any, {
                            driver: {
                                id: item.driver_id,
                                name: item.name,
                                tmId: item.unique_id,
                                mobile: item.mobile,
                                image: item.images,
                                state: item.state_name,
                                // status: 'Unknown',
                                isNew: false,
                                addedDate: '',
                                completion: 0
                            }
                        });
                    }
                }}
            >
                <View style={styles.driverImageContainer}>
                    <Image
                        source={{ uri: item.images ? `${BASE_URL}public/${item.images}` : 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png' }}
                        style={styles.driverImage}
                        defaultSource={require('@truckmitr/src/assets/profile_icon.png')}
                    />
                </View>
                <View style={styles.driverInfo}>
                    <Text style={styles.driverName}>{item.name || 'Unknown Driver'}</Text>
                    <Text style={styles.driverId}>{item.unique_id || 'No ID'}</Text>
                    <View style={styles.detailsRow}>
                        <Ionicons name="call-outline" size={14} color="#666" />
                        <Text style={styles.detailText}>{item.mobile}</Text>
                    </View>
                    <View style={styles.detailsRow}>
                        <Ionicons name="location-outline" size={14} color="#666" />
                        <Text style={styles.detailText}>{item.state_name || 'Unknown Location'}</Text>
                    </View>
                    <View style={styles.vehicleRow}>
                        <Image source={getVehicleImage(item.vehicle_type)} style={{ width: 20, height: 20, resizeMode: 'contain', marginRight: 5 }} />
                        <Text style={styles.vehicleText}>{getVehicleLabel(item.vehicle_type)}</Text>
                    </View>
                </View>
                <Feather name="chevron-right" size={20} color="#ccc" />
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header / Search Bar Area */}
            <View style={styles.header}>
                <View style={[styles.searchContainer, { flex: 1, paddingHorizontal: 16 }]}>
                    <Feather name="search" size={20} color="#999" style={styles.searchIcon} />
                    <TextInput
                        ref={inputRef}
                        style={styles.searchInput}
                        placeholder={t('searchPhoneTmidName') || "Search by Name, Mobile or TMID"}
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={handleSearchChange}
                        returnKeyType="search"
                        autoCapitalize="none"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => handleSearchChange('')}>
                            <Ionicons name="close-circle" size={18} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Results or Empty State */}
            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary || '#6E7CF5'} />
                </View>
            ) : (
                <FlatList
                    data={results}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.driver_id?.toString() || Math.random().toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        hasSearched && searchQuery.length > 0 ? (
                            <View style={styles.centerContainer}>
                                <Image
                                    source={require('@truckmitr/src/assets/pending_profile.png')}
                                    style={{ width: 150, height: 150, opacity: 0.5 }}
                                    resizeMode="contain"
                                />
                                <Text style={styles.emptyText}>{t('noDriversFound') || "No drivers found"}</Text>
                            </View>
                        ) : null
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 16, // Added padding to push down from status bar/top
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f1f1',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 44,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        height: '100%',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    driverImageContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        overflow: 'hidden',
        marginRight: 12,
        backgroundColor: '#eee',
    },
    driverImage: {
        width: '100%',
        height: '100%',
    },
    driverInfo: {
        flex: 1,
    },
    driverName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginBottom: 2,
    },
    driverId: {
        fontSize: 12,
        color: '#6E7CF5',
        fontWeight: '600',
        marginBottom: 4,
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    detailText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
    vehicleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    vehicleText: {
        fontSize: 12,
        color: '#333',
        fontWeight: '500',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 50,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#999',
    }
});

export default ForemanSearchScreen;
