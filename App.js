import React, { useEffect } from "react";
import { RootSiblingParent } from "react-native-root-siblings";
import { SafeAreaProvider } from "react-native-safe-area-context";

import AsyncStorage from "@react-native-async-storage/async-storage";

import * as Localization from "expo-localization";

import i18n from "./src/i18n";

import MainNavigator from "./src/navigation/MainNavigator";

import OfflineView from "./src/components/offline/OfflineView";
import { ConnectivityProvider } from "./context/ConnectivityContext";
import { LoggedInUserInfoProvider } from "./context/LoggedInUserInfoContext";
import {
  AbsenceForceRefreshProvider,
  ExpenseForceRefreshProvider,
  TimesheetForceRefreshProvider,
} from "./context/ForceRefreshContext";
import { RequestQueueProvider } from "./context/RequestQueueContext";

/**
 * Function to get the initial language of the device/platform.
 * @returns {string} The initial language based on the device's platform or from AsyncStorage.
 */
const getInitialLanguage = async () => {
  try {
    // Check AsyncStorage for the preferred language
    const preferredLanguage = await AsyncStorage.getItem("preferredLanguage");

    if (preferredLanguage) {
      // If preferred language is available in AsyncStorage, return it
      return preferredLanguage;
    } else {
      // Use expo-localization to get the device's locale
      const locale = Localization.locale.split("-")[0];

      // Return the language if available, otherwise fallback to English
      return locale && i18n.options.resources[locale] ? locale : "en";
    }
  } catch (error) {
    console.error(
      "Error fetching preferred language from AsyncStorage:",
      error
    );
    // Fallback to English in case of any errors
    return "en";
  }
};

/**
 * Main App Component
 * This component initializes the app, sets up localization, and renders the main navigation component.
 */
const App = () => {
  useEffect(() => {
    /**
     * Function to initialize the app by setting up the initial language.
     */
    const initializeApp = async () => {
      try {
        // Get the initial language for the app
        const initialLanguage = await getInitialLanguage();
        // Set the initial language for the i18n localization library
        i18n.changeLanguage(initialLanguage);
      } catch (error) {
        console.error("Error initializing app:", error.message);
      }
    };

    // Call the initializeApp function when the component mounts
    initializeApp();
  }, []);

  return (
    // RootSiblingParent is used for displaying modals and other components outside of the regular component hierarchy
    <RootSiblingParent>
      {/* SafeAreaProvider ensures that content doesn't overlap system insets (e.g., status bar, notch) */}
      <SafeAreaProvider>
        {/* LoggedInUserInfoProvider wraps the entire application to provide logged-in user information context */}
        <LoggedInUserInfoProvider>
          {/* ConnectivityProvider and RequestQueueProvider wrap the MainNavigator to provide access to their respective contexts */}
          <ConnectivityProvider>
            <RequestQueueProvider>
              {/* TimesheetForceRefreshProvider, ExpenseForceRefreshProvider, and AbsenceForceRefreshProvider are context providers wrapping MainNavigator */}
              <TimesheetForceRefreshProvider>
                <ExpenseForceRefreshProvider>
                  <AbsenceForceRefreshProvider>
                    {/* MainNavigator is the main navigation component */}
                    <MainNavigator />
                  </AbsenceForceRefreshProvider>
                </ExpenseForceRefreshProvider>
              </TimesheetForceRefreshProvider>
            </RequestQueueProvider>
            {/* Render OfflineView component */}
            {<OfflineView />}
          </ConnectivityProvider>
        </LoggedInUserInfoProvider>
      </SafeAreaProvider>
    </RootSiblingParent>
  );
};

export default App;
