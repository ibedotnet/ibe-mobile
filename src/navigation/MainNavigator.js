import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import CustomImagePicker from "../components/CustomImagePicker";
import Filters from "../components/filters/Filters";

import Absence from "../screens/Absence";
import Expense from "../screens/Expense";
import Home from "../screens/Home";
import Login from "../screens/Login";
import Timesheet from "../screens/Timesheet";
import User from "../screens/User";
import common from "../styles/common";

const Stack = createNativeStackNavigator();

const MainNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={common.header}>
        <Stack.Screen
          name="Login"
          component={Login}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen
          name="Timesheet"
          component={Timesheet}
        />
        <Stack.Screen
          name="Expense"
          component={Expense}
        />
        <Stack.Screen
          name="Absence"
          component={Absence}
        />
        <Stack.Screen
          name="User"
          component={User}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CustomImagePicker"
          component={CustomImagePicker}
          options={{ headerTitle: "" }}
        />
        <Stack.Screen
          name="Filters"
          component={Filters}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default MainNavigator;
