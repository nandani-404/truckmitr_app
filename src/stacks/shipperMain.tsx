import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { STACKS } from '@truckmitr/stacks/stacks';
import ShipperHome from '@truckmitr/layouts/shipper/home';

const Stack = createNativeStackNavigator();

export default function ShipperMain() {
    return (
        <Stack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName={STACKS.SHIPPER_HOME}
        >
            <Stack.Screen name={STACKS.SHIPPER_HOME} component={ShipperHome} />
        </Stack.Navigator>
    );
}
