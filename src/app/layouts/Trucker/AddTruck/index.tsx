import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, StatusBar, Platform, Modal, Alert,
    KeyboardAvoidingView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Polyline } from 'react-native-svg';
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import axiosInstance from 'src/utils/config/axiosInstance';
import { END_POINTS } from 'src/utils/config';
import Toast from 'react-native-simple-toast';

// ─────────────────────────────────────────────
// Design Tokens
// ─────────────────────────────────────────────
const C = {
    bg: '#FFFFFF',
    surface: '#FFFFFF',
    border: '#E5E7EB',
    borderFocus: '#2C5282',
    inputBg: '#F9FAFB',
    text: '#1C1C1E',
    textSec: '#6B7280',
    textMuted: '#9CA3AF',
    accent: '#2C5282',
    accentLight: '#EBF0F7',
    success: '#059669',
    successLight: '#ECFDF5',
    danger: '#DC2626',
    white: '#FFFFFF',
};

// ─────────────────────────────────────────────
// Icons (minimal line-art, 1.5px stroke)
// ─────────────────────────────────────────────
const ArrowLeftIcon = () => (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M19 12H5" /><Polyline points="12 19 5 12 12 5" />
    </Svg>
);
const ChevronDownIcon = () => (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <Polyline points="6 9 12 15 18 9" />
    </Svg>
);
const CalendarIcon = () => (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <Rect x="3" y="4" width="18" height="18" rx="2" /><Path d="M16 2v4M8 2v4M3 10h18" />
    </Svg>
);
const CheckIcon = () => (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <Polyline points="20 6 9 17 4 12" />
    </Svg>
);
const UploadIcon = () => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><Polyline points="17 8 12 3 7 8" /><Path d="M12 3v12" />
    </Svg>
);
const CameraIcon = () => (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><Circle cx="12" cy="13" r="4" />
    </Svg>
);
const GalleryIcon = () => (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <Rect x="3" y="3" width="18" height="18" rx="2" /><Circle cx="8.5" cy="8.5" r="1.5" /><Path d="M21 15l-5-5L5 21" />
    </Svg>
);
const SearchIcon = () => (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Circle cx="11" cy="11" r="8" /><Path d="M21 21l-4.35-4.35" />
    </Svg>
);

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface AddTruckScreenProps {
    onBack: () => void;
    onSaveSuccess: () => void;
}

// ─────────────────────────────────────────────
// Reusable Form Field Components
// ─────────────────────────────────────────────

/** Simple text input field */
const FormInput = ({
    label, value, onChangeText, placeholder, required, editable = true,
    keyboardType = 'default', autoCapitalize = 'none', multiline = false,
}: {
    label: string; value: string; onChangeText: (t: string) => void;
    placeholder?: string; required?: boolean; editable?: boolean;
    keyboardType?: any; autoCapitalize?: any; multiline?: boolean;
}) => (
    <View style={formStyles.fieldContainer}>
        <Text style={formStyles.label}>
            {label}{required && <Text style={formStyles.required}> *</Text>}
        </Text>
        <TextInput
            style={[
                formStyles.input,
                !editable && formStyles.inputDisabled,
                multiline && { height: 80, textAlignVertical: 'top' },
            ]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder || label}
            placeholderTextColor={C.textMuted}
            editable={editable}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            multiline={multiline}
        />
    </View>
);

/** Date picker field */
const FormDateField = ({
    label, value, onChange, placeholder, required,
}: {
    label: string; value: string; onChange: (date: string) => void;
    placeholder?: string; required?: boolean;
}) => {
    const [showPicker, setShowPicker] = useState(false);

    const handleDateChange = (_event: any, selectedDate?: Date) => {
        setShowPicker(Platform.OS === 'ios');
        if (selectedDate) {
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const year = selectedDate.getFullYear();
            onChange(`${day}-${month}-${year}`);
        }
    };

    return (
        <View style={formStyles.fieldContainer}>
            <Text style={formStyles.label}>
                {label}{required && <Text style={formStyles.required}> *</Text>}
            </Text>
            <TouchableOpacity style={formStyles.input} onPress={() => setShowPicker(true)} activeOpacity={0.7}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[formStyles.inputText, !value && { color: C.textMuted }]}>
                        {value || placeholder || 'dd-mm-yyyy'}
                    </Text>
                    <CalendarIcon />
                </View>
            </TouchableOpacity>
            {showPicker && (
                <DateTimePicker
                    value={value ? new Date(value.split('-').reverse().join('-')) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                />
            )}
        </View>
    );
};

