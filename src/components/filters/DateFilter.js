import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";

import { useTranslation } from "react-i18next";

import CustomDateTimePicker from "../CustomDateTimePicker";
import { showToast } from "../../utils/MessageUtils";
import { convertToDateObject } from "../../utils/FormatUtils";

/**
 * DateFilter component allows users to filter data based on a selected date range.
 * It provides a label and two custom date pickers for selecting the start and end dates.
 *
 * @param {Object} props - Component props.
 * @param {string} props.label - The label displayed above the date pickers.
 * @param {function} props.onFilter - Callback function invoked when the date selection changes.
 * It receives an object containing the selected start and end dates as its argument.
 * @param {Date} props.initialValue - The initial value for the date pickers.
 * @param {boolean} props.clearValue - Boolean indicating whether to clear the selected dates.
 * When set to true, the selected dates will be cleared.
 * @param {string} props.initialMode - The initial mode for the date pickers ('date' or 'time').
 * Defaults to 'date'.
 * @param {boolean} props.isTimePickerVisible - Boolean indicating whether the time picker is visible.
 * Defaults to false.
 * If set to false, the end date must be greater than the start date. Defaults to false.
 * @returns {JSX.Element} - Rendered component.
 */
const DateFilter = ({
  label,
  onFilter,
  initialValue,
  clearValue,
  initialMode = "date",
  isTimePickerVisible = false,
}) => {
  // Initialize useTranslation hook
  const { t } = useTranslation();

  // State to manage the selected start and end dates
  const [greaterThanDate, setGreaterThanDate] = useState(
    convertToDateObject(initialValue?.greaterThanDate)
  );
  const [lessThanDate, setLessThanDate] = useState(
    convertToDateObject(initialValue?.lessThanDate)
  );

  /**
   * Handles changes in the start date picker.
   * @param {Date} date - Selected start date.
   */
  const handleGreaterThanChange = (date) => {
    setGreaterThanDate(date);
  };

  /**
   * Handles changes in the end date picker.
   * @param {Date} date - Selected end date.
   */
  const handleLessThanChange = (date) => {
    setLessThanDate(date);
  };

  // Effect to trigger filter callback when date selection changes
  useEffect(() => {
    handleFilterChange();
  }, [greaterThanDate, lessThanDate]);

  /**
   * Handles filter changes and invokes the filter callback with selected dates.
   */
  const handleFilterChange = () => {
    try {
      // Ensure that `greaterThanDate` and `lessThanDate` are Date objects. If they are valid Date objects,
      // clone them to avoid mutating the original dates; otherwise, set them to null if they are not provided
      // or not valid Date objects.
      let parsedGreaterThanDate =
        greaterThanDate instanceof Date && !isNaN(greaterThanDate.getTime())
          ? new Date(greaterThanDate) // Create a new Date object to avoid mutating the original date
          : null;
      let parsedLessThanDate =
        lessThanDate instanceof Date && !isNaN(lessThanDate.getTime())
          ? new Date(lessThanDate) // Create a new Date object to avoid mutating the original date
          : null;

      // Set time components of parsedGreaterThanDate to midnight in UTC timezone
      if (parsedGreaterThanDate !== null) {
        parsedGreaterThanDate.setUTCHours(0, 0, 0, 0);
      }

      // Set time components of parsedLessThanDate to midnight in UTC timezone
      if (parsedLessThanDate !== null) {
        parsedLessThanDate.setUTCHours(0, 0, 0, 0);
      }

      // Check if both from and to dates are selected and ensure that the to date is after the from date
      if (
        parsedGreaterThanDate !== null &&
        parsedLessThanDate !== null &&
        parsedLessThanDate < parsedGreaterThanDate
      ) {
        showToast(t("from_date_cannot_be_later_than_to_date"), "error");
        setGreaterThanDate(null);
        setLessThanDate(null);
        return;
      }

      // Propagate selected dates to the parent component
      if (onFilter) {
        onFilter({
          greaterThanDate: parsedGreaterThanDate
            ? parsedGreaterThanDate.toISOString()
            : null,
          lessThanDate: parsedLessThanDate
            ? parsedLessThanDate.toISOString()
            : null,
        });
      }
    } catch (error) {
      console.error("Date: Error in handleFilterChange: ", error.message);
    }
  };

  // Effect to clear selected dates when clearValue is true
  useEffect(() => {
    if (clearValue) {
      setGreaterThanDate(null);
      setLessThanDate(null);
    }
  }, [clearValue]);

  return (
    <View>
      {/* Label */}
      <Text style={styles.label}>{label}</Text>
      {/* Date pickers container */}
      <View style={styles.filtersContainer}>
        {/* Start date picker */}
        <CustomDateTimePicker
          placeholder={t("from")}
          initialValue={greaterThanDate}
          isTimePickerVisible={isTimePickerVisible}
          initialMode={initialMode}
          onFilter={handleGreaterThanChange}
        />
        {/* End date picker */}
        <CustomDateTimePicker
          placeholder={t("to")}
          initialValue={lessThanDate}
          isTimePickerVisible={isTimePickerVisible}
          initialMode={initialMode}
          onFilter={handleLessThanChange}
        />
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
  filtersContainer: {
    marginBottom: "4%",
    rowGap: 8,
  },
});

export default DateFilter;
