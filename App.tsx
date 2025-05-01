import * as React from 'react';
import { NavigationContainer, DefaultTheme, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import DetailsScreen from './screens/DetailsScreen';

export type RootStackParamList = {
  Home: undefined;
  Details: { tile: {
    id: string;
    icon: string;
    title: string;
    subtitle: string;
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
  async getInitialURL() {
    // Handles widget deep links or normal links
    const url = await Promise.resolve(window.location.href);
    return url;
  },
};

export default function App() {
  return (
    <NavigationContainer linking={linking} theme={DefaultTheme}>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