/** Dropdown/Select field */
const FormSelect = ({
    label, value, options, onSelect, placeholder, required,
}: {
    label: string; value: string; options: string[];
    onSelect: (v: string) => void; placeholder?: string; required?: boolean;
}) => {
    const [showModal, setShowModal] = useState(false);
    return (
        <View style={formStyles.fieldContainer}>
            <Text style={formStyles.label}>
                {label}{required && <Text style={formStyles.required}> *</Text>}
            </Text>
            <TouchableOpacity style={formStyles.input} onPress={() => setShowModal(true)} activeOpacity={0.7}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[formStyles.inputText, !value && { color: C.textMuted }]}>
                        {value || placeholder || `Select ${label}`}
                    </Text>
                    <ChevronDownIcon />
                </View>
            </TouchableOpacity>

            <Modal visible={showModal} transparent animationType="fade">
                <TouchableOpacity
                    style={modalStyles.overlay}
                    activeOpacity={1}
                    onPress={() => setShowModal(false)}
                >
                    <View style={modalStyles.content}>
                        <Text style={modalStyles.title}>{label}</Text>
                        <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                            {options.map((opt) => (
                                <TouchableOpacity
                                    key={opt}
                                    style={modalStyles.option}
                                    onPress={() => { onSelect(opt); setShowModal(false); }}
                                >
                                    <Text style={[
                                        modalStyles.optionText,
                                        value === opt && { color: C.accent, fontWeight: '600' },
                                    ]}>
                                        {opt}
                                    </Text>
                                    {value === opt && <CheckIcon />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

// ─────────────────────────────────────────────
// Section Header
// ─────────────────────────────────────────────
const SectionHeader = ({ title, number }: { title: string; number: number }) => (
    <View style={sectionStyles.header}>
        <View style={sectionStyles.numberBadge}>
            <Text style={sectionStyles.numberText}>{number}</Text>
        </View>
        <Text style={sectionStyles.title}>{title}</Text>
    </View>
);

// ─────────────────────────────────────────────
// Row layout helper (2 or 3 cols)
// ─────────────────────────────────────────────
const FormRow = ({ children }: { children: React.ReactNode }) => (
    <View style={{ flexDirection: 'row', gap: 12 }}>
        {children}
    </View>
);

const FormCol = ({ flex = 1, children }: { flex?: number; children: React.ReactNode }) => (
    <View style={{ flex }}>
        {children}
    </View>
);

// ─────────────────────────────────────────────
// Document Upload Card
// ─────────────────────────────────────────────
const DocumentCard = ({ title, isUploaded, onUpload }: {
    title: string; isUploaded: boolean; onUpload: () => void;
}) => (
    <View style={docStyles.card}>
        <View style={{ flex: 1 }}>
            <Text style={docStyles.title}>{title}</Text>
            <View style={[docStyles.badge, isUploaded ? docStyles.badgeSuccess : docStyles.badgePending]}>
                <Text style={[docStyles.badgeText, isUploaded ? { color: C.success } : { color: C.textMuted }]}>
                    {isUploaded ? '✓ Uploaded' : 'Pending'}
                </Text>
            </View>
        </View>
        <TouchableOpacity style={docStyles.uploadBtn} onPress={onUpload} activeOpacity={0.7}>
            {isUploaded ? <CheckIcon /> : <UploadIcon />}
            <Text style={[docStyles.uploadText, isUploaded && { color: C.success }]}>
                {isUploaded ? 'Change' : 'Upload'}
            </Text>
        </TouchableOpacity>
    </View>
);

// ═══════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════
const AddTruckScreen: React.FC<AddTruckScreenProps> = ({ onBack, onSaveSuccess }) => {

    // ── 1. Basic Information ──
    const [vehicleBody, setVehicleBody] = useState('');
    const [vehicleType, setVehicleType] = useState('');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isVerified, setIsVerified] = useState(false);

    // Options from API
    const [vehicleBodies, setVehicleBodies] = useState<{ id: string; name: string }[]>([]);
    const [vehicleTypes, setVehicleTypes] = useState<{ id: string; length_label: string }[]>([]);

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [bodyRes, typeRes] = await Promise.all([
                    axiosInstance.get(END_POINTS.TRUCKER_VEHICLE_BODY_LIST),
                    axiosInstance.get(END_POINTS.TRUCKER_VEHICLE_TYPE_LIST),
                ]);

                if (bodyRes?.data?.status === 'success') {
                    setVehicleBodies(bodyRes.data.data);
                }
                if (typeRes?.data?.status === 'success') {
                    setVehicleTypes(typeRes.data.data);
                }
            } catch (error) {
                console.error('Error fetching vehicle options:', error);
            }
        };
        fetchOptions();
    }, []);

    // ── 2. Owner Information ──
    const [ownerName, setOwnerName] = useState('');
    const [fatherName, setFatherName] = useState('');
    const [permanentAddress, setPermanentAddress] = useState('');

    // ── 3. Registration Details ──
    const [registrationDate, setRegistrationDate] = useState('');
    const [vehicleCategory, setVehicleCategory] = useState('');
    const [vehicleClass, setVehicleClass] = useState('');
    const [rtoName, setRtoName] = useState('');

    // ── 4. Vehicle Specifications ──
    const [manufacturer, setManufacturer] = useState('');
    const [model, setModel] = useState('');
    const [fuelType, setFuelType] = useState('');
    const [engineNumber, setEngineNumber] = useState('');
    const [chassisNumber, setChassisNumber] = useState('');
    const [color, setColor] = useState('');
    const [seatingCapacity, setSeatingCapacity] = useState('');
    const [standingCapacity, setStandingCapacity] = useState('');
    const [cubicCapacity, setCubicCapacity] = useState('');
    const [grossVehicleWeight, setGrossVehicleWeight] = useState('');
    const [unladenWeight, setUnladenWeight] = useState('');
    const [bodyType, setBodyType] = useState('');

    // ── 5. Location Information ──
    const [locationState, setLocationState] = useState('');
    const [locationDistrict, setLocationDistrict] = useState('');

    // ── 6. Validity & Insurance ──
    const [fitnessValidUpto, setFitnessValidUpto] = useState('');
    const [insuranceCompany, setInsuranceCompany] = useState('');
    const [insurancePolicyNumber, setInsurancePolicyNumber] = useState('');
    const [insuranceValidity, setInsuranceValidity] = useState('');
    const [pollutionValidUpto, setPollutionValidUpto] = useState('');
    const [roadTaxPaidUpto, setRoadTaxPaidUpto] = useState('');

    // ── 7. Permit Information ──
    const [nationalPermitNumber, setNationalPermitNumber] = useState('');
    const [nationalPermitValidity, setNationalPermitValidity] = useState('');
    const [statePermitNumber, setStatePermitNumber] = useState('');
    const [statePermitValidity, setStatePermitValidity] = useState('');

    // ── 8. Additional Information ──
    const [hypothecation, setHypothecation] = useState('');
    const [nocDetails, setNocDetails] = useState('');
    const [blacklistStatus, setBlacklistStatus] = useState('');
    const [taxStatus, setTaxStatus] = useState('');
    const [rcStatus, setRcStatus] = useState('');
    const [smartCardIssued, setSmartCardIssued] = useState('');
    const [registrationValidUpto, setRegistrationValidUpto] = useState('');
    const [previousRegNumber, setPreviousRegNumber] = useState('');
    const [makerModelDesc, setMakerModelDesc] = useState('');

    // ── Documents ──
    const [rcDoc, setRcDoc] = useState<{ uri: string } | null>(null);
    const [insuranceDoc, setInsuranceDoc] = useState<{ uri: string } | null>(null);
    const [permitDoc, setPermitDoc] = useState<{ uri: string } | null>(null);

    // ── UI State ──
    const [isSaving, setIsSaving] = useState(false);
    const [uploadModalVisible, setUploadModalVisible] = useState(false);
    const [currentDocType, setCurrentDocType] = useState<'rc' | 'insurance' | 'permit' | null>(null);

    const scrollRef = useRef<ScrollView>(null);

    // ── Helper: format date from yyyy-mm-dd to dd-mm-yyyy ──
    const formatDate = (dateStr: string | null | undefined): string => {
        if (!dateStr) return '';
        // Handle yyyy-mm-dd format
        const parts = dateStr.split('-');
        if (parts.length === 3 && parts[0].length === 4) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return dateStr;
    };

    const safe = (val: any): string => (val != null ? String(val) : '');

    const isDocumentValidStr = (dateStr: string | null | undefined): boolean => {
        if (!dateStr || dateStr === 'N/A') return false;
        const parts = dateStr.split('-');
        if (parts.length !== 3) return false;
        const year = parts[2].length === 4 ? Number(parts[2]) : Number(parts[0]);
        const month = parts[2].length === 4 ? Number(parts[1]) : Number(parts[1]);
        const day = parts[2].length === 4 ? Number(parts[0]) : Number(parts[2]);
        if (isNaN(year) || isNaN(month) || isNaN(day)) return false;
        const dobj = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diff = Math.ceil((dobj.getTime() - today.getTime()) / (1000 * 3600 * 24));
        return diff >= 5;
    };

    const formatDisplayDate = (dateStr: string) => {
        if (!dateStr || dateStr === 'N/A') return 'N/A';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const day = parts[0].padStart(2, '0');
            const month = months[Number(parts[1]) - 1];
            const year = parts[2];
            if (month) return `${day}-${month}-${year}`;
        }
        return dateStr;
    };

    const getVehicleAge = (regDate: string) => {
        if (!regDate) return 'N/A';
        const parts = regDate.split('-');
        if (parts.length !== 3) return 'N/A';
        const dobj = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        const now = new Date();
        let years = now.getFullYear() - dobj.getFullYear();
        let months = now.getMonth() - dobj.getMonth();
        if (months < 0) {
            years--;
            months += 12;
        }
        return `${years} Years & ${months} months`;
    };

    const StatusRow = ({ label, value, valueColor }: { label: string, value: string, valueColor?: string }) => (
        <View style={rcStyles.row}>
            <Text style={rcStyles.label}>{label}</Text>
            <Text style={[rcStyles.value, valueColor && { color: valueColor }]}>{value || 'N/A'}</Text>
        </View>
    );

    const RcSummaryCard = () => (
        <View style={rcStyles.card}>
            <StatusRow label="Vehicle Number" value={vehicleNumber} />
            <StatusRow label="Owner Name" value={ownerName} />
            <StatusRow label="Registering Authority" value={rtoName} />
            <StatusRow label="Vehicle Class" value={vehicleClass} />
            <StatusRow label="Fuel Type" value={fuelType} />
            <StatusRow label="Emission Norm" value={"BHARAT STAGE VI"} />
            <StatusRow label="Vehicle Age" value={getVehicleAge(registrationDate)} />
            <StatusRow label="Hypothecated" value={hypothecation && hypothecation !== 'Not Financed' ? 'Yes' : 'No'} />
            <StatusRow label="Vehicle Status" value={rcStatus || 'ACTIVE'} valueColor={C.success} />



            <View style={rcStyles.divider} />

            <StatusRow label="Registration Date" value={formatDisplayDate(registrationDate)} />
            <StatusRow label="Fitness Valid UpTo" value={formatDisplayDate(fitnessValidUpto)} />
            <StatusRow label="Tax Valid UpTo" value={formatDisplayDate(roadTaxPaidUpto)} />
            <StatusRow label="Insurance Valid UpTo" value={formatDisplayDate(insuranceValidity)} valueColor={!isDocumentValidStr(insuranceValidity) ? C.danger : undefined} />
            <StatusRow label="PUCC Valid Upto" value={formatDisplayDate(pollutionValidUpto)} valueColor={!isDocumentValidStr(pollutionValidUpto) ? C.danger : undefined} />
            <StatusRow label="State Permit Valid UpTo" value={formatDisplayDate(statePermitValidity)} valueColor={!isDocumentValidStr(statePermitValidity) ? C.danger : undefined} />
            <StatusRow label="National Permit Valid UpTo" value={formatDisplayDate(nationalPermitValidity)} valueColor={!isDocumentValidStr(nationalPermitValidity) ? C.danger : undefined} />


        </View>
    );

    // ── Verify RC handler (Real API) ──
    const handleVerifyRC = async () => {
        if (vehicleNumber.length < 5) {
            Alert.alert('Invalid', 'Please enter a valid vehicle number.');
            return;
        }
        setIsVerifying(true);
        try {
            const response = await axiosInstance.post(END_POINTS.TRUCKER_VERIFY_RC, {
                rc_number: vehicleNumber.replace(/\s/g, ''),
            });

            const data = response?.data;

            if (data?.status === 'success' && data?.details) {
                const d = data.details;

                // 2. Owner Information
                setOwnerName(safe(d.owner_name));
                setFatherName(safe(d.father_name));
                setPermanentAddress(safe(d.permanent_address));

                // 3. Registration Details
                setRegistrationDate(formatDate(d.registration_date));
                setVehicleCategory(safe(d.vehicle_category));
                setVehicleClass(safe(d.vehicle_class));
                setRtoName(safe(d.registered_place));

                // 4. Vehicle Specifications
                setManufacturer(safe(d.manufacturer));
                setModel(safe(d.manufacturer_model));
                setFuelType(safe(d.fuel_type));
                setEngineNumber(safe(d.engine_number));
                setChassisNumber(safe(d.chassis_number));
                setColor(safe(d.colour));
                setSeatingCapacity(safe(d.seating_capacity));
                setStandingCapacity(safe(d.standing_capacity));
                setCubicCapacity(safe(d.cubic_capacity));
                setGrossVehicleWeight(safe(d.gross_vehicle_weight));
                setUnladenWeight(safe(d.unladden_weight));
                setBodyType(safe(d.body_type));

                // 5. Location Information
                setLocationState(safe(d.state));
                setLocationDistrict(safe(d.registered_place));

                // 6. Validity & Insurance
                setFitnessValidUpto(formatDate(d.fitness_upto));
                setInsuranceCompany(safe(d.insurance_name));
                setInsurancePolicyNumber(safe(d.insurance_policy_no));
                setInsuranceValidity(formatDate(d.insurance_validity));
                setPollutionValidUpto(formatDate(d.puc_valid_upto));
                setRoadTaxPaidUpto(formatDate(d.mv_tax_upto));

                // 7. Permit Information — map based on permit_type
                const isNationalPermit = d.permit_type?.toUpperCase()?.includes('NATIONAL');
                if (isNationalPermit) {
                    setNationalPermitNumber(safe(d.permit_no || d.npermit_no));
                    setNationalPermitValidity(formatDate(d.permit_validity_upto || d.npermit_upto));
                    setStatePermitNumber('');
                    setStatePermitValidity('');
                } else {
                    setNationalPermitNumber(safe(d.npermit_no));
                    setNationalPermitValidity(formatDate(d.npermit_upto));
                    setStatePermitNumber(safe(d.permit_no));
                    setStatePermitValidity(formatDate(d.permit_validity_upto));
                }

                // 8. Additional Information
                setHypothecation(d.is_financed ? safe(d.financer) : 'Not Financed');
                setNocDetails(safe(d.noc_details));
                setBlacklistStatus(safe(d.blacklist_status));
                setTaxStatus(d.mv_tax_upto ? 'Paid' : 'N/A');
                setRcStatus(safe(d.status_verification));
                setSmartCardIssued('');
                setRegistrationValidUpto(formatDate(d.fitness_upto));
                setPreviousRegNumber('');
                setMakerModelDesc(safe(d.manufacturer_model));

                setIsVerified(true);

                const _puc = formatDate(d.puc_valid_upto);
                const _ins = formatDate(d.insurance_validity);
                const _perm = isNationalPermit
                    ? formatDate(d.permit_validity_upto || d.npermit_upto)
                    : formatDate(d.permit_validity_upto);

                const pucValid = isDocumentValidStr(_puc);
                const insValid = isDocumentValidStr(_ins);
                const permValid = isDocumentValidStr(_perm);

                if (!pucValid || !insValid || !permValid) {
                    Alert.alert(
                        'Document Expiry Warning',
                        'One or more documents (PUC, Insurance, Permit) are expired or expiring within 5 days.'
                    );
                } else {
                    Alert.alert('RC Verified', 'Vehicle details have been fetched successfully.');
                }
            } else {
                Alert.alert('Verification Failed', data?.message || 'Could not verify RC. Please check the number and try again.');
            }
        } catch (error: any) {
            console.error('RC Verify Error:', error);
            Alert.alert('Error', 'Something went wrong while verifying RC. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    // ── Document Upload ──
    const openUploadModal = (type: 'rc' | 'insurance' | 'permit') => {
        setCurrentDocType(type);
        setUploadModalVisible(true);
    };

    const handleCameraLaunch = () => {
        launchCamera({ mediaType: 'photo', quality: 0.7 }, handleImageResponse);
    };

    const handleGalleryLaunch = () => {
        launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, handleImageResponse);
    };

    const handleImageResponse = (response: ImagePickerResponse) => {
        setUploadModalVisible(false);
        if (response.didCancel || response.errorCode || !response.assets?.[0]?.uri) return;
        const uri = response.assets[0].uri;
        if (currentDocType === 'rc') setRcDoc({ uri });
        if (currentDocType === 'insurance') setInsuranceDoc({ uri });
        if (currentDocType === 'permit') setPermitDoc({ uri });
    };

    // ── Helper: convert dd-mm-yyyy back to yyyy-mm-dd for API ──
    const toApiDate = (dateStr: string): string | null => {
        if (!dateStr) return null;
        const parts = dateStr.split('-');
        if (parts.length === 3 && parts[2].length === 4) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        // Already yyyy-mm-dd or other format
        return dateStr;
    };

    const emptyToNull = (val: string): string | null => (val.trim() ? val.trim() : null);

    const resetForm = () => {
        setVehicleBody(''); setVehicleType(''); setVehicleNumber(''); setIsVerifying(false); setIsVerified(false);
        setOwnerName(''); setFatherName(''); setPermanentAddress('');
        setRegistrationDate(''); setVehicleCategory(''); setVehicleClass(''); setRtoName('');
        setManufacturer(''); setModel(''); setFuelType(''); setEngineNumber(''); setChassisNumber(''); setColor('');
        setSeatingCapacity(''); setStandingCapacity(''); setCubicCapacity(''); setGrossVehicleWeight(''); setUnladenWeight(''); setBodyType('');
        setLocationState(''); setLocationDistrict('');
        setFitnessValidUpto(''); setInsuranceCompany(''); setInsurancePolicyNumber(''); setInsuranceValidity(''); setPollutionValidUpto(''); setRoadTaxPaidUpto('');
        setNationalPermitNumber(''); setNationalPermitValidity(''); setStatePermitNumber(''); setStatePermitValidity('');
        setHypothecation(''); setNocDetails(''); setBlacklistStatus(''); setTaxStatus(''); setRcStatus(''); setSmartCardIssued('');
        setRegistrationValidUpto(''); setPreviousRegNumber(''); setMakerModelDesc('');
        setRcDoc(null); setInsuranceDoc(null); setPermitDoc(null);
        scrollRef.current?.scrollTo({ y: 0, animated: true });
    };

    // ── Submit ──
    const handleSubmit = async () => {
        if (vehicleNumber.length < 5) {
            Alert.alert('Required', 'Please enter a valid vehicle number.');
            return;
        }
        if (!vehicleBody) {
            Alert.alert('Required', 'Please select a vehicle body.');
            return;
        }
        if (!vehicleType) {
            Alert.alert('Required', 'Please select a vehicle type.');
            return;
        }

        const pucValid = isDocumentValidStr(pollutionValidUpto);
        const insValid = isDocumentValidStr(insuranceValidity);
        const permValid = isDocumentValidStr(nationalPermitValidity) || isDocumentValidStr(statePermitValidity);

        if (!pucValid || !insValid || !permValid) {
            Alert.alert('Validation Error', 'PUC, Insurance, or Permit must be valid for at least the next 5 days to proceed.');
            return;
        }

        setIsSaving(true);
        try {
            // Map dropdown values to IDs from API response
            const selectedBody = vehicleBodies.find(b => b.name === vehicleBody);
            const selectedType = vehicleTypes.find(t => t.length_label === vehicleType);

            const bodyIndex = selectedBody ? selectedBody.id : '';
            const typeIndex = selectedType ? selectedType.id : '';

            const payload = {
                vechicle_body: String(bodyIndex),
                vechicle_type: String(typeIndex),
                registration_number: vehicleNumber.replace(/\s/g, ''),
                owner_name: emptyToNull(ownerName),
                father_name: emptyToNull(fatherName),
                permanent_address: emptyToNull(permanentAddress),
                registration_date: toApiDate(registrationDate),
                vehicle_class: emptyToNull(vehicleClass),
                vehicle_category: emptyToNull(vehicleCategory),
                rto_name: emptyToNull(rtoName),
                manufacturer: emptyToNull(manufacturer),
                model: emptyToNull(model),
                fuel_type: emptyToNull(fuelType),
                engine_number: emptyToNull(engineNumber),
                chassis_number: emptyToNull(chassisNumber),
                color: emptyToNull(color),
                seating_capacity: emptyToNull(seatingCapacity),
                standing_capacity: emptyToNull(standingCapacity),
                cubic_capacity: emptyToNull(cubicCapacity),
                gross_vehicle_weight: emptyToNull(grossVehicleWeight),
                unladen_weight: emptyToNull(unladenWeight),
                body_type: emptyToNull(bodyType),
                vehicle_location_state: emptyToNull(locationState),
                vehicle_location_district: emptyToNull(locationDistrict),
                fitness_valid_upto: toApiDate(fitnessValidUpto),
                insurance_company: emptyToNull(insuranceCompany),
                insurance_policy_number: emptyToNull(insurancePolicyNumber),
                insurance_validity: toApiDate(insuranceValidity),
                pollution_valid_upto: toApiDate(pollutionValidUpto),
                road_tax_paid_upto: toApiDate(roadTaxPaidUpto),
                national_permit_number: emptyToNull(nationalPermitNumber),
                national_permit_validity: toApiDate(nationalPermitValidity),
                state_permit_number: emptyToNull(statePermitNumber),
                state_permit_validity: toApiDate(statePermitValidity),
                hypothecation: emptyToNull(hypothecation),
                noc_details: emptyToNull(nocDetails),
                blacklist_status: emptyToNull(blacklistStatus),
                tax_status: emptyToNull(taxStatus === 'N/A' ? '' : taxStatus),
                rc_status: emptyToNull(rcStatus),
                smart_card_issued: emptyToNull(smartCardIssued),
                registration_valid_upto: toApiDate(registrationValidUpto),
                previous_registration_number: emptyToNull(previousRegNumber),
                maker_model_description: emptyToNull(makerModelDesc),
            };

            console.log('Final Payload:', JSON.stringify(payload, null, 2));

            const response = await axiosInstance.post(END_POINTS.TRUCKER_ADD_VEHICLE, payload);
            console.log('Add Vehicle Response:', response?.data);
            const data = response?.data;

            if (data?.status === 'success' || response?.status === 200 || response?.status === 201) {
                Toast.show('Vehicle added successfully', Toast.LONG);
                resetForm();
            } else {
                // Handle duplicate registration error specifically
                if (data?.errors?.registration_number?.some((msg: string) => msg.includes('taken'))) {
                    Toast.show('This vehicle number is already registered. Please add a different vehicle.', Toast.LONG);
                } else {
                    let errorMessage = data?.message || 'Could not add vehicle.';
                    if (data?.errors) {
                        const errorDetails = Object.values(data.errors).flat().join('\n');
                        errorMessage += `\n${errorDetails}`;
                    }
                    Alert.alert('Failed', errorMessage);
                }
            }
        } catch (error: any) {
            console.error('Add Vehicle Error:', error);
            Alert.alert('Error', 'Something went wrong while adding the vehicle. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    // ── Dropdown Options ──
    const vehicleBodyOptions = vehicleBodies.map(b => b.name);
    const vehicleTypeOptions = vehicleTypes.map(t => t.length_label);
    const fuelTypeOptions = ['Diesel', 'Petrol', 'CNG', 'LPG', 'Electric', 'Hybrid'];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

            {/* ── Header ── */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
                    <ArrowLeftIcon />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add Vehicle</Text>
                <View style={{ width: 38 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    ref={scrollRef}
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >

                    {/* ═══════════════════════════════════════════ */}
                    {/* 1. Basic Information                       */}
                    {/* ═══════════════════════════════════════════ */}
                    <View style={styles.section}>
                        <SectionHeader title="Vehicle Information" number={1} />

                        <FormSelect
                            label="Select Vehicle Body"
                            value={vehicleBody}
                            options={vehicleBodyOptions}
                            onSelect={setVehicleBody}
                            placeholder="Select vehicle body"
                            required
                        />
                        <FormSelect
                            label="Select Vehicle Type"
                            value={vehicleType}
                            options={vehicleTypeOptions}
                            onSelect={setVehicleType}
                            placeholder="Select vehicle type"
                            required
                        />

                        <FormInput
                            label="Vehicle Number"
                            value={vehicleNumber}
                            onChangeText={(t) => setVehicleNumber(t.toUpperCase())}
                            placeholder="MH 12 AB 1234"
                            required
                            autoCapitalize="characters"
                        />
                        <TouchableOpacity
                            style={[
                                styles.verifyBtn,
                                isVerified && styles.verifyBtnDone,
                            ]}
                            onPress={handleVerifyRC}
                            disabled={isVerifying || isVerified}
                            activeOpacity={0.7}
                        >
                            {isVerifying ? (
                                <ActivityIndicator size="small" color={C.white} />
                            ) : isVerified ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <CheckIcon />
                                    <Text style={[styles.verifyText, { color: C.success }]}>Verified</Text>
                                </View>
                            ) : (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <SearchIcon />
                                    <Text style={styles.verifyText}>Verify RC</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* ── Sections 2-9: Only visible after RC verification ── */}
                    {isVerified && (
                        <>
                            <RcSummaryCard />

                            {/* ═══════════════════════════════════════════ */}
                            {/* 2. Owner Information                       */}
                            {/* ═══════════════════════════════════════════ */}
                            <View style={styles.section}>
                                <SectionHeader title="Owner Information" number={2} />
                                <FormInput label="Owner Name" value={ownerName} onChangeText={setOwnerName} />
                                <FormInput label="Father / Care Of" value={fatherName} onChangeText={setFatherName} />
                                <FormInput label="Permanent Address" value={permanentAddress} onChangeText={setPermanentAddress} multiline />
                            </View>

                            {/* ═══════════════════════════════════════════ */}
                            {/* 3. Registration Details                    */}
                            {/* ═══════════════════════════════════════════ */}
                            <View style={styles.section}>
                                <SectionHeader title="Registration Details" number={3} />
                                <FormDateField label="Registration Date" value={registrationDate} onChange={setRegistrationDate} />
                                <FormInput label="Vehicle Category" value={vehicleCategory} onChangeText={setVehicleCategory} />
                                <FormInput label="Vehicle Class" value={vehicleClass} onChangeText={setVehicleClass} />
                                <FormInput label="RTO Name" value={rtoName} onChangeText={setRtoName} />
                            </View>

                            {/* ═══════════════════════════════════════════ */}
                            {/* 4. Vehicle Specifications                  */}
                            {/* ═══════════════════════════════════════════ */}
                            <View style={styles.section}>
                                <SectionHeader title="Vehicle Specifications" number={4} />
                                <FormInput label="Manufacturer" value={manufacturer} onChangeText={setManufacturer} />
                                <FormInput label="Model" value={model} onChangeText={setModel} />
                                <FormSelect label="Fuel Type" value={fuelType} options={fuelTypeOptions} onSelect={setFuelType} />
                                <FormInput label="Color" value={color} onChangeText={setColor} />
                                <FormInput label="Engine Number" value={engineNumber} onChangeText={setEngineNumber} />
                                <FormInput label="Chassis Number" value={chassisNumber} onChangeText={setChassisNumber} />
                                <FormInput label="Seating Capacity" value={seatingCapacity} onChangeText={setSeatingCapacity} keyboardType="numeric" />
                                <FormInput label="Standing Capacity" value={standingCapacity} onChangeText={setStandingCapacity} keyboardType="numeric" />
                                <FormInput label="Cubic Capacity (cc)" value={cubicCapacity} onChangeText={setCubicCapacity} keyboardType="numeric" />
                                <FormInput label="Body Type" value={bodyType} onChangeText={setBodyType} />
                                <FormInput label="Gross Vehicle Weight (kg)" value={grossVehicleWeight} onChangeText={setGrossVehicleWeight} keyboardType="numeric" />
                                <FormInput label="Unladen Weight (kg)" value={unladenWeight} onChangeText={setUnladenWeight} keyboardType="numeric" />
                            </View>

                            {/* ═══════════════════════════════════════════ */}
                            {/* 5. Location Information                    */}
                            {/* ═══════════════════════════════════════════ */}
                            <View style={styles.section}>
                                <SectionHeader title="Location Information" number={5} />
                                <FormInput label="Vehicle Location State" value={locationState} onChangeText={setLocationState} />
                                <FormInput label="Vehicle Location District" value={locationDistrict} onChangeText={setLocationDistrict} />
                            </View>

                            {/* ═══════════════════════════════════════════ */}
                            {/* 6. Validity & Insurance                    */}
                            {/* ═══════════════════════════════════════════ */}
                            <View style={styles.section}>
                                <SectionHeader title="Validity & Insurance" number={6} />
                                <FormDateField label="Fitness Valid Upto" value={fitnessValidUpto} onChange={setFitnessValidUpto} />
                                <FormInput label="Insurance Company" value={insuranceCompany} onChangeText={setInsuranceCompany} />
                                <FormInput label="Insurance Policy Number" value={insurancePolicyNumber} onChangeText={setInsurancePolicyNumber} />
                                <FormDateField label="Insurance Validity" value={insuranceValidity} onChange={setInsuranceValidity} />
                                <FormDateField label="Pollution Valid Upto (PUC)" value={pollutionValidUpto} onChange={setPollutionValidUpto} />
                                <FormDateField label="Road Tax Paid Upto" value={roadTaxPaidUpto} onChange={setRoadTaxPaidUpto} />
                            </View>

                            {/* ═══════════════════════════════════════════ */}
                            {/* 7. Permit Information                      */}
                            {/* ═══════════════════════════════════════════ */}
                            <View style={styles.section}>
                                <SectionHeader title="Permit Information" number={7} />
                                <FormInput label="National Permit Number" value={nationalPermitNumber} onChangeText={setNationalPermitNumber} />
                                <FormDateField label="National Permit Validity" value={nationalPermitValidity} onChange={setNationalPermitValidity} />
                                <FormInput label="State Permit Number" value={statePermitNumber} onChangeText={setStatePermitNumber} />
                                <FormDateField label="State Permit Validity" value={statePermitValidity} onChange={setStatePermitValidity} />
                            </View>

                            {/* ═══════════════════════════════════════════ */}
                            {/* 8. Additional Information                  */}
                            {/* ═══════════════════════════════════════════ */}
                            <View style={styles.section}>
                                <SectionHeader title="Additional Information" number={8} />
                                <FormInput label="Hypothecation" value={hypothecation} onChangeText={setHypothecation} />
                                <FormInput label="NOC Details" value={nocDetails} onChangeText={setNocDetails} />
                                <FormInput label="Blacklist Status" value={blacklistStatus} onChangeText={setBlacklistStatus} />
                                <FormInput label="Tax Status" value={taxStatus} onChangeText={setTaxStatus} />
                                <FormInput label="RC Status" value={rcStatus} onChangeText={setRcStatus} />
                                <FormInput label="Smart Card Issued" value={smartCardIssued} onChangeText={setSmartCardIssued} />
                                <FormDateField label="Registration Valid Upto" value={registrationValidUpto} onChange={setRegistrationValidUpto} />
                                <FormInput label="Previous Registration Number" value={previousRegNumber} onChangeText={setPreviousRegNumber} />
                                <FormInput label="Maker Model Description" value={makerModelDesc} onChangeText={setMakerModelDesc} />
                            </View>

                            {/* ═══════════════════════════════════════════ */}
                            {/* 9. Vehicle Documents                       */}
                            {/* ═══════════════════════════════════════════ */}
                            {/* <View style={styles.section}>
                                <SectionHeader title="Vehicle Documents" number={9} />
                                <DocumentCard title="Registration Certificate (RC)" isUploaded={!!rcDoc} onUpload={() => openUploadModal('rc')} />
                                <DocumentCard title="Insurance Policy" isUploaded={!!insuranceDoc} onUpload={() => openUploadModal('insurance')} />
                                <DocumentCard title="Permit Document" isUploaded={!!permitDoc} onUpload={() => openUploadModal('permit')} />
                            </View> */}
                        </>
                    )}

                    {/* ── Prompt when not verified ── */}
                    {!isVerified && !isVerifying && (
                        <View style={styles.promptCard}>
                            <Text style={styles.promptTitle}>Enter Vehicle Number & Verify RC</Text>
                            <Text style={styles.promptSubtitle}>All vehicle details will be auto-filled from the government database once RC is verified.</Text>
                        </View>
                    )}

                    <View style={{ height: 120 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ── Footer: Submit Button (only after verification) ── */}
            {isVerified && (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.submitBtn, isSaving && { opacity: 0.7 }]}
                        onPress={handleSubmit}
                        disabled={isSaving}
                        activeOpacity={0.8}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color={C.white} />
                        ) : (
                            <Text style={styles.submitText}>Submit</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* ── Upload Modal ── */}
            <Modal visible={uploadModalVisible} transparent animationType="slide">
                <View style={uploadStyles.overlay}>
                    <View style={uploadStyles.content}>
                        <View style={uploadStyles.handle} />
                        <Text style={uploadStyles.title}>Upload Document</Text>

                        <TouchableOpacity style={uploadStyles.option} onPress={handleCameraLaunch} activeOpacity={0.7}>
                            <View style={uploadStyles.optionIcon}><CameraIcon /></View>
                            <View>
                                <Text style={uploadStyles.optionTitle}>Take Photo</Text>
                                <Text style={uploadStyles.optionSub}>Use camera to capture document</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={uploadStyles.option} onPress={handleGalleryLaunch} activeOpacity={0.7}>
                            <View style={[uploadStyles.optionIcon, { backgroundColor: '#F3F0FF' }]}><GalleryIcon /></View>
                            <View>
                                <Text style={uploadStyles.optionTitle}>Choose from Gallery</Text>
                                <Text style={uploadStyles.optionSub}>Select an existing photo</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={uploadStyles.cancelBtn} onPress={() => setUploadModalVisible(false)} activeOpacity={0.7}>
                            <Text style={uploadStyles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.bg,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: C.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 17,
        fontWeight: '700',
        color: C.text,
        letterSpacing: -0.2,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },

    // Sections
    section: {
        backgroundColor: C.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.border,
        padding: 16,
        marginBottom: 16,
    },

    // Prompt card (before verification)
    promptCard: {
        backgroundColor: C.accentLight,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D6E0F0',
        padding: 24,
        marginTop: 8,
        alignItems: 'center',
    },
    promptTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: C.accent,
        textAlign: 'center',
        marginBottom: 6,
    },
    promptSubtitle: {
        fontSize: 13,
        color: C.textSec,
        textAlign: 'center',
        lineHeight: 18,
    },

    // Verify RC Button
    verifyBtn: {
        backgroundColor: C.accent,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        marginBottom: 4,
    },
    verifyBtnDone: {
        backgroundColor: C.successLight,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    verifyText: {
        fontSize: 13,
        fontWeight: '600',
        color: C.white,
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: C.bg,
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: Platform.OS === 'ios' ? 28 : 12,
        borderTopWidth: 1,
        borderTopColor: C.border,
    },
    submitBtn: {
        backgroundColor: C.accent,
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitText: {
        color: C.white,
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
});

// ── Form Field Styles ──
const formStyles = StyleSheet.create({
    fieldContainer: {
        marginBottom: 14,
    },
    label: {
        fontSize: 12,
        fontWeight: '500',
        color: C.textSec,
        marginBottom: 6,
        letterSpacing: 0.1,
    },
    required: {
        color: C.danger,
        fontWeight: '400',
    },
    input: {
        backgroundColor: C.inputBg,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: Platform.OS === 'ios' ? 12 : 10,
        fontSize: 14,
        color: C.text,
    },
    inputText: {
        fontSize: 14,
        color: C.text,
    },
    inputDisabled: {
        backgroundColor: '#F3F4F6',
        color: C.textMuted,
    },
});

// ── Section Header Styles ──
const sectionStyles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    numberBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: C.accent,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    numberText: {
        fontSize: 12,
        fontWeight: '700',
        color: C.white,
    },
    title: {
        fontSize: 15,
        fontWeight: '700',
        color: C.text,
        letterSpacing: -0.1,
    },
});

// ── Document Card Styles ──
const docStyles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: C.inputBg,
        padding: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: C.border,
        marginBottom: 10,
    },
    title: {
        fontSize: 13,
        fontWeight: '600',
        color: C.text,
        marginBottom: 4,
    },
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeSuccess: {
        backgroundColor: C.successLight,
    },
    badgePending: {
        backgroundColor: '#F3F4F6',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '600',
    },
    uploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: C.accentLight,
    },
    uploadText: {
        fontSize: 12,
        fontWeight: '600',
        color: C.accent,
    },
});

// ── Modal Styles ──
const modalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    content: {
        backgroundColor: C.bg,
        borderRadius: 16,
        padding: 20,
        maxHeight: '70%',
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: C.text,
        marginBottom: 12,
        textAlign: 'center',
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    optionText: {
        fontSize: 15,
        color: C.text,
    },
});

const rcStyles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        alignItems: 'flex-start',
    },
    label: {
        fontSize: 14,
        color: '#111827',
        flex: 1,
        fontWeight: '500',
    },
    value: {
        fontSize: 14,
        color: '#4B5563',
        flex: 1,
        textAlign: 'right',
        fontWeight: '600',
    },
    linkBtn: {
        marginVertical: 12,
        alignItems: 'center',
    },
    linkText: {
        color: '#38BDF8',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 16,
    },
    btnRow: {
        marginTop: 16,
        gap: 12,
    },
    actionBtn: {
        backgroundColor: '#56B5F7',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    actionBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

// ── Upload Modal Styles ──
const uploadStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    content: {
        backgroundColor: C.bg,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#D1D5DB',
        alignSelf: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: C.text,
        marginBottom: 20,
        textAlign: 'center',
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.border,
        marginBottom: 10,
        gap: 14,
    },
    optionIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: C.accentLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: C.text,
    },
    optionSub: {
        fontSize: 12,
        color: C.textMuted,
        marginTop: 1,
    },
    cancelBtn: {
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 6,
    },
    cancelText: {
        fontSize: 15,
        fontWeight: '600',
        color: C.danger,
    },
});

export default AddTruckScreen;
