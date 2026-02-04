import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { STACKS } from '@truckmitr/stacks/stacks';
import ProfileCompletionPuncture from '@truckmitr/src/app/layouts/auth/puncture-profile-completion';

const Stack = createNativeStackNavigator();

export default function PunctureProfileCompletionStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Group>
                <Stack.Screen name={STACKS.PUNCTURE_PROFILE_COMPLETION} component={ProfileCompletionPuncture} options={{ animation: 'slide_from_right' }} />
            </Stack.Group>
        </Stack.Navigator>
    )
}
