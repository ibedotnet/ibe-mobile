import {
  API_ENDPOINTS,
  APP,
  BUSOBJCAT,
  BUSOBJCATMAP,
  INTSTATUS,
  TEST_MODE,
} from "../constants";
import { fetchBusObjCatData, fetchData } from "./APIUtils";
import { datesAreForSameDay, isEqual, normalizeDateToUTC } from "./FormatUtils";
import { showToast } from "./MessageUtils";
import { sprintf } from "sprintf-js";

/**
 * Common prefix for all absence type fields
 * This prefix is used to create the full field names by appending specific field keys.
 */
const absenceTypePrefix = `${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-type:`;

/**
 * List of dynamic field keys for absence types.
 * These keys represent individual properties of absence types and
 * will be combined with the common prefix to generate the full field names.
 */
const absenceTypeFields = [
  "AbsenceType-busObjCat",
  "AbsenceType-extID",
  "AbsenceType-name",
  "AbsenceType-policyText",
  "AbsenceType-hourlyLeave",
  "AbsenceType-displayInHours",
  "AbsenceType-fixedCalendar",
  "AbsenceType-allowedInProbation",
  "AbsenceType-allowedInTermination",
  "AbsenceType-adminAdjustOnly",
  "AbsenceType-halfDaysNotAllowed",
  "AbsenceType-minRequest",
  "AbsenceType-maxRequest",
  "AbsenceType-negativeDays",
  "AbsenceType-adjustAfterDays",
  "AbsenceType-gender",
];

/**
 * Mapping boolean values to user-friendly strings: "Yes" and "No".
 *
 * This map is used to convert boolean values `true` and `false` into more
 * user-friendly string representations like "Yes" for `true` and "No` for `false`.
 */
const booleanMap = {
  true: "Yes",
  false: "No",
};

/**
 * Calculates the duration (number of working days) between start and end dates, including fractions.
 *
 * @param {Date} startDate - The start date of the absence.
 * @param {Date} endDate - The end date of the absence.
 * @param {Object} employeeInfo - The employee information containing non-working dates and days.
 * @param {string|number|null} startDayFraction - The fraction of the first day used (0-1) as a string, number, or null.
 * @param {string|number|null} endDayFraction - The fraction of the last day used (0-1) as a string, number, or null.
 * @param {Object} absenceDetails - The details of the absence.
 * @param {Function} updateKPIs - Callback function to update KPI values.
 * @param {Function} setIsKPIUpdating - Callback function to set the KPI updating state.
 * @param {Function} t - Translation function used to show localized messages.
 * @param {boolean} localAbsenceTypeHourlyLeave - Indicates if the absence type is based on hourly leave.
 * @param {boolean} localAbsenceTypeDisplayInHours - Indicates if the absence should be displayed in hours.
 * @param {number} hoursPerDay - The number of working hours per day.
 * @returns {string} - The total working day equivalent (including fractions) as a string.
 *
 * @throws {Error} - Throws error if input dates or fractions are invalid.
 */
