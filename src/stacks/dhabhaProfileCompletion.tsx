import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { STACKS } from '@truckmitr/stacks/stacks';
import ProfileCompletionDhabha from '@truckmitr/layouts/auth/dhabha-profile-completion';

const Stack = createNativeStackNavigator();

export default function DhabhaProfileCompletionStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Group>
                <Stack.Screen name={STACKS.DHABHA_PROFILE_COMPLETION} component={ProfileCompletionDhabha} options={{ animation: 'slide_from_right' }} />
            </Stack.Group>
        </Stack.Navigator>
    )
}
