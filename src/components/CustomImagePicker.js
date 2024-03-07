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
import React, { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import CustomToast from "./CustomToast";
import Loader from "./Loader";
import SaveCancelBar from "./SaveCancelBar";

import { uploadBinaryResource } from "../utils/APIUtils";
import { updateBusObjCat } from "../utils/UpdateUtils";
import { showToast } from "../utils/MessageUtils";

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
      alert("You did not select any image.");
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
      alert("You did not take any photo.");
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
        const binaryResource = await uploadBinaryResource(selectedImage);

        // Update the bus object category with the binary resource
        updateBusObjCat(linkBackToBusObjcat, binaryResource);

        showToast("Photo updated successfully.");

        // Go back to the previous screen
        goBack();
      } catch (error) {
        console.error("Error in onSave:", error);

        showToast("Failed to upload the photo.");
      } finally {
        setIsLoading(false);
      }
    } else {
      alert("No image selected to save.");
    }
  };

  /**
   * Function to handle cancel action.
   * It resets the selected image.
   */
  const onCancel = () => {
    setSelectedImage(null);
  };

  // Render JSX
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={imageSource} style={styles.image} resizeMode="contain" />
      </View>
      <View style={styles.buttonContainer}>
        <Button
          label="Open Gallery"
          icon="picture-o"
          accessibilityLabel="Pick photo from gallery"
          onPress={pickImageAsync}
        />
        <Button
          label="Open Camera"
          icon="camera"
          accessibilityLabel="Open Camera to take a photo"
          onPress={openCameraAsync}
        />
      </View>
      <SaveCancelBar
        onSave={onSave}
        onCancel={onCancel}
        saveLabel="Save"
        cancelLabel="Cancel"
        saveIcon="save"
        cancelIcon="times"
      />
      {isLoading && <Loader />}
      <CustomToast />
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
