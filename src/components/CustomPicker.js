import React, { useEffect, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { Picker } from "@react-native-picker/picker";

import { useTranslation } from "react-i18next";

import { isEqual } from "../utils/FormatUtils";

/**
 * CustomPicker component provides a customizable picker component for React Native.
 * @param {Object} props - Component props.
 * @param {Array} props.items - Array of objects representing picker items. Should be of the form { label: string, value: string }.
 * @param {string} props.initialValue - Initial value for the picker.
 * @param {Function} props.onFilter - Callback function triggered when the picker value changes.
 * @param {boolean} props.clearValue - Boolean indicating whether to clear the value.
 * @param {boolean} props.disabled - Boolean indicating whether the picker is disabled.
 * @returns {JSX.Element} CustomPicker component JSX.
 */
const CustomPicker = ({
  placeholder,
  items,
  initialValue,
  onFilter,
  clearValue = false,
  disabled = false,
}) => {
  // Initialize useTranslation hook
  const { t } = useTranslation();

  if (!placeholder) {
    placeholder = `${t("select")}...`;
  }

  // State to manage the selected label
  const [selectedValue, setSelectedValue] = useState(initialValue || null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState(items);

  /**
   * Function to handle value change in the picker.
   * @param {string|number} itemValue - Selected value from the picker.
   * @param {number} itemIndex - Index of the selected item.
   */
  const handleValueChange = (itemValue, itemIndex) => {
    setSelectedValue(itemValue);
    // Call onFilter with the selected value
    if (onFilter) {
      onFilter(itemValue);
    }
  };

  // Reset selectedValue when clearValue changes
  useEffect(() => {
    if (clearValue) {
      setSelectedValue(null);
    }
  }, [clearValue]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredItems(items);
    } else {
      const filtered = items.filter((item) =>
        item.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  }, [searchTerm, items]);

  useEffect(() => {
    // Effect to set the selected value based on the initial value
    if (initialValue && items.length > 0) {
      // Find the item in the items array that matches the initial value
      const selectedItem = items.find((item) => {
        // Compare values based on their types
        if (typeof item.value === typeof initialValue) {
          // If both values are arrays, compare them element-wise
          if (Array.isArray(item.value) && Array.isArray(initialValue)) {
            // Ensure both arrays have the same length
            if (item.value.length === initialValue.length) {
              // Check if every element in the arrays is equal
              return item.value.every((val, index) =>
                isEqual(val, initialValue[index])
              );
            }
          } else {
            // Otherwise, compare them directly
            return item.value === initialValue;
          }
        }
        // Return false if types are different
        return false;
      });

      // If a matching item is found, set it as the selected value
      if (selectedItem) {
        setSelectedValue(selectedItem.value);
      }
    }
  }, [initialValue]);

  return (
    <View style={styles.container}>
      {/* Picker component */}
      <Picker
        selectedValue={selectedValue}
        onValueChange={handleValueChange}
        enabled={!disabled}
      >
        {/* Render default/placeholder option */}
        <Picker.Item label={placeholder} value={null} />

        {/* Render filtered picker items */}
        {filteredItems.map((item, index) => (
          <Picker.Item key={index} label={item.label} value={item.value} />
        ))}
      </Picker>
      {/* Search input */}
      <TextInput
        style={styles.input}
        placeholder={t("placeholder_type_to_search")}
        placeholderTextColor="darkgrey"
        value={searchTerm}
        onChangeText={setSearchTerm}
        editable={!disabled}
      />
    </View>
  );
};

// Styles for the component
const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderRadius: 8,
    borderColor: "black",
    marginBottom: "4%",
  },
  input: {
    borderTopWidth: 2,
    borderColor: "black",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});

export default CustomPicker;
