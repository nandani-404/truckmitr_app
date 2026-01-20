import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { STACKS } from '@truckmitr/stacks/stacks';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

type Driver = {
    id: string;
    name: string;
    tmId: string;
    mobile: string;
    status: string;
    image: string;
    isNew: boolean;
    state: string;
    addedDate: string;
    completion: number;
    subscriptionPlan: number;
    training: number;
    healthHygiene: number;
    jobsApplied: number;
    dob: string;
    gender: string;
    education: string;
    vehicleType: string;
    drivingExp: string;
    licenseType: string;
    licenseEndorsement: string;
    currentSalary: string;
    expectedSalary: string;
    aadharNo: string;
    licenseNo: string;
    licenseExpiry: string;
    amount: number;
    email: string;
};

const DRIVERS_DATA: Driver[] = [
    {
        id: '1',
        name: 'Ramesh Kumar',
        tmId: 'TM 1024FR045758339',
        mobile: '+91 98765 43210',
        status: 'Verified',
        image: 'https://randomuser.me/api/portraits/men/32.jpg',
        isNew: true,
        state: 'Haryana',
        addedDate: '12 Jan 2024',
        completion: 100,
        subscriptionPlan: 499,
        training: 100,
        healthHygiene: 90,
        jobsApplied: 5,
        dob: '15 Aug 1985',
        gender: 'Male',
        education: '12th Pass',
        vehicleType: 'Heavy Truck',
        drivingExp: '5 Years',
        licenseType: 'HCV',
        licenseEndorsement: 'Hazardous',
        currentSalary: '₹ 25,000 - ₹ 30,000',
        expectedSalary: '₹ 30,000 - ₹ 40,000',
        aadharNo: '1234 5678 9012',
        licenseNo: 'DL1234567890',
        licenseExpiry: '10 Oct 2028',
        amount: 499,
        email: 'ramesh.kumar@example.com',
    },
    {
        id: '2',
        name: 'Suresh Singh',
        tmId: 'TM 1025FR045758340',
        mobile: '+91 98765 43211',
        status: 'Pending',
        image: 'https://randomuser.me/api/portraits/men/44.jpg',
        isNew: false,
        state: 'Punjab',
        addedDate: '10 Jan 2024',
        completion: 67,
        subscriptionPlan: 0,
        training: 50,
        healthHygiene: 60,
        jobsApplied: 2,
        dob: '20 Jul 1990',
        gender: 'Male',
        education: '10th Pass',
        vehicleType: 'Mini Truck',
        drivingExp: '2 Years',
        licenseType: 'LMV',
        licenseEndorsement: 'None',
        currentSalary: '₹ 15,000 - ₹ 20,000',
        expectedSalary: '₹ 20,000 - ₹ 25,000',
        aadharNo: '9876 5432 1098',
        licenseNo: 'DL0987654321',
        licenseExpiry: '15 Mar 2026',
        amount: 0,
        email: 'suresh.singh@example.com',
    },
    {
        id: '3',
        name: 'Rajesh Yadav',
        tmId: 'TM 1026FR045758341',
        mobile: '+91 98765 43212',
        status: 'Verified',
        image: 'https://randomuser.me/api/portraits/men/12.jpg',
        isNew: false,
        state: 'Uttar Pradesh',
        addedDate: '05 Dec 2023',
        completion: 100,
        subscriptionPlan: 199,
        training: 100,
        healthHygiene: 80,
        jobsApplied: 8,
        dob: '05 Jan 1988',
        gender: 'Male',
        education: 'Graduate',
        vehicleType: 'Tanker',
        drivingExp: '8 Years',
        licenseType: 'HCV',
        licenseEndorsement: 'Hill',
        currentSalary: '₹ 25,000 - ₹ 30,000',
        expectedSalary: '₹ 30,000 - ₹ 40,000',
        aadharNo: '4567 8901 2345',
        licenseNo: 'DL5432167890',
        licenseExpiry: '22 Dec 2030',
        amount: 199,
        email: 'rajesh.yadav@example.com',
    },
    {
        id: '4',
        name: 'Amit Sharma',
        tmId: 'TM 1027FR045758342',
        mobile: '+91 98765 43213',
        status: 'Rejected',
        image: 'https://randomuser.me/api/portraits/men/66.jpg',
        isNew: true,
        state: 'Rajasthan',
        addedDate: '20 Nov 2023',
        completion: 25,
        subscriptionPlan: 0,
        training: 10,
        healthHygiene: 20,
        jobsApplied: 0,
        dob: '12 Feb 1995',
        gender: 'Male',
        education: '8th Pass',
        vehicleType: 'Pickup',
        drivingExp: '1 Year',
        licenseType: 'LMV',
        licenseEndorsement: 'None',
        currentSalary: '₹ 10,000 - ₹ 15,000',
        expectedSalary: '₹ 15,000 - ₹ 20,000',
        aadharNo: '3210 9876 5432',
        licenseNo: 'DL1122334455',
        licenseExpiry: '01 Jan 2025',
        amount: 0,
        email: 'amit.sharma@example.com',
    },
    {
        id: '5',
        name: 'Vikas Verma',
        tmId: 'TM 1028FR045758343',
        mobile: '+91 98765 43214',
        status: 'Verified',
        image: 'https://randomuser.me/api/portraits/men/75.jpg',
        isNew: true,
        state: 'Delhi',
        addedDate: '15 Jan 2024',
        completion: 100,
        subscriptionPlan: 99,
        training: 100,
        healthHygiene: 100,
        jobsApplied: 10,
        dob: '01 Mar 1992',
        gender: 'Male',
        education: '10th Pass',
        vehicleType: 'Trailer',
        drivingExp: '4 Years',
        licenseType: 'HCV',
        licenseEndorsement: 'None',
        currentSalary: '₹ 20,000 - ₹ 25,000',
        expectedSalary: '₹ 25,000 - ₹ 30,000',
        aadharNo: '7890 1234 5678',
        licenseNo: 'DL9988776655',
        licenseExpiry: '14 Feb 2029',
        amount: 99,
        email: 'vikas.verma@example.com',
    },
];

