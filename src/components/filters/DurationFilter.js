import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";

import { Picker } from "@react-native-picker/picker";

import { timeUnitLabels } from "../../utils/FormatUtils";

/**
 * DurationFilter component renders a filter for duration range.
 * It consists of two text inputs for specifying a range (greater than and less than).
 *
 * @param {object} props - Component props.
 * @param {string} props.label - The label for the filter.
 * @param {string} props.placeholder - The placeholder text for text inputs.
 * @param {Function} props.onFilter - Callback function triggered when the filter changes.
 * @param {Array<number>} props.initialValue - Initial values for greater than and less than inputs.
 * @param {boolean} props.clearValue - Boolean flag indicating whether to clear the filter value.
 * @param {Array<string>} props.units - Array of time units.
 * @returns {JSX.Element} - The rendered DurationFilter component.
 */
const DurationFilter = ({
  label,
  placeholder,
  onFilter,
  initialValue,
  clearValue,
  units,
}) => {
  const [greaterThanValue, setGreaterThanValue] = useState(
    initialValue?.greaterThanValue?.toString() ?? ""
  );

  const [lessThanValue, setLessThanValue] = useState(
    initialValue?.lessThanValue?.toString() ?? ""
  );

  const [unit, setUnit] = useState(initialValue?.unit ?? "h");

  const handleGreaterThanChange = (text) => {
    setGreaterThanValue(text);
  };

  const handleLessThanChange = (text) => {
    setLessThanValue(text);
  };
  
  const handleUnitChange = (unit) => {
    setUnit(unit);
  };

  /**
   * Handle filter change event.
   * Parses and validates the filter values, triggers the filter callback with valid values.
   */
  const handleFilterChange = () => {
    // Parse the duration values to ensure they are valid numbers
    const parsedGreaterThanThreshold = parseFloat(greaterThanValue);
    const parsedLessThanThreshold = parseFloat(lessThanValue);

    let parsedGreaterThanValue = null;
    let parsedLessThanValue = null;

    if (!isNaN(parsedGreaterThanThreshold)) {
      parsedGreaterThanValue = parsedGreaterThanThreshold;
    }

    if (!isNaN(parsedLessThanThreshold)) {
      parsedLessThanValue = parsedLessThanThreshold;
    }

    // Trigger the filter callback with valid values
    if (onFilter) {
      onFilter({
        greaterThanValue: parsedGreaterThanValue,
        lessThanValue: parsedLessThanValue,
        unit,
      });
    }
  };

  useEffect(() => {
    handleFilterChange();
  }, [greaterThanValue, lessThanValue, unit]);

  useEffect(() => {
    if (clearValue) {
      setLessThanValue("");
      setGreaterThanValue("");
    }
  }, [clearValue]);

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={greaterThanValue}
          onChangeText={handleGreaterThanChange}
          placeholder={placeholder || `Greater than...`}
          placeholderTextColor="darkgrey"
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          value={lessThanValue}
          onChangeText={handleLessThanChange}
          placeholder={placeholder || `Less than...`}
          placeholderTextColor="darkgrey"
          keyboardType="numeric"
        />
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={unit}
            style={styles.picker}
            onValueChange={(itemValue) => handleUnitChange(itemValue)}
          >
            {units.map((unit, index) => (
              <Picker.Item
                itemStyle={{ color: "blue", fontSize: 20 }}
                key={index}
                label={timeUnitLabels[unit]}
                value={unit}
              />
            ))}
          </Picker>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    marginBottom: "4%",
    fontSize: 16,
    fontWeight: "bold",
  },
  inputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    columnGap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: "4%",
  },
  pickerContainer: {
    width: "30%",
    borderWidth: 2,
    borderRadius: 8,
    borderColor: "black",
    marginBottom: "4%",
  },
  picker: {
    width: "100%",
  },
});

export default DurationFilter;
