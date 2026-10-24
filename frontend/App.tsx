import React from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {HStaffApp} from './src/HStaffApp';

export default function App() {
  return (
    <SafeAreaProvider>
      <HStaffApp />
    </SafeAreaProvider>
  );
}
