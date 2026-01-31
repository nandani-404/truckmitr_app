import React, { useState, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Image,
    FlatList,
    Platform,
    StatusBar,
    SafeAreaView
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import { useColor, useShadow } from '@truckmitr/src/app/hooks';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Mock Data
const DHABHA_LOCATION = {
    latitude: 28.6139,
    longitude: 77.2090, // New Delhi example
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
};

const NEARBY_DRIVERS = [
    {
        id: '1',
        name: 'Rajesh Kumar',
        tmId: 'TM7894UPDR52364',
        distance: '2.3 km',
        activeTime: '5 min ago',
        latitude: 28.6200,
        longitude: 77.2100,
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        phone: '+919876543210'
    },
    {
        id: '2',
        name: 'Amit Singh',
        tmId: 'TM8894UPDR52365',
        distance: '3.1 km',
        activeTime: '10 min ago',
        latitude: 28.6000,
        longitude: 77.2200,
        avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
        phone: '+919876543211'
    },
    {
        id: '3',
        name: 'Suresh Yadav',
        tmId: 'TM9894UPDR52366',
        distance: '5.5 km',
        activeTime: 'Active now',
        latitude: 28.6300,
        longitude: 77.1900,
        avatar: 'https://randomuser.me/api/portraits/men/12.jpg',
        phone: '+919876543212'
    },
    {
        id: '4',
        name: 'Vikram Malhotra',
        tmId: 'TM6894UPDR52367',
        distance: '8.2 km',
        activeTime: '1 hour ago',
        latitude: 28.5900,
        longitude: 77.2000,
        avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
        phone: '+919876543213'
    },
    {
        id: '5',
        name: 'Deepak Verma',
        tmId: 'TM5894UPDR52368',
        distance: '9.8 km',
        activeTime: '20 min ago',
        latitude: 28.6400,
        longitude: 77.2300,
        avatar: 'https://randomuser.me/api/portraits/men/50.jpg',
        phone: '+919876543214'
    },
];

const DriverMarker = ({ driver, onPress }: { driver: any, onPress: (e: any) => void }) => {
    const [tracksViewChanges, setTracksViewChanges] = useState(true);

    return (
        <Marker
            coordinate={{ latitude: driver.latitude, longitude: driver.longitude }}
            onPress={onPress}
            tracksViewChanges={tracksViewChanges}
        >
            <View style={styles.truckMarker}>
                <Image
                    source={require('../../../../assets/truck.png')}
                    style={{ width: 40, height: 40, resizeMode: 'contain' }}
                    onLoad={() => {
                        // Slight delay to ensure sharp render before freezing
                        setTimeout(() => setTracksViewChanges(false), 200);
                    }}
                />
            </View>
        </Marker>
    );
};

const DhabhaNearby = () => {
    const navigation = useNavigation();
    const mapRef = useRef<MapView>(null);
    const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
    const [selectedDriver, setSelectedDriver] = useState<any>(null);
    const colors = useColor();
    const { shadow } = useShadow();

    // Toggle Button Component
    const ToggleButton = () => (
        <View style={styles.toggleContainer}>
            <TouchableOpacity
                style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
                onPress={() => setViewMode('map')}
                activeOpacity={0.8}
            >
                <Ionicons name="map" size={16} color={viewMode === 'map' ? '#fff' : '#666'} />
                <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>Map</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
                onPress={() => setViewMode('list')}
                activeOpacity={0.8}
            >
                <Ionicons name="list" size={16} color={viewMode === 'list' ? '#fff' : '#666'} />
                <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>List</Text>
            </TouchableOpacity>
        </View>
    );

    // Render Driver List Item
    const renderDriverItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.driverCard}
            activeOpacity={0.9}
            onPress={() => {
                setSelectedDriver(item);
                if (viewMode === 'map') {
                    mapRef.current?.animateToRegion({
                        latitude: item.latitude,
                        longitude: item.longitude,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                    }, 500);
                }
            }}
        >
            <Image source={{ uri: item.avatar }} style={styles.driverAvatar} />
            <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{item.name}</Text>
                <View style={styles.driverMeta}>
                    <Text style={styles.driverDistance}>
                        <Ionicons name="location-outline" size={12} color="#666" /> {item.distance}
                    </Text>
                    <Text style={styles.driverStatus}>• {item.activeTime}</Text>
                </View>
                <Text style={styles.truckNumber}>{item.tmId}</Text>
            </View>
            <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.iconBtn}>
                    <Ionicons name="call" size={20} color={colors.royalBlue} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn}>
                    <MaterialCommunityIcons name="message-processing" size={20} color={colors.royalBlue} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <SafeAreaView style={{ backgroundColor: '#fff' }}>
                <View style={[styles.header, shadow, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Nearby Drivers (10km)</Text>
                        <Text style={styles.headerSubtitle}>Find TruckMitr drivers near your Dhabha</Text>
                    </View>
                    <TouchableOpacity style={styles.refreshBtn}>
                        <Ionicons name="refresh" size={24} color={colors.royalBlue} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* Content */}
            <View style={styles.content}>

                {viewMode === 'map' ? (
                    <View style={styles.mapContainer}>
                        <MapView
                            ref={mapRef}
                            provider={PROVIDER_GOOGLE}
                            style={styles.map}
                            initialRegion={DHABHA_LOCATION}
                            onPress={() => setSelectedDriver(null)}
                        >
                            {/* Dhabha Location (Center) */}
                            <Marker coordinate={DHABHA_LOCATION}>
                                <View style={styles.myLocationMarker}>
                                    <FontAwesome name="building" size={20} color="#fff" />
                                </View>
                            </Marker>
                            <Circle
                                center={DHABHA_LOCATION}
                                radius={10000} // 10 km
                                strokeColor="rgba(249, 115, 22, 0.5)"
                                fillColor="rgba(249, 115, 22, 0.1)"
                            />

                            {/* Drivers */}
                            {NEARBY_DRIVERS.map((driver) => (
                                <DriverMarker
                                    key={driver.id}
                                    driver={driver}
                                    onPress={(e: any) => {
                                        e.stopPropagation();
                                        setSelectedDriver(driver);
                                    }}
                                />
                            ))}
                        </MapView>

                        {/* Map Mode Toggle Positioned absolute */}
                        <View style={styles.absoluteToggle}>
                            <ToggleButton />
                        </View>

                        {/* Bottom Sheet for Selected Driver */}
                        {selectedDriver && (
                            <View style={[styles.bottomSheet, shadow]}>
                                <View style={styles.closeSheetBar} />
                                <View style={styles.sheetHeader}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Image source={{ uri: selectedDriver.avatar }} style={styles.sheetAvatar} />
                                        <View style={{ marginLeft: 12 }}>
                                            <Text style={styles.sheetName}>{selectedDriver.name}</Text>
                                            <Text style={styles.sheetTruck}>{selectedDriver.tmId}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.sheetDistanceBadge}>
                                        <Text style={styles.sheetDistanceText}>{selectedDriver.distance}</Text>
                                    </View>
                                </View>

                                <View style={styles.sheetActions}>
                                    <TouchableOpacity style={[styles.sheetBtn, { backgroundColor: '#F0F9FF' }]}>
                                        <Ionicons name="chatbubble-ellipses" size={20} color={colors.royalBlue} />
                                        <Text style={[styles.sheetBtnText, { color: colors.royalBlue }]}>Message</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.sheetBtn, { backgroundColor: colors.royalBlue }]}>
                                        <Ionicons name="call" size={20} color="#fff" />
                                        <Text style={[styles.sheetBtnText, { color: '#fff' }]}>Call Driver</Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    style={styles.closeBtn}
                                    onPress={() => setSelectedDriver(null)}
                                >
                                    <Ionicons name="close" size={20} color="#999" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={styles.listContainer}>
                        <View style={styles.listHeader}>
                            <ToggleButton />
                            <Text style={styles.listCount}>{NEARBY_DRIVERS.length} Drivers Found</Text>
                        </View>
                        <FlatList
                            data={NEARBY_DRIVERS}
                            keyExtractor={item => item.id}
                            renderItem={renderDriverItem}
                            contentContainerStyle={{ padding: 16, paddingTop: 4 }}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#fff',
        zIndex: 10,
    },
    backBtn: {
        padding: 4,
    },
    headerTitleContainer: {
        flex: 1,
        marginLeft: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#6B7280',
    },
    refreshBtn: {
        padding: 8,
    },
    content: {
        flex: 1,
    },
    // Toggle Styles
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 25,
        padding: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    toggleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    toggleBtnActive: {
        backgroundColor: '#1E3A5F', // Royal Blue
    },
    toggleText: {
        marginLeft: 6,
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    toggleTextActive: {
        color: '#fff',
    },

    // Map Styles
    mapContainer: {
        flex: 1,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    absoluteToggle: {
        position: 'absolute',
        top: 16,
        alignSelf: 'center',
        zIndex: 10,
    },
    myLocationMarker: {
        backgroundColor: '#EA580C',
        padding: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#fff',
    },
    truckMarker: {
        backgroundColor: '#fff',
        padding: 4,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#1E3A5F', // Royal Blue
        width: 52,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Bottom Sheet
    bottomSheet: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    closeSheetBar: {
        width: 40,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    sheetAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f0f0f0',
    },
    sheetName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    sheetTruck: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    sheetDistanceBadge: {
        backgroundColor: '#ECFDF5',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D1FAE5',
    },
    sheetDistanceText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#059669',
    },
    sheetActions: {
        flexDirection: 'row',
        gap: 12,
    },
    sheetBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
    },
    sheetBtnText: {
        marginLeft: 8,
        fontWeight: '600',
        fontSize: 14,
    },
    closeBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        padding: 4,
    },

    // List Styles
    listContainer: {
        flex: 1,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    listCount: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
    },
    driverCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    driverAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f0f0f0',
    },
    driverInfo: {
        flex: 1,
        marginLeft: 12,
    },
    driverName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    driverMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    driverDistance: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    driverStatus: {
        fontSize: 12,
        color: '#059669', // Green
        marginLeft: 4,
    },
    truckNumber: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    iconBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F0F9FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default DhabhaNearby;
