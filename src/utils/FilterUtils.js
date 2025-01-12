import { BUSOBJCAT, BUSOBJCATMAP } from "../constants";
import {
  convertDurationToMilliseconds,
  convertMillisecondsToDuration,
  isEqual,
  timeUnitAbbreviations,
  timeUnitLabels,
} from "./FormatUtils";

/**
 * Represents the filters available for timesheets.
 * Each filter object contains an id, label, type, fieldName, and fieldValue.
 * - id: Unique identifier for the filter.
 * - label: Display label for the filter.
 * - type: Type of the filter (e.g., text, number, date).
 * - fieldName: Field name corresponding to the filter in the data.
 * - fieldValue: Field value to filter with.
 * - units (optional): Array of units for duration type filter (e.g., hours, minutes).
 * - convertToMillisecondsEnabled (optional): Boolean indicating whether duration should be converted to milliseconds.
 */
const timesheetFilters = [
  {
    id: "fromDate",
    label: "start",
    type: "date",
    fieldName: "TimeConfirmation-start",
    fieldValue: "",
  },
  {
    id: "toDate",
    label: "end",
    type: "date",
    fieldName: "TimeConfirmation-end",
    fieldValue: "",
  },
  {
    id: "remark",
    label: "remark",
    type: "text",
    fieldName: "TimeConfirmation-remark-text",
    fieldValue: "",
  },
  {
    id: "duration",
    label: "duration",
    type: "duration",
    fieldName: "TimeConfirmation-totalTime",
    fieldValue: "",
    units: [timeUnitAbbreviations.hours, timeUnitAbbreviations.minutes],
    convertToMillisecondsEnabled: true,
  },
  {
    id: "workflowStatus",
    label: "status",
    type: "status",
    fieldName: "TimeConfirmation-extStatus-processTemplateID",
    fieldValue: "",
  },
];

/**
 * Represents the filters available for absences.
 * Each filter object contains an id, label, type, fieldName, and fieldValue.
 * - id: Unique identifier for the filter.
 * - label: Display label for the filter.
 * - type: Type of the filter (e.g., text, number, date).
 * - fieldName: Field name corresponding to the filter in the data.
 * - fieldValue: Field value to filter with.
 * - units (optional): Array of units for duration type filter (e.g., hours, days).
 * - convertToMillisecondsEnabled (optional): Boolean indicating whether duration should be converted to milliseconds.
 */
const absenceFilters = [
  {
    id: "fromDate",
    label: "start",
    type: "date",
    fieldName: "Absence-start",
    fieldValue: "",
  },
  {
    id: "toDate",
    label: "end",
    type: "date",
    fieldName: "Absence-end",
    fieldValue: "",
  },
  {
    id: "workflowStatus",
    label: "status",
    type: "status",
    fieldName: "Absence-extStatus-processTemplateID",
    fieldValue: "",
  },
  {
    id: "absenceType",
    label: "absence_type",
    type: "picker",
    fieldName: "Absence-type",
    fieldValue: "",
    option: "absenceTypeOptions",
  },
  {
    id: "adjustments",
    label: "adjustments",
    type: "picker",
    fieldName: "Absence-adjustAbsence",
    fieldValue: "",
    option: "booleanOptions",
  },
  {
    id: "reason",
    label: "reason",
    type: "text",
    fieldName: "Absence-remark-text",
    fieldValue: "",
  },
];

/**
 * Represents the filters available for MessageLog.
 * Each filter object contains an id, label, type, fieldName, fieldValue, and option.
 * - id: Unique identifier for the filter.
 * - label: Display label for the filter.
 * - type: Type of the filter (e.g., picker, text, number, date, status).
 * - fieldName: Field name corresponding to the filter in the data.
 * - fieldValue: Field value to filter with.
 * - option: The key representing the corresponding options for the filter.
 *   This will be the property name (e.g., "messageTypeOptions", "documentCategoryOptions", "messageWithinOptions")
 */
