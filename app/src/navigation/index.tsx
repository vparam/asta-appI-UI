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
import { SettingsScreen } from '@/screens/SettingsScreen';
import { subscribeToPushTaps } from '@/native/push';
import { api } from '@/data/api';
import { PatientToken, VitalLane } from '@/data/types';

type RootStackParams = {
  Onboarding: undefined;
  Roster: undefined;
  Inbox: undefined;
  Patient: { token: PatientToken; eventId?: string; openEscalateSheet?: boolean };
  VitalsTrend: { token: PatientToken; lane?: VitalLane };
  Conversation: { token: PatientToken; prefill?: string };
  AddBedsideData: {
    token: PatientToken;
    initialTab?: 'respiratory' | 'circulation' | 'labs' | 'neuro';
    initialFocus?: string;
    onRerunComplete?: (r: { patient: import('@/data/types').PatientFile; receipts: { score: { copy: string } | null; confidence: { copy: string } | null } }) => void;
  };
  RoutineCheck: { token: PatientToken };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParams>();

export function Navigation() {
  const { onboardingComplete } = useOnboarding();
  const navRef = React.useRef<any>(null);

  useEffect(() => {
    const sub = subscribeToPushTaps((p) => {
      const via = (p as { via?: string }).via;
      // §19.7: ack-from-notification writes the same audit row as in-app ack,
      // with action_source = 'notification quick action'. The native module only
      // forwards the event; the audit POST happens here so it shares one path.
      if (via === 'notification') {
        api.acknowledgeAlert(p.event_id, 'notification').catch(() => undefined);
        // Don't navigate — the user explicitly chose to ack without opening.
        return;
      }
      navRef.current?.navigate('Patient', {
        token: p.patient_token as PatientToken,
        eventId: p.event_id,
        openEscalateSheet: via === 'escalate',
      });
    });
    return () => sub?.remove();
  }, []);

  return (
    <NavigationContainer
      ref={navRef}
      linking={{
        prefixes: ['astapplm://', 'https://app.astahealthtech.com'],
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
              openEscalateSheet={route.params.openEscalateSheet}
              navigation={navigation as any}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Settings">
          {({ navigation }) => <SettingsScreen onClose={() => navigation.goBack()} />}
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
              onRerunComplete={route.params.onRerunComplete}
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