export default function ForemanMyPilots() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const renderDriverCard = (driver: Driver) => (
        <View key={driver.id} style={styles.driverCard}>
            <View style={styles.driverMainRow}>
                {/* Profile Image with Completion Circle */}
                <View style={styles.profileImageWrapper}>
                    <View style={styles.circularProgressContainer}>
                        <Svg width={74} height={74} viewBox="0 0 74 74">
                            <Circle
                                cx="37"
                                cy="37"
                                r="34"
                                stroke="#E2E8F0"
                                strokeWidth="4"
                                fill="none"
                            />
                            <Circle
                                cx="37"
                                cy="37"
                                r="34"
                                stroke={driver.status === 'Verified' ? "#22C55E" : "#3B82F6"}
                                strokeWidth="4"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 34}`}
                                strokeDashoffset={`${2 * Math.PI * 34 * (1 - driver.completion / 100)}`}
                                strokeLinecap="round"
                                rotation="90"
                                origin="37, 37"
                            />
                        </Svg>
                        <View style={styles.profileImageContainerInner}>
                            <Image source={{ uri: driver.image }} style={styles.profileImage} />
                        </View>
                        {/* Status Checkmark or Percentage Badge */}
                        <View style={[
                            styles.completionBadge,
                            driver.status === 'Verified' && { borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' }
                        ]}>
                            <Text style={[
                                styles.completionText,
                                driver.status === 'Verified' && { color: '#166534' }
                            ]}>
                                {driver.completion}%
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Info & Status */}
                <View style={styles.driverContent}>
                    <View style={styles.driverHeader}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={styles.driverName}>{driver.name}</Text>
                            <Text style={styles.driverTmId} numberOfLines={1} adjustsFontSizeToFit>{driver.tmId}</Text>
                        </View>
                        {/* Status Badges based on Subscription Plan */}
                        <View style={styles.badgesColumn}>
                            {driver.status === 'Pending' ? (
                                <View style={styles.pendingBadge}>
                                    <Ionicons name="time" size={12} color="#92400E" />
                                    <Text style={styles.pendingText}>Pending</Text>
                                </View>
                            ) : driver.status === 'Rejected' ? (
                                <View style={styles.rejectedBadge}>
                                    <Ionicons name="close-circle" size={12} color="#991B1B" />
                                    <Text style={styles.rejectedText}>Rejected</Text>
                                </View>
                            ) : driver.subscriptionPlan === 499 ? (
                                <View style={styles.trustedBadge}>
                                    <Ionicons name="shield-checkmark" size={12} color="#7E22CE" />
                                    <Text style={styles.trustedText}>Trusted Driver • ₹{driver.amount}</Text>
                                </View>
                            ) : driver.subscriptionPlan === 199 ? (
                                <View style={styles.verifiedBadge}>
                                    <Ionicons name="checkmark-circle" size={12} color="#166534" />
                                    <Text style={styles.verifiedText}>Verified Driver • ₹{driver.amount}</Text>
                                </View>
                            ) : driver.subscriptionPlan === 99 ? (
                                <View style={styles.jobReadyBadge}>
                                    <Ionicons name="briefcase" size={12} color="#1D4ED8" />
                                    <Text style={styles.jobReadyText}>Job Ready Driver • ₹{driver.amount}</Text>
                                </View>
                            ) : (
                                <View style={styles.verifiedBadge}>
                                    <Ionicons name="checkmark-circle" size={12} color="#166534" />
                                    <Text style={styles.verifiedText}>Verified</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Phone */}
                    <View style={styles.infoRow}>
                        <Ionicons name="call-outline" size={14} color="#64748B" />
                        <Text style={styles.infoText}>{driver.mobile}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.divider} />

            {/* Additional Info Row: State & Date */}
            <View style={styles.additionalInfoContainer}>
                <View style={styles.additionalInfoItem}>
                    <Ionicons name="location-outline" size={14} color="#64748B" />
                    <Text style={styles.additionalInfoLabel}>State:</Text>
                    <Text style={styles.additionalInfoValue}>{driver.state}</Text>
                </View>
                <View style={styles.additionalInfoItem}>
                    <Ionicons name="calendar-outline" size={14} color="#64748B" />
                    <Text style={styles.additionalInfoLabel}>Added:</Text>
                    <Text style={styles.additionalInfoValue}>{driver.addedDate}</Text>
                </View>
            </View>

            {/* View Detail Button */}
            <TouchableOpacity
                style={styles.viewDetailButton}
                activeOpacity={0.8}
            // onPress={() => (navigation as any).navigate(STACKS.FOREMAN_DRIVER_DETAILS, { driver })}
            >
                <Text style={styles.viewDetailText}>View Detail</Text>
                <Ionicons name="arrow-forward" size={14} color="#3B82F6" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Pilots</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {DRIVERS_DATA.map(renderDriverCard)}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    driverCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    driverMainRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    profileImageWrapper: {
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -12, // Shifted up
    },
    circularProgressContainer: {
        width: 74,
        height: 74,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileImageContainerInner: {
        position: 'absolute',
        top: 7,
        left: 7,
        width: 60,
        height: 60,
        borderRadius: 30,
        overflow: 'hidden',
    },
    profileImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#E2E8F0',
    },
    verifiedBadgeSmall: {
        position: 'absolute',
        bottom: -2,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 1,
        borderWidth: 2,
        borderColor: '#fff',
        elevation: 2,
    },
    completionBadge: {
        position: 'absolute',
        bottom: -4,
        backgroundColor: '#fff',
        paddingHorizontal: 1,
        paddingVertical: 0,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        elevation: 1,
    },
    completionText: {
        fontSize: 7,
        fontWeight: '700',
        color: '#3B82F6',
    },
    driverContent: {
        flex: 1,
    },
    driverHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
        marginTop: 6,
    },
    driverName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 2,
        lineHeight: 20,
    },
    driverTmId: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '500',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    infoText: {
        fontSize: 13,
        color: '#475569',
        marginLeft: 6,
        fontWeight: '500',
    },
    badgesColumn: {
        alignItems: 'flex-end',
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    verifiedText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#166534',
    },
    pendingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    pendingText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#92400E',
    },
    rejectedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    rejectedText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#991B1B',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 12,
    },
    additionalInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    additionalInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    additionalInfoLabel: {
        fontSize: 12,
        color: '#64748B',
        marginLeft: 6,
        marginRight: 4,
    },
    additionalInfoValue: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1E293B',
    },
    viewDetailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0F9FF',
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#BAE6FD',
        gap: 6,
    },
    viewDetailText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0284C7',
    },
    trustedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3E8FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    trustedText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#7E22CE',
    },
    jobReadyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#DBEAFE',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    jobReadyText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#1D4ED8',
    },
});