const messageLogFilters = [
  {
    id: "documentCategory",
    label: "document_category",
    type: "picker",
    fieldName: "MessageLog-busObjCat",
    fieldValue: "",
    option: "documentCategoryOptions",
  },
  {
    id: "messageType",
    label: "message_type",
    type: "picker",
    fieldName: "MessageLog-type",
    fieldValue: "",
    option: "messageTypeOptions",
  },
  {
    id: "messageWithin",
    label: "message_within",
    type: "picker",
    fieldName: "MessageLog-publishedOn",
    fieldValue: "",
    option: "messageWithinOptions",
  },
];

/**
 *An object mapping busObjCat values to their respective filters
 */
const filtersMap = {
  [BUSOBJCAT.TIMESHEET]: timesheetFilters,
  [BUSOBJCAT.ABSENCE]: absenceFilters,
  [BUSOBJCAT.MESSAGELOG]: messageLogFilters,
};

/**
 * Converts applied filters into OR conditions for building query filters.
 *
 * @param {Object} appliedFilters - The applied filters object.
 * @param {Array} busObjCatFilter - Array of filter objects specific to the business object category.
 * @param {string} busObjCat - The business object category.
 * @returns {Array} - An array of OR conditions for query filters.
 */
const convertFiltersToOrConditions = (
  appliedFilters,
  busObjCatFilter,
  busObjCat
) => {
  const orConditions = [];

  // Iterate over each applied filter
  Object.keys(appliedFilters).forEach((filterId) => {
    const filter = busObjCatFilter.find((item) => item.id === filterId);
    if (filter) {
      switch (filter.type) {
        case "text":
          // Implement text filter handling if needed
          break;
        case "duration":
          // Implement duration filter handling if needed
          break;
        case "date":
          // Implement date filter handling if needed
          break;
        case "picker":
          // Implement date filter handling if needed
          break;
        case "boolean":
          // Implement date filter handling if needed
          break;
        case "status":
          // Handle status filter
          if (appliedFilters[filterId] instanceof Array) {
            appliedFilters[filterId].forEach((item) => {
              // Check if item.stepExtId exists before pushing the condition
              if (item.processTemplateExtId && item.stepExtId) {
                orConditions.push({
                  fieldName: filter.fieldName,
                  operator: "=",
                  value: item.processTemplateExtId,
                  or: false,
                  nestedConditions: [
                    {
                      fieldName: `${BUSOBJCATMAP[busObjCat]}-extStatus-statusID`,
                      operator: "in",
                      value: [item.stepExtId],
                    },
                  ],
                });
              } else {
                console.error(
                  "Missing processTemplateExtId or stepExtId:",
                  item
                );
              }
            });
          }
          break;
        // Add cases for other types of filters if needed

        default:
          break;
      }
    }
  });

  return orConditions;
};

/**
 * Converts applied filters into a where condition suitable for fetching data.
 * @param {Object} appliedFilters - The applied filters object containing key-value pairs of filter ids and values.
 * @param {Array} busObjCatFilter - The array of filter objects defining the filters available for the bus object category.
 * @param {Array} busObjCat - The array of business object categories.
 * @returns {Array} - The where condition array based on the applied filters.
 */
