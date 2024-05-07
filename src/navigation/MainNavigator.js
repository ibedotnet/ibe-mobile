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
import TimesheetDetail from "../screens/TimesheetDetail";
import User from "../screens/User";
import { common } from "../styles/common";

const Stack = createNativeStackNavigator();

/**
 * Main Navigator Component
 * This component sets up the navigation stack for the app using React Navigation.
 * It defines the navigation routes and their corresponding screen components.
 */
const MainNavigator = () => {
  return (
    <NavigationContainer>
      {/* NavigationContainer provides the navigation context for the app */}
      <Stack.Navigator initialRouteName="Login" screenOptions={common.header}>
        {/* Stack.Navigator defines the stack-based navigation for the app */}
        {/* Each Stack.Screen represents a screen in the app */}
        <Stack.Screen
          name="Login"
          component={Login}
          options={{ headerShown: false }}
        />
        {/* The 'headerShown: false' option hides the header for the Login screen */}
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Timesheet" component={Timesheet} />
        <Stack.Screen name="TimesheetDetail" component={TimesheetDetail} />
        <Stack.Screen name="Expense" component={Expense} />
        <Stack.Screen name="Absence" component={Absence} />
        <Stack.Screen name="User" component={User} />
        {/* These are the screens of the app */}
        <Stack.Screen
          name="CustomImagePicker"
          component={CustomImagePicker}
          options={{ headerTitle: "" }}
        />
        {/* The 'CustomImagePicker' screen has an empty headerTitle */}
        <Stack.Screen name="Filters" component={Filters} />
        {/* 'Filters' is another screen component */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default MainNavigator;
