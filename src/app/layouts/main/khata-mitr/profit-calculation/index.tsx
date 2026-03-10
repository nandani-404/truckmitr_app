import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, ImageBackground } from 'react-native';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { STACKS } from '@truckmitr/stacks/stacks';

export default function KhatamitrProfitCalculation() {
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
                    <Text style={{ fontSize: responsiveFontSize(2), fontWeight: 'bold', color: colors.black, marginLeft: 12 }}>Profit Calculation</Text>
                </View>
                <TouchableOpacity style={{ padding: 4 }}>
                    <MaterialIcons name="more-vert" size={24} color={colors.black} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: responsiveWidth(4), paddingBottom: responsiveWidth(24) }}>
                {/* Trip Identity Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <View>
                        <Text style={{ fontSize: responsiveFontSize(1.4), fontWeight: '500', color: colors.blackOpacity(0.5) }}>Trip ID</Text>
                        <Text style={{ fontSize: responsiveFontSize(2), fontWeight: 'bold', color: colors.royalBlue, marginTop: 4 }}>TM-98234</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: responsiveFontSize(1.4), fontWeight: '500', color: colors.blackOpacity(0.5) }}>Date</Text>
                        <Text style={{ fontSize: responsiveFontSize(1.8), fontWeight: '500', color: colors.black, marginTop: 4 }}>Oct 24, 2023</Text>
                    </View>
                </View>

                {/* Main Financial Card */}
                <View style={{ backgroundColor: colors.white, borderRadius: 16, borderColor: colors.blackOpacity(0.05), borderWidth: 1, overflow: 'hidden', ...shadow, marginBottom: 24 }}>
                    <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: colors.blackOpacity(0.05), backgroundColor: colors.royalBlueOpacity(0.05) }}>
                        <Text style={{ fontSize: responsiveFontSize(1.4), fontWeight: '600', color: colors.royalBlue, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Financial Summary</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                            <Text style={{ fontSize: responsiveFontSize(3.6), fontWeight: 'bold', color: colors.black, marginRight: 8 }}>₹1,20,000</Text>
                            <Text style={{ fontSize: responsiveFontSize(1.4), fontWeight: '500', color: colors.blackOpacity(0.5) }}>Total Revenue</Text>
                        </View>
                    </View>

                    <View style={{ padding: 20, gap: 16 }}>
                        <FinancialRow icon="local-shipping" iconColor="#2563EB" bg="#DBEAFE" label="Freight Amount" amount="₹1,20,000" amountColor={colors.black} />
                        <FinancialRow icon="payments" iconColor="#EA580C" bg="#FFEDD5" label="Total Expenses" amount="-₹65,000" amountColor="#EA580C" />
                        <FinancialRow icon="account-balance-wallet" iconColor="#9333EA" bg="#F3E8FF" label="Driver Advance" amount="-₹10,000" amountColor="#9333EA" />

                        <View style={{ paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.blackOpacity(0.3), borderStyle: 'dashed', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ fontSize: responsiveFontSize(1.6), fontWeight: '500', color: colors.blackOpacity(0.5) }}>Remaining Balance</Text>
                            <Text style={{ fontSize: responsiveFontSize(2), fontWeight: '500', color: colors.black }}>₹45,000</Text>
                        </View>
                    </View>

                    {/* Final Profit Highlight Section */}
                    <View style={{ backgroundColor: '#10B981', padding: 24, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#D1FAE5', fontSize: responsiveFontSize(1.4), fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Final Net Profit</Text>
                        <Text style={{ color: colors.white, fontSize: responsiveFontSize(4.8), fontWeight: '900' }}>₹45,000</Text>

                        <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                            <MaterialIcons name="trending-up" size={16} color={colors.white} style={{ marginRight: 4 }} />
                            <Text style={{ color: colors.white, fontSize: responsiveFontSize(1.2), fontWeight: '600' }}>37.5% Margin</Text>
                        </View>
                    </View>
                </View>

                {/* Visual Map/Route Context */}
                <View style={{ height: 160, borderRadius: 16, overflow: 'hidden', ...shadow, marginBottom: 24, borderColor: colors.blackOpacity(0.05), borderWidth: 1 }}>
                    <ImageBackground
                        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBL84I7PTbgxN-Nob61_BJN9c-gQkLOaOO2smqM93AFZYSUjQt-I34sgEpLCPXM2dxShLYxmp5Te8NM8EQ-f1KfEOG2FgycV9VS7YRGhRDgOzSh21nzCbV1rzhbE1_3kj0eI8BC4DlEvm2eiDTgKFTMoFo64US_3DztecA_vKUhXf7SuAym-9a2Lbww1TcJifP8iI1t6oej7jzLB5N45DTXrsGHHI2WMa2iLl2PNKnAx80K3eUP8ysyFPjgMwfDWQ9wqZzJA4t09us' }}
                        style={{ width: '100%', height: '100%' }}
                    >
                        <View style={{ position: 'absolute', bottom: 12, left: 12, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, flexDirection: 'row', alignItems: 'center', borderColor: colors.blackOpacity(0.05), borderWidth: 1 }}>
                            <MaterialIcons name="route" size={16} color={colors.royalBlue} style={{ marginRight: 8 }} />
                            <Text style={{ fontSize: responsiveFontSize(1.2), fontWeight: 'bold', color: colors.blackOpacity(0.5), textTransform: 'uppercase', letterSpacing: -0.5 }}>Mumbai → Delhi (1,400 KM)</Text>
                        </View>
                    </ImageBackground>
                </View>

                {/* Action Button */}
                <TouchableOpacity style={{ backgroundColor: colors.royalBlue, paddingVertical: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: colors.royalBlue, shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 4 }}>
                    <MaterialIcons name="description" size={24} color={colors.white} style={{ marginRight: 12 }} />
                    <Text style={{ fontSize: responsiveFontSize(1.8), fontWeight: 'bold', color: colors.white }}>Generate Trip Report</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const FinancialRow = ({ icon, iconColor, bg, label, amount, amountColor }: any) => {
    const { responsiveFontSize } = useResponsiveScale();
    const colors = useColor();
    return (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ padding: 8, backgroundColor: bg, borderRadius: 8, marginRight: 12 }}>
                    <MaterialIcons name={icon} size={20} color={iconColor} />
                </View>
                <Text style={{ fontSize: responsiveFontSize(1.6), fontWeight: '500', color: colors.blackOpacity(0.8) }}>{label}</Text>
            </View>
            <Text style={{ fontSize: responsiveFontSize(2), fontWeight: '600', color: amountColor }}>{amount}</Text>
        </View>
    );
};
