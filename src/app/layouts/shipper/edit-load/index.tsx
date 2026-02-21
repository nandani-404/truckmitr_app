import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
    ActivityIndicator,
    StatusBar,
    Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import Svg, { Path } from 'react-native-svg';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import axiosInstance from '../../../../utils/config/axiosInstance';
import { END_POINTS } from '../../../../utils/config';
import { STACKS } from '@truckmitr/stacks/stacks';

// --- Icons ---
const BackIcon = () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M19 12H5" />
        <Path d="M12 19l-7-7 7-7" />
    </Svg>
);

const SectionHeader = ({ title, icon }: { title: string; icon: string }) => (
    <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={20} color="#246BFD" style={{ marginRight: 8 }} />
        <Text style={styles.sectionTitle}>{title}</Text>
    </View>
);

const ShipperEditLoad: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const safeAreaInsets = useSafeAreaInsets();
    const { editData } = route.params || {};

    // --- Redux ---
    const materialsFromRedux = useSelector((state: any) => state?.shipper?.materials || []);

    // --- Form State ---
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingInit, setIsLoadingInit] = useState(true);

    // Route Points
    const [originLocation, setOriginLocation] = useState('');
    const [originLat, setOriginLat] = useState('');
    const [originLon, setOriginLon] = useState('');
    const [loadingCityState, setLoadingCityState] = useState('');
    const [exactOriginLocation, setExactOriginLocation] = useState('');

    const [destinationLocation, setDestinationLocation] = useState('');
    const [destinationLat, setDestinationLat] = useState('');
    const [destinationLon, setDestinationLon] = useState('');
    const [unloadingCityState, setUnloadingCityState] = useState('');
    const [exactDestinationLocation, setExactDestinationLocation] = useState('');

    // Load Data
    const [loadQuantity, setLoadQuantity] = useState('');
    const [qtyError, setQtyError] = useState('');
    const [materialType, setMaterialType] = useState('Select Material');
    const [materialId, setMaterialId] = useState<number | null>(null);

    // Truck Data
    const [vehicleBodies, setVehicleBodies] = useState<any[]>([]);
    const [selectedBodyType, setSelectedBodyType] = useState('');
    const [selectedBodyId, setSelectedBodyId] = useState<number | null>(null);
    const [isBodiesLoading, setIsBodiesLoading] = useState(false);

    const [vehicleLengths, setVehicleLengths] = useState<any[]>([]);
    const [selectedVehicleType, setSelectedVehicleType] = useState('');
    const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
    const [isLengthsLoading, setIsLengthsLoading] = useState(false);

    // Schedule & Price
    const [pickupDate, setPickupDate] = useState<Date | null>(null);
    const [loadTime, setLoadTime] = useState<Date | null>(null);
    const [offeredPrice, setOfferedPrice] = useState('');
    const [additionalNote, setAdditionalNote] = useState('');

    // Modals
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [isMaterialVisible, setMaterialVisible] = useState(false);

    // --- Initialization ---
    useEffect(() => {
        if (editData) {
            setOriginLocation(editData.origin_location || '');
            setOriginLat(String(editData.origin_lat || ''));
            setOriginLon(String(editData.origin_lon || ''));
            setLoadingCityState(editData.loading_city_state || '');
            setExactOriginLocation(editData.exact_origin_location || '');

            setDestinationLocation(editData.destination_location || '');
            setDestinationLat(String(editData.destination_lat || ''));
            setDestinationLon(String(editData.destination_lon || ''));
            setUnloadingCityState(editData.unloading_city_state || '');
            setExactDestinationLocation(editData.exact_destination_location || '');

            setLoadQuantity(String(editData.meterial_quantity || ''));
            setMaterialType(
                editData.material?.name ||
                editData.material_name ||
                editData.meterial_name ||
                editData.meterial_type_name ||
                'Select Material'
            );
            setMaterialId(editData.meterial ? parseInt(editData.meterial) : (editData.material_id ? parseInt(editData.material_id) : null));

            setSelectedBodyType(
                editData.vehicle_body?.name ||
                editData.vechicle_body_name ||
                editData.body_type_name ||
                ''
            );
            setSelectedBodyId(editData.vechicle_body ? parseInt(editData.vechicle_body) : null);

            setSelectedVehicleType(
                editData.vehicle_length?.length_label ||
                editData.vechicle_type_name ||
                editData.vehicle_type_name ||
                ''
            );
            setSelectedVehicleId(editData.vechicle_type ? parseInt(editData.vechicle_type) : null);

            if (editData.price) {
                setOfferedPrice(formatPrice(String(editData.price)));
            }
            if (editData.picup_date) {
                setPickupDate(new Date(editData.picup_date));
            }
            if (editData.load_time) {
                setLoadTime(moment(editData.load_time, 'HH:mm').toDate());
            }
            setAdditionalNote(editData.additional_note || '');

            // Fetch dependent data
            if (editData.meterial_quantity) {
                const bodyId = editData.vechicle_body ? parseInt(editData.vechicle_body) : undefined;
                fetchVehicleTypesByQuantity(String(editData.meterial_quantity), bodyId);
            }
            setIsLoadingInit(false);
        }
    }, [editData]);

    // --- API Calls ---
    const fetchVehicleTypesByQuantity = async (quantity: string, initialBodyId?: number) => {
        setIsBodiesLoading(true);
        try {
            const response = await axiosInstance.post(END_POINTS.POST_LOAD_VEHICLE_BODIES, { material_quantity: quantity });
            const bodies = response?.data?.data || (Array.isArray(response?.data) ? response.data : []);
            setVehicleBodies(bodies);

            if (initialBodyId && bodies.find((b: any) => Number(b.id) === Number(initialBodyId))) {
                const lengthId = editData?.vechicle_type ? parseInt(editData.vechicle_type) : undefined;
                fetchVehicleLengths(Number(initialBodyId), quantity, lengthId);
            }
        } catch (error) {
            console.error('Fetch Bodies Error:', error);
        } finally {
            setIsBodiesLoading(false);
        }
    };

    const fetchVehicleLengths = async (bodyId: number, quantity: string, initialLengthId?: number) => {
        setIsLengthsLoading(true);
        try {
            const response = await axiosInstance.post(END_POINTS.POST_LOAD_VEHICLE_LENGTHS, {
                vehicle_body: bodyId,
                material_quantity: quantity
            });
            const lengths = response?.data?.data || (Array.isArray(response?.data) ? response.data : []);
            setVehicleLengths(lengths);
        } catch (error) {
            console.error('Fetch Lengths Error:', error);
        } finally {
            setIsLengthsLoading(false);
        }
    };

    // --- Handlers ---
    const handleQuantityChange = (val: string) => {
        setLoadQuantity(val);
        setSelectedBodyId(null);
        setSelectedBodyType('');
        setVehicleBodies([]);
        setSelectedVehicleId(null);
        setSelectedVehicleType('');
        setVehicleLengths([]);

        if (val) {
            const qty = parseFloat(val);
            if (isNaN(qty)) {
                setQtyError('Invalid number');
            } else if (qty < 2.5 || qty > 45) {
                setQtyError('Quantity should be between 2.5 to 45');
            } else {
                setQtyError('');
            }
        } else {
            setQtyError('');
        }

        if (val && !isNaN(parseFloat(val))) {
            fetchVehicleTypesByQuantity(val);
        }
    };

    const formatPrice = (value: string) => {
        if (!value) return '';
        // Remove commas and then everything after the decimal point
        const number = value.replace(/,/g, '').split('.')[0];
        if (isNaN(Number(number))) return value;
        return Number(number).toLocaleString('en-IN');
    };

    const unformatPrice = (value: string) => {
        return value.replace(/,/g, '');
    };

    const handlePriceChange = (val: string) => {
        const numericValue = unformatPrice(val);
        if (!numericValue || /^\d*$/.test(numericValue)) {
            setOfferedPrice(formatPrice(numericValue));
        }
    };

    const handleBodySelect = (body: any) => {
        setSelectedBodyType(body.name);
        setSelectedBodyId(body.id);
        setSelectedVehicleId(null);
        setSelectedVehicleType('');
        setVehicleLengths([]);
        fetchVehicleLengths(body.id, loadQuantity);
    };

    const handleUpdate = async () => {
        // Simple Validation
        if (!originLat || !destinationLat) {
            Alert.alert("Missing Locations", "Please select loading and unloading points on the map.");
            return;
        }
        if (!loadQuantity || parseFloat(loadQuantity) < 2.5 || parseFloat(loadQuantity) > 45) {
            Alert.alert("Invalid Weight", "Quantity should be between 2.5 to 45");
            return;
        }
        if (!materialId || !selectedBodyId || !selectedVehicleId || !offeredPrice || !pickupDate || !loadTime) {
            Alert.alert("Missing Fields", "Please fill in all required fields.");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                load_id: editData.id,
                origin_location: originLocation,
                origin_lat: originLat,
                origin_lon: originLon,
                loading_city_state: loadingCityState,
                exact_origin_location: exactOriginLocation,
                destination_location: destinationLocation,
                destination_lat: destinationLat,
                destination_lon: destinationLon,
                unloading_city_state: unloadingCityState,
                exact_destination_location: exactDestinationLocation,
                meterial: materialId,
                meterial_quantity: loadQuantity,
                vechicle_body: selectedBodyId,
                vechicle_type: selectedVehicleId,
                price: unformatPrice(offeredPrice),
                picup_date: moment(pickupDate).format('YYYY-MM-DD'),
                load_time: moment(loadTime).format('HH:mm'),
                additional_note: additionalNote,
            };

            const response = await axiosInstance.post(END_POINTS.POST_LOAD_SUBMIT, payload);
            if (response.data.status === 'success') {
                Alert.alert("Success", "Load updated successfully!", [
                    { text: "OK", onPress: () => navigation.goBack() }
                ]);
            } else {
                Alert.alert("Error", response.data.message || "Failed to update load.");
            }
        } catch (error) {
            console.error('Update Error:', error);
            Alert.alert("Error", "An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingInit) {
        return <View style={styles.loaderContainer}><ActivityIndicator size="large" color="#246BFD" /></View>;
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

            <View style={[styles.header, { paddingTop: safeAreaInsets.top ? safeAreaInsets.top + 10 : 20 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
                    <BackIcon />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Load</Text>
                <View style={{ width: 20 }} />
            </View>

            <KeyboardAwareScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.tipBox}>
                    <Ionicons name="information-circle-outline" size={20} color="#0369a1" />
                    <Text style={styles.tipText}>Update any load details below. Submitting will update your active posting.</Text>
                </View>

                {/* --- Route --- */}
                <SectionHeader title="Route Details" icon="location-outline" />

                <Text style={styles.label}>Loading Point</Text>
                <TouchableOpacity
                    style={styles.mapPicker}
                    onPress={() => navigation.navigate(STACKS.MAP_VIEW, {
                        returnScreen: STACKS.SHIPPER_EDIT_LOAD,
                        pointType: 'origin',
                        initialLocation: { latitude: parseFloat(originLat), longitude: parseFloat(originLon), address: originLocation }
                    })}
                >
                    <Text style={[styles.pickerText, !originLocation && { color: '#999' }]} numberOfLines={1}>{originLocation || 'Select on Map'}</Text>
                    <Ionicons name="map-outline" size={20} color="#3b82f6" />
                </TouchableOpacity>
                <TextInput
                    style={styles.input}
                    placeholder="Full Address (Shop No, Street...)"
                    value={exactOriginLocation}
                    onChangeText={setExactOriginLocation}
                />

                <View style={{ height: 16 }} />

                <Text style={styles.label}>Unloading Point</Text>
                <TouchableOpacity
                    style={styles.mapPicker}
                    onPress={() => navigation.navigate(STACKS.MAP_VIEW, {
                        returnScreen: STACKS.SHIPPER_EDIT_LOAD,
                        pointType: 'destination',
                        initialLocation: { latitude: parseFloat(destinationLat), longitude: parseFloat(destinationLon), address: destinationLocation }
                    })}
                >
                    <Text style={[styles.pickerText, !destinationLocation && { color: '#999' }]} numberOfLines={1}>{destinationLocation || 'Select on Map'}</Text>
                    <Ionicons name="map-outline" size={20} color="#3b82f6" />
                </TouchableOpacity>
                <TextInput
                    style={styles.input}
                    placeholder="Full Address (Shop No, Street...)"
                    value={exactDestinationLocation}
                    onChangeText={setExactDestinationLocation}
                />

                <View style={styles.divider} />

                {/* --- Material & Info --- */}
                <SectionHeader title="Material & Quantity" icon="cube-outline" />
                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                        <Text style={styles.label}>Material Type</Text>
                        <TouchableOpacity style={styles.picker} onPress={() => setMaterialVisible(true)}>
                            <Text style={styles.pickerText} numberOfLines={1}>{materialType}</Text>
                            <Ionicons name="chevron-down" size={18} color="#666" />
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Quantity (Tonnes)</Text>
                        <TextInput
                            style={[styles.input, qtyError ? { borderColor: '#ef4444' } : {}]}
                            placeholder="e.g. 15"
                            keyboardType="numeric"
                            value={loadQuantity}
                            onChangeText={handleQuantityChange}
                        />
                        {qtyError ? <Text style={styles.errorText}>{qtyError}</Text> : null}
                    </View>
                </View>

                <View style={styles.divider} />

                {/* --- Truck Details --- */}
                <SectionHeader title="Truck Requirement" icon="bus-outline" />
                <Text style={styles.label}>Select Body Type</Text>
                {isBodiesLoading ? <ActivityIndicator size="small" color="#246BFD" /> : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalChips}>
                        {vehicleBodies.map((body) => (
                            <TouchableOpacity
                                key={body.id}
                                style={[styles.chip, selectedBodyId === body.id && styles.chipSelected]}
                                onPress={() => handleBodySelect(body)}
                            >
                                <Text style={[styles.chipText, selectedBodyId === body.id && styles.chipTextSelected]}>{body.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                <Text style={[styles.label, { marginTop: 12 }]}>Select Vehicle Length</Text>
                {isLengthsLoading ? <ActivityIndicator size="small" color="#246BFD" /> : (
                    <View style={styles.grid}>
                        {vehicleLengths.map((len) => (
                            <TouchableOpacity
                                key={len.id}
                                style={[styles.gridItem, selectedVehicleId === len.id && styles.gridItemSelected]}
                                onPress={() => { setSelectedVehicleId(len.id); setSelectedVehicleType(len.length_label); }}
                            >
                                <Text style={[styles.gridText, selectedVehicleId === len.id && styles.gridTextSelected]}>{len.length_label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <View style={styles.divider} />

                {/* --- Schedule & Price --- */}
                <SectionHeader title="Schedule & Pricing" icon="calendar-outline" />
                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                        <Text style={styles.label}>Pickup Date</Text>
                        <TouchableOpacity style={styles.picker} onPress={() => setShowDatePicker(true)}>
                            <Text style={styles.pickerText}>{pickupDate ? moment(pickupDate).format('DD MMM') : 'Select'}</Text>
                            <Ionicons name="calendar" size={18} color="#666" />
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Pickup Time</Text>
                        <TouchableOpacity style={styles.picker} onPress={() => setShowTimePicker(true)}>
                            <Text style={styles.pickerText}>{loadTime ? moment(loadTime).format('hh:mm A') : 'Select'}</Text>
                            <Ionicons name="time" size={18} color="#666" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ marginTop: 16 }}>
                    <Text style={styles.label}>Offered Price (₹)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 25000"
                        keyboardType="numeric"
                        value={offeredPrice}
                        onChangeText={handlePriceChange}
                    />
                </View>

                <View style={styles.divider} />

                <Text style={styles.label}>Additional Notes (Optional)</Text>
                <TextInput
                    style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                    placeholder="Add special instructions..."
                    multiline
                    value={additionalNote}
                    onChangeText={setAdditionalNote}
                />

                <View style={{ height: 20 }} />
            </KeyboardAwareScrollView>

            <View style={[styles.stickyFooter, { paddingBottom: safeAreaInsets.bottom > 0 ? safeAreaInsets.bottom : 20 }]}>
                <TouchableOpacity
                    style={[styles.fullUpdateBtn, isSubmitting && { opacity: 0.7 }]}
                    onPress={handleUpdate}
                    disabled={isSubmitting}
                >
                    <Text style={styles.fullUpdateBtnText}>{isSubmitting ? 'UPDATING...' : 'UPDATE LOAD'}</Text>
                </TouchableOpacity>
            </View>

            {/* Modals */}
            {showDatePicker && (
                <DateTimePicker
                    value={pickupDate || new Date()}
                    mode="date"
                    minimumDate={new Date()}
                    onChange={(e, d) => { setShowDatePicker(false); if (d) setPickupDate(d); }}
                />
            )}
            {showTimePicker && (
                <DateTimePicker
                    value={loadTime || new Date()}
                    mode="time"
                    onChange={(e, d) => { setShowTimePicker(false); if (d) setLoadTime(d); }}
                />
            )}

            <MaterialCategoryModal
                visible={isMaterialVisible}
                categories={materialsFromRedux}
                onSelect={(item: any) => { setMaterialType(item.name); setMaterialId(item.id); setMaterialVisible(false); }}
                onClose={() => setMaterialVisible(false)}
            />
        </View>
    );
};

// Material Category Modal (Same as PostLoad)
const MaterialCategoryModal = ({ visible, categories, onSelect, onClose }: any) => {
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) return categories;
        return categories.map((cat: any) => ({
            ...cat,
            children: (cat.children || []).filter((item: any) => item.name.toLowerCase().includes(searchQuery.toLowerCase())),
        })).filter((cat: any) => cat.name.toLowerCase().includes(searchQuery.toLowerCase()) || (cat.children && cat.children.length > 0));
    }, [categories, searchQuery]);

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={matStyles.container}>
                <View style={[matStyles.header, { paddingTop: 48 }]}>
                    <TouchableOpacity onPress={onClose}><BackIcon /></TouchableOpacity>
                    <Text style={matStyles.headerTitle}>Select Material</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={matStyles.searchContainer}>
                    <TextInput style={matStyles.searchBox} placeholder="Search materials..." value={searchQuery} onChangeText={setSearchQuery} />
                </View>
                <ScrollView contentContainerStyle={{ padding: 16 }}>
                    {filteredCategories.map((category: any) => (
                        <View key={category.id} style={{ marginBottom: 8 }}>
                            <TouchableOpacity style={matStyles.categoryHeader} onPress={() => setExpandedCategory(expandedCategory === String(category.id) ? null : String(category.id))}>
                                <Text style={matStyles.categoryName}>{category.name}</Text>
                                <Ionicons name={expandedCategory === String(category.id) ? "chevron-up" : "chevron-down"} size={20} color="#666" />
                            </TouchableOpacity>
                            {expandedCategory === String(category.id) && (
                                <View style={{ backgroundColor: '#fff', paddingLeft: 16 }}>
                                    {(category.children || []).map((item: any) => (
                                        <TouchableOpacity key={item.id} style={matStyles.itemRow} onPress={() => onSelect(item)}>
                                            <Text style={matStyles.itemText}>{item.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    ))}
                </ScrollView>
            </View>
        </Modal>
    );
};

const matStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    searchContainer: { padding: 16 },
    searchBox: { backgroundColor: '#f3f4f6', borderRadius: 12, padding: 12, fontSize: 15 },
    categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#f9fafb', borderRadius: 12 },
    categoryName: { fontSize: 15, fontWeight: '600' },
    itemRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
    itemText: { fontSize: 15, color: '#333' },
});

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#F8F9FA', borderBottomWidth: 1, borderBottomColor: '#EEE' },
    navBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    saveBtn: { backgroundColor: '#246BFD', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    scrollContent: { padding: 20, paddingBottom: 60 },
    tipBox: { flexDirection: 'row', backgroundColor: '#e0f2fe', padding: 12, borderRadius: 12, marginBottom: 20, alignItems: 'center' },
    tipText: { flex: 1, fontSize: 13, color: '#0369a1', marginLeft: 8, lineHeight: 18 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 10 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
    label: { fontSize: 14, fontWeight: '600', color: '#4b5563', marginBottom: 8 },
    input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 16, height: 48, fontSize: 15, color: '#1F2937' },
    mapPicker: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 16, height: 48, marginBottom: 8 },
    picker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 16, height: 48 },
    pickerText: { fontSize: 15, color: '#1F2937', flex: 1 },
    row: { flexDirection: 'row' },
    divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 24 },
    horizontalChips: { marginBottom: 16 },
    chip: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#F3F4F6', borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#E5E7EB' },
    chipSelected: { backgroundColor: '#246BFD', borderColor: '#246BFD' },
    chipText: { fontSize: 13, color: '#4B5563', fontWeight: '600' },
    chipTextSelected: { color: '#fff' },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    gridItem: { width: '31%', backgroundColor: '#F3F4F6', paddingVertical: 12, borderRadius: 10, marginRight: '2%', marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
    gridItemSelected: { backgroundColor: '#F0F5FF', borderColor: '#246BFD' },
    gridText: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
    gridTextSelected: { color: '#246BFD' },
    stickyFooter: {
        paddingHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        paddingTop: 12,
    },
    fullUpdateBtn: { backgroundColor: '#111827', height: 54, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    fullUpdateBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 1 },
    errorText: { color: '#ef4444', fontSize: 11, marginTop: 4, fontWeight: '600' },
});

export default ShipperEditLoad;
