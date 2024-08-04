/**
 * CustomImagePicker Component
 *
 * This component provides functionality to pick an image from the gallery
 * or take a photo using the device camera. It allows the user to preview
 * and upload the selected image.
 *
 * @param {object} route - The route object passed by React Navigation.
 * @param {object} navigation - The navigation object passed by React Navigation.
 *
 * @returns {JSX.Element} JSX Element representing the CustomImagePicker component.
 */
import React, { useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";
import Loader from "./Loader";
import SaveCancelBar from "./SaveCancelBar";
import { APP, APP_NAME } from "../constants";
import { uploadBinaryResource } from "../utils/APIUtils";
import { changeDateToAPIFormat } from "../utils/FormatUtils";
import { showToast } from "../utils/MessageUtils";
import updateFields from "../utils/UpdateUtils";

/**
 * Button Component
 *
 * Reusable button component for consistent styling and functionality.
 *
 * @param {string} label - The label text displayed on the button.
 * @param {string} icon - The FontAwesome icon name for the button.
 * @param {string} accessibilityLabel - The accessibility label for the button.
 * @param {function} onPress - The function to be executed when the button is pressed.
 *
 * @returns {JSX.Element} JSX Element representing the Button component.
 */
const Button = ({ label, icon, accessibilityLabel, onPress }) => {
  return (
    <View>
      <Pressable style={[styles.button, {}]} onPress={onPress}>
        <FontAwesome
          name={icon}
          size={18}
          color="black"
          style={styles.buttonIcon}
          accessibilityLabel={accessibilityLabel}
        />
        <Text style={styles.buttonLabel}>{label}</Text>
      </Pressable>
    </View>
  );
};

/**
 * CustomImagePicker Component
 *
 * @param {object} route - The route object passed by React Navigation.
 * @param {object} navigation - The navigation object passed by React Navigation.
 *
 * @returns {JSX.Element} JSX Element representing the CustomImagePicker component.
 */
const CustomImagePicker = ({ route, navigation: { goBack } }) => {
  const currentUserPhoto = route?.params?.userPhoto;

  // Initialize useTranslation hook
  const { t } = useTranslation();

  // State variables
  const [selectedImage, setSelectedImage] = useState(currentUserPhoto);
  const [isLoading, setIsLoading] = useState(false);

  const placeholderImageSource = currentUserPhoto
    ? { uri: currentUserPhoto }
    : require("../assets/images/blank-picture_640.png");
  const imageSource = selectedImage
    ? { uri: selectedImage }
    : placeholderImageSource;

  /**
   * Function to pick image from gallery using ImagePicker.
   */
  const pickImageAsync = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    } else {
      Alert.alert(t("alert_title"), t("no_image_selected"));
    }
  };

  /**
   * Function to open the device camera and capture a photo using ImagePicker.
   */
  const openCameraAsync = async () => {
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    } else {
      Alert.alert(t("alert_title"), t("no_photo_taken"));
    }
  };

  const linkBackToBusObjcat = route?.params?.linkBackToBusObjcat;

  /**
   * Function to handle save action.
   * It uploads the selected image and updates the bus object category.
   */
  const onSave = async () => {
    if (selectedImage) {
      try {
        setIsLoading(true);

        // Upload the selected image and get binary resource
        const binaryResource = await uploadBinaryResource(
          selectedImage,
          true, // Fetch new object IDs
          {
            type: "image/png",
            name: "user-photo.jpg",
            tHeight: 600,
            tWidth: 400,
            convertToPng: true,
          },
          {
            client: APP.LOGIN_USER_CLIENT,
            allClient: false,
          }
        );

        // Construct formData object with binary resource data
        const formData = {
          data: {
            [`${linkBackToBusObjcat}-photoID`]: binaryResource.attachmentId,
            [`${linkBackToBusObjcat}-thumbnailID`]: binaryResource.thumbId,
            [`${linkBackToBusObjcat}-type`]: "employee",
            [`${linkBackToBusObjcat}-id`]: APP.LOGIN_USER_EMPLOYEE_ID,
          },
        };

        // Construct query string parameters
        const queryStringParams = {
          userID: APP.LOGIN_USER_ID,
          client: parseInt(APP.LOGIN_USER_CLIENT),
          language: APP.LOGIN_USER_LANGUAGE,
          testMode: APP.TEST_MODE ? APP.TEST_MODE : null,
          changeDate: changeDateToAPIFormat(new Date()),
          component: "platform",
          doNotReplaceAnyList: true,
          appName: APP_NAME.EMPLOYEE,
        };

        // Update the linked bus object category with the binary resource
        const updateResponse = await updateFields(formData, queryStringParams);

        // Check if update was successful
        if (updateResponse.success) {
          showToast(t("photo_updated_success"));

          goBack(); // Go back to the previous screen
        } else {
          showToast(t("failed_upload_photo"), "error");
        }

        if (updateResponse.message) {
          showToast(updateResponse.message);
        }
      } catch (error) {
        if (error.status === 413) {
          console.error("Payload too large. Please upload a smaller file.");
          showToast(t("upload_error_413"), "error");
        } else {
          console.error("Error in onSave method of CustomImagePicker:", error);
          showToast(t("failed_upload_photo"), "error");
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      Alert.alert(`${t("alert_title")}!`, t("no_image_selected"));
    }
  };

  /**
   * Function to handle cancel action.
   * If an image is selected, it resets the selected image.
   * If no image is selected, it shows an alert informing the user.
   */
  const onReset = () => {
    if (selectedImage) {
      setSelectedImage(null);
    } else {
      Alert.alert(`${t("alert_title")}!`, t("no_image_to_reset"));
    }
  };

  // Render JSX
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={imageSource} style={styles.image} resizeMode="contain" />
      </View>
      <View style={styles.buttonContainer}>
        <Button
          label={t("pick_image")}
          icon="picture-o"
          accessibilityLabel={t("pick_photo_gallery")}
          onPress={pickImageAsync}
        />
        <Button
          label={t("open_camera")}
          icon="camera"
          accessibilityLabel={t("open_camera_photo")}
          onPress={openCameraAsync}
        />
      </View>
      <SaveCancelBar
        onSave={onSave}
        onCancel={onReset}
        saveLabel={t("save")}
        cancelLabel={t("reset")}
        saveIcon="save"
        cancelIcon="times"
      />
      {isLoading && <Loader />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ffd33d",
    width: "60%",
    height: "80%",
  },
  buttonContainer: {
    flex: 1,
    justifyContent: "center",
    padding: "5%",
    rowGap: 16,
  },
  button: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: "6%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#005eb8",
    backgroundColor: "white",
    elevation: 5,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  buttonIcon: {
    paddingRight: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});

export default CustomImagePicker;
