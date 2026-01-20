import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { STACKS } from '@truckmitr/stacks/stacks';
import ProfileCompletionForeman from '@truckmitr/layouts/auth/foreman-profile-completion';

const Stack = createNativeStackNavigator();

export default function ForemanProfileCompletionStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Group>
                <Stack.Screen name={STACKS.FOREMAN_PROFILE_COMPLETION} component={ProfileCompletionForeman} options={{ animation: 'slide_from_right' }} />
            </Stack.Group>
        </Stack.Navigator>
    )
}
