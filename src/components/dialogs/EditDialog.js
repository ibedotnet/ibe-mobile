import React, { useEffect, useRef, useState } from "react";
import { Button, Modal, Text, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import {
  RichEditor,
  RichToolbar,
  actions,
} from "react-native-pell-rich-editor";
import CustomTextInput from "../CustomTextInput";
import CustomRemotePicker from "../CustomRemotePicker";
import {
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";

/**
 * EditDialog component
 *
 * This component displays a modal dialog with input fields. It can handle multiple types of inputs including simple text input and rich text input.
 *
 * @param {boolean} isVisible - Controls the visibility of the dialog.
 * @param {function} onClose - Function to handle dialog close action.
 * @param {function} onConfirm - Function to handle confirm action.
 * @param {string} title - Title of the dialog.
 * @param {Array} inputsConfigs - Array of input configurations for the input fields, including initial values.
 */
const EditDialog = ({
  isVisible,
  onClose,
  onConfirm,
  title,
  inputsConfigs = [], // Default to an empty array
}) => {
  const { t } = useTranslation();

  // Initialize state with the initial values from inputsConfigs
  const [values, setValues] = useState(
    inputsConfigs.reduce((acc, config) => {
      acc[config.id] = config.initialValue || "";
      return acc;
    }, {})
  );
  const [initialValues, setInitialValues] = useState(values); // Track initial values
  const [error, setError] = useState(null);

  // Use useRef to store editor references
  const richTextRefs = useRef({});

  /**
   * Function to handle input changes and update the state.
   * @param {string} id - ID of the input field.
   * @param {string} value - New value for the input field.
   */
  const handleInputChange = (id, value) => {
    setValues((prevValues) => ({
      ...prevValues,
      [id]: value,
    }));
  };

  /**
   * Function to handle confirm action.
   * Validates the input values, checks if any changes occurred, invokes the onConfirm function with the current values, and closes the dialog.
   */
  const handleConfirm = () => {
    const hasChanges = Object.keys(values).some(
      (key) => values[key] !== initialValues[key]
    );

    if (!hasChanges) {
      setError(t("no_changes_detected"));
      return;
    }

    // Function to validate input values if allowBlank is false
    const emptyValidation = (values) => {
      for (const value of Object.values(values)) {
        if (typeof value === "string" && value.trim() === "") {
          return t("input_cannot_be_empty");
        }
      }
      return null;
    };

    const validationErrors = inputsConfigs.map((config) => {
      const fieldValue = values[config.id];
      const fieldValidation =
        config.validateInput ||
        (!config.allowBlank ? emptyValidation : (value) => null); // Use empty validation only if allowBlank is false

      return fieldValidation({ [config.id]: fieldValue });
    });

    // Check if any validation error occurred
    const firstError = validationErrors.find((error) => error !== null);
    if (firstError) {
      setError(firstError);
    } else {
      console.debug("Dialog input values on confirm:", values);
      onConfirm(values);
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

  // Update values and initialValues state when inputsConfigs prop changes or when the component becomes visible
  useEffect(() => {
    if (isVisible) {
      const initial = inputsConfigs.reduce((acc, config) => {
        acc[config.id] = config.initialValue || "";
        return acc;
      }, {});
      setValues(initial);
      setInitialValues(initial); // Update initial values when dialog becomes visible
    }
  }, [isVisible, inputsConfigs]);

  /**
   * Render the input field based on its type.
   * @param {Object} config - Configuration for the input field.
   * @returns {JSX.Element} The rendered input field.
   */
  const renderInputField = (config) => {
    switch (config.type) {
      case "richText":
        return (
          <View
            key={config.id}
            style={[styles.richTextContainer, { minHeight: 150 }]}
          >
            <RichToolbar
              getEditor={() => richTextRefs.current[config.id]}
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
              ref={(el) => (richTextRefs.current[config.id] = el)}
              initialContentHTML={values[config.id]}
              style={styles.richEditor}
              placeholder={config.placeholder || t("write_your_comment_here")}
              pasteAsPlainText={true}
              initialFocus={config.id === inputsConfigs[0]?.id}
              onChange={(html) => handleInputChange(config.id, html)}
            />
          </View>
        );
      case "text":
        return (
          <CustomTextInput
            key={config.id}
            value={values[config.id]}
            onChangeText={(text) => handleInputChange(config.id, text)}
            autoFocus={config.id === inputsConfigs[0]?.id}
            placeholder={config.placeholder}
            containerStyle={[styles.input, error && styles.inputError]}
          />
        );
      case "dropdown":
        return (
          <View key={config.id} style={[styles.input]}>
            <CustomRemotePicker
              queryParams={{
                queryFields: config.queryFields,
                commonQueryParams: config.commonQueryParams,
              }}
              pickerLabel={config.pickerLabel}
              initialAdditionalLabel={config.initialAdditionalLabel}
              initialItemLabel={config.initialItemLabel}
              initialItemValue={config.initialItemValue}
              labelItemField={config.labelItemField}
              valueItemField={config.valueItemField}
              additionalFields={config.additionalFields}
              searchFields={config.searchFields}
              multiline={true}
              onValueChange={(value) => handleInputChange(config.id, value)}
            />
          </View>
        );
      default:
        return null;
    }
  };

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
          <GestureHandlerRootView>
            <ScrollView>{inputsConfigs.map(renderInputField)}</ScrollView>
          </GestureHandlerRootView>
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
    padding: "4%",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  dialogBox: {
    backgroundColor: "#fff",
    padding: "5%",
    borderRadius: 5,
    flex: 1,
    maxHeight: "80%",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: "4%",
    textAlign: "center",
  },
  input: {
    marginBottom: "4%",
  },
  inputError: {
    borderColor: "#f00",
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