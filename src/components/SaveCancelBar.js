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
 * @param {boolean} props.saveDisable - Whether the Save button is disabled.
 * @param {boolean} props.cancelDisable - Whether the Cancel button is disabled.
 * @param {boolean} props.isFloating - Determines whether buttons are displayed as floating buttons or not.
 * @returns {JSX.Element} - Rendered component.
 */
const SaveCancelBar = ({
  onSave,
  onCancel,
  saveLabel = "",
  cancelLabel = "",
  saveIcon,
  cancelIcon,
  saveDisable,
  cancelDisable,
  isFloating = false,
}) => {
  const saveIconProps = isFloating
    ? { name: saveIcon, size: 24 }
    : { name: saveIcon };

  const cancelIconProps = isFloating
    ? { name: cancelIcon, size: 24 }
    : { name: cancelIcon };

  return (
    <View style={isFloating ? styles.floatingContainer : styles.barContainer}>
      {/* Save button */}
      <CustomButton
        onPress={onSave}
        label={saveLabel}
        icon={saveIconProps}
        disabled={saveDisable}
        style={isFloating ? styles.floatingButton : styles.barButton}
      />
      {/* Separator (only for bar layout) */}
      {!isFloating && <View style={styles.separator} />}
      {/* Cancel button */}
      <CustomButton
        onPress={onCancel}
        label={cancelLabel}
        icon={cancelIconProps}
        disabled={cancelDisable}
        style={isFloating ? styles.floatingButton : styles.barButton}
      />
    </View>
  );
};

// Styles for the component
const styles = StyleSheet.create({
  barContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#005eb8",
    width: "100%",
  },
  floatingContainer: {
    position: "absolute",
    bottom: 20,
    right: 20,
    alignItems: "center",
    borderColor: "#005eb8",
    marginTop: 20,
  },
  barButton: {
    flex: 1,
  },
  floatingButton: {
    marginBottom: 10,
    width: 56,
    height: 56,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 94, 184, 0.9)",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  separator: {
    height: "100%",
    width: 1,
    backgroundColor: "white",
  },
});

export default SaveCancelBar;
