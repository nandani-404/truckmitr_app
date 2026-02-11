import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { STACKS } from '@truckmitr/stacks/stacks';
import ProfileCompletionShipper from '@truckmitr/layouts/auth/shipper-profile-completion';

const Stack = createNativeStackNavigator();

export default function ShipperProfileCompletionStack() {
    return (
        <Stack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName={STACKS.SHIPPER_PROFILE_COMPLETION}
        >
            <Stack.Screen name={STACKS.SHIPPER_PROFILE_COMPLETION} component={ProfileCompletionShipper} />
        </Stack.Navigator>
    );
}
