import React, { useEffect } from "react";
import { Alert, View, Platform, BackHandler } from "react-native";
import CustomButton from "./CustomButton";

/**
 *
 * This component renders a customizable back button for navigation.
 * It uses a touchable area that triggers the `handlePress` function when pressed.
 * An icon from the Ionicons library is displayed as the button's visual representation.
 *
 * @param {Object} props - The props object.
 * @param {Object} props.navigation - The navigation object provided by React Navigation.
 * @param {boolean} props.hasUnsavedChanges - Indicates if there are unsaved changes.
 * @param {Function} props.discardChanges - Function to discard unsaved changes. Defaults to an empty function.
 * @param {Function} props.t - Localization function to translate alert messages.
 *
 * Usage:
 *   <CustomBackButton navigation={navigation} hasUnsavedChanges={hasUnsavedChanges} discardChanges={discardChanges} t={t} />
 */
const CustomBackButton = ({
  navigation,
  hasUnsavedChanges = false,
  discardChanges = () => {},
  t,
}) => {
  console.log("Has unsaved changes? : ", hasUnsavedChanges);

  const handlePress = () => {
    // Check if there are unsaved changes
    if (hasUnsavedChanges) {
      Alert.alert(
        t("discard_changes_alert_title"),
        t("discard_changes_alert_message"),
        [
          {
            text: t("discard_changes_alert_button_leave"),
            style: "cancel",
            onPress: () => {},
          },
          {
            text: t("discard_changes_alert_button_discard"),
            style: "destructive",
            onPress: () => {
              discardChanges(); // Discard unsaved changes
              navigation.goBack(); // Navigate back
            },
          },
        ],
        { cancelable: false } // Prevent dismissing the alert by tapping outside
      );
    } else {
      navigation.goBack(); // Navigate back if no unsaved changes
    }
  };

  // Handle Android hardware back button press
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        handlePress(); // Trigger the same logic as the custom back button
        return true; // Prevent default behavior
      }
    );

    return () => backHandler.remove(); // Cleanup the event listener when the component unmounts
  }, [hasUnsavedChanges]);

  // Determine the icon based on the platform
  const iconName =
    Platform.OS === "ios" ? "chevron-left-circle" : "arrow-left-circle";

  return (
    <View>
      <CustomButton
        onPress={handlePress}
        label={""}
        icon={{
          name: iconName,
          library: "MaterialCommunityIcons",
          size: 24,
          color: "white",
        }}
        backgroundColor={false}
        accessibilityLabel={t("back_button")}
        accessibilityRole="button"
        testID="back-button"
      />
    </View>
  );
};

export default CustomBackButton;
