import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ImageBackground, SafeAreaView, StatusBar, Dimensions } from 'react-native';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { STACKS } from '@truckmitr/stacks/stacks';

export default function KhatamitrActiveTrip() {
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
                    <View style={{ marginLeft: 12 }}>
                        <Text style={{ fontSize: responsiveFontSize(2), fontWeight: 'bold', color: colors.black }}>Trip Details</Text>
                        <Text style={{ fontSize: responsiveFontSize(1.4), color: colors.blackOpacity(0.5) }}>ID: TM-98421</Text>
                    </View>
                </View>
                <TouchableOpacity style={{ padding: 4 }}>
                    <MaterialIcons name="more-vert" size={24} color={colors.royalBlue} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: responsiveWidth(20) }}>
                {/* Map Preview */}
                <View style={{ padding: responsiveWidth(4) }}>
                    <ImageBackground
                        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBL84I7PTbgxN-Nob61_BJN9c-gQkLOaOO2smqM93AFZYSUjQt-I34sgEpLCPXM2dxShLYxmp5Te8NM8EQ-f1KfEOG2FgycV9VS7YRGhRDgOzSh21nzCbV1rzhbE1_3kj0eI8BC4DlEvm2eiDTgKFTMoFo64US_3DztecA_vKUhXf7SuAym-9a2Lbww1TcJifP8iI1t6oej7jzLB5N45DTXrsGHHI2WMa2iLl2PNKnAx80K3eUP8ysyFPjgMwfDWQ9wqZzJA4t09us' }}
                        style={{ width: '100%', height: responsiveWidth(50), borderRadius: 16, overflow: 'hidden', justifyContent: 'flex-start' }}
                    >
                        <View style={{ padding: 16 }}>
                            <View style={{ backgroundColor: colors.royalBlue, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' }}>
                                <Text style={{ color: colors.white, fontSize: responsiveFontSize(1.2), fontWeight: 'bold' }}>IN PROGRESS</Text>
                            </View>
                        </View>
                    </ImageBackground>

                    {/* Trip Info */}
                    <View style={{ ...shadow, backgroundColor: colors.white, marginTop: 16, padding: responsiveWidth(4), borderRadius: 16, borderColor: colors.blackOpacity(0.05), borderWidth: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <View>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: 'bold', color: colors.black }}>Delhi</Text>
                                    <MaterialIcons name="arrow-right-alt" size={20} color={colors.royalBlue} style={{ marginHorizontal: 8 }} />
                                    <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: 'bold', color: colors.black }}>Mumbai</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                    <MaterialIcons name="person" size={14} color={colors.blackOpacity(0.5)} style={{ marginRight: 4 }} />
                                    <Text style={{ fontSize: responsiveFontSize(1.6), color: colors.blackOpacity(0.5) }}>Rajesh Kumar</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                    <MaterialIcons name="local-shipping" size={14} color={colors.blackOpacity(0.5)} style={{ marginRight: 4 }} />
                                    <Text style={{ fontSize: responsiveFontSize(1.6), color: colors.blackOpacity(0.5) }}>HR-38-AS-9012</Text>
                                </View>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ fontSize: responsiveFontSize(1.2), color: colors.blackOpacity(0.5), fontWeight: 'bold' }}>EST. ARRIVAL</Text>
                                <Text style={{ fontSize: responsiveFontSize(1.6), color: colors.royalBlue, fontWeight: 'bold', marginTop: 4 }}>14 Oct, 08:30 PM</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Grid */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: responsiveWidth(4), gap: responsiveWidth(3), justifyContent: 'space-between' }}>
                    <View style={{ ...shadow, width: '48%', backgroundColor: colors.white, padding: responsiveWidth(4), borderRadius: 16, marginBottom: responsiveWidth(1) }}>
                        <Text style={{ fontSize: responsiveFontSize(1.2), color: colors.blackOpacity(0.5), fontWeight: '600' }}>FREIGHT</Text>
                        <Text style={{ fontSize: responsiveFontSize(2.4), color: colors.black, fontWeight: 'bold', marginTop: 4 }}>₹85,000</Text>
                        <Text style={{ fontSize: responsiveFontSize(1.2), color: 'green', fontWeight: 'bold', marginTop: 4 }}>+0% vs Target</Text>
                    </View>
                    <View style={{ ...shadow, width: '48%', backgroundColor: colors.white, padding: responsiveWidth(4), borderRadius: 16, marginBottom: responsiveWidth(1) }}>
                        <Text style={{ fontSize: responsiveFontSize(1.2), color: colors.blackOpacity(0.5), fontWeight: '600' }}>EXPENSES</Text>
                        <Text style={{ fontSize: responsiveFontSize(2.4), color: colors.black, fontWeight: 'bold', marginTop: 4 }}>₹32,400</Text>
                        <Text style={{ fontSize: responsiveFontSize(1.2), color: 'red', fontWeight: 'bold', marginTop: 4 }}>+5% Over Limit</Text>
                    </View>
                    <View style={{ ...shadow, width: '48%', backgroundColor: '#EFF6FF', padding: responsiveWidth(4), borderRadius: 16 }}>
                        <Text style={{ fontSize: responsiveFontSize(1.2), color: colors.royalBlue, fontWeight: 'bold' }}>CURRENT PROFIT</Text>
                        <Text style={{ fontSize: responsiveFontSize(2.4), color: colors.royalBlue, fontWeight: 'bold', marginTop: 4 }}>₹52,600</Text>
                        <Text style={{ fontSize: responsiveFontSize(1.2), color: colors.royalBlue, opacity: 0.8, marginTop: 4 }}>Net Margin 61%</Text>
                    </View>
                    <View style={{ ...shadow, width: '48%', backgroundColor: colors.white, padding: responsiveWidth(4), borderRadius: 16 }}>
                        <Text style={{ fontSize: responsiveFontSize(1.2), color: colors.blackOpacity(0.5), fontWeight: '600' }}>DISTANCE</Text>
                        <Text style={{ fontSize: responsiveFontSize(2.4), color: colors.black, fontWeight: 'bold', marginTop: 4 }}>740 km</Text>
                        <Text style={{ fontSize: responsiveFontSize(1.2), color: colors.royalBlue, fontWeight: 'bold', marginTop: 4 }}>45% Completed</Text>
                    </View>
                </View>

                {/* Recent Expenses List */}
                <View style={{ padding: responsiveWidth(4), marginTop: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: 'bold', color: colors.black }}>Recent Expenses</Text>
                        <TouchableOpacity onPress={() => navigation.navigate(STACKS.KHATAMITR_EXPENSE_SUMMARY)}>
                            <Text style={{ fontSize: responsiveFontSize(1.4), color: colors.royalBlue, fontWeight: 'bold' }}>View All</Text>
                        </TouchableOpacity>
                    </View>
                    <ExpenseItem icon="local-gas-station" color="orange" title="Diesel Refill" subtitle="HP Petrol Pump, Jaipur" amount="₹12,400" time="2h ago" />
                    <ExpenseItem icon="payments" color="blue" title="FastTag Toll" subtitle="NH-48 NHAI Plaza" amount="₹2,850" time="5h ago" />
                    <ExpenseItem icon="build" color="red" title="Tyre Repair" subtitle="National Garage, Rewari" amount="₹1,200" time="Yesterday" />
                    <ExpenseItem icon="restaurant" color="green" title="Driver Allowance" subtitle="Meal & Stay - Day 1" amount="₹500" time="Yesterday" />
                </View>
            </ScrollView>

            {/* Floating FAB for Add Expense */}
            <TouchableOpacity onPress={() => navigation.navigate(STACKS.KHATAMITR_ADD_EXPENSE)} style={{ position: 'absolute', bottom: responsiveWidth(6), right: responsiveWidth(6), width: 64, height: 64, borderRadius: 32, backgroundColor: colors.royalBlue, justifyContent: 'center', alignItems: 'center', shadowColor: colors.royalBlue, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 8 }}>
                <MaterialIcons name="add" size={32} color={colors.white} />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const ExpenseItem = ({ icon, color, title, subtitle, amount, time }: any) => {
    const { responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const colors = useColor() as any;
    const shadow = useShadow().shadow;
    const bgColors: any = {
        orange: 'rgba(255, 165, 0, 0.15)',
        blue: 'rgba(0, 0, 255, 0.1)',
        red: 'rgba(255, 0, 0, 0.1)',
        green: 'rgba(0, 128, 0, 0.1)'
    };
    const iconColors: any = {
        orange: '#EA580C',
        blue: '#2563EB',
        red: '#DC2626',
        green: '#16A34A'
    };
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, padding: 12, borderRadius: 16, marginBottom: 12, ...shadow, borderColor: colors.blackOpacity(0.04), borderWidth: 1 }}>
            <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: bgColors[color], justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                <MaterialIcons name={icon} size={24} color={iconColors[color]} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: responsiveFontSize(1.6), fontWeight: 'bold', color: colors.black }}>{title}</Text>
                <Text style={{ fontSize: responsiveFontSize(1.4), color: colors.blackOpacity(0.5), marginTop: 2 }}>{subtitle}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: responsiveFontSize(1.8), fontWeight: 'bold', color: colors.black }}>{amount}</Text>
                <Text style={{ fontSize: responsiveFontSize(1.2), color: colors.blackOpacity(0.5), marginTop: 2 }}>{time}</Text>
            </View>
        </View>
    );
}
