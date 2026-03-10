import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { STACKS } from '@truckmitr/stacks/stacks';

export default function KhatamitrAddExpense() {
    const colors = useColor();
    const { responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const navigation = useNavigation<any>();
    const { shadow } = useShadow();

    // state for active category
    const [selectedCategory, setSelectedCategory] = useState<string>('Diesel');

    const categories = [
        { id: 'Diesel', icon: 'local-gas-station' },
        { id: 'Toll', icon: 'add-road' },
        { id: 'Food', icon: 'restaurant' },
        { id: 'Mechanic', icon: 'build' },
        { id: 'Parking', icon: 'local-parking' },
        { id: 'Other', icon: 'more-horiz' },
    ];

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: responsiveWidth(4), borderBottomWidth: 1, borderBottomColor: colors.blackOpacity(0.05), backgroundColor: colors.white }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
                        <MaterialIcons name="arrow-back" size={24} color={colors.black} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: responsiveFontSize(2), fontWeight: 'bold', color: colors.black, marginLeft: 12 }}>Add Expense</Text>
                </View>
                <TouchableOpacity style={{ padding: 4, backgroundColor: colors.royalBlueOpacity(0.1), borderRadius: 20 }}>
                    <MaterialIcons name="help-outline" size={24} color={colors.royalBlue} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ padding: responsiveWidth(4), paddingBottom: responsiveWidth(24) }}>

                    {/* Voice Input Action */}
                    <View style={{ alignItems: 'center', paddingVertical: 24, backgroundColor: colors.white, borderRadius: 16, borderColor: colors.blackOpacity(0.05), borderWidth: 1, ...shadow, marginBottom: 24 }}>
                        <TouchableOpacity style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.royalBlue, justifyContent: 'center', alignItems: 'center', shadowColor: colors.royalBlue, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 8 }}>
                            <MaterialIcons name="mic" size={40} color={colors.white} />
                        </TouchableOpacity>
                        <Text style={{ marginTop: 16, fontSize: responsiveFontSize(1.8), fontWeight: 'bold', color: colors.royalBlue }}>Tap to Speak Expense</Text>
                        <Text style={{ marginTop: 4, fontSize: responsiveFontSize(1.2), color: colors.blackOpacity(0.5) }}>"Paid 2500 for Diesel at HP Petrol Pump"</Text>
                    </View>

                    {/* Amount Input */}
                    <View style={{ marginBottom: 24 }}>
                        <Text style={{ fontSize: responsiveFontSize(1.4), fontWeight: '600', color: colors.blackOpacity(0.7), textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>Amount</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderColor: colors.blackOpacity(0.1), borderWidth: 2, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 }}>
                            <Text style={{ fontSize: responsiveFontSize(2.8), fontWeight: 'bold', color: colors.blackOpacity(0.5), marginRight: 8 }}>₹</Text>
                            <TextInput
                                style={{ flex: 1, fontSize: responsiveFontSize(3), fontWeight: 'bold', color: colors.royalBlue }}
                                placeholder="0.00"
                                placeholderTextColor={colors.blackOpacity(0.5)}
                                keyboardType="numeric"
                                autoFocus
                            />
                        </View>
                    </View>

                    {/* Category Grid */}
                    <View style={{ marginBottom: 24 }}>
                        <Text style={{ fontSize: responsiveFontSize(1.4), fontWeight: '600', color: colors.blackOpacity(0.7), textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 }}>Category</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: responsiveWidth(3), justifyContent: 'space-between' }}>
                            {categories.map((cat, index) => {
                                const isSelected = cat.id === selectedCategory;
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => setSelectedCategory(cat.id)}
                                        style={{
                                            width: '31%',
                                            aspectRatio: 1,
                                            backgroundColor: isSelected ? colors.royalBlueOpacity(0.05) : colors.white,
                                            borderColor: isSelected ? colors.royalBlue : colors.blackOpacity(0.1),
                                            borderWidth: 2,
                                            borderRadius: 16,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            marginBottom: responsiveWidth(2)
                                        }}
                                    >
                                        <MaterialIcons name={cat.icon} size={32} color={isSelected ? colors.royalBlue : colors.blackOpacity(0.5)} style={{ marginBottom: 8 }} />
                                        <Text style={{ fontSize: responsiveFontSize(1.2), fontWeight: 'bold', color: isSelected ? colors.royalBlue : colors.black }}>{cat.id}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Notes and Receipt */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: responsiveFontSize(1.4), fontWeight: '600', color: colors.blackOpacity(0.7), textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>Notes</Text>
                        <TextInput
                            style={{ backgroundColor: colors.white, borderColor: colors.blackOpacity(0.1), borderWidth: 2, borderRadius: 16, padding: 16, fontSize: responsiveFontSize(1.6), color: colors.black, minHeight: 100, textAlignVertical: 'top' }}
                            placeholder="Add a brief description..."
                            placeholderTextColor={colors.blackOpacity(0.5)}
                            multiline
                        />
                    </View>

                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blackOpacity(0.02), borderColor: colors.blackOpacity(0.2), borderWidth: 2, borderStyle: 'dashed', borderRadius: 16, padding: 16 }}>
                        <MaterialIcons name="receipt-long" size={24} color={colors.blackOpacity(0.5)} style={{ marginRight: 8 }} />
                        <Text style={{ fontSize: responsiveFontSize(1.6), fontWeight: 'bold', color: colors.blackOpacity(0.5) }}>Upload Receipt</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Bottom Action Button */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: responsiveWidth(4), backgroundColor: 'rgba(255, 255, 255, 0.9)', borderTopWidth: 1, borderTopColor: colors.blackOpacity(0.05) }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ backgroundColor: colors.royalBlue, paddingVertical: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: colors.royalBlue, shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 4 }}>
                    <MaterialIcons name="save" size={24} color={colors.white} style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: responsiveFontSize(1.8), fontWeight: 'bold', color: colors.white }}>Save Expense</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
