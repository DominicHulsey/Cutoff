import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { NavigationContainer, DefaultTheme, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import HomeScreen from './screens/HomeScreen/HomeScreen';
import DetailsScreen from './screens/DetailsScreen';

export type RootStackParamList = {
  Home: undefined;
  Details: { tile: {
    id: string;
    icon: string;
    title: string;
    color: string;
  }};
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['cutoff://'],
  config: {
    screens: {
      Home: '',
      Details: {
        path: 'details/:id',
        parse: {
          id: (id: string) => id,
        },
      },
    },
  },
};

// Create a custom theme with Montserrat font
const customTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F4F4F2',
    primary: '#2A7D4F',
    text: '#333333',
  },
};

export default function App() {

  return (
    <NavigationContainer linking={linking} theme={customTheme}>
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          headerShown: false, // Remove the header completely
          contentStyle: { backgroundColor: '#F4F4F2' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
