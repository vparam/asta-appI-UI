import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useOnboarding } from '@/state/onboarding';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { RosterScreen } from '@/screens/RosterScreen';
import { PatientScreen } from '@/screens/PatientScreen';
import { VitalsTrendScreen } from '@/screens/VitalsTrendScreen';
import { InboxScreen } from '@/screens/InboxScreen';
import { ConversationScreen } from '@/screens/ConversationScreen';
import { AddBedsideDataScreen } from '@/screens/AddBedsideDataScreen';
import { RoutineCheckScreen } from '@/screens/RoutineCheckScreen';
import { subscribeToPushTaps } from '@/native/push';
import { PatientToken, VitalLane } from '@/data/types';

type RootStackParams = {
  Onboarding: undefined;
  Roster: undefined;
  Inbox: undefined;
  Patient: { token: PatientToken; eventId?: string };
  VitalsTrend: { token: PatientToken; lane?: VitalLane };
  Conversation: { token: PatientToken; prefill?: string };
  AddBedsideData: { token: PatientToken; initialTab?: 'respiratory' | 'circulation' | 'labs' | 'neuro'; initialFocus?: string };
  RoutineCheck: { token: PatientToken };
};

const Stack = createNativeStackNavigator<RootStackParams>();

export function Navigation() {
  const { onboardingComplete } = useOnboarding();
  const navRef = React.useRef<any>(null);

  useEffect(() => {
    const sub = subscribeToPushTaps((p) => {
      navRef.current?.navigate('Patient', { token: p.patient_token as PatientToken, eventId: p.event_id });
    });
    return () => sub?.remove();
  }, []);

  return (
    <NavigationContainer
      ref={navRef}
      linking={{
        prefixes: ['astappplm://', 'https://app.astahealthtech.com'],
        config: {
          screens: {
            Patient: 'patient/:token',
            VitalsTrend: 'patient/:token/trend/:lane',
          },
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!onboardingComplete && <Stack.Screen name="Onboarding">{({ navigation }) => <OnboardingScreen onDone={() => navigation.replace('Roster')} />}</Stack.Screen>}
        <Stack.Screen name="Roster" component={RosterScreen as any} />
        <Stack.Screen name="Inbox" component={InboxScreen as any} />
        <Stack.Screen name="Patient">
          {({ route, navigation }) => (
            <PatientScreen
              token={route.params.token}
              eventId={route.params.eventId}
              navigation={navigation as any}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="VitalsTrend">
          {({ route }) => <VitalsTrendScreen token={route.params.token} initialLane={route.params.lane} />}
        </Stack.Screen>
        <Stack.Screen name="Conversation">
          {({ route }) => <ConversationScreen token={route.params.token} prefill={route.params.prefill} />}
        </Stack.Screen>
        <Stack.Screen name="AddBedsideData" options={{ presentation: 'modal' }}>
          {({ route, navigation }) => (
            <AddBedsideDataScreen
              token={route.params.token}
              initialTab={route.params.initialTab}
              initialFocus={route.params.initialFocus}
              onClose={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="RoutineCheck" options={{ presentation: 'modal' }}>
          {({ route, navigation }) => (
            <RoutineCheckScreen token={route.params.token} onClose={() => navigation.goBack()} />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
