import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";

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
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={handleFilterChange}
        placeholder={placeholder || `Type to filter ${label}...`}
        placeholderTextColor="darkgrey"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    marginBottom: "4%",
    fontSize: 16,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: "4%",
  },
});

export default TextFilter;