const convertFiltersToWhereConditions = (
  appliedFilters,
  busObjCatFilter,
  busObjCat
) => {
  let whereConditions = [];
  let orConditions = [];
  // Iterate over each applied filter
  Object.keys(appliedFilters).forEach((filterId) => {
    // Find the corresponding filter object in busObjCatFilter
    const filter = busObjCatFilter.find((item) => item.id === filterId);
    if (filter) {
      switch (filter.type) {
        case "text":
          // For text filters, add to where condition if value is not empty
          if (appliedFilters[filterId]) {
            whereConditions.push({
              fieldName: filter.fieldName,
              operator: "contains", // Use 'contains' operator for text filters
              value: appliedFilters[filterId],
            });
          }
          break;
        case "duration":
          // For duration filters, add to where condition if value is not empty
          if (appliedFilters[filterId]) {
            if (appliedFilters[filterId].greaterThanValue !== null) {
              whereConditions.push({
                fieldName: filter.fieldName,
                operator: ">=",
                value: appliedFilters[filterId].greaterThanValue,
              });
            }
            if (appliedFilters[filterId].lessThanValue !== null) {
              whereConditions.push({
                fieldName: filter.fieldName,
                operator: "<=",
                value: appliedFilters[filterId].lessThanValue,
              });
            }
          }
          break;
        case "date":
          // For date filters, add to where condition if value is not empty
          if (appliedFilters[filterId]) {
            if (appliedFilters[filterId].greaterThanDate !== null) {
              whereConditions.push({
                fieldName: filter.fieldName,
                operator: ">=",
                value: appliedFilters[filterId].greaterThanDate,
              });
            }
            if (appliedFilters[filterId].lessThanDate !== null) {
              whereConditions.push({
                fieldName: filter.fieldName,
                operator: "<=",
                value: appliedFilters[filterId].lessThanDate,
              });
            }
          }
          break;
        case "picker":
          // For picker filters, add to where condition if the value is an array or a single value
          const pickerValue = appliedFilters[filterId];
          if (Array.isArray(pickerValue) && pickerValue.length > 0) {
            whereConditions.push({
              fieldName: filter.fieldName,
              operator: "in", // Use IN operator for arrays
              value: pickerValue, // Add the array as the value
            });
          } else if (pickerValue) {
            whereConditions.push({
              fieldName: filter.fieldName,
              operator: "=",
              value: pickerValue, // Single string value
            });
          }
          break;
        default:
          break;
      }
    }
  });

  return whereConditions;
};

/**
 * Converts applied filters to a formatted list of filters.
 * @param {object} appliedFilters - The applied filters object containing filter keys and values.
 * @param {array} busObjCatFilters - The static list of filters for the business object category.
 * @param {string} busObjCat - The name or identifier of the business object category.
 * @returns {object} - The formatted list of filters suitable for filter screen.
 */
const convertToFilterScreenFormat = (
  appliedFilters,
  busObjCatFilters,
  busObjCat
) => {
  // Initialize an empty object to store the formatted filters
  let formattedFilters = {};

  // Iterate over each applied filter property
  for (const key in appliedFilters) {
    if (Object.hasOwnProperty.call(appliedFilters, key)) {
      // Retrieve the value of the applied filter
      const appliedFilterValue = appliedFilters[key];

      // Find the corresponding filter object in the business object category static list of filters
      const busObjCatFilter = busObjCatFilters.find((item) => item.id === key);

      if (busObjCatFilter) {
        switch (busObjCatFilter.type) {
          case "text":
            // For text filters, directly assign the value
            formattedFilters[key] = appliedFilterValue;
            break;
          case "duration":
            // For duration filters, create an object with greaterThanValue, lessThanValue, and unit
            if (!formattedFilters[key]) {
              formattedFilters[key] = {};
            }
            if (appliedFilterValue.unit) {
              formattedFilters[key].unit = appliedFilterValue.unit;
            }
            formattedFilters[key].greaterThanValue =
              convertMillisecondsToDuration(
                appliedFilterValue.greaterThanValue,
                timeUnitLabels[appliedFilterValue.unit],
                busObjCatFilter.convertToMillisecondsEnabled
              );
            formattedFilters[key].lessThanValue = convertMillisecondsToDuration(
              appliedFilterValue.lessThanValue,
              timeUnitLabels[appliedFilterValue.unit],
              busObjCatFilter.convertToMillisecondsEnabled
            );
            break;
          case "date":
            // For date filters, create an object with greaterThanDate and lessThanDate
            if (!formattedFilters[key]) {
              formattedFilters[key] = {};
            }
            if (appliedFilterValue.greaterThanDate) {
              formattedFilters[key].greaterThanDate =
                appliedFilterValue.greaterThanDate;
            }
            if (appliedFilterValue.lessThanDate) {
              formattedFilters[key].lessThanDate =
                appliedFilterValue.lessThanDate;
            }
            break;
          case "status":
            // For status filters, directly assign the value
            formattedFilters[key] = appliedFilterValue;
            break;
          case "picker":
            // For picker filters, directly assign the value
            formattedFilters[key] = appliedFilterValue;
            break;
          default:
            break;
        }
      }
    }
  }

  // Return the formatted list of filters
  return formattedFilters;
};

/**
 * Converts applied filters to a formatted list of filters.
 * @param {object} appliedFilters - The applied filters object containing filter keys and values.
 * @param {array} busObjCatFilters - The static list of filters for the business object category.
 * @param {string} busObjCat - The name or identifier of the business object category.
 * @returns {object} - The formatted list of filters suitable for business object category screen.
 */
