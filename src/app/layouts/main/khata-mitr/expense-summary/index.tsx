import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';

export default function KhatamitrExpenseSummary() {
    const colors = useColor();
    const { responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const navigation = useNavigation<any>();
    const { shadow } = useShadow();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: responsiveWidth(4), borderBottomWidth: 1, borderBottomColor: colors.blackOpacity(0.05), backgroundColor: colors.white }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
                        <MaterialIcons name="arrow-back" size={24} color={colors.royalBlue} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: responsiveFontSize(2), fontWeight: 'bold', color: colors.black, marginLeft: 12 }}>Expense Summary</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity style={{ padding: 8 }}>
                        <MaterialIcons name="share" size={24} color={colors.blackOpacity(0.5)} />
                    </TouchableOpacity>
                    <TouchableOpacity style={{ padding: 8 }}>
                        <MaterialIcons name="more-vert" size={24} color={colors.blackOpacity(0.5)} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: responsiveWidth(24) }}>
                {/* Trip Info Card */}
                <View style={{ padding: responsiveWidth(4) }}>
                    <View style={{ backgroundColor: colors.royalBlue, padding: 24, borderRadius: 16, shadowColor: colors.royalBlue, shadowOpacity: 0.2, shadowOffset: { width: 0, height: 8 }, shadowRadius: 16, elevation: 8 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                            <View>
                                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: responsiveFontSize(1.4), fontWeight: '500' }}>Trip ID: #TM-99210</Text>
                                <Text style={{ color: colors.white, fontSize: responsiveFontSize(2.4), fontWeight: 'bold', marginTop: 4 }}>Delhi to Mumbai</Text>
                            </View>
                            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 }}>
                                <Text style={{ color: colors.white, fontSize: responsiveFontSize(1.2), fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>Completed</Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <View>
                                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: responsiveFontSize(1.4) }}>Total Trip Expense</Text>
                                <Text style={{ color: colors.white, fontSize: responsiveFontSize(3.2), fontWeight: 'bold' }}>₹45,200</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: responsiveFontSize(1.2) }}>Distance Covered</Text>
                                <Text style={{ color: colors.white, fontSize: responsiveFontSize(1.8), fontWeight: '600' }}>1,420 km</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Visual Breakdown */}
                <View style={{ padding: responsiveWidth(4), paddingTop: 8 }}>
                    <View style={{ backgroundColor: colors.white, padding: 24, borderRadius: 16, borderColor: colors.blackOpacity(0.05), borderWidth: 1, ...shadow }}>
                        <Text style={{ fontSize: responsiveFontSize(2), fontWeight: 'bold', color: colors.black, marginBottom: 24 }}>Cost Distribution</Text>

                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: 24 }}>
                            {/* Donut Chart */}
                            <View style={{ width: 140, height: 140, justifyContent: 'center', alignItems: 'center' }}>
                                <Svg width="140" height="140" viewBox="0 0 36 36" style={{ transform: [{ rotate: '-90deg' }] }}>
                                    <Circle stroke={colors.royalBlue} cx="18" cy="18" fill="none" r="16" strokeDasharray="60, 100" strokeLinecap="round" strokeWidth="4" />
                                    <Circle stroke="#38BDF8" cx="18" cy="18" fill="none" r="16" strokeDasharray="20, 100" strokeDashoffset="-60" strokeLinecap="round" strokeWidth="4" />
                                    <Circle stroke="#818CF8" cx="18" cy="18" fill="none" r="16" strokeDasharray="10, 100" strokeDashoffset="-80" strokeLinecap="round" strokeWidth="4" />
                                    <Circle stroke={colors.blackOpacity(0.3)} cx="18" cy="18" fill="none" r="16" strokeDasharray="10, 100" strokeDashoffset="-90" strokeLinecap="round" strokeWidth="4" />
                                </Svg>
                                <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center' }}>
                                    <Text style={{ fontSize: responsiveFontSize(1.2), color: colors.blackOpacity(0.5), fontWeight: 'bold', textTransform: 'uppercase' }}>Budget</Text>
                                    <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: 'bold', color: colors.black }}>100%</Text>
                                </View>
                            </View>

                            {/* Legend */}
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 120, gap: 12 }}>
                                <LegendItem title="Diesel" color={colors.royalBlue} />
                                <LegendItem title="Tolls" color="#38BDF8" />
                                <LegendItem title="Food" color="#818CF8" />
                                <LegendItem title="Repair" color={colors.blackOpacity(0.3)} />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Detailed List */}
                <View style={{ padding: responsiveWidth(4) }}>
                    <Text style={{ fontSize: responsiveFontSize(2), fontWeight: 'bold', color: colors.black, marginBottom: 16 }}>Detailed Breakdown</Text>

                    <BreakdownItem icon="local-gas-station" color={colors.royalBlue} title="Diesel" desc="62% of total expense" amount="₹28,024" status="High" statusColor={colors.royalBlue} />
                    <BreakdownItem icon="toll" color="#0284C7" title="Toll Charges" desc="20% of total expense" amount="₹9,040" status="Normal" statusColor={colors.blackOpacity(0.5)} />
                    <BreakdownItem icon="restaurant" color="#4F46E5" title="Food & Boarding" desc="10% of total expense" amount="₹4,520" status="Normal" statusColor={colors.blackOpacity(0.5)} />
                    <BreakdownItem icon="build" color={colors.blackOpacity(0.5)} title="Maintenance/Repair" desc="8% of total expense" amount="₹3,616" status="Low" statusColor="green" />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const LegendItem = ({ title, color }: any) => {
    const { responsiveFontSize } = useResponsiveScale();
    const colors = useColor();
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', width: '45%' }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color, marginRight: 8 }} />
            <Text style={{ fontSize: responsiveFontSize(1.4), fontWeight: '500', color: colors.black }}>{title}</Text>
        </View>
    );
};

const BreakdownItem = ({ icon, color, title, desc, amount, status, statusColor }: any) => {
    const { responsiveFontSize } = useResponsiveScale();
    const colors = useColor();
    const { shadow } = useShadow();
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: colors.white, borderRadius: 16, marginBottom: 12, borderColor: colors.blackOpacity(0.04), borderWidth: 1, ...shadow }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: color + '1A', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                    <MaterialIcons name={icon} size={24} color={color} />
                </View>
                <View>
                    <Text style={{ fontSize: responsiveFontSize(1.6), fontWeight: 'bold', color: colors.black }}>{title}</Text>
                    <Text style={{ fontSize: responsiveFontSize(1.2), color: colors.blackOpacity(0.5), marginTop: 2 }}>{desc}</Text>
                </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: responsiveFontSize(1.8), fontWeight: 'bold', color: colors.black }}>{amount}</Text>
                <Text style={{ fontSize: responsiveFontSize(1), color: statusColor, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>{status}</Text>
            </View>
        </View>
    );
};
