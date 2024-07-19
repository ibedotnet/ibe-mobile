import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import CustomTextInput from "../CustomTextInput";

/**
 * TextFilter component renders a text input field for filtering purposes.
 * It allows users to input text to filter data based on a specified label.
 *
 * @param {Object} props - Component props.
 * @param {string} props.label - The label displayed above the text input field.
 * @param {string} [props.placeholder] - The placeholder text for the input field.
 * @param {function} [props.onFilter] - Callback function invoked when the text input changes.
 * It receives the updated filter text as its argument.
 * @param {boolean} [props.clearValue] - Boolean indicating whether to reset the text value.
 * When set to true, the text input value will be cleared.
 * @returns {JSX.Element} - Rendered component.
 */
const TextFilter = ({
  label,
  placeholder,
  initialValue,
  onFilter,
  clearValue,
}) => {
  // Initialize useTranslation hook
  const { t } = useTranslation();

  // State variable to store the current value of the input field
  const [value, setValue] = useState(initialValue || "");

  /**
   * Callback function invoked when the text input changes.
   * Updates the state with the new input value and propagates the change to the parent component if provided.
   *
   * @param {string} text - The new value of the text input.
   */
  const handleFilterChange = (text) => {
    setValue(text);
    // Propagate the filter text change to the parent component
    if (onFilter) {
      onFilter(text);
    }
  };

  useEffect(() => {
    if (clearValue) {
      setValue("");
    }
  }, [clearValue]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <CustomTextInput
        containerStyle={styles.input}
        value={value}
        onChangeText={handleFilterChange}
        placeholder={placeholder || `${t("type_to_filter")} ${label}...`}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    marginBottom: "2%",
    fontSize: 16,
    fontWeight: "bold",
  },
  input: {
    marginBottom: "4%",
  },
});

export default TextFilter;
