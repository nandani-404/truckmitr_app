import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Image,
    StatusBar,
    Share,
    Clipboard,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigatorParams } from '@truckmitr/stacks/stacks';
import { useTranslation } from 'react-i18next';
import { showToast } from '@truckmitr/src/app/hooks/toast';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

interface TrainingModule {
    id: string;
    title: string;
    completed: boolean;
}

interface PendingTrainingDriver {
    id: string;
    name: string;
    tmId: string;
    mobile: string;
    image: string;
    trainingProgress: number; // 0 to 100
    completedModules: number;
    totalModules: number;
    currentModule: string;
    lastActive: string;
}

// Sample data
const DRIVERS: PendingTrainingDriver[] = [
    {
        id: '1',
        name: 'Rahul Kumar',
        tmId: 'TM2503UDPR00030',
        mobile: '+91 98765 12345',
        image: 'https://randomuser.me/api/portraits/men/32.jpg',
        trainingProgress: 40,
        completedModules: 2,
        totalModules: 5,
        currentModule: 'Safety Guidelines',
        lastActive: '2 days ago',
    },
    {
        id: '2',
        name: 'Vikram Singh',
        tmId: 'TM2503UDPR00031',
        mobile: '+91 87654 23456',
        image: 'https://randomuser.me/api/portraits/men/45.jpg',
        trainingProgress: 10,
        completedModules: 0,
        totalModules: 5,
        currentModule: 'Introduction to App',
        lastActive: '5 days ago',
    },
    {
        id: '3',
        name: 'Amit Patel',
        tmId: 'TM2503UDPR00032',
        mobile: '+91 76543 34567',
        image: 'https://randomuser.me/api/portraits/men/22.jpg',
        trainingProgress: 80,
        completedModules: 4,
        totalModules: 5,
        currentModule: 'Advanced Navigation',
        lastActive: '1 day ago',
    },
    {
        id: '4',
        name: 'Suresh Raina',
        tmId: 'TM2503UDPR00033',
        mobile: '+91 65432 45678',
        image: 'https://randomuser.me/api/portraits/men/18.jpg',
        trainingProgress: 0,
        completedModules: 0,
        totalModules: 5,
        currentModule: 'Introduction to App',
        lastActive: '1 week ago',
    },
];

const TrainingCard = ({ driver }: { driver: PendingTrainingDriver }) => {
    const { t } = useTranslation();

    const handleRemind = () => {
        const msg = `Hi ${driver.name}, please complete your pending training "${driver.currentModule}" on TruckMitr app to get verified!\n\nTM ID: ${driver.tmId}`;
        Share.share({ message: msg });
    };

    const handleCopy = () => {
        Clipboard.setString(`TM ID: ${driver.tmId}\nMobile: ${driver.mobile}`);
        showToast(t('copiedToClipboard', 'Copied!'));
    };

    // Determine progress color
    let progressColor = '#3B82F6'; // Blue default
    if (driver.trainingProgress > 75) progressColor = '#22C55E'; // Green
    else if (driver.trainingProgress < 30) progressColor = '#EF4444'; // Red

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Image source={{ uri: driver.image }} style={styles.avatar} />
                <View style={styles.cardInfo}>
                    <Text style={styles.name}>{driver.name}</Text>
                    <Text style={styles.tmId}>{driver.tmId}</Text>
                    <Text style={styles.lastActive}>Last active: {driver.lastActive}</Text>
                </View>
                <View style={styles.actions}>
                    <TouchableOpacity style={styles.remindBtn} onPress={handleRemind}>
                        <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
                        <Ionicons name="copy-outline" size={18} color="#64748B" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.progressSection}>
                <View style={styles.progressLabels}>
                    <Text style={styles.moduleText}>
                        Current: <Text style={styles.moduleName}>{driver.currentModule}</Text>
                    </Text>
                    <Text style={styles.percentageText}>{driver.trainingProgress}%</Text>
                </View>

                <View style={styles.progressBarContainer}>
                    <View
                        style={[
                            styles.progressBarFill,
                            { width: `${driver.trainingProgress}%`, backgroundColor: progressColor }
                        ]}
                    />
                </View>

                <Text style={styles.modulesCount}>
                    {driver.completedModules} of {driver.totalModules} modules completed
                </Text>
            </View>
        </View>
    );
};

export default function ForemanPendingTraining() {
    const navigation = useNavigation<NavigatorProp>();
    const safeAreaInsets = useSafeAreaInsets();

    const totalIncomplete = DRIVERS.filter(d => d.trainingProgress < 100).length;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: safeAreaInsets.top + 12 }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Pending Training</Text>
                    <Text style={styles.headerSubtitle}>{totalIncomplete} drivers have incomplete training</Text>
                </View>
            </View>

            <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                {DRIVERS.map((driver) => (
                    <TrainingCard key={driver.id} driver={driver} />
                ))}
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
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        gap: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#64748B',
    },
    list: {
        flex: 1,
    },
    listContent: {
        padding: 16,
        paddingBottom: 32,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
        backgroundColor: '#F3F4F6',
    },
    cardInfo: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2,
    },
    tmId: {
        fontSize: 12,
        color: '#6366F1',
        fontWeight: '600',
        marginBottom: 2,
    },
    lastActive: {
        fontSize: 11,
        color: '#94A3B8',
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    remindBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#22C55E',
        alignItems: 'center',
        justifyContent: 'center',
    },
    copyBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 4,
        marginBottom: 12,
    },
    progressSection: {
        gap: 8,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    moduleText: {
        fontSize: 12,
        color: '#64748B',
    },
    moduleName: {
        fontWeight: '600',
        color: '#475569',
    },
    percentageText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1F2937',
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    modulesCount: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '500',
    },
});