const convertToBusObjCatFormat = (
  appliedFilters,
  busObjCatFilters,
  busObjCat
) => {
  // Initialize an empty object to store the formatted filters
  let formattedFilters = {};

  // Iterate over each applied filter property
  for (const key in appliedFilters) {
    if (Object.hasOwnProperty.call(appliedFilters, key)) {
      // Retrieve the value of the applied filter
      const appliedFilterValue = appliedFilters[key];

      // Find the corresponding filter object in the business object category static list of filters
      const busObjCatFilter = busObjCatFilters.find((item) => item.id === key);

      if (busObjCatFilter) {
        switch (busObjCatFilter.type) {
          case "text":
            // For text filters, directly assign the value
            formattedFilters[key] = appliedFilterValue;
            break;
          case "duration":
            // For duration filters, create an object with greaterThanValue, lessThanValue, and unit
            if (!formattedFilters[key]) {
              formattedFilters[key] = {};
            }
            if (appliedFilterValue.unit) {
              formattedFilters[key].unit = appliedFilterValue.unit;
            }
            formattedFilters[key].greaterThanValue =
              convertDurationToMilliseconds(
                appliedFilterValue.greaterThanValue,
                timeUnitLabels[appliedFilterValue.unit],
                busObjCatFilter.convertToMillisecondsEnabled
              );
            formattedFilters[key].lessThanValue = convertDurationToMilliseconds(
              appliedFilterValue.lessThanValue,
              timeUnitLabels[appliedFilterValue.unit],
              busObjCatFilter.convertToMillisecondsEnabled
            );
            break;
          case "date":
            // For date filters, create an object with greaterThanDate and lessThanDate
            if (!formattedFilters[key]) {
              formattedFilters[key] = {};
            }
            if (appliedFilterValue.greaterThanDate) {
              formattedFilters[key].greaterThanDate =
                appliedFilterValue.greaterThanDate;
            }
            if (appliedFilterValue.lessThanDate) {
              formattedFilters[key].lessThanDate =
                appliedFilterValue.lessThanDate;
            }
            break;
          case "status":
            // For status filters, directly assign the value
            formattedFilters[key] = appliedFilterValue;
            break;
          case "picker":
            // For picker filters, directly assign the selected value
            formattedFilters[key] = appliedFilterValue;
            break;
          default:
            break;
        }
      }
    }
  }

  // Return the formatted list of filters
  return formattedFilters;
};

const handleTextFilter = (
  filterId,
  value,
  initialFilters,
  appliedFilters,
  setAppliedFilters,
  setUnsavedChanges
) => {
  if (!value.trim()) {
    // If the value is invalid (empty, undefined or null), remove the filter with the label from appliedFilters
    const { [filterId]: omit, ...remainingFilters } = appliedFilters;
    setAppliedFilters(remainingFilters);
  } else {
    // If the value is not empty, update the appliedFilters object
    setAppliedFilters({ ...appliedFilters, [filterId]: value });
  }

  // Check if the value has changed, ensuring we handle undefined cases properly
  const initialFilterValue = initialFilters[filterId] || ""; // Default to empty string if undefined
  const filterChanged = initialFilterValue !== value; // Check if current value differs from initial

  console.log(
    `Inside handleTextFilter, the initial set of filters has been recorded as follows: ${JSON.stringify(
      initialFilters
    )}. Currently, the text filter hold the values: ${JSON.stringify({
      value,
    })}. Consequently, has the text filter status been updated?: ${filterChanged}.`
  );

  setUnsavedChanges((prevUnsavedChanges) => ({
    ...prevUnsavedChanges,
    [filterId]: filterChanged,
  }));
};

