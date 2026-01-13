import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    Pressable,
    Animated,
    StyleSheet,
    ViewStyle,
    TextStyle
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Foundation from 'react-native-vector-icons/Foundation';
import { useColor, useResponsiveScale } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hitSlop } from '@truckmitr/src/app/functions';
import { useNavigation } from '@react-navigation/native';
import { Space } from '@truckmitr/src/app/components';

export interface ScreenHeaderProps {
    /** Title text displayed in the header */
    title: string;
    /** Optional count to display next to title, e.g. "Available Jobs (10)" */
    titleCount?: number | string;
    /** Optional subtitle displayed below the title */
    subtitle?: string;
    /** Whether to show the back button (default: true) */
    showBackButton?: boolean;
    /** Custom back button handler (default: navigation.goBack) */
    onBackPress?: () => void;
    /** Whether to show filter button on the right */
    showFilterButton?: boolean;
    /** Filter button label (default: 'Filter') */
    filterLabel?: string;
    /** Filter button press handler */
    onFilterPress?: () => void;
    /** Custom right component to render instead of filter button */
    rightComponent?: React.ReactNode;
    /** Whether to animate the header (default: true) */
    animated?: boolean;
    /** Animation duration in ms (default: 500) */
    animationDuration?: number;
    /** Whether to include safe area top spacing (default: true) */
    includeSafeArea?: boolean;
    /** Custom container style */
    containerStyle?: ViewStyle;
    /** Custom title style */
    titleStyle?: TextStyle;
    /** Whether to show bottom border (default: true) */
    showBorder?: boolean;
    /** Whether to show shadow (default: true) */
    showShadow?: boolean;
}

/**
 * ScreenHeader - A reusable, premium-styled header component for all screens
 * 
 * Features:
 * - Animated entrance with fade-in effect
 * - Back button with royal blue accent
 * - Centered title with optional count
 * - Optional filter button or custom right component
 * - Subtle shadow and border for premium feel
 * - Full customization options
 * 
 * Usage:
 * ```tsx
 * <ScreenHeader
 *   title="Available Jobs"
 *   titleCount={10}
 *   showFilterButton
 *   filterLabel={t('filter')}
 *   onFilterPress={() => setFilterModal(true)}
 * />
 * ```
 */
const ScreenHeader: React.FC<ScreenHeaderProps> = ({
    title,
    titleCount,
    subtitle,
    showBackButton = true,
    onBackPress,
    showFilterButton = false,
    filterLabel = 'Filter',
    onFilterPress,
    rightComponent,
    animated = true,
    animationDuration = 500,
    includeSafeArea = true,
    containerStyle,
    titleStyle,
    showBorder = true,
    showShadow = true,
}) => {
    const colors = useColor();
    const safeAreaInsets = useSafeAreaInsets();
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const navigation = useNavigation();

    const headerOpacity = useRef(new Animated.Value(animated ? 0 : 1)).current;

    useEffect(() => {
        if (animated) {
            Animated.timing(headerOpacity, {
                toValue: 1,
                duration: animationDuration,
                useNativeDriver: true,
            }).start();
        }
    }, [animated, animationDuration]);

    const handleBackPress = () => {
        if (onBackPress) {
            onBackPress();
        } else {
            navigation.goBack();
        }
    };

    // Build display title with optional count
    const displayTitle = titleCount !== undefined
        ? `${title} (${titleCount})`
        : title;

    return (
        <>
            {includeSafeArea && <Space height={safeAreaInsets.top} />}

            <Animated.View
                style={[
                    styles.container,
                    {
                        opacity: headerOpacity,
                        backgroundColor: colors.white,
                        paddingHorizontal: responsiveWidth(4),
                        paddingVertical: responsiveHeight(1.5),
                        borderBottomWidth: showBorder ? 1 : 0,
                        borderBottomColor: colors.blackOpacity(0.05),
                        ...(showShadow && {
                            shadowColor: colors.black,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.04,
                            shadowRadius: 8,
                            elevation: 2,
                        }),
                    },
                    containerStyle,
                ]}
            >
                <View style={styles.contentRow}>
                    {/* Back Button */}
                    {showBackButton ? (
                        <Pressable
                            hitSlop={hitSlop(10)}
                            onPress={handleBackPress}
                            style={({ pressed }) => [
                                styles.backButton,
                                {
                                    height: responsiveFontSize(4.5),
                                    width: responsiveFontSize(4.5),
                                    backgroundColor: colors.royalBlue + '12',
                                    borderRadius: responsiveFontSize(2.25),
                                    opacity: pressed ? 0.6 : 1,
                                },
                            ]}
                        >
                            <Ionicons
                                name="chevron-back"
                                size={22}
                                color={colors.royalBlue}
                            />
                        </Pressable>
                    ) : (
                        <View
                            style={{
                                width: responsiveFontSize(4.5),
                                height: responsiveFontSize(4.5)
                            }}
                        />
                    )}

                    {/* Centered Title */}
                    <View style={styles.titleContainer}>
                        <Text
                            style={[
                                styles.title,
                                {
                                    fontSize: responsiveFontSize(2.2),
                                    color: colors.black,
                                },
                                titleStyle,
                            ]}
                            numberOfLines={1}
                        >
                            {displayTitle}
                        </Text>
                        {subtitle && (
                            <Text
                                style={[
                                    styles.subtitle,
                                    {
                                        fontSize: responsiveFontSize(1.5),
                                        color: colors.blackOpacity(0.6),
                                        marginTop: responsiveFontSize(0.3),
                                    },
                                ]}
                                numberOfLines={1}
                            >
                                {subtitle}
                            </Text>
                        )}
                    </View>

                    {/* Right Component / Filter Button */}
                    {rightComponent ? (
                        rightComponent
                    ) : showFilterButton ? (
                        <Pressable
                            onPress={onFilterPress}
                            hitSlop={hitSlop(15)}
                            style={({ pressed }) => [
                                styles.filterButton,
                                {
                                    backgroundColor: colors.royalBlue + '10',
                                    paddingHorizontal: responsiveFontSize(1.5),
                                    paddingVertical: responsiveFontSize(0.8),
                                    borderRadius: responsiveFontSize(1),
                                    opacity: pressed ? 0.7 : 1,
                                },
                            ]}
                        >
                            <Foundation
                                name="filter"
                                size={18}
                                color={colors.royalBlue}
                            />
                            <Text
                                style={[
                                    styles.filterLabel,
                                    {
                                        color: colors.royalBlue,
                                        fontSize: responsiveFontSize(1.6),
                                        marginLeft: responsiveFontSize(0.5),
                                    },
                                ]}
                            >
                                {filterLabel}
                            </Text>
                        </Pressable>
                    ) : (
                        <View
                            style={{
                                width: responsiveFontSize(4.5),
                                height: responsiveFontSize(4.5)
                            }}
                        />
                    )}
                </View>
            </Animated.View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        // Base container styles
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    title: {
        fontWeight: '700',
        letterSpacing: -0.3,
        textAlign: 'center',
    },
    subtitle: {
        fontWeight: '500',
        textAlign: 'center',
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    filterLabel: {
        fontWeight: '600',
    },
});

export default ScreenHeader;
