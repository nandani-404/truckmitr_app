/**
 * Driver Ki Awaz - Category Chips Component
 * @format
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { CATEGORIES, PostCategory } from '../types';

interface CategoryChipsProps {
    selectedCategory: PostCategory | null;
    onSelectCategory: (category: PostCategory) => void;
    showIcons?: boolean;
    scrollable?: boolean;
    size?: 'small' | 'medium' | 'large';
}

const CategoryChips: React.FC<CategoryChipsProps> = ({
    selectedCategory,
    onSelectCategory,
    showIcons = true,
    scrollable = true,
    size = 'medium',
}) => {
    const chipPadding = size === 'small' ? { paddingHorizontal: 10, paddingVertical: 6 }
        : size === 'medium' ? { paddingHorizontal: 14, paddingVertical: 8 }
            : { paddingHorizontal: 18, paddingVertical: 10 };

    const fontSize = size === 'small' ? 11 : size === 'medium' ? 13 : 15;
    const iconSize = size === 'small' ? 14 : size === 'medium' ? 16 : 18;

    const renderChip = (category: typeof CATEGORIES[0]) => {
        const isSelected = selectedCategory === category.id;

        return (
            <TouchableOpacity
                key={category.id}
                style={[
                    styles.chip,
                    chipPadding,
                    {
                        backgroundColor: isSelected ? category.color : '#F1F5F9',
                        borderColor: isSelected ? category.color : '#E2E8F0',
                    },
                ]}
                onPress={() => onSelectCategory(category.id)}
                activeOpacity={0.7}
            >
                {showIcons && (
                    <Ionicons
                        name={category.icon as any}
                        size={iconSize}
                        color={isSelected ? '#FFFFFF' : category.color}
                        style={styles.icon}
                    />
                )}
                <Text
                    style={[
                        styles.label,
                        {
                            fontSize,
                            color: isSelected ? '#FFFFFF' : '#334155',
                        },
                    ]}
                >
                    {category.label}
                </Text>
            </TouchableOpacity>
        );
    };

    if (scrollable) {
        return (
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContainer}
            >
                {CATEGORIES.map(renderChip)}
            </ScrollView>
        );
    }

    return (
        <View style={styles.wrapContainer}>
            {CATEGORIES.map(renderChip)}
        </View>
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 10,
    },
    wrapContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 10,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        borderWidth: 1,
    },
    icon: {
        marginRight: 6,
    },
    label: {
        fontWeight: '600',
    },
});

export default CategoryChips;