const handleDurationFilter = (
  filterId,
  { greaterThanValue, lessThanValue, unit },
  initialFilters,
  appliedFilters,
  setAppliedFilters,
  setUnsavedChanges
) => {
  // Check if either lessThanValue or greaterThanValue is not null, if not null, update the appliedFilters object
  if ((greaterThanValue !== null || lessThanValue !== null) && unit) {
    setAppliedFilters((prevAppliedFilters) => {
      return {
        ...prevAppliedFilters,
        [filterId]: { greaterThanValue, lessThanValue, unit },
      };
    });
  } else {
    // If both values are empty, remove the filter with the label from appliedFilters
    const { [filterId]: omit, ...remainingFilters } = appliedFilters;
    setAppliedFilters(remainingFilters);
  }

  const filterChanged =
    String(initialFilters[filterId]?.greaterThanValue ?? null) !==
      String(greaterThanValue) ||
    String(initialFilters[filterId]?.lessThanValue ?? null) !==
      String(lessThanValue) ||
    (initialFilters[filterId]?.unit ?? "h") !== unit;

  console.log(
    `Inside handleDurationFilter, the initial set of filters has been recorded as follows: ${JSON.stringify(
      initialFilters
    )}. Currently, the duration filter hold the values: ${JSON.stringify({
      greaterThanValue,
      lessThanValue,
      unit,
    })}. Consequently, has the duration filter status been updated?: ${filterChanged}.`
  );

  setUnsavedChanges((prevUnsavedChanges) => ({
    ...prevUnsavedChanges,
    [filterId]: filterChanged,
  }));
};

const handleDateFilter = (
  filterId,
  { greaterThanDate, lessThanDate },
  initialFilters,
  appliedFilters,
  setAppliedFilters,
  setUnsavedChanges
) => {
  // Check if either lessThanDate or greaterThanDate is not null, if not null, update the appliedFilters object
  if (greaterThanDate !== null || lessThanDate !== null) {
    setAppliedFilters((prevAppliedFilters) => {
      return {
        ...prevAppliedFilters,
        [filterId]: { greaterThanDate, lessThanDate },
      };
    });
  } else {
    // If both values are empty, remove the filter with the label from appliedFilters
    const { [filterId]: omit, ...remainingFilters } = appliedFilters;
    setAppliedFilters(remainingFilters);
  }

  const filterChanged =
    (initialFilters[filterId]?.greaterThanDate ?? null) !== greaterThanDate ||
    (initialFilters[filterId]?.lessThanValue ?? null) !== lessThanDate;

  console.log(
    `Inside handleDateFilter, the initial set of filters has been recorded as follows: ${JSON.stringify(
      initialFilters
    )}. Currently, the date filter hold the values: ${JSON.stringify({
      greaterThanDate,
      lessThanDate,
    })}. Consequently, has the date filter status been updated?: ${filterChanged}.`
  );

  setUnsavedChanges((prevUnsavedChanges) => ({
    ...prevUnsavedChanges,
    [filterId]: filterChanged,
  }));
};

/**
 * Handles changes to a picker filter (dropdown or selector).
 *
 * @param {string} filterId - The identifier for the filter.
 * @param {string|null} value - The selected value for the filter.
 * @param {Object} initialFilters - The initial set of filters.
 * @param {Object} appliedFilters - The currently applied filters.
 * @param {Function} setAppliedFilters - Function to update the applied filters.
 * @param {Function} setUnsavedChanges - Function to update the unsaved changes state.
 */
const handlePickerFilter = (
  filterId,
  value,
  initialFilters,
  appliedFilters,
  setAppliedFilters,
  setUnsavedChanges
) => {
  // Ensure appliedFilters is an object
  const currentAppliedFilters = appliedFilters || {};

  if (value !== null) {
    // Update the appliedFilters object with the selected value for this filter
    setAppliedFilters((prevAppliedFilters) => ({
      ...prevAppliedFilters,
      [filterId]: value,
    }));
  } else {
    // If value is null, remove the filter from appliedFilters
    const { [filterId]: omit, ...remainingFilters } = currentAppliedFilters;
    setAppliedFilters(remainingFilters);
  }

  // Check if the value has changed by comparing the current value with the initial one
  const filterChanged = !isEqual(initialFilters[filterId] || {}, value || {});

  // Log the update process
  console.log(
    `Inside handlePickerFilter, the initial filters are: ${JSON.stringify(
      initialFilters
    )}. The selected value for the filter is: ${JSON.stringify({ value })}. ` +
      `Has the filter value changed? ${filterChanged}.`
  );

  // Update unsaved changes state
  setUnsavedChanges((prevUnsavedChanges) => ({
    ...prevUnsavedChanges,
    [filterId]: filterChanged,
  }));
};

