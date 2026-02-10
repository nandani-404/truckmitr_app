import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { userEditAction } from '@truckmitr/src/redux/actions/user.action';
import { styles } from '../styles';
import { useColor } from '@truckmitr/src/app/hooks';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import Ionicons from 'react-native-vector-icons/Ionicons';

const mealOptions = [
    { label: 'breakfast', value: 'Breakfast' },
    { label: 'lunch', value: 'Lunch' },
    { label: 'dinner', value: 'Dinner' },
    { label: 'lateNight', value: 'Late Night' },
];

const FoodAvailableTab = () => {
    const { t } = useTranslation();
    const { userEdit } = useSelector((state: any) => state?.user);
    const dispatch = useDispatch();
    const colors = useColor();
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const [foodData, setFoodData] = useState({
        foodOption: 'Veg Only',
        mealAvailability: [] as string[],
        specialDishes: [''] as string[],
        priceFrom: '',
        priceTo: '',
    });

    useEffect(() => {
        fetchFoodData();
    }, []);

    const fetchFoodData = async () => {
        setLoading(true);
        try {
            const response: any = await axiosInstance.get(END_POINTS.GET_DHABA_FOOD);
            if (response?.data?.success && response?.data?.food) {
                const food = response.data.food;

                // Map food type
                let option = 'Veg Only';
                const type = food.food_type || [];
                if (type.includes('Veg') && type.includes('Non-Veg')) option = 'Both Veg & Non-Veg';
                else if (type.includes('Non-Veg')) option = 'Non-Veg Only';
                else option = 'Veg Only';

                // Map meals
                const meals: string[] = [];
                if (food.meal_breakfast == '1') meals.push('Breakfast');
                if (food.meal_lunch == '1') meals.push('Lunch');
                if (food.meal_dinner == '1') meals.push('Dinner');
                if (food.meal_night == '1') meals.push('Late Night');

                // Map special dishes
                const dishes = food.special_dishes
                    ? food.special_dishes.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
                    : [''];

                // Map price range
                const priceMatch = (food.avg_price_range || '').match(/₹(\d+)-₹(\d+)/);
                const pFrom = priceMatch ? priceMatch[1] : '';
                const pTo = priceMatch ? priceMatch[2] : '';

                setFoodData({
                    foodOption: option,
                    mealAvailability: meals,
                    specialDishes: dishes.length > 0 ? dishes : [''],
                    priceFrom: pFrom,
                    priceTo: pTo,
                });

                // Update Redux
                dispatch(userEditAction({
                    ...userEdit,
                    dhaba_food: food
                }));
            }
        } catch (error) {
            console.error('Fetch Food Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddDish = () => {
        setFoodData(prev => ({
            ...prev,
            specialDishes: [...prev.specialDishes, '']
        }));
    };

    const handleRemoveDish = (index: number) => {
        setFoodData(prev => {
            const updated = prev.specialDishes.filter((_, i) => i !== index);
            return {
                ...prev,
                specialDishes: updated.length > 0 ? updated : ['']
            };
        });
    };

    const handleDishChange = (text: string, index: number) => {
        setFoodData(prev => {
            const updated = [...prev.specialDishes];
            updated[index] = text;
            return { ...prev, specialDishes: updated };
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const formData = new FormData();

            // dhaba_id
            if (userEdit?.dhaba?.id) {
                formData.append('dhaba_id', userEdit.dhaba.id.toString());
            }

            // Food Types
            if (foodData.foodOption === 'Veg Only') {
                formData.append('food_type[]', 'Veg');
            } else if (foodData.foodOption === 'Non-Veg Only') {
                formData.append('food_type[]', 'Non-Veg');
            } else if (foodData.foodOption === 'Both Veg & Non-Veg') {
                formData.append('food_type[]', 'Veg');
                formData.append('food_type[]', 'Non-Veg');
            }

            // Meals
            formData.append('meal_breakfast', foodData.mealAvailability.includes('Breakfast') ? '1' : '0');
            formData.append('meal_lunch', foodData.mealAvailability.includes('Lunch') ? '1' : '0');
            formData.append('meal_dinner', foodData.mealAvailability.includes('Dinner') ? '1' : '0');
            formData.append('meal_night', foodData.mealAvailability.includes('Late Night') ? '1' : '0');

            // Special Dishes
            const filteredDishes = foodData.specialDishes.filter(d => d.trim().length > 0);
            formData.append('special_dishes', filteredDishes.join(', '));

            // Price Range
            if (foodData.priceFrom && foodData.priceTo) {
                formData.append('avg_price_range', `₹${foodData.priceFrom}-₹${foodData.priceTo}`);
            }

            const response = await axiosInstance.post(END_POINTS.DHABA_FOOD, formData);

            if (response?.data?.status || response?.data?.success) {
                showToast(t('foodDetailsSavedSuccess'));
                if (response?.data?.food) {
                    dispatch(userEditAction({
                        ...userEdit,
                        dhaba_food: response.data.food
                    }));
                }
            } else {
                showToast(t('failedToSaveFoodDetails'));
            }
        } catch (error: any) {
            console.error('Food Save Error:', error);
            showToast(error?.response?.data?.message || t('somethingWentWrong'));
        } finally {
            setSaving(false);
        }
    };

    const ShimmerPlaceholder = () => (
        <View style={styles.sectionCard}>
            {[1, 2, 3, 4].map((item) => (
                <View key={item} style={styles.inputContainer}>
                    <View style={{ width: 100, height: 16, backgroundColor: '#e0e0e0', borderRadius: 4, marginBottom: 8 }} />
                    <View style={{ width: '100%', height: 48, backgroundColor: '#e0e0e0', borderRadius: 8 }} />
                </View>
            ))}
        </View>
    );

    if (loading) {
        return (
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                <ShimmerPlaceholder />
            </ScrollView>
        );
    }

    return (
        <KeyboardAwareScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            enableOnAndroid={true}
            extraScrollHeight={100}
            keyboardShouldPersistTaps="handled"
        >
            <View style={styles.sectionCard}>
                {/* Food Type */}
                <Text style={styles.inputLabel}>{t('foodType')}</Text>
                <View style={styles.radioGroup}>
                    {[
                        { id: 'Veg Only', label: t('vegOnly') },
                        { id: 'Non-Veg Only', label: t('nonVegOnly') },
                        { id: 'Both Veg & Non-Veg', label: t('bothVegNonVeg') }
                    ].map(type => (
                        <TouchableOpacity
                            key={type.id}
                            style={styles.radioContainer}
                            onPress={() => setFoodData(prev => ({ ...prev, foodOption: type.id }))}
                        >
                            <View style={[styles.radioCircle, foodData.foodOption === type.id && { borderColor: colors.royalBlue }]}>
                                {foodData.foodOption === type.id && <View style={[styles.radioDot, { backgroundColor: colors.royalBlue }]} />}
                            </View>
                            <Text style={styles.radioLabel}>{type.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Meal Availability */}
                <View style={{ marginTop: 16 }}>
                    <Text style={[styles.inputLabel, { marginBottom: 12 }]}>{t('mealAvailability')}</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                        {mealOptions.map((option) => {
                            const isSelected = foodData.mealAvailability.includes(option.value);
                            return (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.dropdown,
                                        {
                                            height: 40,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            paddingHorizontal: 12,
                                            backgroundColor: isSelected ? colors.royalBlue : '#fff',
                                            borderColor: isSelected ? colors.royalBlue : '#E5E7EB',
                                            flex: 1,
                                            minWidth: '45%'
                                        }
                                    ]}
                                    onPress={() => {
                                        setFoodData(prev => {
                                            const current = prev.mealAvailability;
                                            const newSelection = current.includes(option.value)
                                                ? current.filter(item => item !== option.value)
                                                : [...current, option.value];
                                            return { ...prev, mealAvailability: newSelection };
                                        });
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Ionicons
                                            name={isSelected ? "checkbox" : "square-outline"}
                                            size={18}
                                            color={isSelected ? "#fff" : "#9CA3AF"}
                                            style={{ marginRight: 6 }}
                                        />
                                        <Text style={[
                                            styles.checkboxLabel,
                                            { color: isSelected ? '#fff' : '#374151', fontSize: 13, fontWeight: isSelected ? '600' : '400' }
                                        ]}>
                                            {t(option.label)}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Price Range */}
                    <Text style={styles.inputLabel}>{t('avgPriceRangeOptional')}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            placeholder={t('minPricePlaceholder')}
                            value={foodData.priceFrom}
                            onChangeText={(t: string) => setFoodData(prev => ({ ...prev, priceFrom: t.replace(/[^0-9]/g, '') }))}
                            keyboardType="numeric"
                        />
                        <Text style={{ color: '#6B7280' }}>{t('to')}</Text>
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            placeholder={t('maxPricePlaceholder')}
                            value={foodData.priceTo}
                            onChangeText={(t: string) => setFoodData(prev => ({ ...prev, priceTo: t.replace(/[^0-9]/g, '') }))}
                            keyboardType="numeric"
                        />
                    </View>

                    {/* Special Dishes */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Text style={styles.inputLabel}>{t('specialDishes')}</Text>
                        <TouchableOpacity onPress={handleAddDish} style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="add-circle" size={20} color={colors.royalBlue} />
                            <Text style={{ color: colors.royalBlue, marginLeft: 4, fontWeight: '600', fontSize: 13 }}>{t('addMore')}</Text>
                        </TouchableOpacity>
                    </View>

                    {foodData.specialDishes.map((dish, index) => (
                        <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder={`${t('specialDishPlaceholder')} ${index + 1}`}
                                value={dish}
                                onChangeText={(t: string) => handleDishChange(t, index)}
                            />
                            {foodData.specialDishes.length > 1 && (
                                <TouchableOpacity onPress={() => handleRemoveDish(index)}>
                                    <Ionicons name="trash-outline" size={22} color="#EF4444" />
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
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
                                {t('saveFoodDetails')}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAwareScrollView>
    );
};

export default FoodAvailableTab;
