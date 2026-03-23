import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { STACKS } from '@truckmitr/stacks/stacks';
import { Approval, IntroVideo, Language, Login, Namaste, Otp, Signup, Welcome, ProfileCompletion, Congratulations, ModuleSelection, ModuleSelectionNew } from '@truckmitr/layouts/index';
import { Privacy, Terms } from '@truckmitr/layouts/main';
// import { GenderModal, LoadingModal } from '@ollnine/modals/index';
import { Main } from '@truckmitr/stacks/index';
import { useSelector } from 'react-redux';

const Stack = createNativeStackNavigator();

export default function Auth() {
  const { selectedModule } = useSelector((state: any) => state?.app);

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={STACKS.NAMASTE}
    >
      <Stack.Group>
        <Stack.Screen name={STACKS.NAMASTE} component={Namaste} />
        <Stack.Screen name={STACKS.INTRO_VIDEO} component={IntroVideo} options={{ animation: 'fade' }} />
        <Stack.Screen name={STACKS.WELCOME} component={Welcome} options={{ animation: 'fade' }} />
        <Stack.Screen name={STACKS.LOGIN} component={Login} options={{ animation: 'fade' }} />
        <Stack.Screen name={STACKS.OTP} component={Otp} options={{ animation: 'fade' }} />
        <Stack.Screen name={STACKS.LANGUAGE} component={Language} options={{ animation: 'fade' }} />
        <Stack.Screen name={STACKS.SIGNUP} component={Signup} options={{ animation: 'fade' }} />
        <Stack.Screen name={STACKS.MODULE_SELECTION} component={ModuleSelection} options={{ animation: 'fade' }} />
        <Stack.Screen name={STACKS.MODULE_SELECTION_NEW} component={ModuleSelectionNew} options={{ animation: 'fade' }} />
        <Stack.Screen name={STACKS.CONGRATULATIONS} component={Congratulations} options={{ animation: 'fade' }} />
        <Stack.Screen name={STACKS.PROFILE_COMPLETION} component={ProfileCompletion} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name={STACKS.APPROVAL} component={Approval} options={{ animation: 'fade' }} />
        <Stack.Screen name={STACKS.PRIVACY} component={Privacy} options={{ animation: 'fade' }} />
        <Stack.Screen name={STACKS.TERMS} component={Terms} options={{ animation: 'fade' }} />
        <Stack.Screen name={STACKS.MAIN} component={Main} options={{ animation: 'fade' }} />
      </Stack.Group>
    </Stack.Navigator>
  )
}