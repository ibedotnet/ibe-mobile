import React from "react";
import { View, StyleSheet } from "react-native";
import CustomButton from "./CustomButton";

/**
 * SaveCancelBar component renders a bar with Save and Cancel buttons.
 *
 * @param {Object} props - Component props.
 * @param {function} props.onSave - Callback function invoked when the Save button is pressed.
 * @param {function} props.onCancel - Callback function invoked when the Cancel button is pressed.
 * @param {string} props.saveLabel - The text label for the Save button.
 * @param {string} props.cancelLabel - The text label for the Cancel button.
 * @param {string} props.saveIcon - The name of the icon for the Save button.
 * @param {string} props.cancelIcon - The name of the icon for the Cancel button.
 * @returns {JSX.Element} - Rendered component.
 */
const SaveCancelBar = ({
  onSave,
  onCancel,
  saveLabel,
  cancelLabel,
  saveIcon,
  cancelIcon,
}) => {
  return (
    <View style={styles.container}>
      {/* Save button */}
      <CustomButton
        onPress={onSave}
        label={saveLabel}
        icon={{ name: saveIcon, library: "FontAwesome" }}
      />
      {/* Separator */}
      <View style={styles.separator} />
      {/* Cancel button */}
      <CustomButton
        onPress={onCancel}
        label={cancelLabel}
        icon={{ name: cancelIcon, library: "FontAwesome" }}
      />
    </View>
  );
};

// Styles for the component
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#005EB8",
    width: "100%",
  },
  separator: {
    height: "100%",
    width: 1,
    backgroundColor: "white",
  },
});

export default SaveCancelBar;
