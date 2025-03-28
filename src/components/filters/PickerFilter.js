import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import CustomPicker from "../CustomPicker";
import Loader from "../Loader";

/**
 * PickerFilter component provides a filter for selecting from a list of options.
 *
 * @param {Object} props - Component props.
 * @param {string} props.label - Label for the filter.
 * @param {Object} props.pickerOptions - Map of label-value pairs for the picker options.
 * @param {Function} props.onFilter - Function to handle filter change.
 * @param {string|null} props.initialValue - Initial value for the filter.
 * @param {boolean} props.clearValue - Boolean indicating whether to clear the filter value.
 * @returns {JSX.Element} - PickerFilter component JSX.
 */
const PickerFilter = ({
  label,
  pickerOptions,
  onFilter,
  initialValue,
  clearValue,
}) => {
  const [value, setValue] = useState(initialValue || null);
  const [loading, setLoading] = useState(true);

  // Sort pickerOptions by label if available
  const pickerItems = pickerOptions
    ? [...pickerOptions]
        .filter((item) => item.label)
        .sort((a, b) => a.label.localeCompare(b.label))
    : [];

  // Effect to clear selected value when clearValue changes
  useEffect(() => {
    if (clearValue) {
      setValue(null);
    }
  }, [clearValue]);

  useEffect(() => {
    setLoading(false); // We assume pickerOptions is ready when passed
  }, [pickerOptions]);

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View>
        {loading ? (
          <Loader size={"small"} />
        ) : pickerItems.length > 0 ? ( // Render CustomPicker if there are items
          <CustomPicker
            items={pickerItems}
            initialValue={value}
            onFilter={onFilter}
            clearValue={clearValue}
          />
        ) : (
          <Text>No options available</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    marginBottom: "2%",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default PickerFilter;
