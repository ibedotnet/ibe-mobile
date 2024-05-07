import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { APP } from "../constants";
import CustomButton from "./CustomButton";
import { convertToDateFNSFormat } from "../utils/FormatUtils";

const CustomDateTimePicker = ({
  placeholder,
  initialValue,
  initialMode = "date",
  isTimePickerVisible = false,
  onFilter,
}) => {
  // Initialize useTranslation hook
  const { t } = useTranslation();

  // State variables to manage the selected date, date picker mode, and visibility
  const [date, setDate] = useState(initialValue || null);
  const [mode, setMode] = useState(initialMode);
  const [show, setShow] = useState(false);

  // Function to handle changes in the date picker
  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || date; // If no date is selected, use the current date
    setShow(false); // Hide the picker
    setDate(currentDate); // Update the selected date state
    // Call onFilter with the selected date
    if (onFilter) {
      onFilter(currentDate);
    }
  };

  // Function to show the date or time picker based on the mode
  const showMode = (currentMode) => {
    setShow(true); // Show the date picker
    setMode(currentMode); // Set the date picker mode
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
      onFilter(null); // Optionally trigger the filter callback with null value
    }
  };

  // Effect to update date value when initialValue changes
  useEffect(() => {
    setDate(initialValue || null);
  }, [initialValue]);

  return (
    <View style={styles.pickerContainer}>
      {/* Button to show the date picker */}
      <CustomButton
        style={styles.picker}
        onPress={showDatepicker}
        label=""
        icon={{
          name: "calendar",
          library: "FontAwesome",
          size: 24,
          color: "black",
        }}
        backgroundColor={false}
      />
      {/* Button to show the time picker, conditionally rendered based on visibility */}
      {isTimePickerVisible && (
        <CustomButton
          style={styles.picker}
          onPress={showTimepicker}
          label=""
          icon={{
            name: "time",
            library: "Ionicons",
            size: 24,
            color: "black",
          }}
          backgroundColor={false}
        />
      )}
      {/* Text displaying the selected date */}
      <Text style={styles.selectedDate}>
        {date
          ? `${placeholder}: ${format(
              date,
              convertToDateFNSFormat(APP.LOGIN_USER_DATE_FORMAT)
            )}${isTimePickerVisible ? " " + date.toLocaleTimeString() : ""}`
          : `${placeholder}: ${t("no_date_selected")}`}
      </Text>
      {/* Clear button to clear the selected date */}
      {date && <CustomButton onPress={clearDate} label={t("clear")} icon={{}} />}
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
    borderWidth: 2,
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
});

export default CustomDateTimePicker;
