import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Image } from 'react-native';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { STACKS } from '@truckmitr/stacks/stacks';

export default function KhatamitrTripCompletion() {
    const colors = useColor();
    const { responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const navigation = useNavigation<any>();
    const { shadow } = useShadow();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: responsiveWidth(4), borderBottomWidth: 1, borderBottomColor: colors.blackOpacity(0.05), backgroundColor: colors.white }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20 }}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.royalBlue} />
                </TouchableOpacity>
                <Text style={{ flex: 1, textAlign: 'center', fontSize: responsiveFontSize(1.8), fontWeight: 'bold', color: colors.black }}>Trip Summary</Text>
                <TouchableOpacity style={{ padding: 4, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20 }}>
                    <MaterialIcons name="more-vert" size={24} color={colors.blackOpacity(0.5)} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: responsiveWidth(24) }}>
                {/* Success Banner */}
                <View style={{ padding: 24, paddingVertical: 32, alignItems: 'center' }}>
                    <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                        <MaterialIcons name="check-circle" size={36} color="#16A34A" />
                    </View>
                    <Text style={{ fontSize: responsiveFontSize(2.4), fontWeight: 'bold', color: colors.black, textAlign: 'center', marginBottom: 4 }}>Trip Successfully Completed!</Text>
                    <Text style={{ fontSize: responsiveFontSize(1.4), color: colors.blackOpacity(0.5), textAlign: 'center' }}>Trip ID: TM-98421 • Delhi to Mumbai</Text>
                </View>

                {/* Route Visualization */}
                <View style={{ paddingHorizontal: responsiveWidth(4), marginBottom: 24 }}>
                    <View style={{ height: 128, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.blackOpacity(0.2) }}>
                        <Image
                            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDpI0ksMRiK_1dnRX-DuhdumKT9tQve-IGJiOmguS0Y7QzC_ba1rdTbuqqKlCc5W4STlEXtU2qCT6tZ850epDrVB0E2HLo9IdXZ0ZxbyPoQQJgi78U6NgGc1hxdevHB2oUYfL4jUt_OD5k0DDrDjDz_cPslPOhU13TaDogzvsm7EMDUIOhADr0VDhZTzTlaHO_l4Q9tmNtU3ehu4d8M76Dz3McTdUwXt1TJ_zcmsAH7MydCB4yJGFvtdA_tL7tAvLlaldCSMjJMpvs' }}
                            style={{ width: '100%', height: '100%', opacity: 0.6 }}
                            resizeMode="cover"
                        />
                        <View style={{ position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 24, ...shadow, borderColor: 'rgba(0,0,0,0.05)', borderWidth: 1 }}>
                                <Text style={{ fontSize: responsiveFontSize(1.2), fontWeight: 'bold', color: colors.royalBlue, textTransform: 'uppercase' }}>Del</Text>
                                <View style={{ width: 48, height: 1, backgroundColor: colors.blackOpacity(0.5), marginHorizontal: 8, borderStyle: 'dashed' }} />
                                <MaterialIcons name="local-shipping" size={16} color={colors.royalBlue} />
                                <View style={{ width: 48, height: 1, backgroundColor: colors.blackOpacity(0.5), marginHorizontal: 8, borderStyle: 'dashed' }} />
                                <Text style={{ fontSize: responsiveFontSize(1.2), fontWeight: 'bold', color: colors.royalBlue, textTransform: 'uppercase' }}>Bom</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Financial Summary Grid */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: responsiveWidth(4), gap: responsiveWidth(3), justifyContent: 'space-between' }}>
                    {/* Freight Earned */}
                    <View style={{ ...shadow, width: '48%', backgroundColor: colors.white, padding: responsiveWidth(5), borderRadius: 16, marginBottom: responsiveWidth(1), borderColor: colors.blackOpacity(0.05), borderWidth: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <MaterialIcons name="payments" size={20} color={colors.royalBlue} />
                            <Text style={{ fontSize: responsiveFontSize(1.2), fontWeight: '600', color: colors.blackOpacity(0.5), textTransform: 'uppercase', letterSpacing: 1, marginLeft: 8 }}>Freight</Text>
                        </View>
                        <Text style={{ fontSize: responsiveFontSize(2.4), fontWeight: 'bold', color: colors.black }}>₹85,000</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 8 }}>
                            <MaterialIcons name="trending-up" size={12} color="#16A34A" />
                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#16A34A', marginLeft: 4 }}>15%</Text>
                        </View>
                    </View>

                    {/* Total Expenses */}
                    <View style={{ ...shadow, width: '48%', backgroundColor: colors.white, padding: responsiveWidth(5), borderRadius: 16, marginBottom: responsiveWidth(1), borderColor: colors.blackOpacity(0.05), borderWidth: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <MaterialIcons name="receipt-long" size={20} color={colors.blackOpacity(0.5)} />
                            <Text style={{ fontSize: responsiveFontSize(1.2), fontWeight: '600', color: colors.blackOpacity(0.5), textTransform: 'uppercase', letterSpacing: 1, marginLeft: 8 }}>Expenses</Text>
                        </View>
                        <Text style={{ fontSize: responsiveFontSize(2.4), fontWeight: 'bold', color: colors.black }}>₹42,500</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.blackOpacity(0.1), alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 8 }}>
                            <MaterialIcons name="remove" size={12} color={colors.blackOpacity(0.5)} />
                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.blackOpacity(0.5), marginLeft: 4 }}>Budgeted</Text>
                        </View>
                    </View>

                    {/* Net Profit */}
                    <View style={{ width: '100%', backgroundColor: colors.royalBlue, padding: responsiveWidth(5), borderRadius: 16, marginBottom: responsiveWidth(3), ...shadow, shadowColor: colors.royalBlue, shadowOpacity: 0.2 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <View>
                                <Text style={{ fontSize: responsiveFontSize(1.2), fontWeight: '600', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Net Profit</Text>
                                <Text style={{ fontSize: responsiveFontSize(3), fontWeight: 'bold', color: colors.white }}>₹42,500</Text>
                            </View>
                            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 8 }}>
                                <MaterialIcons name="account-balance-wallet" size={24} color={colors.white} />
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginRight: 8 }}>
                                <Text style={{ fontSize: responsiveFontSize(1.2), color: colors.white }}>50% Margin</Text>
                            </View>
                            <Text style={{ fontSize: responsiveFontSize(1.2), color: 'rgba(255,255,255,0.8)', fontWeight: '500' }}>Excellent Performance</Text>
                        </View>
                    </View>

                    {/* Driver Settlement */}
                    <View style={{ width: '100%', backgroundColor: colors.white, padding: responsiveWidth(5), borderRadius: 16, borderColor: colors.blackOpacity(0.05), borderWidth: 1, ...shadow }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.blackOpacity(0.05), justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                    <MaterialIcons name="person" size={20} color={colors.blackOpacity(0.5)} />
                                </View>
                                <View>
                                    <Text style={{ fontSize: responsiveFontSize(1.2), fontWeight: '600', color: colors.blackOpacity(0.5), textTransform: 'uppercase', letterSpacing: 1 }}>Driver Settlement</Text>
                                    <Text style={{ fontSize: responsiveFontSize(1.8), fontWeight: 'bold', color: colors.black, marginTop: 2 }}>₹12,000</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.royalBlueOpacity(0.05) }}>
                                <Text style={{ fontSize: responsiveFontSize(1.4), fontWeight: 'bold', color: colors.royalBlue }}>Settle Now</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={{ padding: responsiveWidth(4), marginTop: 16, gap: 12 }}>
                    <TouchableOpacity style={{ backgroundColor: colors.royalBlue, paddingVertical: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', ...shadow }}>
                        <MaterialIcons name="picture-as-pdf" size={20} color={colors.white} style={{ marginRight: 8 }} />
                        <Text style={{ fontSize: responsiveFontSize(1.6), fontWeight: 'bold', color: colors.white }}>Download PDF Report</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ backgroundColor: colors.white, paddingVertical: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderColor: colors.royalBlue, borderWidth: 2 }}>
                        <MaterialIcons name="share" size={20} color={colors.royalBlue} style={{ marginRight: 8 }} />
                        <Text style={{ fontSize: responsiveFontSize(1.6), fontWeight: 'bold', color: colors.royalBlue }}>Share Report</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}
