import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { STACKS } from '@truckmitr/stacks/stacks';
import ProfileCompletionAssociate from '@truckmitr/layouts/auth/associate-profile-completion';

const Stack = createNativeStackNavigator();

export default function AssociateProfileCompletionStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Group>
                <Stack.Screen name={STACKS.ASSOCIATE_PROFILE_COMPLETION} component={ProfileCompletionAssociate} options={{ animation: 'slide_from_right' }} />
            </Stack.Group>
        </Stack.Navigator>
    )
}
