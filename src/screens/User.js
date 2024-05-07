import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import CustomButton from "../components/CustomButton";
import CustomPicker from "../components/CustomPicker";
import SaveCancelBar from "../components/SaveCancelBar";
import { fetchData } from "../utils/APIUtils";
import { showToast } from "../utils/MessageUtils";
import { screenDimension } from "../utils/ScreenUtils";
import { parseUserComms } from "../utils/UserUtils";
import { API_ENDPOINTS } from "../constants";
import { useRequestQueueContext } from "../../context/RequestQueueContext";

const User = ({ route, navigation }) => {
  const user = route?.params?.user;
  const { userEmail, userPhone } = parseUserComms(user);

  // Initialize useTranslation hook
  const { t, i18n } = useTranslation(); // Translation function and localization instance.

  // States to store initial states
  const [initialSelectedLanguage, setInitialSelectedLanguage] = useState(null); // Represents the initially selected language before any changes.
  const [initialIsRequestQueueEnabled, setInitialIsRequestQueueEnabled] =
    useState(false); // Represents the initial state of the request queue feature.

  // State to store selected values for custom pickers
  const [selectedLanguage, setSelectedLanguage] = useState(null); // Represents the currently selected language.

  // Use the custom hook to access the request queue context
  const { isRequestQueueEnabled, setIsRequestQueueEnabled } =
    useRequestQueueContext(); // Provides access to request queue context for managing request queue feature.

  // Initialize changes array
  const [changes, setChanges] = useState([]); // Stores the list of changes made by the user.

  const languages = [
    { label: "English", value: "en" },
    { label: "Spanish", value: "es" },
    { label: "Hindi", value: "hi" },
    // Add more languages as needed
  ];

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);

    // Find the index of the existing 'language' entry in the 'changes' array
    const languageIndex = changes.findIndex(
      (change) => change.field === "language"
    );

    // If the 'language' entry already exists, update its 'changed' property
    if (languageIndex !== -1) {
      const updatedChanges = [...changes];
      updatedChanges[languageIndex] = {
        field: "language",
        changed: language !== initialSelectedLanguage,
      };
      setChanges(updatedChanges);
    } else {
      // If the 'language' entry doesn't exist, add a new one to the 'changes' array
      setChanges([
        ...changes,
        { field: "language", changed: language !== initialSelectedLanguage },
      ]);
    }
  };

  const handleToggleChange = (value) => {
    setIsRequestQueueEnabled(value);

    // Find the index of the existing 'requestQueue' entry in the 'changes' array
    const requestQueueIndex = changes.findIndex(
      (change) => change.field === "requestQueue"
    );

    // If the 'requestQueue' entry already exists, update its 'changed' property
    if (requestQueueIndex !== -1) {
      const updatedChanges = [...changes];
      updatedChanges[requestQueueIndex] = {
        field: "requestQueue",
        changed: value !== initialIsRequestQueueEnabled,
      };
      setChanges(updatedChanges);
    } else {
      // If the 'requestQueue' entry doesn't exist, add a new one to the 'changes' array
      setChanges([
        ...changes,
        {
          field: "requestQueue",
          changed: value !== initialIsRequestQueueEnabled,
        },
      ]);
    }
  };

  // Check if none of the 'changed' values are true
  const saveDisabled = !changes.some((change) => change.changed);

  const handleInfoButtonPress = () => {
    Alert.alert(
      t("user_info"),
      `${t("email")}: ${userEmail}\n${t("phone")}: ${userPhone}`,
      [{ text: "OK" }]
    );
  };

  const clearAllAsyncStorage = async () => {
    try {
      await AsyncStorage.clear();
      console.debug("AsyncStorage cleared successfully");
    } catch (error) {
      console.error("Error clearing AsyncStorage:", error);
    }
  };

  /**
   * Handles the logout process.
   * Shows a confirmation dialog before proceeding with the logout action.
   * Clears AsyncStorage and calls the logout API upon confirmation.
   */
  const onPressLogout = () => {
    // Show confirmation dialog
    Alert.alert(
      t("confirm"),
      t("user_logout_confirmation_message"),
      [
        {
          text: t("cancel"),
          style: "cancel",
        },
        {
          text: t("user_logout"),
          onPress: async () => {
            try {
              // Clear AsyncStorage
              clearAllAsyncStorage();

              // Call the logout API
              const logoutSuccess = callLogoutApi();

              if (logoutSuccess) {
                // Navigate back to the Login screen
                navigation.replace("Login");
              } else {
                // Handle logout failure
                Alert.alert(
                  "Logout failed",
                  "Failed to logout. Please try again."
                );
              }
            } catch (error) {
              console.error("Error logging out:", error);
              Alert.alert(
                "Error",
                "An error occurred while logging out. Please try again."
              );
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const onSave = async () => {
    try {
      // Save selected language in AsyncStorage
      if (selectedLanguage === null) {
        // Remove the preferredLanguage item from AsyncStorage if selectedLanguage is null
        await AsyncStorage.removeItem("preferredLanguage");
      } else {
        await AsyncStorage.setItem("preferredLanguage", selectedLanguage);
      }
      i18n.changeLanguage(selectedLanguage); // Change app's language

      // Save toggle value in AsyncStorage
      await AsyncStorage.setItem(
        "isRequestQueueEnabled",
        JSON.stringify(isRequestQueueEnabled)
      );

      setChanges([]); // Reset Changes state

      showToast(t("preferences_saved"));

      navigation.navigate("Home");
    } catch (error) {
      console.error(
        "Error saving preferred language in device storage:",
        error
      );
    }
  };

  const onCancel = () => {
    navigation.navigate("Home");
  };

  /**
   * Calls the logout API.
   * The logout API doesn't return anything, whether it's success or failure.
   * @returns {boolean} - True if the logout was successful, false otherwise.
   */
  const callLogoutApi = async () => {
    try {
      await fetchData(API_ENDPOINTS.LOGOUT, "GET", {}, {});
      // The logout API doesn't return anything. So, fetch data function returns an empty object.
      return true;
    } catch (error) {
      // Handle any errors that occur during the API call
      console.error("Error calling logout API:", error);
      return false;
    }
  };

  useEffect(() => {
    // Fetch user's preferred language and request queue status from AsyncStorage on component mount
    const fetchDataFromStorage = async () => {
      try {
        const preferredLanguage = await AsyncStorage.getItem(
          "preferredLanguage"
        );
        const isQueueEnabled = await AsyncStorage.getItem(
          "isRequestQueueEnabled"
        );
        if (preferredLanguage !== null) {
          setSelectedLanguage(preferredLanguage);
          setInitialSelectedLanguage(preferredLanguage);
        }
        if (isQueueEnabled !== null) {
          setIsRequestQueueEnabled(JSON.parse(isQueueEnabled));
          setInitialIsRequestQueueEnabled(JSON.parse(isQueueEnabled));
        }
      } catch (error) {
        console.error("Error fetching data from AsyncStorage:", error);
      }
    };
    fetchDataFromStorage();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: t("user_preference"),
      headerRight: () => (
        <View style={styles.headerRightContainer}>
          {/* Info button */}
          <CustomButton
            onPress={handleInfoButtonPress}
            label=""
            icon={{
              name: "info-circle",
              library: "FontAwesome",
              size: 24,
              color: "white",
            }}
            backgroundColor={false}
          />
          {/* Logout button */}
          <Pressable onPress={onPressLogout}>
            <Text style={styles.logoutButtonText}>{t("user_logout")}</Text>
          </Pressable>
        </View>
      ),
    });
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.preferenceContainer}>
        <CustomPicker
          placeholder={t("user_select_language")}
          items={languages}
          initialValue={selectedLanguage}
          onFilter={handleLanguageChange}
        />
        {/* Toggle switch for enabling/disabling request queue */}
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>{t("enable_request_queue")}</Text>
          <Switch
            trackColor={{ false: "#767577", true: "#005eb8" }}
            thumbColor={isRequestQueueEnabled ? "#f5dd4b" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={handleToggleChange}
            value={isRequestQueueEnabled}
          />
        </View>
      </ScrollView>
      <SaveCancelBar
        onSave={onSave}
        onCancel={onCancel}
        saveLabel={t("save")}
        cancelLabel={t("cancel")}
        saveIcon="save"
        cancelIcon="times"
        saveDisable={saveDisabled}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRightContainer: {
    width: screenDimension.width / 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  preferenceContainer: {
    padding: "4%",
  },
  logoutButtonText: {
    textDecorationLine: "underline",
    textDecorationColor: "white",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
    color: "white",
    marginLeft: 10,
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  toggleLabel: {
    fontSize: 16,
  },
});

export default User;
