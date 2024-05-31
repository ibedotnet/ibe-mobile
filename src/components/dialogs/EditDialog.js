import React, { useEffect, useRef, useState } from "react";
import { Button, Modal, Text, TextInput, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  RichEditor,
  RichToolbar,
  actions,
} from "react-native-pell-rich-editor";

/**
 * EditDialog component
 *
 * This component displays a modal dialog with an input field. It can be used for both simple text input and rich text input.
 *
 * @param {boolean} isVisible - Controls the visibility of the dialog.
 * @param {function} onClose - Function to handle dialog close action.
 * @param {function} onConfirm - Function to handle confirm action.
 * @param {function} validateInput - Function to validate the input value. Default validation checks if input is not empty.
 * @param {string} title - Title of the dialog.
 * @param {string} initialValue - Initial value for the input field.
 * @param {boolean} isRichText - Flag to determine if the input should be a rich text editor.
 */

const EditDialog = ({
  isVisible,
  onClose,
  onConfirm,
  validateInput = (value) =>
    value.trim() === "" ? "Input cannot be empty" : null, // Default Validation
  title,
  initialValue,
  isRichText = false,
}) => {
  const { t } = useTranslation();

  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState(null);

  const richText = useRef(null);

  /**
   * Function to handle confirm action.
   * Validates the input value, invokes the onConfirm function with the current value, and closes the dialog.
   */
  const handleConfirm = () => {
    const validationError = validateInput(value);
    if (validationError) {
      setError(validationError);
    } else {
      console.debug("Dialog input value on confirm: " + value);
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
    setError(null);
    onClose();
  };

  // Update value state when initialValue prop changes or when the component becomes visible
  useEffect(() => {
    if (isVisible) {
      setValue(initialValue);
    }
  }, [isVisible, initialValue]);

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.dialogBox}>
          <Text style={styles.title}>{title}</Text>
          {isRichText ? (
            <View style={[styles.richTextContainer, { minHeight: 150 }]}>
              <RichToolbar
                editor={richText}
                selectedIconTint="black"
                actions={[
                  actions.setBold,
                  actions.setItalic,
                  actions.setUnderline,
                  actions.insertBulletsList,
                  actions.insertOrderedList,
                  actions.insertLink,
                  actions.undo,
                  actions.redo,
                ]}
              />
              <RichEditor
                ref={richText}
                initialContentHTML={value}
                style={styles.richEditor}
                placeholder={t("write_your_comment_here")}
                pasteAsPlainText={true}
                initialFocus={true}
                onChange={(html) => {
                  setValue(html);
                  setError(null);
                }}
              />
            </View>
          ) : (
            <TextInput
              value={value}
              onChangeText={(text) => {
                setValue(text);
                setError(null);
              }}
              autoFocus={true}
              style={[styles.input, error && styles.inputError]}
            />
          )}
          {error && <Text style={styles.errorText}>{error}</Text>}
          <View style={styles.buttonsContainer}>
            <Button onPress={handleClose} title={t("cancel")} />
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
    width: "90%",
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
  richTextContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: "4%",
  },
  richEditor: {
    padding: "2%",
  },
});

export default EditDialog;
