import React, { useEffect, useState } from "react";
import { Modal, TextInput, View, StyleSheet, Text, Button } from "react-native";
import { useTranslation } from "react-i18next";

import CustomButton from "../CustomButton";

/**
 * Edit dialog component for displaying a modal with an input field.
 *
 * @param {boolean} isVisible - Controls the visibility of the dialog.
 * @param {function} onClose - Function to handle dialog close action.
 * @param {function} onConfirm - Function to handle confirm action.
 * @param {function} validateInput - Function to validate the input value.
 * @param {string} title - Title of the dialog.
 * @param {string} initialValue - Initial value for the input field.
 */
const EditDialog = ({
  isVisible,
  onClose,
  onConfirm,
  validateInput,
  title,
  initialValue,
}) => {
  // Initialize useTranslation hook
  const { t } = useTranslation();

  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState(null);

  /**
   * Function to handle confirm action.
   * Invokes the onConfirm function with the current value and closes the dialog.
   */
  const handleConfirm = () => {
    const validationError = validateInput(value);
    if (validationError) {
      setError(validationError);
    } else {
      onConfirm(value);
      setError(null);
      onClose();
    }
  };

  /**
   * Function to handle close action.
   * Clears the error and closes the dialog.
   */
  const handleClose = () => {
    console.log(error);
    setError(null);
    onClose();
  };

  // Update value state when initialValue prop changes
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.dialogBox}>
          {/* Dialog Title */}
          <Text style={styles.title}>{title}</Text>
          {/* Input Field */}
          <TextInput
            value={value}
            onChangeText={(text) => {
              setValue(text);
              setError(null); // Clear error when input changes
            }}
            autoFocus
            style={[styles.input, error && styles.inputError]}
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
          {/* Buttons Container */}
          <View style={styles.buttonsContainer}>
            {/* Cancel Button */}
            <Button onPress={onClose} title={t("cancel")} />

            {/* Confirm Button */}
            <Button onPress={handleConfirm} title={t("confirm")} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  dialogBox: {
    backgroundColor: "white",
    padding: "5%",
    borderRadius: 5,
    width: "80%",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: "4%",
    textAlign: "center",
  },
  input: {
    marginBottom: "4%",
    padding: "2%",
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 5,
  },
  inputError: {
    borderColor: "red",
  },
  errorText: {
    color: "red",
    marginBottom: "4%",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
});

export default EditDialog;
