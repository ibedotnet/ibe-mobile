import React, { useContext, useEffect, useState } from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useTranslation } from "react-i18next";

import * as SecureStore from "expo-secure-store";
import Checkbox from "expo-checkbox";
import Ionicons from "@expo/vector-icons/Ionicons";

import Loader from "../components/Loader";

import { API_ENDPOINTS, APP, LOGIN_INPUTS_MAXLENGTH } from "../constants";

import { fetchData } from "../utils/APIUtils";
import { showToast } from "../utils/MessageUtils";
import { screenDimension } from "../utils/ScreenUtils";

import { common } from "../styles/common";
import { LoggedInUserInfoContext } from "../../context/LoggedInUserInfoContext";

/**
 * Login component for user authentication.
 * @component
 * @param {Object} navigation - Navigation prop for navigation between screens.
 * @returns {JSX.Element} JSX element representing the Login component.
 */
const Login = ({ navigation }) => {
  // Initialize useTranslation hook
  const { t } = useTranslation();

  const { loggedInUserInfo } = useContext(LoggedInUserInfoContext);

  // State variables
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [clientId, setClientId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const logoWidth = screenDimension.width / 2;

  /**
   * Fetches stored username and client ID from SecureStore on component mount.
   * @async
   * @function
   * @name retrieveStoredCredentials
   * @returns {void}
   */
  const retrieveStoredCredentials = async () => {
    try {
      const storedUsername = await SecureStore.getItemAsync("username");
      const storedClientId = await SecureStore.getItemAsync("clientId");
      const storedPassword = await SecureStore.getItemAsync("password");

      if (storedUsername) {
        setUsername(storedUsername);
      }
      if (storedClientId) {
        setClientId(storedClientId);
      }
      if (storedPassword) {
        setPassword(storedPassword);
      }

      if (storedUsername && storedClientId && storedPassword) {
        try {
          await onPressLogin(storedUsername, storedPassword, storedClientId);
        } catch (loginError) {
          console.error("Error during automatic login:", loginError);
        }
      }
    } catch (error) {
      console.error("Error retrieving stored credentials: ", error);
    }
  };

  useEffect(() => {
    retrieveStoredCredentials();
  }, []);

  /**
   * Validates user inputs (username, password, and client ID) before login attempt.
   * Displays a toast message if validation fails.
   * @function
   * @name validateInputs
   * @param {string} username - The entered username.
   * @param {string} password - The entered password.
   * @param {string} clientId - The entered client ID.
   * @returns {boolean} - Returns true if inputs are valid, false otherwise.
   */
  const validateInputs = (username, password, clientId) => {
    if (!username) {
      showToast(t("login_username_required"), "error");
      return false;
    }
    if (!password) {
      showToast(t("login_password_required"), "error");
      return false;
    }
    if (!clientId) {
      showToast(t("login_clientId_required"), "error");
      return false;
    }
    return true;
  };

  /**
   * Updates global app user data after a successful login.
   * @function
   * @name updateAppUserData
   * @param {Object} data - response data received from the authenticate API.
   * @returns {void}
   */
  const updateAppUserData = (data) => {
    APP.LOGIN_USER_CLIENT =
      data && data["User"] && data["clientid"] ? data["clientid"] : "m/d/y";
    APP.LOGIN_USER_DATE_FORMAT =
      data && data["User"] && data["UserDateFormat"]
        ? data["UserDateFormat"]
        : "m/d/y";
    APP.LOGIN_USER_EMPLOYEE_ID = data?.User?.[0]?.["Resource-id"] ?? "";
    APP.LOGIN_USER_ID = data?.User?.[0]?.["User-id"] ?? "";
    APP.LOGIN_USER_LANGUAGE =
      data?.User?.[0]?.["User-preferences"]?.language ?? "en";
    loggedInUserInfo.personId = data?.User?.[0]?.["Person-id"] ?? "";
    loggedInUserInfo.timeConfirmationType =
      data?.empWorkSchedue?.timeConfirmationType ?? "";
    loggedInUserInfo.hireDate =
      data?.User?.[0]?.["Resource-core-hireDate"] ?? null;
    loggedInUserInfo.termDate =
      data?.User?.[0]?.["Resource-core-termDate"] ?? null;
    loggedInUserInfo.companyId = data?.User?.[0]?.["Resource-companyID"] ?? "";
    loggedInUserInfo.workScheduleExtId = data?.empWorkSchedue?.extID ?? "";
    loggedInUserInfo.workScheduleName = data?.empWorkSchedue?.name ?? "";
    loggedInUserInfo.dailyStdHours =
      data?.empWorkSchedue?.dailyStdHours ?? 28800000;
    loggedInUserInfo.stdWorkHours =
      data?.empWorkSchedue?.stdWorkHours ?? 28800000;
    loggedInUserInfo.minWorkHours =
      data?.empWorkSchedue?.minWorkHours ?? 28800000;
    loggedInUserInfo.maxWorkHours =
      data?.empWorkSchedue?.maxWorkHours ?? 28800000;
    loggedInUserInfo.workHoursInterval =
      data?.empWorkSchedue?.workHoursInterval ?? "week";
    loggedInUserInfo.patterns = data?.empWorkSchedue?.patterns ?? [];
    loggedInUserInfo.calendarExtId = data?.empWorkCalendar?.extID ?? "";
    loggedInUserInfo.nonWorkingDates =
      data?.empWorkCalendar?.nonWorkingDates ?? [];
    loggedInUserInfo.nonWorkingDays =
      data?.empWorkCalendar?.nonWorkingDays ?? [];
    loggedInUserInfo.startOfWeek = data?.empWorkCalendar?.startOfWeek ?? 1;

    console.debug(
      `Logged in details:
        user id: ${APP.LOGIN_USER_ID},
        language: ${APP.LOGIN_USER_LANGUAGE},
        client id: ${APP.LOGIN_USER_CLIENT},
        employee id: ${APP.LOGIN_USER_EMPLOYEE_ID},
        preferred date format: ${APP.LOGIN_USER_DATE_FORMAT},
        person id: ${loggedInUserInfo.personId},
        time confirmation type: ${loggedInUserInfo.timeConfirmationType},
        hire date: ${loggedInUserInfo.hireDate},
        company id: ${loggedInUserInfo.companyId},
        work schedule ext id: ${loggedInUserInfo.workScheduleExtId},
        daily std hours: ${loggedInUserInfo.dailyStdHours},
        std work hours: ${loggedInUserInfo.stdWorkHours},
        min work hours: ${loggedInUserInfo.minWorkHours},
        max work hours: ${loggedInUserInfo.maxWorkHours},
        work hours interval: ${loggedInUserInfo.workHoursInterval},
        calendar ext id: ${loggedInUserInfo.calendarExtId},
        non-working days: ${loggedInUserInfo.nonWorkingDays},
        start of week: ${loggedInUserInfo.startOfWeek}`
    );
  };

  /**
   * Handles the press event when the user clicks the login button.
   * Initiates the login process by calling the authentication API.
   * @async
   * @function
   * @name onPressLogin
   * @param {string} username - The entered username.
   * @param {string} password - The entered password.
   * @param {string} clientId - The entered client ID.
   * @returns {void}
   */
  const onPressLogin = async (username, password, clientId) => {
    // Validate the input fields
    if (!validateInputs(username, password, clientId)) {
      return;
    }

    // Hide the keyboard to improve user experience
    Keyboard.dismiss();

    // Set the loading state to true to show a loader
    setIsLoading(true);

    // Convert password to an array of ASCII values as required by the API
    const passwordInASCIIArr = Array.from(password, (char) =>
      char.charCodeAt(0)
    );

    // Prepare the data to be sent in the authentication request
    let authenticateData = {
      user: username,
      password: "[" + passwordInASCIIArr + "]", // API accepts the password as array of ASCII values
      enterpriseID: parseInt(clientId),
      remember: true,
      validateOnly: false,
      isPortal: "false",
    };

    // Convert the data to URLSearchParams format
    const formData = new URLSearchParams(authenticateData);

    /**
     * Perform authentication with the provided user credentials.
     * If successful, update app user data and navigate to the Home screen.
     * Display error messages for unsuccessful login attempts.
     */
    const authenticate = async () => {
      try {
        // Make the API call to authenticate the user
        const authenticationResult = await fetchData(
          API_ENDPOINTS.AUTHENTICATE,
          "POST",
          {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          },
          formData.toString()
        );

        // Handle unsuccessful authentication
        if (
          !authenticationResult ||
          Object.keys(authenticationResult).length === 0 ||
          !authenticationResult.success
        ) {
          showToast(
            authenticationResult && authenticationResult.param_msgText
              ? authenticationResult.param_msgText
              : t("login_error_message"),
            "error"
          );
          return;
        }

        // Store credentials if 'Remember Me' is checked
        if (rememberMe) {
          try {
            await SecureStore.setItemAsync("username", username);
            await SecureStore.setItemAsync("clientId", clientId);
            await SecureStore.setItemAsync("password", password);
          } catch (error) {
            console.error("Error storing credentials:", error);
          }
        }

        // Update the app user data with the received authentication result
        updateAppUserData(authenticationResult);

        // Navigate to the Home screen after successful login
        navigation.replace("Home", { authenticationResult });
      } catch (error) {
        // Show a toast message for any exception during login
        showToast(t("login_exception_message"), "error");
        throw error;
      } finally {
        // Set the loading state to false to hide the loader
        setIsLoading(false);
      }
    };

    // Call the authenticate function
    try {
      await authenticate();
    } catch (error) {
      console.error("Error in authenticate:", error);
      setIsLoading(false);
    }
  };

  // Login component rendering
  return (
    <KeyboardAvoidingView
      style={common.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <Image
          style={{ width: logoWidth }}
          source={require("../assets/images/ibe-logo.jpg")}
          alt="ibe logo"
          resizeMode="contain"
        />
      </View>
      <View style={styles.main}>
        <TextInput
          style={styles.input}
          placeholder={t("login_username_placeholder")}
          placeholderTextColor="darkgrey"
          maxLength={LOGIN_INPUTS_MAXLENGTH.USERNAME}
          value={username}
          onChangeText={(username) => setUsername(username)}
        />
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.password}
            placeholder={t("login_password_placeholder")}
            placeholderTextColor="darkgrey"
            secureTextEntry={!showPassword}
            maxLength={LOGIN_INPUTS_MAXLENGTH.PASSWORD}
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={(password) => setPassword(password)}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={24}
              color="black"
            />
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          placeholder={t("login_clientId_placeholder")}
          placeholderTextColor="darkgrey"
          keyboardType="numeric"
          maxLength={LOGIN_INPUTS_MAXLENGTH.CLIENTID}
          value={clientId}
          onChangeText={(clientId) => setClientId(clientId)}
        />
        <View style={styles.checkboxContainer}>
          <Checkbox
            style={styles.checkbox}
            value={rememberMe}
            color={rememberMe ? "#005eb8" : undefined}
            onValueChange={() => setRememberMe(!rememberMe)}
          />
          <Text style={styles.checkboxText}>{t("login_rememberMe_text")}</Text>
        </View>
        <Pressable
          style={styles.loginButton}
          onPress={() => onPressLogin(username, password, clientId)}
        >
          <Text style={styles.loginButtonText}>{t("login_button_text")}</Text>
        </Pressable>
        {isLoading && <Loader />}
      </View>
      <View style={styles.footer}>
        <Text>
          {t("login_version_text")} {APP.VERSION}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  header: {
    flex: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  main: {
    flex: 3,
    width: "100%",
    justifyContent: "center",
  },
  input: {
    borderWidth: 2,
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: "4%",
  },
  passwordContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: "4%",
  },
  password: {
    flex: 1,
  },
  checkboxContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: "4%",
  },
  checkbox: {
    borderColor: "#000",
    marginRight: 5,
  },
  checkboxText: {
    fontSize: 16,
  },
  loginButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: "5%",
    borderRadius: 30,
    backgroundColor: "#005eb8",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
    color: "white",
  },
  footer: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
});

export default Login;
