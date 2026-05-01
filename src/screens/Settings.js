import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { SvgXml } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";

const notificationIcon = require("../assets/icons/notification_icon.svg");
const worldIcon = require("../assets/icons/world_icon.svg");
const themeIcon = require("../assets/icons/theme_icon.svg");
const eyeIcon = require("../assets/icons/eye_icon.svg");
const supportIcon = require("../assets/icons/support_icon.svg");
const logoutIcon = require("../assets/icons/logout_icon.svg");

import { LoggedInUserInfoContext } from "../../context/LoggedInUserInfoContext";
import { useClientPaths } from "../../context/ClientPathsContext";

const ICON_SIZE = 17.857;
const chevronXml = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 18l6-6-6-6" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const SettingRow = ({ iconSource, label, onPress, isLogout = false, width }) => (
  <TouchableOpacity
    style={[styles.row, { width: width || "100%" }]}
    onPress={onPress}
    activeOpacity={0.7}
    accessibilityRole="button"
    accessibilityLabel={label}
  >
    <View style={styles.rowIconWrap}>
      <Image
        source={iconSource}
        style={{ width: ICON_SIZE, height: ICON_SIZE }}
        contentFit="contain"
      />
    </View>
    <Text style={[styles.rowLabel, isLogout && styles.rowLabelLogout]}>
      {label}
    </Text>
    <SvgXml xml={chevronXml} width={20} height={20} />
  </TouchableOpacity>
);

const Settings = ({ navigation }) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { loggedInUserInfo } = useContext(LoggedInUserInfoContext);
  const { clientPaths } = useClientPaths();

  const profileImageSource =
    clientPaths?.userThumbnailPath || clientPaths?.userPhotoPath
      ? { uri: clientPaths.userThumbnailPath || clientPaths.userPhotoPath }
      : require("../assets/images/blank-picture_640.png");

  const userName =
    [loggedInUserInfo?.firstName, loggedInUserInfo?.lastName]
      .filter(Boolean)
      .join(" ") ||
    loggedInUserInfo?.fullName ||
    loggedInUserInfo?.userName ||
    "User";

  const userRole =
    loggedInUserInfo?.designationName ??
    loggedInUserInfo?.jobTitle ??
    "";

  const horizontalPadding = screenWidth * 0.053;
  const cardWidth = Math.min(600, screenWidth - (horizontalPadding * 2));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={26} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom: (insets.bottom || 20) + (screenHeight * 0.1)
          },
        ]}
        bounces={false}
      >
        <TouchableOpacity
          style={[styles.profileCard, { width: cardWidth }]}
          onPress={() => navigation.navigate("MyProfile")}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="View profile"
        >
          <Image
            style={styles.avatar}
            source={profileImageSource}
            contentFit="cover"
            accessibilityLabel="Profile picture"
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>
              {userName}
            </Text>
            <Text style={styles.profileRole} numberOfLines={1}>
              {userRole}
            </Text>
          </View>
          <SvgXml xml={chevronXml} width={20} height={20} />
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>Other Settings</Text>
        <SettingRow
          iconSource={notificationIcon}
          label="Notifications"
          onPress={() => { }}
          width={cardWidth}
        />
        <SettingRow
          iconSource={worldIcon}
          label="language"
          onPress={() => navigation.navigate("LanguageSelection")}
          width={cardWidth}
        />
        <SettingRow
          iconSource={themeIcon}
          label="Theme"
          onPress={() => navigation.navigate("ThemeSelection")}
          width={cardWidth}
        />
        <SettingRow
          iconSource={eyeIcon}
          label="Colour Blind Friendly"
          onPress={() => navigation.navigate("ColourBlindSelection")}
          width={cardWidth}
        />
        <SettingRow
          iconSource={supportIcon}
          label="Support"
          onPress={() => navigation.navigate("SupportSelection")}
          width={cardWidth}
        />
        <SettingRow
          iconSource={logoutIcon}
          label="Logout"
          onPress={() => { }}
          isLogout
          width={cardWidth}
        />
      </ScrollView>
    </View>
  );
};

const cardShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  android: { elevation: 3 },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F4F8",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 18,
    backgroundColor: "#FFFFFF",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
    }),
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingTop: 20,
    alignItems: "center",
  },
  profileCard: {
    height: 72,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 15,
    paddingRight: 12,
    ...cardShadow,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#D0D0D0",
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  profileRole: {
    fontSize: 13,
    color: "#757575",
    marginTop: 2,
  },
  sectionLabel: {
    width: "100%",
    maxWidth: 600,
    fontSize: 15,
    fontWeight: "500",
    color: "#1A1A1A",
    marginTop: 20,
    marginBottom: 12,
    textAlign: "left",
    paddingHorizontal: 5,
  },
  row: {
    height: 51.28,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    paddingRight: 12,
    marginBottom: 12,
    ...cardShadow,
  },
  rowIconWrap: {
    width: ICON_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    flex: 1,
    marginLeft: 14,
    fontSize: 15,
    color: "#1A1A1A",
  },
  rowLabelLogout: {
    color: "#E53935",
    fontWeight: "500",
  },
});

export default Settings;