const calculateDuration = (
  startDate,
  endDate,
  employeeInfo,
  startDayFraction = "1",
  endDayFraction = "1",
  absenceDetails,
  updateKPIs,
  setIsKPIUpdating,
  t,
  localAbsenceTypeDisplayInHours,
  localAbsenceTypeHourlyLeave,
  hoursPerDay
) => {
  // Ensure fractions are parsed as valid numbers between 0 and 1
  startDayFraction =
    startDayFraction !== null && !isNaN(parseFloat(startDayFraction))
      ? Math.min(Math.max(parseFloat(startDayFraction), 0), 1)
      : 1;

  // Handle same-day scenario: enforce endDayFraction as null
  endDayFraction = datesAreForSameDay(startDate, endDate)
    ? null
    : endDayFraction !== null && !isNaN(parseFloat(endDayFraction))
      ? Math.min(Math.max(parseFloat(endDayFraction), 0), 1)
      : null;

  if (!(startDate instanceof Date) || isNaN(startDate)) {
    console.error("Invalid startDate. Expected a valid Date object.");
    return;
  }
  if (!(endDate instanceof Date) || isNaN(endDate)) {
    console.error("Invalid endDate. Expected a valid Date object.");
    return;
  }

  // Set both startDate and endDate to midnight to compare only the date part
  const startDateAtMidnight = new Date(startDate);
  startDateAtMidnight.setHours(0, 0, 0, 0); // Reset time to 00:00:00

  const endDateAtMidnight = new Date(endDate);
  endDateAtMidnight.setHours(0, 0, 0, 0); // Reset time to 00:00:00

  if (startDateAtMidnight > endDateAtMidnight) {
    console.error("Start date cannot be after end date.");
    showToast(t("start_date_must_be_less_than_equal_to_end_date"), "error");
    return;
  }

  let duration = 0;
  const currentDate = new Date(startDate);
  let isFirstDay = true;

  while (currentDate <= endDate) {
    if (!isNonWorkingDay(currentDate, employeeInfo)) {
      if (isFirstDay) {
        // Handle same-day case by taking max of fractions
        if (startDateAtMidnight.getTime() === endDateAtMidnight.getTime()) {
          const effectiveEndFraction =
            endDayFraction !== null ? endDayFraction : startDayFraction;
          duration += Math.max(startDayFraction, effectiveEndFraction);
          break;
        } else {
          duration += startDayFraction;
          isFirstDay = false;
        }
      } else if (
        currentDate.toDateString() === endDateAtMidnight.toDateString()
      ) {
        duration += endDayFraction !== null ? endDayFraction : 1;
      } else {
        duration++;
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Handle case where startDate is a non-working day
  if (duration === 0 && isNonWorkingDay(startDate, employeeInfo)) {
    showToast(t("start_date_invalid_duration_zero"), "error");
  }

  let adjustedDuration = duration;
  // Adjust duration if displayed in hours
  if (localAbsenceTypeDisplayInHours || localAbsenceTypeHourlyLeave) {
    adjustedDuration = adjustedDuration * hoursPerDay;
    console.log("Adjusted duration (in hours):", adjustedDuration);
  }

  // Update KPI balances with the calculated (adjusted if applicable) duration
  updateKPIBalances(
    { ...absenceDetails, absenceDuration: adjustedDuration },
    updateKPIs,
    setIsKPIUpdating
  );

  // Return the duration (if adjusted) as a string to handle text box compatibility
  return adjustedDuration.toString();
};

/**
 * Calculates the end date based on the start date, duration, and fractions, considering weekends and holidays.
 *
 * @param {Date} startDate - The start date of the absence.
 * @param {string|number} duration - The total working day equivalent as a string (from text input) or number.
 * @param {Object} employeeInfo - The employee information containing non-working dates and days.
 * @param {number|string|null} startDayFraction - The fraction of the first day used (0-1) as a number, string, or null.
 * @param {number|string|null} endDayFraction - The fraction of the last day used (0-1) as a number, string, or null.
 * @param {Object} absenceDetails - The details of the absence.
 * @param {Function} updateKPIs - Callback function to update KPI values.
 * @param {Function} setIsKPIUpdating - Callback function to set the KPI updating state.
 * @param {boolean} localAbsenceTypeHourlyLeave - Indicates if the absence type is based on hourly leave.
 * @param {boolean} localAbsenceTypeDisplayInHours - Indicates if the absence should be displayed in hours.
 * @param {number} hoursPerDay - The number of working hours per day.
 * @returns {Date} - The calculated end date.
 *
 * @throws {Error} Throws an error if the start date is invalid, or if duration, startDayFraction, or endDayFraction are out of valid bounds.
 *
 * @example
 * calculateEndDate(new Date(), "3.5", employeeInfo, "0.5", "0.5", absenceDetails, updateKPIs);
 * // Returns a date three and a half working days after the start date, accounting for holidays.
 */
const calculateEndDate = (
  startDate,
  duration,
  employeeInfo,
  startDayFraction = "1",
  endDayFraction = "1",
  absenceDetails,
  updateKPIs,
  setIsKPIUpdating,
  localAbsenceTypeHourlyLeave,
  localAbsenceTypeDisplayInHours,
  hoursPerDay
) => {
  // Ensure the duration is a valid number
  let parsedDuration = parseFloat(duration);
  if (isNaN(parsedDuration) || parsedDuration < 0) {
    console.error("Invalid duration. Expected a non-negative number.");
    showToast(
      "Invalid duration. Expected a valid non-negative number.",
      "error"
    );
    return;
  }

  // Adjust duration if displayed in hours
  if (localAbsenceTypeDisplayInHours || localAbsenceTypeHourlyLeave) {
    parsedDuration = parsedDuration / hoursPerDay;
    console.log("Adjusted duration (in days):", parsedDuration);
  }

  // Convert fractions to valid numbers or defaults if null or invalid
  startDayFraction =
    startDayFraction !== null ? parseFloat(startDayFraction) || 0 : 0;

  endDayFraction = datesAreForSameDay(startDate, endDate)
    ? null
    : parseFloat(endDayFraction) || 1;

  if (!(startDate instanceof Date) || isNaN(startDate)) {
    console.error("Invalid startDate. Expected a valid Date object.");
    return;
  }
  if (startDayFraction < 0 || startDayFraction > 1) {
    console.error("Invalid startDayFraction. Must be between 0 and 1.");
    return;
  }
  if (endDayFraction < 0 || endDayFraction > 1) {
    console.error("Invalid endDayFraction. Must be between 0 and 1.");
    return;
  }

  if (parsedDuration === 0) return new Date(startDate);

  let remainingDuration = parsedDuration - startDayFraction;
  let endDate = new Date(startDate);

  // Skip initial non-working days only if startDayFraction is 0
  if (startDayFraction === 0) {
    while (isNonWorkingDay(endDate, employeeInfo)) {
      endDate.setDate(endDate.getDate() + 1);
    }
  }

  // Adjust remaining duration considering working days
  while (remainingDuration > 0) {
    endDate.setDate(endDate.getDate() + 1);

    if (!isNonWorkingDay(endDate, employeeInfo)) {
      if (remainingDuration <= 1) {
        // Apply the remaining fractional day carefully without exceeding 24 hours
        endDate.setHours(
          Math.min(endDate.getHours() + endDayFraction * 24, 23)
        );
        remainingDuration = 0;
      } else {
        remainingDuration--;
      }
    }
  }

  // Update KPI balances in the UI
  updateKPIBalances(
    {
      ...absenceDetails,
      absenceEnd: endDate,
      absenceDuration: parsedDuration,
    },
    updateKPIs,
    setIsKPIUpdating
  );

  return endDate;
};

/**
 * Calculates the number of valid working days between the start and end date,
 * excluding non-working days (e.g., weekends, holidays).
 *
 * @param {Date|string} startDate - The start date of the period.
 * @param {Date|string} endDate - The end date of the period.
 * @param {Object} employeeInfo - The employee's non-working days (e.g., holidays, weekends).
 * @returns {number} - The count of valid working days between the two dates.
 */
const calculateValidDaysCount = (startDate, endDate, employeeInfo) => {
  let validDaysCount = 0;

  // Normalize both dates to UTC
  let currentDate = normalizeDateToUTC(new Date(startDate));
  let normalizedEndDate = normalizeDateToUTC(new Date(endDate));

  while (currentDate <= normalizedEndDate) {
    if (!isNonWorkingDay(currentDate, employeeInfo)) {
      validDaysCount++;
    }

    // Move to the next day safely
    currentDate = new Date(currentDate.getTime() + 86400000);
  }

  return validDaysCount;
};

/**
 * Determines if leave cancellation is allowed based on the restriction period and end date.
 *
 * @param {number} maxCancellationDays - The number of days after which leave cancellation is restricted.
 * @param {Date|null} leaveEndDate - The end date of the absence.
 * @param {function} t - The translation function from `useTranslation()`
 * @returns {boolean} - Returns true if cancellation is allowed, otherwise false.
 */
const canCancelLeave = (maxCancellationDays, leaveEndDate, t) => {
  if (maxCancellationDays <= 0 || !leaveEndDate) {
    return true;
  }

  const currentDateUTC = normalizeDateToUTC(new Date());
  const leaveEndDateUTC = normalizeDateToUTC(leaveEndDate);

  const maxCancellationPeriodMs = maxCancellationDays * 24 * 60 * 60 * 1000;

  if (
    currentDateUTC.getTime() - leaveEndDateUTC.getTime() >
    maxCancellationPeriodMs
  ) {
    showToast(
      t("leave_cancellation_not_allowed", { days: maxCancellationDays }),
      "error"
    );
    return false;
  }

  return true;
};

/**
 * Creates a mapping of `extID` to `statusLabel` for process steps.
 *
 * @param {Array} data - Array of process template data, each containing steps.
 * @returns {Object} - A map where keys are `extID` and values are `statusLabel`.
 */
const createExtIdStatusLabelMap = (data) => {
  const extIdStatusLabelMap = {};

  // Iterate over each process template
  data.forEach((processTemplate) => {
    const steps = processTemplate["ProcessTemplate-steps"];

    // Ensure steps is not null and is an array
    if (steps && Array.isArray(steps)) {
      // Map each step's extID to its statusLabel
      steps.forEach((step) => {
        const { extID, statusLabel } = step;
        extIdStatusLabelMap[extID] = statusLabel;
      });
    }
  });

  return extIdStatusLabelMap;
};

/**
 * Fetches eligible absence types for a given employee asynchronously from the API.
 *
 * This function constructs a request to fetch absence types using the `AbsenceTypeBalanceReadApi` method.
 * It processes the response, checks if valid absence type data is present, and returns the list of eligible absence types.
 * If no valid data is found or an error occurs, an empty array is returned.
 *
 * @param {string} employeeId - The ID of the employee for whom absence types are being fetched.
 * @param {boolean} hideZeroBalances - Flag indicating whether absence types with zero balances should be hidden.
 *                                      Defaults to `false`.
 * @param {Function} t - Translation function used to show localized messages.
 * @returns {Promise<Object>} A promise that resolves to a map of eligible absence types, or an empty object if no data is found or an error occurs.
 */
const fetchEligibleAbsenceTypes = async (
  employeeId,
  hideZeroBalances = false,
  t
) => {
  try {
    const normalizedDate = normalizeDateToUTC(new Date());
    const balanceCheckOnDate = sprintf(
      "%d-%02d-%02dT%02d:%02d:%02d-0000",
      normalizedDate.getUTCFullYear(),
      normalizedDate.getUTCMonth() + 1,
      normalizedDate.getUTCDate(),
      normalizedDate.getUTCHours(),
      normalizedDate.getUTCMinutes(),
      normalizedDate.getUTCSeconds()
    );

    const requestBody = {
      interfaceName: "AbsenceTypeBalanceReadApi",
      methodName: "readAbsenceTypeBalances",
      paramsMap: {
        employeeId: employeeId,
        userId: APP.LOGIN_USER_ID,
        hrDivisionId: null,
        readDate: null,
        languageId: APP.LOGIN_USER_LANGUAGE,
        clientId: APP.LOGIN_USER_CLIENT,
        hideZeroBalances: hideZeroBalances,
        balanceCheckOnDate: balanceCheckOnDate,
        absenceType: null,
        checkBalances: false,
        absenceDuration: 0.0,
        employee: null,
      },
    };

    // Send the API request
    const response = await fetchData(
      API_ENDPOINTS.INVOKE,
      "POST",
      {
        "Content-Type": "application/json",
      },
      JSON.stringify(requestBody)
    );

    // Process the response to extract eligible absence types
    if (
      response &&
      response.success &&
      response.retVal &&
      response.retVal.data &&
      response.retVal.data.length > 0
    ) {
      console.log("Eligible absence types fetched successfully.");
      // Create a map with extID as the key and the entire absence type object as the value
      const map = response.retVal.data.reduce((acc, item) => {
        const extID = item["extID"];
        if (extID) acc[extID] = item; // Use the entire item as the value
        return acc;
      }, {});

      return map; // Return the map directly
    }

    console.log("No eligible absence types found.");
    showToast(t("no_eligible_absence_types_found"), "error");
    return {}; // Return empty object if no eligible absence types are found
  } catch (error) {
    console.error("Failed to fetch eligible absence types:", error);
    return {};
  }
};

/**
 * Fetches employee absences with specific conditions.
 *
 * @param {string} absenceEmployeeId - The employee ID.
 * @returns {Promise<Array>} - A Promise resolving to an array of absences.
 */
const fetchEmployeeAbsences = async (absenceEmployeeId) => {
  if (!absenceEmployeeId) {
    console.error("Invalid employee ID provided in fetchEmployeeAbsences.");
    return [];
  }

  const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString(); // Start of the current year

  try {
    const queryFields = {
      fields: [
        "Absence-id",
        "Absence-type",
        "Absence-start",
        "Absence-end",
        "Absence-employeeID",
      ],
      where: [
        {
          fieldName: "Absence-employeeID",
          operator: "=",
          value: absenceEmployeeId,
        },
        { fieldName: "Absence-end", operator: ">=", value: startOfYear },
      ],
    };

    const formData = {
      query: JSON.stringify(queryFields),
      testMode: TEST_MODE,
      client: parseInt(APP.LOGIN_USER_CLIENT, 10),
      user: APP.LOGIN_USER_ID,
      userID: APP.LOGIN_USER_ID,
      language: APP.LOGIN_USER_LANGUAGE,
      intStatus: JSON.stringify([INTSTATUS.ACTIVE]),
    };

    const absencesResponse = await fetchData(
      API_ENDPOINTS.QUERY,
      "POST",
      { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      new URLSearchParams(formData).toString()
    );

    if (absencesResponse.success) {
      return absencesResponse.data;
    } else {
      console.error("Failed to fetch employee absences.");
      return [];
    }
  } catch (error) {
    console.error("Error fetching employee absences:", error);
    return [];
  }
};

/**
 * Formats the leave duration in either hours (`h`) or days (`d`).
 *
 * @param {number} planned - The planned leave quantity.
 * @param {boolean} [isHourly=false] - Whether the leave is measured in hours.
 * @param {boolean} [isDisplayInHours=false] - Whether to display in hours.
 * @param {boolean} [adjustAbsence=false] - Whether the leave is an adjustment.
 * @returns {string} - Formatted leave duration with units (e.g., "8 h" or "+2 d").
 */
const formatLeaveDuration = (
  planned,
  isHourly = false,
  isDisplayInHours = false,
  adjustAbsence = false
) => {
  let formattedUnit;
  let displayPlanned = `${planned}`;

  // Determine the unit: hours ('h') or days ('d')
  if (isHourly || isDisplayInHours) {
    formattedUnit = "h";
  } else {
    formattedUnit = "d";
  }

  displayPlanned = `${displayPlanned} ${formattedUnit}`;

  // Add "+" sign for adjusted absences with positive planned values
  if (adjustAbsence && planned > 0) {
    displayPlanned = `+${displayPlanned}`;
  }

  return displayPlanned;
};

/**
 * Calculates the total absence time in milliseconds.
 *
 * @param {Array} hoursByDay - An array of objects, each containing an `hours` property (time in ms).
 * @returns {number} - The total absence time in milliseconds.
 */
const getAbsenceMilliseconds = (hoursByDay) => {
  return hoursByDay.reduce((sum, entry) => sum + entry.hours, 0);
};

/**
 * Fetches Absence Types from the API and returns a map where:
 * - the key is the `extID`
 * - the value is the corresponding absence type object.
 *
 * @returns {Promise<Object>} - A Promise resolving to a map with `extID` as the key and the full absence type object as the value.
 */
const fetchAbsenceTypes = async () => {
  try {
    const queryFields = {
      fields: absenceTypeFields,
      where: [
        {
          fieldName: "AbsenceType-busObjCat",
          operator: "=",
          value: "AbsenceType",
        },
      ],
    };

    const formData = {
      query: JSON.stringify(queryFields),
      testMode: TEST_MODE,
      client: parseInt(APP.LOGIN_USER_CLIENT, 10),
      user: APP.LOGIN_USER_ID,
      userID: APP.LOGIN_USER_ID,
      language: APP.LOGIN_USER_LANGUAGE,
      intStatus: JSON.stringify([INTSTATUS.ACTIVE]),
    };

    // Fetch absence types from the API
    const response = await fetchData(
      API_ENDPOINTS.QUERY,
      "POST",
      { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      new URLSearchParams(formData).toString()
    );

    if (response.success && Array.isArray(response.data)) {
      // Create a map with extID as the key and the entire absence type object as the value
      const map = response.data.reduce((acc, item) => {
        const extID = item["AbsenceType-extID"];
        if (extID) acc[extID] = item; // Use the entire item as the value
        return acc;
      }, {});

      return map; // Return the map directly
    } else {
      console.error("Unexpected response format for AbsenceType.");
      return {};
    }
  } catch (error) {
    console.error("Error in fetching AbsenceType data:", error);
    return {};
  }
};

/**
 * Finds absence type record by its external ID (extid).
 *
 * @param {string} extid - The external ID of the absence type.
 * @param {Object} allAbsenceTypes - Map of all absence types, where keys are extids.
 * @returns {Object|null} - The absence type record if found, otherwise null.
 */
const getAbsenceTypeByExtId = (extid, allAbsenceTypes) => {
  if (!extid || !allAbsenceTypes) {
    return null;
  }

  return allAbsenceTypes[extid] || null;
};

/**
 * Returns an array of absence type fields.
 * These fields represent details about absence types, such as the external ID, name, policy text, and various configuration options.
 *
 * @returns {string[]} Array of absence type field keys
 */
const getAbsenceTypeFields = () => {
  // Dynamically generate the full field names by combining the prefix with each field key
  return absenceTypeFields.map((field) => `${absenceTypePrefix}${field}`);
};

/**
 * Returns an array of absence fields.
 * These fields represent detailed information about an absence, including the absence type, employee details, duration, status, remarks, and associated files or comments.
 *
 * This function also includes absence type fields by invoking `getAbsenceTypeFields`.
 *
 * @returns {string[]} Array of absence field keys
 */
const getAbsenceFields = () => [
  // Absence ID field
  `${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-id`,
  // Absence type field
  `${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-type`,
  // Employee ID field associated with the absence
  `${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-employeeID`,
  // Employee's known name (from the Resource core)
  `${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-employeeID:Resource-core-name-knownAs`,
  // Start date of the absence
  `${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-start`,
  // End date of the absence
  `${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-end`,
  // Indicates if the absence starts as a half-day
  `${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-startHalfDay`,
  // Indicates if the absence ends as a half-day
  `${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-endHalfDay`,
  // Total planned days for the absence
  `${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-plannedDays`,
  // Date when the absence was submitted
  `${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-submittedOn`,
  // Indicates if the absence is adjustable
  `${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-adjustAbsence`,
  // Daily hours breakdown for the absence
  `${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-hoursByDay`,
  // Additional remarks for the absence
  `${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-remark`,
  // External status of the absence
  `${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-extStatus`,
  // Associated files for the absence
  `${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-files`,
  // Comments associated with the absence
  `${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-comments`,
  // Absence negative field
  "Absence-negative",
  // Include absence type fields from `getAbsenceTypeFields`
  ...getAbsenceTypeFields(),
];

/**
 * Fetches list data by `extID` and returns a map of `entryID` to `entryName`.
 *
 * @param {string} extID - The external ID of the list to fetch.
 * @returns {Promise<Object>} - A Promise resolving to a map of `entryID` to `entryName`.
 */
const fetchListData = async (extID) => {
  if (!extID) {
    console.error("extID is required to fetch list data.");
    return {};
  }

  try {
    const queryFields = {
      fields: ["Lists-extID", "Lists-listName", "Lists-listEntries"],
      where: [
        {
          fieldName: "Lists-extID",
          operator: "=",
          value: extID,
        },
      ],
    };

    const formData = {
      query: JSON.stringify(queryFields),
      testMode: TEST_MODE,
      client: parseInt(APP.LOGIN_USER_CLIENT, 10),
      user: APP.LOGIN_USER_ID,
      userID: APP.LOGIN_USER_ID,
      language: APP.LOGIN_USER_LANGUAGE,
      intStatus: JSON.stringify([INTSTATUS.ACTIVE]),
    };

    // Fetch data from the API
    const response = await fetchData(
      API_ENDPOINTS.QUERY,
      "POST",
      { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      new URLSearchParams(formData).toString()
    );

    if (response.success && Array.isArray(response.data)) {
      const list = response.data[0]; // Assuming a single list is fetched by extID
      const listEntries = list?.["Lists-listEntries"] || [];

      // Create a map of entryID to entryName
      return listEntries.reduce((map, entry) => {
        map[entry.entryID] = entry.entryName;
        return map;
      }, {});
    } else {
      console.error("Unexpected response format for list data.");
      return {};
    }
  } catch (error) {
    console.error("Error fetching list data:", error);
    return {};
  }
};

/**
 * Fetches process template data and maps status labels to step IDs.
 *
 * @param {string} statusTemplateExtId - External ID of the status template.
 * @returns {Promise<Object>} - A Promise resolving to a map of step `extID` to `statusLabel`.
 */
const fetchProcessTemplate = async (statusTemplateExtId) => {
  if (!statusTemplateExtId) {
    return;
  }

  try {
    const queryFields = {
      fields: [
        "ProcessTemplate-id",
        "ProcessTemplate-extID",
        "ProcessTemplate-steps",
      ],
    };

    const whereConditions = [
      {
        fieldName: "ProcessTemplate-extID",
        operator: "=",
        value: statusTemplateExtId,
      },
    ];

    // Fetch process template data
    const response = await fetchBusObjCatData(
      "ProcessTemplate",
      null,
      null,
      queryFields,
      whereConditions,
      []
    );

    let statusLabelAndStepMap = {};

    // Create a map of step extIDs to status labels
    if (!response.error && response.data) {
      statusLabelAndStepMap = createExtIdStatusLabelMap(response.data);
    } else {
      console.error("Error fetching process template data:", response.error);
    }

    return statusLabelAndStepMap;
  } catch (error) {
    console.error("Error fetching process template data:", error);
  }
};

/**
 * Fetches non-working dates from the work calendar based on the provided calendar external ID.
 *
 * @param {string} calendarExtId - The external ID of the work calendar.
 * @returns {Promise<Array>} - A Promise resolving to an array of non-working dates.
 */
const fetchWorkCalendar = async (calendarExtId) => {
  try {
    const queryFields = {
      fields: ["WorkCalendar-extID", "WorkCalendar-nonWorkingDates"],
      where: [
        {
          fieldName: "WorkCalendar-extID",
          operator: "=",
          value: calendarExtId,
        },
      ],
    };

    const formData = {
      query: JSON.stringify(queryFields),
      testMode: TEST_MODE,
      client: parseInt(APP.LOGIN_USER_CLIENT, 10),
      user: APP.LOGIN_USER_ID,
      userID: APP.LOGIN_USER_ID,
      language: APP.LOGIN_USER_LANGUAGE,
      intStatus: JSON.stringify([INTSTATUS.ACTIVE]),
    };

    const response = await fetchData(
      API_ENDPOINTS.QUERY,
      "POST",
      { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      new URLSearchParams(formData).toString()
    );

    if (response.success && Array.isArray(response.data)) {
      const workCalendarData = response.data[0];
      return workCalendarData?.["WorkCalendar-nonWorkingDates"] || [];
    } else {
      console.error("Failed to fetch work calendar:", response);
      return [];
    }
  } catch (error) {
    console.error("Error fetching work calendar:", error);
    return [];
  }
};

/**
 * Fetches and updates absence type details based on the selected absence type.
 *
 * @param {Object} params - The parameters object.
 * @param {string} params.absenceType - The ID of the absence type to update.
 * @param {Object} params.allAbsenceTypes - A map of all available absence types, keyed by their external IDs.
 * @returns {Object} - An object containing updated absence type details.
 */
const handleAbsenceTypeUpdate = ({ absenceType, allAbsenceTypes }) => {
  // Retrieve the absence type record by its ID
  const absenceTypeRecord =
    getAbsenceTypeByExtId(absenceType, allAbsenceTypes) || {};

  // Extract relevant fields from the absence type record, with default values
  const {
    "AbsenceType-extID": absenceTypeExtId = absenceType,
    "AbsenceType-name": absenceTypeName = "",
    "AbsenceType-policyText": absenceTypePolicyText = "",
    "AbsenceType-hourlyLeave": absenceTypeHourlyLeave = false,
    "AbsenceType-displayInHours": absenceTypeDisplayInHours = false,
    "AbsenceType-fixedCalendar": absenceTypeFixedCalendar = "",
    "AbsenceType-allowedInProbation": absenceTypeAllowedInProbation = false,
    "AbsenceType-allowedInTermination": absenceTypeAllowedInTermination = false,
    "AbsenceType-adminAdjustOnly": absenceTypeAdminAdjustOnly = false,
    "AbsenceType-halfDaysNotAllowed": absenceTypeHalfDaysNotAllowed = false,
    "AbsenceType-minRequest": absenceTypeMinRequest = null,
    "AbsenceType-maxRequest": absenceTypeMaxRequest = null,
    "AbsenceType-negativeDays": absenceTypeNegativeDays = 0,
    "AbsenceType-adjustAfterDays": absenceTypeAdjustAfterDays = 0,
    "AbsenceType-gender": absenceTypeGender = "",
  } = absenceTypeRecord;

  console.log("Absence Type Record: ", {
    absenceTypeExtId,
    absenceTypeName,
    absenceTypePolicyText,
    absenceTypeHourlyLeave,
    absenceTypeDisplayInHours,
    absenceTypeFixedCalendar,
    absenceTypeAllowedInProbation,
    absenceTypeAllowedInTermination,
    absenceTypeAdminAdjustOnly,
    absenceTypeHalfDaysNotAllowed,
    absenceTypeMinRequest,
    absenceTypeMaxRequest,
    absenceTypeNegativeDays,
    absenceTypeAdjustAfterDays,
    absenceTypeGender,
  });

  // Construct and return the updated absence type details
  return {
    updatedFields: {
      absenceTypeExtId,
      absenceTypeName,
      absenceTypePolicyText,
      absenceTypeHourlyLeave,
      absenceTypeDisplayInHours,
      absenceTypeFixedCalendar,
      absenceTypeAllowedInProbation,
      absenceTypeAllowedInTermination,
      absenceTypeAdminAdjustOnly,
      absenceTypeHalfDaysNotAllowed,
      absenceTypeMinRequest,
      absenceTypeMaxRequest,
      absenceTypeNegativeDays,
      absenceTypeAdjustAfterDays,
      absenceTypeGender,
    },
  };
};

/**
 * Checks if two date ranges overlap, ignoring time.
 *
 * @param {Date} startDate1 - Start date of the first range.
 * @param {Date} endDate1 - End date of the first range.
 * @param {Date} startDate2 - Start date of the second range.
 * @param {Date} endDate2 - End date of the second range.
 * @param {Function} t - Translation function used to show localized messages.
 * @returns {boolean} - Returns true if the date ranges overlap, otherwise false.
 */
const isAbsencesOverlap = (startDate1, endDate1, startDate2, endDate2, t) => {
  // Convert input to Date objects if they are not already
  const parseDate = (date) =>
    typeof date === "string" ? new Date(date) : date;

  startDate1 = parseDate(startDate1);
  endDate1 = parseDate(endDate1);
  startDate2 = parseDate(startDate2);
  endDate2 = parseDate(endDate2);

  // Validate dates
  if (
    [startDate1, endDate1, startDate2, endDate2].some(
      (date) => !(date instanceof Date) || isNaN(date)
    )
  ) {
    console.error("Invalid date. Expected a valid Date object.");
    return false;
  }

  // Ensure start dates are before or equal to end dates
  if (startDate1 > endDate1 || startDate2 > endDate2) {
    console.error("Start date cannot be after end date.");
    showToast(t("start_date_must_be_less_than_equal_to_end_date"), "error");
    return false;
  }

  // Check for overlap: periods overlap if one does not end before the other starts
  return !(endDate1 < startDate2 || endDate2 < startDate1);
};

/**
 * Checks if leave is allowed during probation or notice period.
 *
 * @param {Object} employee - The employee object containing relevant employee data.
 * @param {boolean} allowedInProbation - Indicates if the absence type is allowed during the probation period.
 * @param {boolean} allowedInNoticePeriod - Indicates if the absence type is allowed during the notice period.
 * @param {Date|string} start - The start of the time-off request.
 * @param {Date|string} end - The end of the time-off request.
 * @param {Function} t - Translation function used to show localized messages.
 * @returns {boolean} - Returns `true` if the time-off request is allowed, otherwise returns `false`.
 */
const isLeaveAllowedInEmploymentPeriod = (
  employeeInfo,
  allowedInProbation,
  allowedInNoticePeriod,
  start,
  end,
  t
) => {
  const { confirmationDate, termDate, noticePeriod } = employeeInfo;

  // Check if absence is allowed during the notice period
  if (
    allowedInNoticePeriod === false &&
    noticePeriod > 0 &&
    termDate &&
    termDate.getTime() >= new Date().getTime()
  ) {
    showToast(t("notice_period_not_allowed"), "error");
    return false;
  }

  // Check if absence is allowed after the termination date
  if (allowedInNoticePeriod === true && start && end && termDate) {
    const isStartDateAfterTermDate =
      termDate.getTime() <= new Date(start).getTime() ||
      datesAreForSameDay(termDate, new Date(start));
    const isEndDateAfterTermDate =
      termDate.getTime() <= new Date(end).getTime() ||
      datesAreForSameDay(termDate, new Date(end));

    if (isStartDateAfterTermDate || isEndDateAfterTermDate) {
      showToast(
        t("after_termination", { terminationDate: termDate.toDateString() }),
        "error"
      );
      return false;
    }
  }

  // Check if absence is allowed during the probation period
  if (
    allowedInProbation === false &&
    confirmationDate &&
    !datesAreForSameDay(confirmationDate, new Date()) &&
    confirmationDate.getTime() >= new Date().getTime()
  ) {
    showToast(t("probation_period_not_allowed"), "error");
    return false;
  }

  return true;
};

/**
 * Checks if a given date is a non-working day (weekend or holiday).
 *
 * @param {Date} date - The date to check.
 * @param {Object} employeeInfo - The employee information containing non-working dates and days.
 * @returns {boolean} - True if the date is a non-working day, otherwise false.
 */
const isNonWorkingDay = (date, employeeInfo) => {
  const { nonWorkingDates = [], nonWorkingDays = [] } = employeeInfo;
  const dayOfWeek = date.getDay();
  const currentDate = date.setHours(0, 0, 0, 0);

  const uniqueNonWorkingDates = new Set(
    nonWorkingDates.map((dateInfo) =>
      new Date(dateInfo.date).setHours(0, 0, 0, 0)
    )
  );

  return (
    nonWorkingDays.includes(dayOfWeek) || uniqueNonWorkingDates.has(currentDate)
  );
};

/**
 * Checks if the hourly time-off request falls on holidays or non-working days.
 *
 * @param {Date|string} startDate - The start date of the time-off request.
 * @param {Date|string} endDate - The end date of the time-off request.
 * @param {Function} t - The translation function for localized messages.
 * @param {Object} employeeInfo - The employee's non-working days (e.g., holidays, weekends).
 * @param {string} [messageType='warning'] - Message type: "warning" or "error".
 * @returns {boolean} - Returns `true` if the time-off request is valid, `false` if it falls on holidays or non-working days.
 */
const isTimeOffOnHoliday = (
  startDate,
  endDate,
  t,
  employeeInfo,
  messageType = "warning"
) => {
  const validDaysCount = calculateValidDaysCount(
    startDate,
    endDate,
    employeeInfo
  );

  if (validDaysCount <= 0) {
    showToast(t("time_off_holiday_error"), messageType);
    return false;
  }
  return true;
};

/**
 * Merges additional data from eligible absence types into the absence types map.
 *
 * @param {Object} absenceTypesMap - The map of absence types.
 * @param {Object} eligibleAbsenceTypes - The map of eligible absence types with additional data.
 * @returns {Array} - An array of merged absence type data.
 */
const mergeAbsenceData = (absenceTypesMap, eligibleAbsenceTypes) => {
  return Object.entries(absenceTypesMap).map(([key, value]) => {
    // Merge additional data from eligibleAbsenceTypes if available
    const eligibleData = eligibleAbsenceTypes[key] || {};
    return [
      key,
      {
        ...value,
        "AbsenceType-projectedNextYear": eligibleData["projectedNextYear"] || 0,
        "AbsenceType-negativeDays":
          eligibleData["negativeDays"] || value["negativeDays"] || 0,
      },
    ];
  });
};

/**
 * Updates the start and end day fractions based on the parsed duration.
 *
 * This function ensures correct handling of full-day, partial-day, and multi-day absences.
 * It correctly assigns the `absenceStartDayFraction` and `absenceEndDayFraction` based on:
 *  - Whether half-days are allowed
 *  - The duration of the absence
 *  - The minimum selectable fraction
 *  - Ensuring the duration is a valid multiple of `minFraction`
 *
 * @param {string|number} duration - The calculated absence duration (string or number).
 * @param {number} minFraction - The smallest available fraction for a day (e.g., 0.5 or 0.25).
 * @param {boolean} halfDaysNotAllowed - Indicates whether half-day absences are restricted.
 * @param {Function} setStartFraction - State setter for the start day fraction.
 * @param {Function} setEndFraction - State setter for the end day fraction.
 * @param {Function} handleFieldChange - Callback to update absence-related fields in the state.
 */
const updateDayFractionsBasedOnDuration = (
  duration,
  minFraction,
  halfDaysNotAllowed,
  setStartFraction,
  setEndFraction,
  handleFieldChange
) => {
  // Ensure duration is parsed as a number
  const parsedDuration = parseFloat(duration);

  // Check for invalid duration: NaN, empty, zero, negative, or not a multiple of minFraction
  if (
    isNaN(parsedDuration) ||
    parsedDuration <= 0 ||
    parsedDuration % minFraction !== 0
  ) {
    setStartFraction("1"); // Default to full day
    setEndFraction(null); // No end fraction
    handleFieldChange({
      absenceStartDayFraction: "1",
      absenceEndDayFraction: null,
    });
    return;
  }

  let newStartFraction = "1"; // Default: Full start day
  let newEndFraction = null; // Default: No end fraction

  // Case 1: Full-day absence or half-days not allowed
  if (halfDaysNotAllowed || parsedDuration === 1) {
    newStartFraction = "1";
    newEndFraction = null;
  }
  // Case 2: Multi-day absence (greater than 1 day)
  else if (parsedDuration > 1) {
    newStartFraction = "1";
    // If duration is a whole number, end fraction remains "1"
    // Otherwise, it should take the minimum fraction
    newEndFraction = parsedDuration % 1 === 0 ? "1" : minFraction.toString();
  }
  // Case 3: Partial-day absence (less than 1 day)
  else {
    newStartFraction = parsedDuration.toString(); // Assign the valid duration fraction
    newEndFraction = null; // No end fraction needed
  }

  // Update state values
  setStartFraction(newStartFraction);
  setEndFraction(newEndFraction);

  // Notify parent component about the changes
  handleFieldChange({
    absenceStartDayFraction: newStartFraction,
    absenceEndDayFraction: newEndFraction,
  });
};

/**
 * Helper function to update a field in state if the value has changed.
 * This function compares the new value with the current value of the field.
 * If they are different, it updates the state and records the change.
 *
 * @param {Object} values - The new values to compare and update.
 * @param {string} fieldName - The field name to update.
 * @param {any} newValue - The new value for the field.
 * @param {Function} setState - The state setter function to update the field.
 * @param {Object} changes - The object where updated values are stored.
 * @param {string} changeKey - The key used to store updated values.
 */
const updateFieldInState = (
  values,
  fieldName,
  newValue,
  setState,
  changes,
  changeKey
) => {
  if (
    values[fieldName] !== undefined &&
    !isEqual(values[fieldName], newValue)
  ) {
    setState(values[fieldName]);
    changes[changeKey] = values[fieldName];
  }
};

/**
 * Updates KPI balances based on the absence request details.
 * This function makes two API calls:
 * 1. To retrieve the current KPI balances.
 * 2. To retrieve the projected KPI balances as of the year's end.
 *
 * @param {Object} absenceDetails - Details about the absence request.
 * @param {string} absenceDetails.absenceType - The type of absence requested.
 * @param {string} absenceDetails.absenceEmployeeId - The ID of the employee requesting the absence.
 * @param {string} [absenceDetails.absenceEnd] - The end date of the absence.
 * @param {number} [absenceDetails.absenceDuration] - The duration of the absence in days.
 * @param {Function} updateKPIs - Callback function to update KPI values in the UI.
 * @param {Function} setIsKPIUpdating - Callback function to set the loading state.
 *
 *   This function is called with an object containing the following properties:
 *   - balance: The current balance of absence days.
 *   - balanceAfter: The projected balance after considering the absence.
 *   - projectedBalance: The projected balance as of the year's end.
 *   - projectedCarryForward: The projected carry-forward days at year's end.
 */
const updateKPIBalances = async (
  absenceDetails,
  updateKPIs,
  setIsKPIUpdating
) => {
  if (
    !absenceDetails ||
    !absenceDetails.absenceType ||
    !absenceDetails.absenceEmployeeId
  ) {
    console.error("Invalid absence details provided to updateKPIBalances.");
    return;
  }

  const { absenceType, absenceEmployeeId, absenceEnd, absenceDuration } =
    absenceDetails;

  try {
    setIsKPIUpdating(true);

    const normalizedDate = normalizeDateToUTC(new Date());
    const balanceCheckOnDate = sprintf(
      "%d-%02d-%02dT%02d:%02d:%02d-0000",
      normalizedDate.getUTCFullYear(),
      normalizedDate.getUTCMonth() + 1,
      normalizedDate.getUTCDate(),
      normalizedDate.getUTCHours(),
      normalizedDate.getUTCMinutes(),
      normalizedDate.getUTCSeconds()
    );

    // Prepare the request payload for current balance
    const requestBody = {
      interfaceName: "AbsenceTypeBalanceReadApi",
      methodName: "readAbsenceTypeBalances",
      paramsMap: {
        employeeId: absenceEmployeeId,
        userId: APP.LOGIN_USER_ID,
        hrDivisionId: null,
        readDate: null,
        languageId: APP.LOGIN_USER_LANGUAGE,
        clientId: APP.LOGIN_USER_CLIENT,
        hideZeroBalances: false,
        balanceCheckOnDate,
        absenceTypeExtId: absenceType,
        checkBalances: true,
        absenceDuration,
        employee: null,
      },
    };

    // First API call for current balance
    const response = await fetchData(
      API_ENDPOINTS.INVOKE,
      "POST",
      { "Content-Type": "application/json" },
      JSON.stringify(requestBody)
    );

    let balance = "-",
      balanceAfter = "-";

    if (response.success && response.retVal && response.retVal.data) {
      balance = response.retVal.data[0]?.projectedNextYear || 0;
      balanceAfter = balance - absenceDuration;
    }

    // Correct the balanceCheckOnDate for the projected balance request
    const endOfYearDate = sprintf(
      "%d-12-31T00:00:00-0000",
      new Date().getFullYear()
    );

    // Prepare the request payload for projected balance at year's end
    const projectedBalanceRequest = {
      ...requestBody,
      paramsMap: {
        ...requestBody.paramsMap,
        balanceCheckOnDate: endOfYearDate,
        absenceDuration: 0,
      },
    };

    // Second API call for projected balance
    const projectedResponse = await fetchData(
      API_ENDPOINTS.INVOKE,
      "POST",
      { "Content-Type": "application/json" },
      JSON.stringify(projectedBalanceRequest)
    );

    let projectedBalance = "-",
      projectedCarryForward = "-";

    if (
      projectedResponse.success &&
      projectedResponse.retVal &&
      projectedResponse.retVal.data
    ) {
      projectedBalance =
        projectedResponse.retVal.data[0]?.projectedNextYear || "-";
      projectedCarryForward = Math.min(
        projectedResponse.retVal.data[0]?.projectedNextYear || 0,
        projectedResponse.retVal.data[0]?.maxCarryForwards || 0
      );
    }

    // Update the UI with the fetched KPI data
    updateKPIs({
      balanceBefore: balance,
      balanceAfter,
      projectedBalance,
      projectedCarryForward,
    });
  } catch (error) {
    console.error("Error fetching KPI balances", error);
    // Fallback UI update in case of errors
    updateKPIs({
      balanceBefore: "-",
      balanceAfter: "-",
      projectedBalance: "-",
      projectedCarryForward: "-",
    });
  } finally {
    setIsKPIUpdating(false);
  }
};

/**
 * Validates absence adjustments based on various constraints.
 *
 * @param {number} absencePlannedDays - Number of planned days for the absence adjustment.
 * @param {number} negativeDays - Maximum allowable negative days.
 * @param {number} projectedNextYear - Available absence days projected for the next year.
 * @param {string} absenceTypeName - Name of the absence type for error messages.
 * @param {Function} t - Translation function for localized messages.
 * @returns {boolean} - Returns true if the absence adjustment is valid, otherwise false.
 */
const validateAbsenceOnSaveWithAdjustment = (
  absencePlannedDays,
  negativeDays,
  projectedNextYear,
  absenceTypeName,
  t
) => {
  if (!absencePlannedDays) {
    showToast(t("please_input_number_of_days_to_be_adjusted"), "error");
    return false;
  }

  let errorMessage = "";

  const remainingBalance = projectedNextYear - absencePlannedDays;

  if (negativeDays > 0) {
    if (remainingBalance < 0 && Math.abs(remainingBalance) > negativeDays) {
      errorMessage = `${t("only")} ${Math.abs(
        projectedNextYear + negativeDays
      )} ${t("days_of")} ${absenceTypeName} ${t("could_be_deducted")}`;
    }
  } else {
    if (remainingBalance < 0) {
      errorMessage = `${t("only")} ${Math.abs(projectedNextYear)} ${t(
        "days_of"
      )} ${absenceTypeName} ${t("could_be_deducted")}`;
    }
  }

  if (errorMessage) {
    showToast(errorMessage, "error");
    return false;
  }

  return true;
};

/**
 * Validates the duration of absence based on various conditions, ensuring it meets the necessary requirements.
 *
 * @param {number} value - The entered duration value to be validated.
 * @param {number} minValue - The minimum allowed value for the duration.
 * @param {number|null} maxValue - The maximum allowed value for the duration.
 * @param {boolean} halfDaysNotAllowed - Flag to indicate if half days are not allowed for the duration.
 * @param {boolean} isHourlyAbsence - Flag indicating whether the absence is measured in hours.
 * @param {boolean} isDisplayInHours - Flag indicating if the duration is displayed in hours.
 * @param {number} hoursPerDay - The number of work hours in a day.
 * @param {function} t - Translation function used to fetch localized strings for error messages.
 * @param {number} minFraction - The minimum fraction value for the duration.
 * @param {boolean} checkInvalidDuration - Flag indicating whether to check for invalid duration values.
 * @returns {boolean} - Returns `false` if validation fails (duration is not in acceptable multiples), otherwise `true`.
 */
const validateDuration = (
  value,
  minValue,
  maxValue,
  halfDaysNotAllowed,
  isHourlyAbsence,
  isDisplayInHours,
  hoursPerDay = 8,
  t,
  minFraction,
  checkInvalidDuration
) => {
  console.log("Validating duration:", {
    value,
    minValue,
    maxValue,
    halfDaysNotAllowed,
    isHourlyAbsence,
    isDisplayInHours,
    hoursPerDay,
    minFraction,
    checkInvalidDuration,
  });

  if (checkInvalidDuration && isNaN(parseFloat(value))) {
    showToast(
      t("invalid_duration_value", {
        value: value || "0",
      }),
      "error"
    );
    return false;
  }

  // Ensure the duration is greater than zero
  if (checkInvalidDuration && parseFloat(value) <= 0) {
    showToast(t("duration_must_be_positive"), "error");
    return false;
  }

  // Ensure the duration meets the minimum requirement
  if (minValue && parseFloat(value) < minValue) {
    showToast(t("duration_min_value", { minValue }), "error");
    return false;
  }

  // Ensure the duration does not exceed the maximum requirement
  if (maxValue && parseFloat(value) > maxValue) {
    showToast(t("duration_max_value", { maxValue }), "error");
    return false;
  }

  // Check if half days are not allowed
  if (halfDaysNotAllowed && value % 1 !== 0) {
    showToast(t("fraction_not_allowed_error"), "error");
    return false;
  }

  // Check for invalid durations when not using hourly absence or displaying duration in hours
  if (
    minValue < 1 &&
    !isHourlyAbsence &&
    !isDisplayInHours &&
    (hoursPerDay / minValue) % 1 === 0 &&
    value % minFraction !== 0
  ) {
    showToast(t("duration_multiple_error", { minFraction }), "error");
    console.log("Duration is not a multiple of the minimum value.");
    return false;
  }

  return true;
};

/**
 * Validates the status change based on the process template.
 * @param {Object} processTemplate - The process template containing steps.
 * @param {Object} currentStatus - The current status of the absence.
 * @param {number} maxCancellationDays - The configured number of days after which leave adjustment is restricted.
 * @param {Date} endDate - The end date of the absence.
 * @param {function} t - The translation function from `useTranslation()`
 * @returns {boolean} - Returns true if the status change is valid, otherwise false.
 */
const validateStatusChange = (
  processTemplate,
  currentStatus,
  maxCancellationDays,
  endDate,
  t
) => {
  if (!processTemplate || !currentStatus) {
    return true;
  }

  const steps = processTemplate["ProcessTemplate-steps"];
  if (!steps || !Array.isArray(steps)) {
    return true;
  }

  const submissionCancelledStepIds = steps
    .filter((step) => step.eventID === "SUBMISSIONCANCELLEDAPI")
    .map((step) => step.extID);

  if (submissionCancelledStepIds.length === 0) {
    return true;
  }

  // Validate if the current status is one of the cancellation steps
  if (submissionCancelledStepIds.includes(currentStatus.statusID)) {
    return canCancelLeave(maxCancellationDays, endDate, t);
  }

  return true;
};

export {
  booleanMap,
  calculateDuration,
  calculateEndDate,
  calculateValidDaysCount,
  canCancelLeave,
  fetchAbsenceTypes,
  fetchEmployeeAbsences,
  fetchEligibleAbsenceTypes,
  fetchListData,
  fetchProcessTemplate,
  fetchWorkCalendar,
  formatLeaveDuration,
  getAbsenceMilliseconds,
  getAbsenceFields,
  getAbsenceTypeFields,
  handleAbsenceTypeUpdate,
  isAbsencesOverlap,
  isLeaveAllowedInEmploymentPeriod,
  isNonWorkingDay,
  isTimeOffOnHoliday,
  mergeAbsenceData,
  updateDayFractionsBasedOnDuration,
  updateFieldInState,
  updateKPIBalances,
  validateAbsenceOnSaveWithAdjustment,
  validateDuration,
  validateStatusChange,
};
