import React, { useCallback, useEffect, useMemo } from "react"; // React and hooks
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { Image } from "expo-image";
import {
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";

import { useTranslation } from "react-i18next";

import { fetchAndCacheResource } from "../utils/APIUtils";
import { screenDimension } from "../utils/ScreenUtils";

import { common } from "../styles/common";
import { useClientPaths } from "../../context/ClientPathsContext";

const Home = ({ route, navigation }) => {
  const { t } = useTranslation();

  const logoDimension = useMemo(() => screenDimension.width / 2, []);

  /**
   * Retrieves the client image paths from the ClientPaths context.
   * This includes the paths for the client logo, user photo, and user thumbnail.
   * The paths are used to display images in the UI, allowing for dynamic updates
   * based on the fetched values from the server.
   */
  const { clientPaths, setClientPaths } = useClientPaths();

  const authenticationResult = route?.params?.authenticationResult ?? {};

  const userName =
    authenticationResult?.User?.[0]?.["Resource-core-name-knownAs"] ??
    t("home_hello_user");

  /**
   * Navigates to the CustomImagePicker screen, passing the user's photo path and client paths.
   * The `linkBackToBusObjcat` is a parameter expected by the target screen.
   */
  const navigateToUploadPhoto = useCallback(() => {
    console.log("Navigating to CustomImagePicker with paths:", clientPaths);
    navigation.navigate("CustomImagePicker", {
      linkBackToBusObjcat: "Resource",
    });
  }, [clientPaths, navigation]);

  /**
   * Navigates to the User screen, passing the user data from the authentication result.
   * The user data is used to display detailed user information on the target screen.
   */
  const navigateToUserScreen = useCallback(() => {
    console.log(
      "Navigating to User screen with authentication result:",
      JSON.stringify(authenticationResult, null, 2)
    );
    navigation.navigate("User", {
      user: authenticationResult?.User?.[0] ?? {},
    });
  }, [authenticationResult, navigation]);

  /**
   * Fetches client logo, user photo, and user thumbnail concurrently.
   * Uses `Promise.all` to run the fetch operations in parallel, improving performance.
   * Updates the state with the image paths when fetched successfully.
   */
  const fetchClientDataConcurrently = useCallback(async (authResult) => {
    if (Object.entries(authResult).length === 0) {
      console.log(
        "No authentication result provided, unable to fetch user data."
      );
      return;
    }

    const clientLogoId = authResult?.User?.[0]?.["Client-clientLogo"] ?? "";
    const userPhotoId = authResult?.User?.[0]?.["Person-photoID"] ?? "";
    const userThumbnailId = authResult?.User?.[0]?.["Person-thumbnailID"] ?? "";

    try {
      const [clientLogoPath, userPhotoPath, userThumbnailPath] =
        await Promise.all([
          fetchAndCacheResource(clientLogoId),
          fetchAndCacheResource(userPhotoId),
          fetchAndCacheResource(userThumbnailId),
        ]);

      setClientPaths({
        clientLogoPath,
        userPhotoPath,
        userThumbnailPath,
      });
    } catch (error) {
      console.error("Error fetching and caching images: ", error);
    }
  }, []);

  /**
   * Fetches client logo, user photo, and user thumbnail when the authentication result changes.
   * The fetch process is initiated once the authentication data is available.
   */
  useEffect(() => {
    fetchClientDataConcurrently(authenticationResult);
  }, [authenticationResult, fetchClientDataConcurrently]);

  /**
   * Gets the source object for the user image.
   * This function checks the `clientPaths` state for the available user images.
   * It prioritizes the user thumbnail path over the user photo path.
   * If neither image path is available, it returns a default placeholder image.
   *
   * @function getUserImageSource
   * @returns {object} An object representing the image source.
   *                   - If a user thumbnail or photo path is available, it returns an object with the `uri` property set to the image path.
   *                   - If neither path is available, it returns a default placeholder image as a local require.
   *
   * @example
   * const userImageSource = getUserImageSource();
   * // userImageSource will either be { uri: "path/to/image" } or the default placeholder.
   */
  const getUserImageSource = useMemo(() => {
    return clientPaths.userThumbnailPath || clientPaths.userPhotoPath
      ? { uri: clientPaths.userThumbnailPath || clientPaths.userPhotoPath }
      : require("../assets/images/blank-picture_640.png"); // Placeholder if no image is available
  }, [clientPaths]);

  /**
   * Gets the source object for the client logo image.
   * If a client logo path is available, returns an object with the `uri` property set to the image path.
   * Otherwise, returns a default placeholder logo image.
   *
   * @returns {object} The source for the client logo, with the image URI or a local placeholder.
   */
  const getClientLogoSource = useMemo(() => {
    return clientPaths.clientLogoPath
      ? { uri: clientPaths.clientLogoPath }
      : require("../assets/images/client-logo-placeholder_500.png"); // Placeholder if no logo is available
  }, [clientPaths.clientLogoPath]);

  /**
   * Sets custom header options for the screen, including a user photo, username, and help icon.
   * The header includes navigation links to the photo upload screen and user profile screen.
   */
  useEffect(() => {
    navigation.setOptions({
      headerTitle: "",
      headerLeft: () => (
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={navigateToUploadPhoto}
            accessibilityLabel={t("navigate_to_photo_upload")}
          >
            <Image
              style={styles.userPhoto}
              source={getUserImageSource}
              onError={(error) =>
                console.error("Error loading user photo:", error)
              }
              resizeMode="contain"
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={navigateToUserScreen}
            accessibilityLabel={t("navigate_to_user_screen")}
          >
            <Text
              style={styles.userName}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {userName}
            </Text>
          </TouchableOpacity>
        </View>
      ),
      headerRight: () => (
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => navigation.navigate("Help")}
            accessibilityLabel={t("navigate_to_help")}
          >
            <Ionicons name="help-circle-outline" size={30} color="#fff" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [getUserImageSource, navigateToUploadPhoto, navigateToUserScreen]);

  // Handlers for navigation to different screens
  const onPressTimesheets = () => navigation.navigate("Timesheet");
  const onPressExpenses = () => navigation.navigate("Expense");
  const onPressAbsences = () => navigation.navigate("Absence");
  const onPressApprovals = () => navigation.navigate("Inbox");

  return (
    <SafeAreaView style={common.container} testID="home-screen">
      {/**
      * Renders the client logo or a placeholder if the logo path is unavailable. 
      * `clientPaths.clientLogoPath` is fetched dynamically, while the local placeholder 
      * is used as a fallback in case the logo is not
      available. 
      */}
      <View style={styles.logoContainer}>
        <Image
          style={{
            width: logoDimension,
            height: logoDimension,
            maxHeight: screenDimension.width / 3,
            maxWidth: screenDimension.width / 3,
            borderWidth: 1,
            borderRadius: 8,
            borderColor: "#fff",
          }}
          source={getClientLogoSource}
          onError={(error) => console.error("Error loading logo image:", error)}
          onLoad={() =>
            console.log("Logo image loaded:", clientPaths.clientLogoPath)
          }
          resizeMode="contain"
        />
      </View>
      {/* Main Menu Section */}
      <View style={styles.main}>
        {/* Row for Timesheet and Expense buttons */}
        <View style={styles.row}>
          <TouchableOpacity
            onPress={onPressTimesheets}
            accessibilityLabel={t("navigate_to_timesheets")}
          >
            <View style={styles.card}>
              <Ionicons name="timer" size={24} color="black" />
              <Text
                style={styles.cardText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {`${t("timesheet")}s`}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onPressExpenses}
            accessibilityLabel={t("navigate_to_expenses")}
            disabled={true}
          >
            <View style={styles.card}>
              <FontAwesome name="credit-card" size={24} color="black" />
              <Text
                style={styles.cardText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {`${t("expense")}s`}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Row for Absence and Approvals buttons */}
        <View style={styles.row}>
          <TouchableOpacity
            onPress={onPressAbsences}
            accessibilityLabel={t("navigate_to_absences")}
            disabled={true}
          >
            <View style={styles.card}>
              <MaterialCommunityIcons
                name="airplane-takeoff"
                size={24}
                color="black"
              />
              <Text
                style={styles.cardText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {`${t("absence")}s`}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onPressApprovals}
            accessibilityLabel={t("navigate_to_approvals")}
            disabled={true}
          >
            <View style={styles.card}>
              <MaterialIcons name="approval" size={24} color="black" />
              <Text
                style={styles.cardText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t("approvals")}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

// Styles for the Home screen
const styles = StyleSheet.create({
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  headerRight: {
    paddingVertical: 8,
  },
  userPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "white",
    marginRight: 12,
    ...Platform.select({
      ios: {
        width: 32,
        height: 32,
        borderRadius: 16,
      },
    }),
  },
  userName: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    textDecorationLine: "underline",
  },
  logoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  main: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    marginBottom: "4%",
    columnGap: 18,
  },
  card: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: screenDimension.width,
    backgroundColor: "#f0f8ff",
    padding: "16%",
    borderWidth: 0.5,
    borderColor: "#005eb8",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  cardText: {
    fontWeight: "bold",
    color: "#000",
  },
});

export default Home;
