import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { STACKS } from '@truckmitr/stacks/stacks';

// Unified RC Data interface to handle both response formats
interface UnifiedRcData {
    // Vehicle Info
    registrationNumber: string;
    ownerName: string;
    fatherName: string;
    vehicleMakeModel: string;
    manufacturer: string;
    vehicleClass: string;
    bodyType: string;
    vehicleColor: string;
    fuelType: string;
    status: string;

    // Registration
    registrationDate: string;
    registrationLocation: string;
    stateCode: string;
    rtoCode: string;
    vehicleAge: string;

    // Technical
    chassisNumber: string;
    engineNumber: string;
    cubicCapacity: string;
    cylinders: string;
    grossWeight: string;
    unladenWeight: string;
    wheelbase: string;
    seatingCapacity: string;
    emissionNorms: string;
    manufacturedDate: string;

    // Validity
    fitnessValidUpto: string;
    taxValidUpto: string;
    expiryDate: string;
    puccExpiryDate: string;
    fitnessExpired: string;

    // Insurance
    insuranceCompany: string;
    policyNumber: string;
    insuranceExpiry: string;
    remainingValidity: string;
    insuranceExpired: string;

    // Permit
    permitNumber: string;
    permitType: string;
    permitExpiryDate: string;
    nationalPermitNumber: string;
    nationalPermitIssuedBy: string;
    nationalPermitExpiry: string;

    // Finance
    vehicleFinanced: boolean;
    financer: string;

    // Address
    presentAddress: string;
    permanentAddress: string;

    // Other
    blacklistStatus: string;
    nocDetails: string;
    ownerSerialNumber: string;
    state: string;
}

