import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  ScrollView,
  Dimensions,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { SvgXml, Svg, Path, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";

import { LoggedInUserInfoContext } from "../../context/LoggedInUserInfoContext";
import { useClientPaths } from "../../context/ClientPathsContext";
import { parseUserComms } from "../utils/UserUtils";
import { convertToDateFNSFormat } from "../utils/FormatUtils";
import { APP } from "../constants";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CARD_TOP = SCREEN_HEIGHT * (189 / 852);
const AVATAR_SIZE = 90;

// ── Parabolic dome dimensions
const DOME_SIDES_Y = CARD_TOP;
const DOME_DEPTH = 72;
const DOME_SVG_HEIGHT = DOME_SIDES_Y + DOME_DEPTH + 8;

const DOME_PATH = [
  `M 0 0`,
  `L ${SCREEN_WIDTH} 0`,
  `L ${SCREEN_WIDTH} ${DOME_SIDES_Y}`,
  `Q ${SCREEN_WIDTH / 2} ${DOME_SIDES_Y + DOME_DEPTH} 0 ${DOME_SIDES_Y}`,
  `Z`,
].join(" ");

const CARD_BOTTOM =
  Platform.OS === "ios"
    ? SCREEN_HEIGHT * 0.04 + 150
    : SCREEN_HEIGHT * 0.02 + 150;

// ─── SVG Strings ─────────────────────────────────────────────────────────────

/** Camera icon rendered inside the small blue button on the avatar */
const cameraAvatarXml = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" fill="white"/>
<circle cx="12" cy="13" r="4" stroke="#0072E5" stroke-width="1.8" fill="none"/>
</svg>`;

/** Photo library icon for the bottom sheet */
const photoLibraryXml = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="2" y="6" width="16" height="14" rx="2" stroke="#0072E5" stroke-width="1.5"/>
<path d="M6 2h14a2 2 0 0 1 2 2v14" stroke="#0072E5" stroke-width="1.5" stroke-linecap="round"/>
<circle cx="7.5" cy="11.5" r="1.5" fill="#0072E5"/>
<path d="M2 16l4-4 3 3 3-3 5 5" stroke="#0072E5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

/** Camera icon for the bottom sheet */
const cameraSheetXml = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="#0072E5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<circle cx="12" cy="13" r="4" stroke="#0072E5" stroke-width="1.5"/>
</svg>`;

/** Trash icon for the bottom sheet */
const trashXml = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<polyline points="3 6 5 6 21 6" stroke="#E53935" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="#E53935" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<line x1="10" y1="11" x2="10" y2="17" stroke="#E53935" stroke-width="1.5" stroke-linecap="round"/>
<line x1="14" y1="11" x2="14" y2="17" stroke="#E53935" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

/** Chevron right for each row */
const chevronXml = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9 18l6-6-6-6" stroke="#BDBDBD" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;


/**
 * ReadOnlyField
 *
 * A labelled, non-editable text field that communicates read-only intent to the
 * user both visually and via accessibility APIs. Backed by a real `TextInput`
 * so that screen readers correctly announce it as a text field rather than
 * plain static text.
 *
 * Props:
 *   label  {string}  – The field label rendered above the input.
 *   value  {string}  – The display value; em-dash placeholder shown when empty.
 */
const ReadOnlyField = ({ label, value }) => (
  <View style={styles.fieldWrapper}>
    <Text style={styles.fieldLabel} accessibilityRole="text">
      {label}
    </Text>
    <TextInput
      style={styles.readOnlyInput}
      value={value ?? ""}
      editable={false}
      placeholder="—"
      placeholderTextColor="#BFBFBF"
      numberOfLines={1}
      caretHidden
      contextMenuHidden
      underlineColorAndroid="transparent"
      // Accessibility
      accessibilityLabel={label}
      accessibilityRole="text"
      accessibilityState={{ disabled: true }}
    />
  </View>
);


const MyProfile = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();

  // Context data
  const { loggedInUserInfo } = useContext(LoggedInUserInfoContext);
  const { clientPaths } = useClientPaths();

  // User comms (email/phone) from route params (passed when navigating from Home screen)
  const user = route?.params?.user ?? {};
  const { userEmail, userPhone } = parseUserComms(user);

  // Local profile image override (after user picks from library / takes photo)
  const [profileImage, setProfileImage] = useState(null);
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);

  // Resolve profile picture source: locally picked → cached path → placeholder
  const profileImageSource = profileImage
    ? { uri: profileImage }
    : clientPaths?.userThumbnailPath || clientPaths?.userPhotoPath
      ? { uri: clientPaths.userThumbnailPath || clientPaths.userPhotoPath }
      : require("../assets/images/blank-picture_640.png");

  // Format hire date if available
  let formattedHireDate = "";
  try {
    if (loggedInUserInfo?.hireDate) {
      formattedHireDate = format(
        new Date(loggedInUserInfo.hireDate),
        convertToDateFNSFormat(APP.LOGIN_USER_DATE_FORMAT)
      );
    }
  } catch {
    formattedHireDate = loggedInUserInfo?.hireDate ?? "";
  }

  // ──── Camera action handlers ────────────────────────────────────────────────

  const handleChooseFromLibrary = async () => {
    setShowPhotoSheet(false);
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library in Settings."
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image from library:", error);
    }
  };

  const handleTakePhoto = async () => {
    setShowPhotoSheet(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow camera access in Settings."
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
    }
  };

  const handleRemovePicture = () => {
    setShowPhotoSheet(false);
    setProfileImage(null);
  };
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Parabolic gradient dome (SVG — cross-platform, no extra deps) ── */}
      <Svg
        style={styles.dome}
        width={SCREEN_WIDTH}
        height={DOME_SVG_HEIGHT}
        accessible={false}
        importantForAccessibility="no"
      >
        <Defs>
          {/*
           * gradientUnits="userSpaceOnUse" pins the gradient vector to SVG
           * pixel coordinates, so the colour transition always spans from
           * y = 0 (top) to y = DOME_SIDES_Y (where the arc edges land).
           * The dome protrusion below DOME_SIDES_Y is filled with the last
           * stop colour (#0072E5) and is visually hidden behind the card.
           */}
          <SvgGradient
            id="headerGrad"
            x1="0"
            y1="0"
            x2="0"
            y2={DOME_SIDES_Y}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor="#003F7F" />
            <Stop offset="0.5596" stopColor="#003F7F" />
            <Stop offset="0.9373" stopColor="#0072E5" />
            <Stop offset="1" stopColor="#0072E5" />
          </SvgGradient>
        </Defs>
        <Path d={DOME_PATH} fill="url(#headerGrad)" />
      </Svg>

      {/* ── Custom header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        {/* Spacer to keep title centred */}
        <View style={styles.headerSpacer} />
      </View>

      {/* ── Profile avatar (overlaps header & card) ── */}
      <View style={styles.avatarWrapper}>
        {/* The avatar and camera button share a relative container */}
        <View style={styles.avatarRelative}>
          <Image
            style={styles.avatar}
            source={profileImageSource}
            contentFit="cover"
            accessibilityLabel="Profile picture"
          />
          {/* Camera change button */}
          <TouchableOpacity
            style={styles.cameraIconButton}
            onPress={() => setShowPhotoSheet(true)}
            accessibilityLabel="Change profile picture"
            accessibilityRole="button"
          >
            <SvgXml xml={cameraAvatarXml} width={16} height={16} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── White info card ── */}
      <View style={styles.card}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.cardContent}
          bounces={false}
        >
          <ReadOnlyField label="Email" value={userEmail} />

          <ReadOnlyField label="Phone" value={userPhone} />

          <ReadOnlyField
            label="Work Schedule"
            value={loggedInUserInfo?.workScheduleName ?? ""}
          />

          <ReadOnlyField label="Hire Date" value={formattedHireDate} />
        </ScrollView>
      </View>

      {/* ── Camera action bottom sheet ── */}
      <Modal
        visible={showPhotoSheet}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowPhotoSheet(false)}
      >
        {/* Dimmed overlay — tapping it closes the sheet */}
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setShowPhotoSheet(false)}
        />

        {/* The actual bottom sheet panel */}
        <View
          style={[styles.bottomSheet, { paddingBottom: insets.bottom || 20 }]}
        >
          {/* Choose from library */}
          <TouchableOpacity
            style={styles.sheetRow}
            onPress={handleChooseFromLibrary}
            accessibilityLabel="Choose from library"
            accessibilityRole="button"
          >
            <View style={styles.sheetIconWrap}>
              <SvgXml xml={photoLibraryXml} width={27} height={27} />
            </View>
            <Text style={styles.sheetRowText}>Choose from library</Text>
            <SvgXml xml={chevronXml} width={20} height={20} />
          </TouchableOpacity>

          <View style={styles.sheetDivider} />

          {/* Take photo */}
          <TouchableOpacity
            style={styles.sheetRow}
            onPress={handleTakePhoto}
            accessibilityLabel="Take photo"
            accessibilityRole="button"
          >
            <View style={styles.sheetIconWrap}>
              <SvgXml xml={cameraSheetXml} width={27} height={27} />
            </View>
            <Text style={styles.sheetRowText}>Take photo</Text>
            <SvgXml xml={chevronXml} width={20} height={20} />
          </TouchableOpacity>

          <View style={styles.sheetDivider} />

          {/* Remove current picture */}
          <TouchableOpacity
            style={styles.sheetRow}
            onPress={handleRemovePicture}
            accessibilityLabel="Remove current picture"
            accessibilityRole="button"
          >
            <View style={styles.sheetIconWrap}>
              <SvgXml xml={trashXml} width={27} height={27} />
            </View>
            <Text style={[styles.sheetRowText, styles.removeText]}>
              Remove current picture
            </Text>
            <SvgXml xml={chevronXml} width={20} height={20} />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F4F8",
  },

  // ── Gradient dome ──
  dome: {
    position: "absolute",
    top: 0,
    left: 0,
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    zIndex: 2,
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
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  headerSpacer: {
    width: 40,
  },

  // ── Avatar ──
  avatarWrapper: {
    position: "absolute",
    top: CARD_TOP - AVATAR_SIZE / 2,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  avatarRelative: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    backgroundColor: "#D0D0D0",
  },
  cameraIconButton: {
    position: "absolute",
    bottom: 2,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#0072E5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    // Shadow
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
  },

  // ── White Card ──
  card: {
    position: "absolute",
    top: CARD_TOP,
    left: `${(21 / 393) * 100}%`, // 5.34%
    width: `${(352.2 / 393) * 100}%`, // 89.6%
    bottom: CARD_BOTTOM,
    backgroundColor: "#FFFFFF",
    borderRadius: 23.72,
    paddingTop: AVATAR_SIZE / 2 + 20,
    overflow: "hidden",
    // Shadow
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
    }),
  },
  cardContent: {
    paddingHorizontal: `${(34 / 393) * 100}%`, // converts left: 34px from Figma
    paddingBottom: 24,
  },
  // ── Read-only field ──
  fieldWrapper: {
    // Provides stable spacing between label and sibling elements
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1A1A1A",
    marginTop: 16,
    marginBottom: 6,
  },
  readOnlyInput: {
    width: "100%",
    height: 51,
    borderRadius: 8.89,
    backgroundColor: "#F5F6FA",
    paddingHorizontal: 14,
    paddingVertical: 0,
    textAlignVertical: "center",
    fontSize: 14,
    color: "#4A4A4A",
  },

  // ── Bottom Sheet ──
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  bottomSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  sheetIconWrap: {
    width: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  sheetRowText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "400",
    color: "#1A1A1A",
    marginLeft: 10,
  },
  removeText: {
    color: "#E53935",
  },
  sheetDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginLeft: 60,
    marginRight: 20,
  },
});

export default MyProfile;
