import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { Navigation } from '@/navigation';
import { registerForPush } from '@/native/push';
import { requireBiometric } from '@/native/biometric';

export default function App() {
  useEffect(() => {
    requireBiometric('Unlock PPLM Bedside');
    registerForPush();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <StatusBar barStyle="dark-content" />
          <Navigation />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