const RcCheckResult = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const colors = useColor();
    const { responsiveWidth, responsiveFontSize, responsiveHeight } = useResponsiveScale();
    const { shadow } = useShadow();

    const { rcNumber, rcData } = route.params || { rcNumber: '', rcData: null };

    // Normalize data from both response formats
    const normalizeData = (): UnifiedRcData | null => {
        if (!rcData) return null;

        // Check if it's the "already verified" format (has `data` object)
        if (rcData.data) {
            const d = rcData.data;
            return {
                registrationNumber: d.vehicle_number || rcNumber,
                ownerName: d.owner || '',
                fatherName: d.owner_fathers_name || '',
                vehicleMakeModel: d.model_name || '',
                manufacturer: d.company_name || '',
                vehicleClass: d.class || '',
                bodyType: d.category || '',
                vehicleColor: d.color || '',
                fuelType: d.fuel_type || '',
                status: d.rc_status || 'ACTIVE',

                registrationDate: formatDate(d.registration_date),
                registrationLocation: '',
                stateCode: d.vehicle_number?.substring(0, 2) || '',
                rtoCode: d.rto_code || '',
                vehicleAge: calculateVehicleAge(d.manufacturing_date),

                chassisNumber: d.chassis || '',
                engineNumber: d.engine || '',
                cubicCapacity: d.cubic_capacity ? `${d.cubic_capacity} cc` : '',
                cylinders: d.no_cyl?.toString() || '',
                grossWeight: d.gross_weight ? `${d.gross_weight} kg` : '',
                unladenWeight: d.unladen_weight ? `${d.unladen_weight} kg` : '',
                wheelbase: d.wheel_base ? `${d.wheel_base} mm` : '',
                seatingCapacity: d.seat_cap?.toString() || '',
                emissionNorms: d.norms_desc || '',
                manufacturedDate: formatDate(d.manufacturing_date),

                fitnessValidUpto: formatDate(d.expiry_date),
                taxValidUpto: formatDate(d.tax_upto),
                expiryDate: formatDate(d.expiry_date),
                puccExpiryDate: '',
                fitnessExpired: '',

                insuranceCompany: d.insurance_company || '',
                policyNumber: d.policy_number || '',
                insuranceExpiry: formatDate(d.insurance_valid_till),
                remainingValidity: '',
                insuranceExpired: '',

                permitNumber: d.permit_number || '',
                permitType: '',
                permitExpiryDate: formatDate(d.permit_upto),
                nationalPermitNumber: '',
                nationalPermitIssuedBy: '',
                nationalPermitExpiry: '',

                vehicleFinanced: d.is_financed === 1,
                financer: d.financier || '',

                presentAddress: d.present_address || '',
                permanentAddress: d.permanent_address || '',

                blacklistStatus: d.blacklist_status || 'NA',
                nocDetails: d.noc_details || '',
                ownerSerialNumber: d.owner_number || '',
                state: ''
            };
        }

        // Check if it's the "newly verified" format (has `result` object)
        if (rcData.result) {
            const r = rcData.result;
            return {
                registrationNumber: r.registration_number || rcNumber,
                ownerName: r.user_name || '',
                fatherName: r.father_name || '',
                vehicleMakeModel: r.vehicle_make_model || '',
                manufacturer: r.vehicle_maker_description || '',
                vehicleClass: r.vehicle_class_description || '',
                bodyType: r.body_type_description || '',
                vehicleColor: r.vehicle_color || '',
                fuelType: r.vehicle_fuel_description || '',
                status: r.status || 'ACTIVE',

                registrationDate: r.registration_date || '',
                registrationLocation: r.registration_location || '',
                stateCode: r.state_code || '',
                rtoCode: r.rto_code || '',
                vehicleAge: r.vehicle_age || '',

                chassisNumber: r.chassis_number || '',
                engineNumber: r.engine_number || '',
                cubicCapacity: r.vehicle_cubic_capacity ? `${r.vehicle_cubic_capacity} cc` : '',
                cylinders: r.vehicle_number_of_cylinders || '',
                grossWeight: r.vehicle_gross_weight ? `${r.vehicle_gross_weight} kg` : '',
                unladenWeight: r.vehicle_unladen_weight ? `${r.vehicle_unladen_weight} kg` : '',
                wheelbase: r.vehicle_wheelbase ? `${r.vehicle_wheelbase} mm` : '',
                seatingCapacity: r.vehicle_seating_capacity || '',
                emissionNorms: r.norms_description || '',
                manufacturedDate: r.vehicle_manufactured_date || '',

                fitnessValidUpto: r.fit_upto || '',
                taxValidUpto: r.tax_upto || '',
                expiryDate: r.expiry_date || '',
                puccExpiryDate: r.pucc_expiry_date || '',
                fitnessExpired: r.vehicle_fitness_expired || '',

                insuranceCompany: r.insurance?.company || '',
                policyNumber: r.insurance?.policy_number || '',
                insuranceExpiry: r.insurance?.expiry_date || '',
                remainingValidity: r.month_year_remaining_for_insurance_exp || '',
                insuranceExpired: r.insurance_expired || '',

                permitNumber: r.permit_number || '',
                permitType: r.permit_type || '',
                permitExpiryDate: r.permit_expiry_date || '',
                nationalPermitNumber: r.national_permit_number || '',
                nationalPermitIssuedBy: r.national_permit_issued_by || '',
                nationalPermitExpiry: r.national_permit_expiry_date || '',

                vehicleFinanced: r.vehicle_financed || false,
                financer: r.financer || '',

                presentAddress: r.user_present_address || '',
                permanentAddress: r.user_permanent_address || '',

                blacklistStatus: r.blacklist_status || 'NA',
                nocDetails: r.noc_details || '',
                ownerSerialNumber: r.vehicle_owner_number || '',
                state: r.state || ''
            };
        }

        return null;
    };

    // Helper to format dates
    const formatDate = (dateStr: string | null | undefined): string => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    // Helper to calculate vehicle age
    const calculateVehicleAge = (manufacturedDate: string | null | undefined): string => {
        if (!manufacturedDate) return '';
        try {
            const mfgDate = new Date(manufacturedDate);
            const now = new Date();
            const years = now.getFullYear() - mfgDate.getFullYear();
            const months = now.getMonth() - mfgDate.getMonth();

            if (months < 0) {
                return `${years - 1} years ${12 + months} months`;
            }
            return `${years} years ${months} months`;
        } catch {
            return '';
        }
    };

    const result = normalizeData();
    const isAlreadyVerified = rcData?.message?.toLowerCase().includes('already verified');

    const _goBack = () => navigation.goBack();

    const _checkAnotherRc = () => {
        navigation.goBack();
    };

    const DetailRow = ({ label, value, isHighlight = false }: { label: string, value: string | null | undefined, isHighlight?: boolean }) => {
        if (!value || value === '' || value === 'NA' || value === 'null') return null;
        return (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, alignItems: 'flex-start' }}>
                <Text style={{ fontSize: responsiveFontSize(1.6), color: '#64748B', flex: 1 }}>{label}</Text>
                <Text style={{
                    fontSize: responsiveFontSize(1.6),
                    color: isHighlight ? '#16A34A' : '#334155',
                    fontWeight: isHighlight ? '700' : '600',
                    flex: 1.2,
                    textAlign: 'right'
                }}>
                    {value}
                </Text>
            </View>
        );
    };

    const SectionCard = ({ title, icon, children }: { title: string, icon: string, children: React.ReactNode }) => (
        <View style={{ backgroundColor: colors.white, borderRadius: 16, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#EAF3FF', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                    <Ionicons name={icon as any} size={16} color="#2563EB" />
                </View>
                <Text style={{ fontSize: responsiveFontSize(1.8), fontWeight: '700', color: '#001F3F' }}>{title}</Text>
            </View>
            {children}
        </View>
    );

    const StatusBadge = ({ status }: { status: string }) => {
        const isActive = status?.toUpperCase() === 'ACTIVE';
        return (
            <View style={{
                backgroundColor: isActive ? '#DCFCE7' : '#FEE2E2',
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 20,
                alignSelf: 'center'
            }}>
                <Text style={{
                    color: isActive ? '#166534' : '#DC2626',
                    fontWeight: 'bold',
                    fontSize: responsiveFontSize(1.6)
                }}>
                    {status?.toUpperCase() || 'N/A'}
                </Text>
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: responsiveWidth(4), paddingTop: responsiveHeight(4), backgroundColor: colors.white, elevation: 2 }}>
                <TouchableOpacity onPress={_goBack} style={{ padding: 5, marginRight: 10 }}>
                    <Ionicons name="chevron-back" size={24} color={colors.royalBlue} />
                </TouchableOpacity>
                <Text style={{ fontSize: responsiveFontSize(2.4), fontWeight: 'bold', color: colors.royalBlue }}>
                    {t('rcDetails') || 'RC Details'}
                </Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: responsiveWidth(4), paddingBottom: responsiveHeight(18) }}>

                {/* Status Badge */}
                <View style={{ alignItems: 'center', marginVertical: responsiveHeight(2) }}>
                    <View style={{ backgroundColor: result?.status === 'ACTIVE' ? '#DBF4E6' : '#FEE2E2', height: 80, width: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                        <Ionicons
                            name={result?.status === 'ACTIVE' ? "checkmark-circle" : "alert-circle"}
                            size={48}
                            color={result?.status === 'ACTIVE' ? "#16A34A" : "#DC2626"}
                        />
                    </View>
                    <Text style={{ fontSize: responsiveFontSize(2.6), fontWeight: 'bold', color: result?.status === 'ACTIVE' ? '#16A34A' : '#DC2626', marginBottom: 4 }}>
                        {result?.status === 'ACTIVE' ? (t('verified') || 'Verified') : (t('inactive') || 'Inactive')}
                    </Text>
                    <Text style={{ fontSize: responsiveFontSize(1.6), color: '#64748B', textAlign: 'center' }}>
                        {isAlreadyVerified
                            ? (t('vehicleAlreadyVerified') || 'Vehicle already verified in our records')
                            : (t('vehicleDetailsVerified') || 'Vehicle details verified successfully')
                        }
                    </Text>
                </View>

                {/* Vehicle Info Card */}
                <SectionCard title={t('vehicleInformation') || 'Vehicle Information'} icon="car-sport-outline">
                    <DetailRow label={t('vehicleNumber') || "Vehicle Number"} value={result?.registrationNumber} isHighlight />
                    <DetailRow label={t('ownerName') || "Owner Name"} value={result?.ownerName} />
                    <DetailRow label={t('fatherName') || "Father Name"} value={result?.fatherName} />
                    <DetailRow label={t('vehicleMakeModel') || "Make & Model"} value={result?.vehicleMakeModel} />
                    <DetailRow label={t('manufacturer') || "Manufacturer"} value={result?.manufacturer} />
                    <DetailRow label={t('vehicleClass') || "Vehicle Class"} value={result?.vehicleClass} />
                    <DetailRow label={t('bodyType') || "Body Type"} value={result?.bodyType} />
                    <DetailRow label={t('vehicleColor') || "Color"} value={result?.vehicleColor} />
                    <DetailRow label={t('fuelType') || "Fuel Type"} value={result?.fuelType} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                        <Text style={{ fontSize: responsiveFontSize(1.6), color: '#64748B' }}>{t('rcStatus') || 'RC Status'}</Text>
                        <StatusBadge status={result?.status || 'N/A'} />
                    </View>
                </SectionCard>

                {/* Registration Details */}
                <SectionCard title={t('registrationDetails') || 'Registration Details'} icon="document-text-outline">
                    <DetailRow label={t('registrationDate') || "Registration Date"} value={result?.registrationDate} />
                    <DetailRow label={t('registrationLocation') || "Registration Location"} value={result?.registrationLocation} />
                    <DetailRow label={t('stateCode') || "State Code"} value={result?.stateCode} />
                    <DetailRow label={t('state') || "State"} value={result?.state} />
                    <DetailRow label={t('rtoCode') || "RTO Code"} value={result?.rtoCode} />
                    <DetailRow label={t('vehicleAge') || "Vehicle Age"} value={result?.vehicleAge} />
                </SectionCard>

                {/* Technical Details */}
                <SectionCard title={t('technicalDetails') || 'Technical Details'} icon="settings-outline">
                    <DetailRow label={t('chassisNumber') || "Chassis Number"} value={result?.chassisNumber} />
                    <DetailRow label={t('engineNumber') || "Engine Number"} value={result?.engineNumber} />
                    <DetailRow label={t('cubicCapacity') || "Cubic Capacity"} value={result?.cubicCapacity} />
                    <DetailRow label={t('cylinders') || "Cylinders"} value={result?.cylinders} />
                    <DetailRow label={t('grossWeight') || "Gross Weight"} value={result?.grossWeight} />
                    <DetailRow label={t('unladenWeight') || "Unladen Weight"} value={result?.unladenWeight} />
                    <DetailRow label={t('wheelbase') || "Wheelbase"} value={result?.wheelbase} />
                    <DetailRow label={t('seatingCapacity') || "Seating Capacity"} value={result?.seatingCapacity} />
                    <DetailRow label={t('emissionNorms') || "Emission Norms"} value={result?.emissionNorms} />
                    <DetailRow label={t('manufacturedDate') || "Manufactured Date"} value={result?.manufacturedDate} />
                </SectionCard>

                {/* Validity Details */}
                <SectionCard title={t('validityDetails') || 'Validity Details'} icon="calendar-outline">
                    <DetailRow label={t('fitnessValidUpto') || "Fitness Valid Upto"} value={result?.fitnessValidUpto} />
                    <DetailRow label={t('taxValidUpto') || "Tax Valid Upto"} value={result?.taxValidUpto} />
                    <DetailRow label={t('expiryDate') || "Expiry Date"} value={result?.expiryDate} />
                    <DetailRow label={t('puccExpiryDate') || "PUCC Expiry Date"} value={result?.puccExpiryDate} />
                    {result?.fitnessExpired && (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                            <Text style={{ fontSize: responsiveFontSize(1.6), color: '#64748B' }}>{t('fitnessExpired') || 'Fitness Expired'}</Text>
                            <View style={{
                                backgroundColor: result.fitnessExpired === 'N' ? '#DCFCE7' : '#FEE2E2',
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                                borderRadius: 12
                            }}>
                                <Text style={{
                                    color: result.fitnessExpired === 'N' ? '#166534' : '#DC2626',
                                    fontWeight: '600',
                                    fontSize: responsiveFontSize(1.4)
                                }}>
                                    {result.fitnessExpired === 'N' ? (t('no') || 'No') : (t('yes') || 'Yes')}
                                </Text>
                            </View>
                        </View>
                    )}
                </SectionCard>

                {/* Insurance Details */}
                {(result?.insuranceCompany || result?.policyNumber) && (
                    <SectionCard title={t('insuranceDetails') || 'Insurance Details'} icon="shield-checkmark-outline">
                        <DetailRow label={t('insuranceCompany') || "Insurance Company"} value={result?.insuranceCompany} />
                        <DetailRow label={t('policyNumber') || "Policy Number"} value={result?.policyNumber} />
                        <DetailRow label={t('insuranceExpiry') || "Insurance Expiry"} value={result?.insuranceExpiry} />
                        <DetailRow label={t('remainingValidity') || "Remaining Validity"} value={result?.remainingValidity} />
                        {result?.insuranceExpired && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                                <Text style={{ fontSize: responsiveFontSize(1.6), color: '#64748B' }}>{t('insuranceExpired') || 'Insurance Expired'}</Text>
                                <View style={{
                                    backgroundColor: result.insuranceExpired === 'N' ? '#DCFCE7' : '#FEE2E2',
                                    paddingHorizontal: 10,
                                    paddingVertical: 4,
                                    borderRadius: 12
                                }}>
                                    <Text style={{
                                        color: result.insuranceExpired === 'N' ? '#166534' : '#DC2626',
                                        fontWeight: '600',
                                        fontSize: responsiveFontSize(1.4)
                                    }}>
                                        {result.insuranceExpired === 'N' ? (t('no') || 'No') : (t('yes') || 'Yes')}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </SectionCard>
                )}

                {/* Permit Details */}
                {(result?.permitNumber || result?.nationalPermitNumber) && (
                    <SectionCard title={t('permitDetails') || 'Permit Details'} icon="receipt-outline">
                        <DetailRow label={t('permitNumber') || "Permit Number"} value={result?.permitNumber} />
                        <DetailRow label={t('permitType') || "Permit Type"} value={result?.permitType} />
                        <DetailRow label={t('permitExpiryDate') || "Permit Expiry Date"} value={result?.permitExpiryDate} />
                        <DetailRow label={t('nationalPermitNumber') || "National Permit Number"} value={result?.nationalPermitNumber} />
                        <DetailRow label={t('nationalPermitIssuedBy') || "National Permit Issued By"} value={result?.nationalPermitIssuedBy} />
                        <DetailRow label={t('nationalPermitExpiry') || "National Permit Expiry"} value={result?.nationalPermitExpiry} />
                    </SectionCard>
                )}

                {/* Finance Details */}
                {(result?.financer || result?.vehicleFinanced) && (
                    <SectionCard title={t('financeDetails') || 'Finance Details'} icon="cash-outline">
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <Text style={{ fontSize: responsiveFontSize(1.6), color: '#64748B' }}>{t('vehicleFinanced') || 'Vehicle Financed'}</Text>
                            <View style={{
                                backgroundColor: result?.vehicleFinanced ? '#FEF3C7' : '#DCFCE7',
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                                borderRadius: 12
                            }}>
                                <Text style={{
                                    color: result?.vehicleFinanced ? '#92400E' : '#166534',
                                    fontWeight: '600',
                                    fontSize: responsiveFontSize(1.4)
                                }}>
                                    {result?.vehicleFinanced ? (t('yes') || 'Yes') : (t('no') || 'No')}
                                </Text>
                            </View>
                        </View>
                        {result?.financer && <DetailRow label={t('financer') || "Financer"} value={result.financer} />}
                    </SectionCard>
                )}

                {/* Address Details */}
                {(result?.presentAddress || result?.permanentAddress) && (
                    <SectionCard title={t('addressDetails') || 'Address Details'} icon="location-outline">
                        <DetailRow label={t('presentAddress') || "Present Address"} value={result?.presentAddress} />
                        <DetailRow label={t('permanentAddress') || "Permanent Address"} value={result?.permanentAddress} />
                    </SectionCard>
                )}

                {/* Blacklist & NOC Status */}
                <View style={{ backgroundColor: colors.white, borderRadius: 16, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#EAF3FF', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                            <MaterialCommunityIcons name="shield-check-outline" size={16} color="#2563EB" />
                        </View>
                        <Text style={{ fontSize: responsiveFontSize(1.8), fontWeight: '700', color: '#001F3F' }}>{t('otherDetails') || 'Other Details'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <Text style={{ fontSize: responsiveFontSize(1.6), color: '#64748B' }}>{t('blacklistStatus') || 'Blacklist Status'}</Text>
                        <View style={{
                            backgroundColor: result?.blacklistStatus === 'NA' ? '#DCFCE7' : '#FEE2E2',
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 12
                        }}>
                            <Text style={{
                                color: result?.blacklistStatus === 'NA' ? '#166534' : '#DC2626',
                                fontWeight: '600',
                                fontSize: responsiveFontSize(1.4)
                            }}>
                                {result?.blacklistStatus === 'NA' ? (t('clear') || 'Clear') : result?.blacklistStatus}
                            </Text>
                        </View>
                    </View>
                    <DetailRow label={t('nocDetails') || "NOC Details"} value={result?.nocDetails} />
                    <DetailRow label={t('ownerNumber') || "Owner Serial Number"} value={result?.ownerSerialNumber} />
                </View>

            </ScrollView>

            {/* Bottom CTA */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: responsiveWidth(4), backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: '#E5E7EB', ...shadow }}>
                <TouchableOpacity
                    onPress={_goBack}
                    style={{ backgroundColor: colors.royalBlue, paddingVertical: responsiveHeight(1.8), borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}
                >
                    <Text style={{ color: colors.white, fontSize: responsiveFontSize(2.0), fontWeight: 'bold' }}>
                        {t('done') || 'Done'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={_checkAnotherRc}
                    style={{ paddingVertical: responsiveHeight(1.5), borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                >
                    <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(1.8), fontWeight: '600' }}>
                        {t('checkAnotherVehicleRc') || 'Check Another Vehicle RC'}
                    </Text>
                </TouchableOpacity>
            </View>

        </View>
    );
}

export default RcCheckResult;
