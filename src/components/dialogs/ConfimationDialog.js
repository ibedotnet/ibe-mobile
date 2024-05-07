import React from "react";
import { Button, Modal, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

/**
 * ConfirmationDialog component displays a modal dialog for confirmation.
 * @param {Object} props - Component props.
 * @param {boolean} props.isVisible - Flag indicating whether the dialog is visible.
 * @param {function} props.onClose - Function to handle closing the dialog.
 * @param {function} props.onConfirm - Function to handle confirming the action.
 * @param {string} props.message - Message displayed in the dialog.
 * @returns {JSX.Element} A React component.
 */
const ConfirmationDialog = ({ isVisible, onClose, onConfirm, message }) => {
  // Initialize useTranslation hook
  const { t } = useTranslation();

  return (
    <Modal visible={isVisible} transparent={true} animationType="slide">
      <View style={styles.container}>
        <View style={styles.dialog}>
          <Text>{message}</Text>
          <View style={styles.buttonContainer}>
            <Button title={t("cancel")} onPress={onClose} />
            <Button title={t("confirm")} onPress={onConfirm} />
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
  dialog: {
    backgroundColor: "white",
    padding: "5%",
    borderRadius: 5,
    width: "80%",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: "10%",
  },
});

export default ConfirmationDialog;
