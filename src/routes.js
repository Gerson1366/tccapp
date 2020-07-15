import * as React from 'react';
import { Button, View } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';

import Main from './pages/main';
import Diagnostic from './pages/diagnostic';

function HomeScreen({ navigation }) {
    return (
        <View style={{ flex: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Button
            onPress={() => navigation.navigate('Diagnosticos')}
            title="Diagnostics"
        />
        </View>
    );
}

function NotificationsScreen({ navigation }) {
    return (
        <View style={{ flex: 0, alignItems: 'center', justifyContent: 'center', width:'100%' }}>
        <Button onPress={() => navigation.goBack()} title="Go back home" />
        </View>
    );
}

const Drawer = createDrawerNavigator();

export default function Routes() {
  return (
    <NavigationContainer>
      <Drawer.Navigator initialRouteName="Main">
        <Drawer.Screen name="Main" component={Main} />
        <Drawer.Screen name="Diagnósticos" component={Diagnostic} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}