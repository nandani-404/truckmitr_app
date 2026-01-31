import React, { useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDhabhaProfile } from '../DhabhaProfileContext';
import { Space } from '@truckmitr/src/app/components';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles } from '../styles';
import { useColor } from '@truckmitr/src/app/hooks';
import { showToast } from '@truckmitr/src/app/hooks/toast';

const getOfferTypes = (t: any) => [
    { id: 'discount_offer', label: t('discountOffer'), icon: 'cash-outline', subtitle: t('discountSubtitle') },
    { id: 'combo_deal', label: t('comboDeal'), icon: 'restaurant-outline', subtitle: t('comboSubtitle') },
    { id: 'group_offer', label: t('groupOffer'), icon: 'people-outline', subtitle: t('groupSubtitle') },
    { id: 'free_facility', label: t('freeFacility'), icon: 'gift-outline', subtitle: t('freeFacilitySubtitle') },
    { id: 'time_offer', label: t('timeOfferLabel'), icon: 'time-outline', subtitle: t('timeOfferSubtitle') },
    { id: 'custom_offer', label: t('customOffer'), icon: 'create-outline', subtitle: t('customOfferSubtitle') },
];

const DriverOfferTab = () => {
    const { t } = useTranslation();
    const offerTypes = getOfferTypes(t);
    const { profileData, setProfileData } = useDhabhaProfile();
    const colors = useColor();
    const [saving, setSaving] = useState(false);

    const handleSave = () => {
        setSaving(true);
        // Placeholder for API call
        setTimeout(() => {
            showToast(t('offersSavedSuccessLocal'));
            setSaving(false);
        }, 1000);
    };
    const [activeOfferType, setActiveOfferType] = useState<string | null>(null);

    const selectedOffers = profileData.driver_offers || [];
    const currentOfferDetails = profileData.offer_details || {};

    const updateUserOffers = (offers: string[]) => {
        setProfileData(prev => ({ ...prev, driver_offers: offers }));
    };

    const updateOfferDetails = (offerId: string, updates: any) => {
        setProfileData(prev => ({
            ...prev,
            offer_details: {
                ...prev.offer_details,
                [offerId]: {
                    ...(prev.offer_details[offerId] || {}),
                    ...updates,
                }
            }
        }));
    };

    const toggleOffer = (offerId: string) => {
        if (activeOfferType === offerId) {
            setActiveOfferType(null);
        } else {
            setActiveOfferType(offerId);
            if (!selectedOffers.includes(offerId)) {
                const newOffers = [...selectedOffers, offerId];
                updateUserOffers(newOffers);

                if (!currentOfferDetails[offerId]) {
                    updateOfferDetails(offerId, { visible: true, title: '', description: '' });
                }
            }
        }
    };

    const getOfferSubtitle = (offerId: string) => {
        if (!selectedOffers.includes(offerId)) {
            return offerTypes.find(o => o.id === offerId)?.subtitle;
        }
        const details = currentOfferDetails[offerId] || {};
        switch (offerId) {
            case 'discount_offer':
                if (details.value) {
                    const type = details.discount_type === 'amount' ? '₹' : '%';
                    return `${details.value}${type} Off${details.min_bill ? ' *' : ''}`;
                }
                return t('discountAdded');
            case 'combo_deal':
                if (details.title && details.title.length > 3) return details.title;
                if (details.num_drivers && details.price) return `${details.num_drivers} Drivers @ ₹${details.price}`;
                return t('comboAdded');
            case 'time_offer':
                return details.title || t('timeOfferActive');
            default:
                return details.title || t('offerAdded');
        }
    };

    const renderOfferForm = (typeId: string) => {
        const details = currentOfferDetails[typeId] || {};

        switch (typeId) {
            case 'combo_deal':
                return (
                    <View>
                        <Text style={styles.inputLabel}>{t('comboTitle')}</Text>
                        <View style={{ position: 'relative' }}>
                            <TextInput
                                style={styles.input}
                                placeholder={t('comboTitlePlaceholder')}
                                placeholderTextColor="#999"
                                value={details.title}
                                onChangeText={(t) => updateOfferDetails(typeId, { title: t })}
                            />
                        </View>

                        <Space height={12} />
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>{t('numDrivers')}</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="4"
                                    keyboardType="numeric"
                                    placeholderTextColor="#999"
                                    value={details.num_drivers}
                                    onChangeText={(t) => updateOfferDetails(typeId, { num_drivers: t })}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>{t('priceRupee')}</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="99"
                                    keyboardType="numeric"
                                    placeholderTextColor="#999"
                                    value={details.price}
                                    onChangeText={(t) => updateOfferDetails(typeId, { price: t })}
                                />
                            </View>
                        </View>

                        <Space height={12} />
                        <Text style={styles.inputLabel}>{t('details')}</Text>
                        <TextInput
                            style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]}
                            placeholder={t('describeMeal')}
                            multiline
                            placeholderTextColor="#999"
                            value={details.description}
                            onChangeText={(t) => updateOfferDetails(typeId, { description: t })}
                        />
                    </View>
                );

            case 'discount_offer':
                return (
                    <View>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>{t('type')}</Text>
                                <View style={{ flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 8, padding: 4 }}>
                                    <TouchableOpacity
                                        style={{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6, backgroundColor: details.discount_type !== 'amount' ? '#fff' : 'transparent', elevation: details.discount_type !== 'amount' ? 1 : 0 }}
                                        onPress={() => updateOfferDetails(typeId, { discount_type: 'percent' })}
                                    >
                                        <Text style={{ fontWeight: '600', color: details.discount_type !== 'amount' ? '#000' : '#666' }}>%</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6, backgroundColor: details.discount_type === 'amount' ? '#fff' : 'transparent', elevation: details.discount_type === 'amount' ? 1 : 0 }}
                                        onPress={() => updateOfferDetails(typeId, { discount_type: 'amount' })}
                                    >
                                        <Text style={{ fontWeight: '600', color: details.discount_type === 'amount' ? '#000' : '#666' }}>₹</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>{t('value')}</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder={details.discount_type === 'amount' ? "50" : "10"}
                                    keyboardType="numeric"
                                    placeholderTextColor="#999"
                                    value={details.value}
                                    onChangeText={(t) => updateOfferDetails(typeId, { value: t })}
                                />
                            </View>
                        </View>

                        <Space height={12} />
                        <Text style={styles.inputLabel}>{t('minBillAmountOptional')}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 500"
                            keyboardType="numeric"
                            placeholderTextColor="#999"
                            value={details.min_bill}
                            onChangeText={(t) => updateOfferDetails(typeId, { min_bill: t })}
                        />
                    </View>
                );

            default:
                return (
                    <View>
                        <Text style={styles.inputLabel}>{t('offerTitle')}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={`${t('enter')} ${offerTypes.find(o => o.id === typeId)?.label}`}
                            placeholderTextColor="#999"
                            value={details.title}
                            onChangeText={(t) => updateOfferDetails(typeId, { title: t })}
                        />
                        <Space height={12} />
                        <Text style={styles.inputLabel}>{t('description')}</Text>
                        <TextInput
                            style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]}
                            placeholder={t('describeDetails')}
                            multiline
                            placeholderTextColor="#999"
                            value={details.description}
                            onChangeText={(t) => updateOfferDetails(typeId, { description: t })}
                        />
                    </View>
                );
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <View style={styles.sectionCard}>
                <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>{t('driverOffers')}</Text>
                <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>
                    {t('driverOffersDescription')}
                </Text>

                <View style={{ gap: 12 }}>
                    {offerTypes.map((offer) => {
                        const isSelected = selectedOffers.includes(offer.id);
                        const isActive = activeOfferType === offer.id;

                        return (
                            <View
                                key={offer.id}
                                style={{
                                    borderWidth: 1,
                                    borderColor: (isSelected || isActive) ? colors.royalBlue : '#E5E7EB',
                                    borderRadius: 12,
                                    backgroundColor: (isSelected || isActive) ? '#F5F8FF' : '#fff',
                                    overflow: 'hidden'
                                }}
                            >
                                <TouchableOpacity
                                    style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}
                                    onPress={() => toggleOffer(offer.id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={{
                                        width: 40, height: 40, borderRadius: 20,
                                        backgroundColor: (isSelected || isActive) ? colors.royalBlue : '#F3F4F6',
                                        alignItems: 'center', justifyContent: 'center', marginRight: 12
                                    }}>
                                        <Ionicons
                                            name={offer.icon}
                                            size={20}
                                            color={(isSelected || isActive) ? '#fff' : '#6B7280'}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#1F2937' }}>{offer.label}</Text>
                                        <Text style={{ fontSize: 12, color: (isSelected || isActive) ? colors.royalBlue : '#6B7280', marginTop: 2 }}>
                                            {getOfferSubtitle(offer.id)}
                                        </Text>
                                    </View>
                                    <Ionicons
                                        name={isActive ? "chevron-up" : "chevron-down"}
                                        size={20}
                                        color="#9CA3AF"
                                    />
                                </TouchableOpacity>

                                {isActive && (
                                    <View style={{ padding: 16, paddingTop: 0, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' }}>
                                        <Space height={16} />
                                        {renderOfferForm(offer.id)}

                                        <Space height={16} />
                                        <TouchableOpacity
                                            style={{ alignSelf: 'flex-end' }}
                                            onPress={() => {
                                                const newOffers = selectedOffers.filter(id => id !== offer.id);
                                                updateUserOffers(newOffers);
                                                setActiveOfferType(null);
                                            }}
                                        >
                                            <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '500' }}>{t('removeOffer')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>
            </View>

            {/* Save Button */}
            <View style={{ marginTop: 24, marginBottom: 20 }}>
                <TouchableOpacity
                    onPress={handleSave}
                    style={{
                        backgroundColor: colors.royalBlue,
                        height: 50,
                        borderRadius: 25,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: colors.royalBlue,
                        shadowOpacity: 0.3,
                        shadowRadius: 5,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 4
                    }}
                    disabled={saving}
                    activeOpacity={0.8}
                >
                    {saving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                            {t('saveOffers')}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView >
    );
};

export default DriverOfferTab;
