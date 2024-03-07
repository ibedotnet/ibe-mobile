import React, { useState, useEffect } from "react";
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

import AsyncStorage from "@react-native-async-storage/async-storage";

import Checkbox from "expo-checkbox";
import Ionicons from "@expo/vector-icons/Ionicons";

import CustomToast from "../components/CustomToast";
import Loader from "../components/Loader";

import { API_ENDPOINTS, APP, LOGIN_INPUTS_MAXLENGTH } from "../constants";

import { fetchData } from "../utils/APIUtils";
import { showToast } from "../utils/MessageUtils";
import { screenDimension } from "../utils/ScreenUtils";

import common from "../styles/common";

/**
 * Login component for user authentication.
 * @component
 * @param {Object} navigation - Navigation prop for navigation between screens.
 * @returns {JSX.Element} JSX element representing the Login component.
 */
const Login = ({ navigation }) => {
  // State variables
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [clientId, setClientId] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const logoWidth = screenDimension.width / 2;

  /**
   * Fetches stored username and client ID from AsyncStorage on component mount.
   * @async
   * @function
   * @name retrieveStoredCredentials
   * @returns {void}
   */
  const retrieveStoredCredentials = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem("username");
      const storedClientId = await AsyncStorage.getItem("clientId");
      if (storedUsername) {
        setUsername(storedUsername);
      }
      if (storedClientId) {
        setClientId(storedClientId);
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
   * @returns {boolean} - Returns true if inputs are valid, false otherwise.
   */
  const validateInputs = () => {
    if (!username) {
      showToast("Username is required.");
      return false;
    }
    if (!password) {
      showToast("Password is required.");
      return false;
    }
    if (!clientId) {
      showToast("Client Id is required.");
      return false;
    }
    return true;
  };

  /**
   * Updates global app user data after a successful login.
   * @function
   * @name updateAppUserData
   * @param {Object} userData - User data received from the authenticate API.
   * @returns {void}
   */
  const updateAppUserData = (userData) => {
    APP.LOGIN_USER_CLIENT =
      userData && userData["User"] && userData["clientid"]
        ? userData["clientid"]
        : "m/d/y";
    APP.LOGIN_USER_DATE_FORMAT =
      userData && userData["User"] && userData["UserDateFormat"]
        ? userData["UserDateFormat"]
        : "m/d/y";
    APP.LOGIN_USER_EMPLOYEE_ID = userData?.User?.[0]?.["Resource-id"] ?? "";
    APP.LOGIN_USER_ID = userData?.User?.[0]?.["User-id"] ?? "";
    APP.LOGIN_USER_LANGUAGE =
      userData?.User?.[0]?.["User-preferences"]?.language ?? "en";

    console.debug(
      `Logged in details
        user id: ${APP.LOGIN_USER_ID},
        language: ${APP.LOGIN_USER_LANGUAGE},
        client id: ${APP.LOGIN_USER_CLIENT},
        employee id: ${APP.LOGIN_USER_EMPLOYEE_ID},
        preferred date format: ${APP.LOGIN_USER_DATE_FORMAT}`
    );
  };

  /**
   * Handles the press event when the user clicks the login button.
   * Initiates the login process by calling the authentication API.
   * @async
   * @function
   * @name onPress
   * @returns {void}
   */
  const onPress = async () => {
    if (!validateInputs()) {
      return;
    }

    // Hide the keyboard to improve user experience
    Keyboard.dismiss();

    setIsLoading(true);

    const passwordInASCIIArr = Array.from(password, (char) =>
      char.charCodeAt(0)
    );

    let authenticateData = {
      user: username,
      password: "[" + passwordInASCIIArr + "]", // API accepts the password as array of ASCII values
      enterpriseID: parseInt(clientId),
      remember: true,
      validateOnly: false,
      isPortal: "false",
    };

    const formData = new URLSearchParams(authenticateData);

    /**
     * Perform authentication with the provided user credentials.
     * If successful, update app user data and navigate to the Home screen.
     * Display error messages for unsuccessful login attempts.
     */
    const authenticate = async () => {
      try {
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
              : "An error occurred during login."
          );
          return;
        }

        // Store credentials if 'Remember Me' is checked
        if (rememberMe) {
          try {
            await AsyncStorage.setItem("username", username);
            await AsyncStorage.setItem("clientId", clientId);
          } catch (error) {
            console.error("Error storing credentials:", error);
          }
        }

        updateAppUserData(authenticationResult);

        navigation.replace("Home", { authenticationResult });
      } catch (error) {
        showToast("An exception occurred during login.");
      } finally {
        setIsLoading(false);
      }
    };
    authenticate();
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
          placeholder="Username"
          placeholderTextColor="darkgrey"
          maxLength={LOGIN_INPUTS_MAXLENGTH.USERNAME}
          value={username}
          onChangeText={(username) => setUsername(username)}
        />
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.password}
            placeholder="Password"
            placeholderTextColor="darkgrey"
            secureTextEntry={!showPassword}
            maxLength={LOGIN_INPUTS_MAXLENGTH.PASSWORD}
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={(password) => setPassword(password)}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "ios-eye-off" : "ios-eye"}
              size={24}
              color="black"
            />
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Client ID"
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
          <Text style={styles.checkboxText}>Remember Me</Text>
        </View>
        <Pressable style={styles.loginButton} onPress={onPress}>
          <Text style={styles.loginButtonText}>Login</Text>
        </Pressable>
        {isLoading && <Loader />}
        <CustomToast />
      </View>
      <View style={styles.footer}>
        <Text>Version {APP.VERSION}</Text>
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
    shadowColor: "#000000",
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
