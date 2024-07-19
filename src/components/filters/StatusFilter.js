import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import { fetchBusObjCatData } from "../../utils/APIUtils";

import CustomPicker from "../CustomPicker";

import Loader from "../Loader";

/**
 * StatusFilter component provides a filter for selecting status labels.
 *
 * @param {Object} props - Component props.
 * @param {string} props.label - Label for the filter.
 * @param {Function} props.onFilter - Function to handle filter change.
 * @param {string|null} props.initialValue - Initial value for the filter.
 * @param {boolean} props.clearValue - Boolean indicating whether to clear the filter value.
 * @param {string} props.busObjCat - Business object category.
 * @returns {JSX.Element} - StatusFilter component JSX.
 */
const StatusFilter = ({
  label,
  onFilter,
  initialValue,
  clearValue,
  busObjCat,
}) => {
  // State variables for the selected value, picker options, track options loaded and loading indicator
  const [value, setValue] = useState(initialValue || null);
  const [pickerOptions, setPickerOptions] = useState({});
  const [optionsLoaded, setOptionsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  /**
   * Creates a map of status labels and associated step information.
   *
   * @param {Array} data - Process template data.
   * @returns {Object} - Map of status labels and step information.
   */
  const createStatusLabelAndStepMap = (data) => {
    const statusMap = {};

    // Loop through each returned process template
    data.forEach((processTemplate) => {
      const processTemplateExtId = processTemplate["ProcessTemplate-extID"];
      const steps = processTemplate["ProcessTemplate-steps"];

      // Check if steps is not null and is an array
      if (steps && Array.isArray(steps)) {
        // Loop through steps in each process template
        steps.forEach((step) => {
          const { extID, statusLabel } = step;
          // Check if status label already exists in the map
          if (statusMap.hasOwnProperty(statusLabel)) {
            statusMap[statusLabel].push({
              processTemplateExtId,
              stepExtId: extID,
            });
          } else {
            statusMap[statusLabel] = [
              { processTemplateExtId, stepExtId: extID },
            ];
          }
        });
      }
    });

    return statusMap;
  };

  /**
   * Fetches process templates based on the provided business object category.
   */
  const fetchProcessTemplates = async () => {
    try {
      const queryFields = {
        fields: [
          "ProcessTemplate-id",
          "ProcessTemplate-extID",
          "ProcessTemplate-steps",
        ],
      };

      const whereConditions = [];
      const orConditions = [];

      whereConditions.push({
        fieldName: "ProcessTemplate-busObjCat",
        operator: "=",
        value: busObjCat,
      });

      // Fetch process template data
      const response = await fetchBusObjCatData(
        "ProcessTemplate",
        null,
        null,
        queryFields,
        whereConditions,
        orConditions
      );
      if (!response.error && response.data) {
        const statusLabelAndStepMap = createStatusLabelAndStepMap(
          response.data
        );
        setPickerOptions(statusLabelAndStepMap);
        setOptionsLoaded(true);
        setLoading(false);
      } else {
        console.error("Error fetching process template data:", response.error);
      }
    } catch (error) {
      console.error("Error fetching process template data:", error);
    }
  };

  // Effect to clear selected status when clearValue is true
  useEffect(() => {
    if (clearValue) {
      setValue(null);
    }
  }, [clearValue]);

  // Fetch process templates on component mount
  useEffect(() => {
    fetchProcessTemplates();
  }, []);

  // Construct picker items array
  const pickerItems = [
    ...Object.entries(pickerOptions).map(([label, value]) => ({
      label,
      value,
    })),
  ];

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View>
        {loading ? ( // Render loader when loading is true
          <Loader size={"small"} />
        ) : optionsLoaded ? ( // Render CustomPicker when options are loaded
          <CustomPicker
            items={pickerItems}
            initialValue={value}
            onFilter={onFilter}
            clearValue={clearValue}
          />
        ) : (
          <Text>No options available in status</Text>
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

export default StatusFilter;
