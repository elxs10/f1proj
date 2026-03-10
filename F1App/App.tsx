import React from 'react';
import { StatusBar } from 'react-native';
import Navigation from './src/navigation';

export default function App() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#080808" />
      <Navigation />
    </>
  );
}