/**
 * Handles changes to the status filter.
 *
 * @param {string} filterId - The identifier for the filter.
 * @param {string|null} value - The selected value for the filter.
 * @param {Object} initialFilters - The initial set of filters.
 * @param {Object} appliedFilters - The currently applied filters.
 * @param {Function} setAppliedFilters - Function to update the applied filters.
 * @param {Function} setUnsavedChanges - Function to update the unsaved changes state.
 */
const handleStatusFilter = (
  filterId,
  value,
  initialFilters,
  appliedFilters,
  setAppliedFilters,
  setUnsavedChanges
) => {
  // Check if appliedFilters is an object, otherwise initialize it as an empty object
  const currentAppliedFilters = appliedFilters || {};

  if (value !== null) {
    // Check if value is not null, if not null, update the appliedFilters object
    setAppliedFilters((prevAppliedFilters) => {
      return {
        ...prevAppliedFilters,
        [filterId]: value,
      };
    });
  } else {
    // If the value is invalid (null), remove the filter with the label from appliedFilters
    const { [filterId]: omit, ...remainingFilters } = currentAppliedFilters;

    setAppliedFilters(remainingFilters);
  }

  const filterChanged = !isEqual(initialFilters[filterId] || {}, value || {});

  console.log(
    `Inside handleStatusFilter, the initial set of filters has been recorded as follows: ${JSON.stringify(
      initialFilters
    )}. Currently, the status filter hold the value: ${JSON.stringify({
      value,
    })}. Consequently, has status filter status been updated?: ${filterChanged}.`
  );

  setUnsavedChanges((prevUnsavedChanges) => ({
    ...prevUnsavedChanges,
    [filterId]: filterChanged,
  }));
};

/**
 * This function is used to ensure that applied filters, especially duration filters,
 * adhere to the constraints defined by the business object category filters.
 * The decision to implement this validation separately from the duration filter component was made considering
 * scenarios where users might not trigger filter submission or blur events, potentially skipping validation checks.
 * By centralizing the validation logic here, we ensure that regardless of how the filters are applied or interacted with,
 * the constraints defined by the business object category filters are consistently enforced.
 * @param {Object} appliedFilters - The filters applied by the user.
 * @param {Array} busObjCatFilters - The filters defined for the business object category.
 * @returns {Object} An object indicating whether the applied filters are valid along with an optional message.
 */
const validateAppliedFilters = (
  appliedFilters,
  busObjCatFilters,
  translation
) => {
  // Initialize an object to store validation results
  const validationResult = { isValid: true, message: "" };

  // Iterate through each applied filter
  Object.keys(appliedFilters).forEach((filterId) => {
    // Find the corresponding filter definition in busObjCatFilters
    const busObjCatFilter = busObjCatFilters.find(
      (item) => item.id === filterId
    );
    // If filter definition exists
    if (busObjCatFilter) {
      // Handle duration type filters
      if (busObjCatFilter.type === "duration") {
        // If filter values are provided
        if (appliedFilters[filterId]) {
          // Ensure that if both "greater than" and "less than" thresholds are provided,
          // the "less than" threshold is greater than the "greater than" threshold.
          if (
            appliedFilters[filterId].greaterThanValue !== null &&
            appliedFilters[filterId].lessThanValue !== null &&
            appliedFilters[filterId].lessThanValue <
              appliedFilters[filterId].greaterThanValue
          ) {
            // Set validation result indicating invalid filter
            validationResult.isValid = false;
            validationResult.message = translation(
              "less_than_greater_than_duration_error"
            );
          }
        }
      }
    }
  });

  // Return the final validation result
  return validationResult;
};

export {
  convertFiltersToOrConditions,
  convertFiltersToWhereConditions,
  convertToBusObjCatFormat,
  convertToFilterScreenFormat,
  filtersMap,
  handleDateFilter,
  handleDurationFilter,
  handlePickerFilter,
  handleStatusFilter,
  handleTextFilter,
  validateAppliedFilters,
};
