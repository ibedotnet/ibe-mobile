import React, { useEffect, useState } from "react";
import { Image, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

const Home = ({ route, navigation }) => {
  // Initialize useTranslation hook
  const { t } = useTranslation();

  const logoDimension = screenDimension.width / 2;

  const [clientPaths, setClientPaths] = useState({
    clientLogoPath: null,
    userPhotoPath: null,
    userThumbnailPath: null,
  });

  const authenticationResult = route?.params?.authenticationResult ?? {};

  const userName =
    authenticationResult?.User?.[0]?.["Resource-core-name-knownAs"] ??
    t("home_hello_user");

  const navigateToUploadPhoto = () => {
    navigation.navigate("CustomImagePicker", {
      userPhoto: clientPaths.userPhotoPath,
      linkBackToBusObjcat: "Resource",
      clientPaths: clientPaths,
    });
  };

  const navigateToUserScreen = () => {
    navigation.navigate("User", {
      user: authenticationResult?.User?.[0] ?? {},
    });
  };

  const fetchClientDataConcurrently = async (authenticationResult) => {
    if (Object.entries(authenticationResult).length === 0) {
      return;
    }

    let clientLogoId =
      authenticationResult?.User?.[0]?.["Client-clientLogo"] ?? "";
    let userPhotoId = authenticationResult?.User?.[0]?.["Person-photoID"] ?? "";
    let userThumbnailId =
      authenticationResult?.User?.[0]?.["Person-thumbnailID"] ?? "";

    try {
      const [
        fetchedClientLogoPath,
        fetchedUserPhotoPath,
        fetchedUserThumbnailPath,
      ] = await Promise.all([
        fetchAndCacheResource(clientLogoId),
        fetchAndCacheResource(userPhotoId),
        fetchAndCacheResource(userThumbnailId),
      ]);

      console.debug("Fetched client logo path:", fetchedClientLogoPath);
      console.debug("Fetched user photo path:", fetchedUserPhotoPath);
      console.debug("Fetched user thumbnail path:", fetchedUserThumbnailPath);

      const updatedPaths = {
        clientLogoPath: fetchedClientLogoPath,
        userPhotoPath: fetchedUserPhotoPath,
        userThumbnailPath: fetchedUserThumbnailPath,
      };

      setClientPaths(updatedPaths);

      console.debug("Images successfully fetched and cached");
    } catch (error) {
      console.error("Error fetching and caching images: ", error);
    }
  };

  useEffect(() => {
    fetchClientDataConcurrently(authenticationResult);
  }, []);

  const headerRight = () => {
    return (
      <View style={styles.headerRight}>
        <TouchableOpacity onPress={navigateToUploadPhoto}>
          <Image
            style={styles.userPhoto}
            source={
              clientPaths.userThumbnailPath || clientPaths.userPhotoPath
                ? {
                    uri:
                      clientPaths.userThumbnailPath ||
                      clientPaths.userPhotoPath,
                  }
                : require("../assets/images/blank-picture_640.png")
            }
            alt="user photo"
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={navigateToUserScreen}>
          <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
            {userName}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  useEffect(() => {
    navigation.setOptions({
      headerTitle: "",
      headerRight: headerRight,
    });
  }, [clientPaths]);

  const onPressTimesheets = () => navigation.navigate("Timesheet");
  const onPressExpenses = () => navigation.navigate("Expense");
  const onPressAbsences = () => navigation.navigate("Absence");
  const onPressApprovals = () => navigation.navigate("Inbox");

  return (
    <SafeAreaView style={common.container}>
      <View style={styles.logoContainer}>
        <Image
          style={{
            width: logoDimension,
            height: logoDimension,
            maxHeight: screenDimension.width / 3,
            maxWidth: screenDimension.width / 3,
            borderWidth: 1,
            borderRadius: 8,
          }}
          source={
            clientPaths.clientLogoPath
              ? {
                  uri: clientPaths.clientLogoPath,
                }
              : require("../assets/images/client-logo-placeholder_500.png")
          }
          alt="client logo"
          resizeMode="contain"
        />
      </View>
      <View style={styles.main}>
        <View style={styles.row}>
          <TouchableOpacity onPress={onPressTimesheets}>
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
          <TouchableOpacity onPress={onPressExpenses}>
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
        <View style={styles.row}>
          <TouchableOpacity onPress={onPressAbsences}>
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
          <TouchableOpacity onPress={onPressApprovals}>
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

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  userPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "white",
    marginRight: 12,
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
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  cardText: {
    fontWeight: "bold",
    color: "#000",
  },
});

export default Home;
