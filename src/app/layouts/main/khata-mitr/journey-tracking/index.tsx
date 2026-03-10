import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, StyleSheet } from 'react-native';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle, G, Text as SvgText } from 'react-native-svg';

export default function KhatamitrJourneyTracking() {
    const colors = useColor();
    const { responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const navigation = useNavigation<any>();
    const { shadow } = useShadow();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: responsiveWidth(4), borderBottomWidth: 1, borderBottomColor: colors.blackOpacity(0.05), backgroundColor: colors.white, zIndex: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, backgroundColor: colors.blackOpacity(0.05), borderRadius: 20 }}>
                        <MaterialIcons name="arrow-back" size={24} color={colors.blackOpacity(0.6)} />
                    </TouchableOpacity>
                    <View style={{ marginLeft: 12 }}>
                        <Text style={{ fontSize: responsiveFontSize(1.8), fontWeight: 'bold', color: colors.black }}>Trip #TM-8829</Text>
                        <Text style={{ fontSize: responsiveFontSize(1.2), fontWeight: '500', color: colors.blackOpacity(0.5), marginTop: 2 }}>MUMBAI → DELHI</Text>
                    </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity style={{ padding: 8, backgroundColor: colors.royalBlueOpacity(0.1), borderRadius: 20, marginRight: 8 }}>
                        <MaterialIcons name="share" size={24} color={colors.royalBlue} />
                    </TouchableOpacity>
                    <TouchableOpacity style={{ padding: 8, backgroundColor: colors.royalBlue, borderRadius: 20 }}>
                        <MaterialIcons name="sos" size={24} color={colors.white} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ flex: 1, position: 'relative' }}>
                {/* Map Simulation Area */}
                <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.blackOpacity(0.1) }]}>
                    <Svg width="100%" height="100%">
                        <Path d="M100,600 Q250,450 400,300 T700,100" fill="none" stroke="#CBD5E1" strokeLinecap="round" strokeWidth="8" />
                        <Path d="M100,600 Q250,450 400,300" fill="none" stroke={colors.royalBlue} strokeLinecap="round" strokeWidth="8" />

                        <G transform="translate(390, 290)">
                            <Circle cx="10" cy="10" r="20" fill={colors.royalBlue} fillOpacity={0.2} />
                            <Circle cx="10" cy="10" r="12" fill={colors.royalBlue} />
                            <SvgText x="1" y="14" fill={colors.white} fontSize="14" fontWeight="bold">T</SvgText>
                        </G>
                    </Svg>

                    {/* Map Controls */}
                    <View style={{ position: 'absolute', right: 16, top: 16, gap: 8 }}>
                        <TouchableOpacity style={{ width: 40, height: 40, backgroundColor: colors.white, borderRadius: 8, justifyContent: 'center', alignItems: 'center', ...shadow }}>
                            <MaterialIcons name="add" size={24} color={colors.blackOpacity(0.6)} />
                        </TouchableOpacity>
                        <TouchableOpacity style={{ width: 40, height: 40, backgroundColor: colors.white, borderRadius: 8, justifyContent: 'center', alignItems: 'center', ...shadow }}>
                            <MaterialIcons name="remove" size={24} color={colors.blackOpacity(0.6)} />
                        </TouchableOpacity>
                        <TouchableOpacity style={{ width: 40, height: 40, backgroundColor: colors.white, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 8, ...shadow }}>
                            <MaterialIcons name="my-location" size={24} color={colors.royalBlue} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Floating Status Cards */}
                <View style={{ position: 'absolute', top: 16, left: 0, right: 0, zIndex: 10 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
                        <View style={{ minWidth: 140, padding: 16, backgroundColor: colors.white, borderRadius: 12, ...shadow, borderBottomWidth: 4, borderBottomColor: colors.royalBlue, marginRight: 12 }}>
                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.blackOpacity(0.5), textTransform: 'uppercase', letterSpacing: 1 }}>Covered</Text>
                            <Text style={{ fontSize: responsiveFontSize(2), fontWeight: 'bold', color: colors.royalBlue, marginTop: 4 }}>450 <Text style={{ fontSize: responsiveFontSize(1.4), fontWeight: '500' }}>km</Text></Text>
                        </View>
                        <View style={{ minWidth: 140, padding: 16, backgroundColor: colors.white, borderRadius: 12, ...shadow, borderBottomWidth: 4, borderBottomColor: '#CBD5E1', marginRight: 12 }}>
                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.blackOpacity(0.5), textTransform: 'uppercase', letterSpacing: 1 }}>Remaining</Text>
                            <Text style={{ fontSize: responsiveFontSize(2), fontWeight: 'bold', color: colors.blackOpacity(0.8), marginTop: 4 }}>780 <Text style={{ fontSize: responsiveFontSize(1.4), fontWeight: '500' }}>km</Text></Text>
                        </View>
                        <View style={{ minWidth: 140, padding: 16, backgroundColor: colors.royalBlue, borderRadius: 12, ...shadow }}>
                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 1 }}>ETA</Text>
                            <Text style={{ fontSize: responsiveFontSize(2), fontWeight: 'bold', color: colors.white, marginTop: 4 }}>14h 30m</Text>
                        </View>
                    </ScrollView>
                </View>

                {/* Bottom Sheet / Timeline */}
                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 8, paddingHorizontal: 24, paddingBottom: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: -10 }, shadowRadius: 25, elevation: 20, zIndex: 20 }}>
                    <View style={{ alignItems: 'center', marginBottom: 16 }}>
                        <View style={{ width: 48, height: 6, backgroundColor: colors.blackOpacity(0.2), borderRadius: 4 }} />
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Text style={{ fontSize: responsiveFontSize(1.8), fontWeight: 'bold', color: colors.black }}>Trip Timeline</Text>
                        <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#15803D', textTransform: 'uppercase' }}>On Schedule</Text>
                        </View>
                    </View>

                    {/* Timeline Items */}
                    <ScrollView style={{ height: 200 }} showsVerticalScrollIndicator={false}>
                        <View style={{ paddingLeft: 16, position: 'relative' }}>
                            <View style={{ position: 'absolute', left: 16, top: 0, bottom: 0, width: 2, backgroundColor: '#CBD5E1' }} />

                            <TimelineItem icon="build" bg="#F97316" title="Repair Event" time="10:45 AM" desc="Tyre pressure check at Highway Point B" isActive />
                            <TimelineItem icon="toll" bg={colors.royalBlue} title="Toll Crossed" time="08:20 AM" desc="Kherki Daula Toll Plaza - ₹350 Deducted" isActive />
                            <TimelineItem icon="local-gas-station" bg={colors.royalBlue} title="Fuel Stop" time="05:15 AM" desc="Filled 150L at Reliance Petroleum" isFaded />
                            <TimelineItem icon="play-arrow" bg={colors.royalBlue} title="Trip Started" time="04:00 AM" desc="Departure from Mumbai Logistics Hub" isFaded />
                        </View>
                    </ScrollView>
                </View>
            </View>
        </SafeAreaView>
    );
}

const TimelineItem = ({ icon, bg, title, time, desc, isActive, isFaded }: any) => {
    const { responsiveFontSize } = useResponsiveScale();
    const colors = useColor();
    return (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24, opacity: isFaded ? 0.75 : 1 }}>
            <View style={{ position: 'absolute', left: -16, top: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: bg, borderWidth: 4, borderColor: colors.white, justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
                <MaterialIcons name={icon} size={12} color={colors.white} />
            </View>
            <View style={{ marginLeft: 32, flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={{ fontSize: responsiveFontSize(1.4), fontWeight: '600', color: colors.black }}>{title}</Text>
                    <Text style={{ fontSize: 10, color: colors.blackOpacity(0.5) }}>{time}</Text>
                </View>
                <Text style={{ fontSize: responsiveFontSize(1.2), color: colors.blackOpacity(0.5), marginTop: 4 }}>{desc}</Text>
            </View>
        </View>
    );
};
