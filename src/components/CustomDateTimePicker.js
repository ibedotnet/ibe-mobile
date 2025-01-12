import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { APP } from "../constants";
import CustomButton from "./CustomButton";
import { convertToDateFNSFormat } from "../utils/FormatUtils";

/**
 * CustomDateTimePicker component for selecting date and time.
 * @param {Object} props - Component props.
 * @param {string} props.placeholder - Placeholder text for the picker.
 * @param {Date} props.initialValue - Initial value of the picker.
 * @param {string} props.initialMode - Initial mode of the picker ("date" or "time").
 * @param {boolean} props.isTimePickerVisible - Whether the time picker is visible.
 * @param {Function} props.onFilter - Callback function triggered when the date or time changes.
 * @param {boolean} props.isDisabled - Whether the picker is disabled.
 * @param {boolean} props.showClearButton - Whether the clear button is shown.
 * @param {Object} props.style - Custom styles for different components (container, picker, etc.).
 * @returns {JSX.Element} - CustomDateTimePicker component.
 */
const CustomDateTimePicker = ({
  placeholder,
  initialValue,
  initialMode = "date",
  isTimePickerVisible = false,
  onFilter,
  isDisabled = false,
  showClearButton = true,
  style = {}, // Default style prop for custom styling
}) => {
  // Initialize useTranslation hook
  const { t } = useTranslation();

  // State variables to manage the selected date, date picker mode, and visibility
  const [date, setDate] = useState(initialValue || null);
  const [mode, setMode] = useState(initialMode);
  const [show, setShow] = useState(false);

  // Function to handle changes in the date picker
  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShow(false);
    setDate(currentDate);
    // Call onFilter with the selected date
    if (onFilter) {
      onFilter(currentDate);
    }
  };

  // Function to show the date or time picker based on the mode
  const showMode = (currentMode) => {
    setShow(true);
    setMode(currentMode);
  };

  // Function to show the date picker
  const showDatepicker = () => {
    showMode("date");
  };

  // Function to show the time picker if it's visible
  const showTimepicker = () => {
    if (isTimePickerVisible) {
      showMode("time");
    }
  };

  // Function to clear the selected date
  const clearDate = () => {
    setDate(null);
    if (onFilter) {
      onFilter(null);
    }
  };

  // Effect to update date value when initialValue changes
  useEffect(() => {
    setDate(initialValue || null);
  }, [initialValue]);

  return (
    <View
      style={[
        styles.pickerContainer,
        { borderColor: isDisabled ? "rgba(0, 0, 0, 0.5)" : "black" },
        style.pickerContainer, // Custom style for pickerContainer
      ]}
    >
      {/* Button to show the date picker */}
      <CustomButton
        style={[styles.picker, style.picker]} // Custom style for picker button
        onPress={isDisabled ? null : showDatepicker}
        label=""
        icon={{
          name: "calendar",
          library: "FontAwesome",
          size: 24,
          color: isDisabled ? "rgba(0, 0, 0, 0.5)" : "black",
        }}
        backgroundColor={false}
        disabled={isDisabled}
      />
      {/* Button to show the time picker, conditionally rendered based on visibility */}
      {isTimePickerVisible && (
        <CustomButton
          style={[styles.picker, style.picker]} // Custom style for picker button
          onPress={isDisabled ? null : showTimepicker}
          label=""
          icon={{
            name: "time",
            library: "Ionicons",
            size: 24,
            color: isDisabled ? "rgba(0, 0, 0, 0.5)" : "black",
          }}
          backgroundColor={false}
          disabled={isDisabled}
        />
      )}
      {/* Text displaying the selected date */}
      <Text style={[styles.selectedDate, style.selectedDate]}>
        {date
          ? `${placeholder ? placeholder + ": " : ""}${format(
              date,
              convertToDateFNSFormat(APP.LOGIN_USER_DATE_FORMAT)
            )}${isTimePickerVisible ? " " + date.toLocaleTimeString() : ""}`
          : `${placeholder ? placeholder + ": " : ""} ${t("no_date_selected")}`}
      </Text>
      {/* Clear button to clear the selected date, conditionally rendered based on isDisabled prop */}
      {date && !isDisabled && showClearButton && (
        <CustomButton
          onPress={clearDate}
          label={t("clear")}
          icon={{
            name: "clear",
            library: "MaterialIcons",
            color: "#005eb8",
          }}
          backgroundColor={false}
          style={[
            { icon: { marginRight: 0 }, borderLeftWidth: 0.5 },
            style.clearButton,
          ]} // Custom clear button style
          labelStyle={[styles.clearButtonText, style.clearButtonText]} // Custom clear button text style
        />
      )}
      {/* Date picker component, rendered conditionally based on show state */}
      {show && (
        <DateTimePicker
          value={date || new Date()}
          mode={mode}
          is24Hour={true}
          onChange={onChange}
        />
      )}
    </View>
  );
};

// Styles for the component
const styles = StyleSheet.create({
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
  },
  picker: {
    flex: 1,
  },
  selectedDate: {
    flex: 2,
    textAlign: "right",
    paddingRight: "4%",
  },
  clearButtonText: {
    color: "#005eb8",
  },
});

export default CustomDateTimePicker;
