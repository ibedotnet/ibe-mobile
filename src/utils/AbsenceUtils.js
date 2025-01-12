import {
  API_ENDPOINTS,
  APP,
  BUSOBJCAT,
  BUSOBJCATMAP,
  INTSTATUS,
  TEST_MODE,
} from "../constants";
import { fetchBusObjCatData, fetchData } from "./APIUtils";
import { normalizeDateToUTC } from "./FormatUtils";
import { showToast } from "./MessageUtils";

/**
 * Adjusts the duration of an absence request based on day fractions and holidays.
 *
 * @param {number} duration - The initial duration of the absence in days.
 * @param {number} startDayFraction - The fraction of the start day.
 * @param {number} endDayFraction - The fraction of the end day.
 * @param {Date|string} startDate - The start date of the absence request.
 * @param {Date|string} endDate - The end date of the absence request.
 * @param {Object} employeeInfo - The employee information containing non-working dates and days.
 * @param {Function} t - Translation function used to show localized messages.
 * @returns {number} - The adjusted duration considering day fractions and holidays.
 */
const adjustDurationForDayFractionsAndHolidays = (
  duration,
  startDayFraction,
  endDayFraction,
  startDate,
  endDate,
  employeeInfo,
  t
) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNotHoliday(start, employeeInfo)) {
    duration = duration - 1 + startDayFraction;
  } else {
    showToast(t("time_off_holiday_warning"), "warning");
  }

  if (start.toDateString() !== end.toDateString()) {
    if (isNotHoliday(end, employeeInfo)) {
      duration = duration - 1 + endDayFraction;
    } else {
      showToast(t("time_off_holiday_warning"), "warning");
    }
  }

  return duration;
};

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
 * Calculates the actual number of valid days between two dates, excluding non-working days such as holidays and weekends.
 *
 * @param {Date|string} startDate - The start date of the absence request.
 * @param {Date|string} endDate - The end date of the absence request.
 * @param {Object} employeeInfo - The employee information containing non-working dates and days.
 * @returns {number} - The number of valid days between the start and end dates, excluding non-working days.
 */
const calculateValidDaysBetweenDates = (startDate, endDate, employeeInfo) => {
  if (!startDate || !endDate) {
    return 0;
  }

  const start = new Date(startDate.toString());
  const end = new Date(endDate.toString());
  const { nonWorkingDates, nonWorkingDays } = employeeInfo;
  let validDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

  if (nonWorkingDays && nonWorkingDays.length > 0) {
    let tempDate = start;
    const uniqueNonWorkingDates = new Set();

    while (tempDate < end) {
      if (nonWorkingDays.includes(tempDate.getDay())) {
        validDays++;
        end.setDate(end.getDate() + 1);
      }

      if (nonWorkingDates && nonWorkingDates.length > 0) {
        for (const dateInfo of nonWorkingDates) {
          const nonWorkingDate = new Date(dateInfo.date.toString());
          if (nonWorkingDays.includes(nonWorkingDate.getDay())) {
            continue;
          }
          if (nonWorkingDate >= start && nonWorkingDate <= tempDate) {
            if (!uniqueNonWorkingDates.has(nonWorkingDate.getTime())) {
              uniqueNonWorkingDates.add(nonWorkingDate.getTime());
              validDays++;
              end.setDate(end.getDate() + 1);
            }
          }
        }
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }
  }

  return Math.max(0, Math.floor(validDays));
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
  "AbsenceType-isFixedCalendar",
];

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
 * Fetches existing absences for the given employee within the specified date range.
 *
 * @param {string} employeeID - The ID of the employee.
 * @param {Date|string} startDate - The start date of the absence request.
 * @param {Date|string} endDate - The end date of the absence request.
 * @returns {Promise<Array>} - A Promise resolving to an array of existing absence records.
 */
const fetchExistingAbsences = async (employeeID, startDate, endDate) => {
  try {
    const queryFields = {
      fields: [
        "Absence-start",
        "Absence-end",
        "Absence-employeeID",
        "Absence-startHalfDay",
        "Absence-endHalfDay",
        "Absence-duration",
        "Absence-plannedDays",
        "Absence-adjustAbsence",
        "Absence-redemption",
      ],
      where: [
        {
          fieldName: "Absence-employeeID",
          operator: "=",
          value: employeeID,
        },
        {
          fieldName: "Absence-start",
          operator: "<=",
          value: new Date(endDate).toISOString(),
        },
        {
          fieldName: "Absence-end",
          operator: ">=",
          value: new Date(startDate).toISOString(),
        },
        {
          fieldName: "Absence-intStatus",
          operator: "nin",
          value: [3],
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

    // Fetch existing absences from the API
    const response = await fetchData(
      API_ENDPOINTS.QUERY,
      "POST",
      { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      new URLSearchParams(formData).toString()
    );

    if (response.success && Array.isArray(response.data)) {
      return response.data;
    } else {
      console.error("Unexpected response format for existing absences.");
      return [];
    }
  } catch (error) {
    console.error("Error in fetching existing absences:", error);
    return [];
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
 * Calculates the adjusted duration of an absence request, considering holidays and weekends.
 *
 * @param {Date|string} startDate - The start date of the absence request.
 * @param {number} duration - The initial duration of the absence in days.
 * @param {Object} employeeInfo - The employee information containing non-working dates and days.
 * @returns {number} - The adjusted duration including holidays and weekends.
 */
const getAdjustedDuration = (startDate, duration, employeeInfo) => {
  if (!startDate) {
    return 0;
  }

  const startDateObj = new Date(startDate.toString());
  const endDateObj = new Date(startDateObj);
  endDateObj.setDate(startDateObj.getDate() + Math.ceil(duration));

  let adjustedDuration = calculateValidDaysBetweenDates(
    startDateObj,
    endDateObj,
    employeeInfo
  );

  if (adjustedDuration >= 1) {
    adjustedDuration -= 1;
  } else {
    adjustedDuration = 0;
  }

  return adjustedDuration;
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
 * Updates the absence type details based on the given absence type and related information.
 *
 * @param {Object} params - The parameters object.
 * @param {string} params.absenceType - The ID or identifier of the absence type to be updated.
 * @param {Array} params.allAbsenceTypes - A list of all available absence types.
 * @returns {Object} - The updated absence type fields.
 *    - updatedFields: Contains the updated values for absence fields like policy text, start/end date, duration, etc.
 */
const handleAbsenceTypeUpdate = ({ absenceType, allAbsenceTypes }) => {
  // Retrieve the absence type record based on the external ID (absenceType)
  const absenceTypeRecord =
    getAbsenceTypeByExtId(absenceType, allAbsenceTypes) || {};

  // Destructure the relevant fields from the absenceTypeRecord with default values
  const {
    "AbsenceType-extID": extID = absenceType,
    "AbsenceType-name": name = "",
    "AbsenceType-policyText": policyText = "",
    "AbsenceType-hourlyLeave": hourlyLeave = false,
    "AbsenceType-displayInHours": displayInHours = false,
    "AbsenceType-isFixedCalendar": isFixedCalendar = false,
  } = absenceTypeRecord;

  console.log("Absence Type Record: ", {
    extID,
    name,
    policyText,
    hourlyLeave,
    displayInHours,
    isFixedCalendar,
  });

  // Construct the updated fields object
  const updatedFields = {
    localAbsenceStart: new Date(),
    localAbsenceEnd: new Date(),
    localAbsenceStartHalfDay: "1",
    localAbsenceEndHalfDay: null,
    localDuration: "1",
    absenceTypeExtId: extID,
    absenceTypeName: name,
    absenceTypePolicyText: policyText,
    absenceTypeHourlyLeave: hourlyLeave,
    absenceTypeDisplayInHours: displayInHours,
    absenceTypeIsFixedCalendar: isFixedCalendar,
  };

  // Return the updated fields
  return { updatedFields };
};

/**
 * Checks if leave cancellation is allowed based on the configured number of days (adjustAfterDays).
 * The cancellation is not allowed if the end date is more than `adjustAfterDays` days ago.
 *
 * @param {number} adjustAfterDays - The number of days after which leave cancellation is not allowed.
 * @param {Date|string} endDate - The end date of the absence request, used to calculate the cancellation window.
 * @param {Function} t - Translation function used to show localized messages.
 * @returns {boolean} - Returns `true` if leave cancellation is allowed, otherwise `false`.
 *  - If no end date is provided, it returns `true` by default.
 *  - If the cancellation period has passed, it returns `false` and shows an error message.
 *  - If the cancellation period is within the allowed window, it returns `true`.
 */
const isLeaveCancellationAllowed = (adjustAfterDays, endDate, t) => {
  // If no endDate is provided, assume cancellation is allowed (return true)
  if (!endDate) {
    return true;
  }

  // Normalize the current date and the endDate to UTC format
  const todayInUTC = normalizeDateToUTC(new Date()); // Current date normalized to UTC
  const endDateInUTC = normalizeDateToUTC(new Date(endDate)); // End date normalized to UTC

  // Calculate the difference in time (in milliseconds) and check if it exceeds the allowed cancellation period
  if (
    todayInUTC.getTime() - endDateInUTC.getTime() >
    adjustAfterDays * 24 * 60 * 60 * 1000 // Convert adjustAfterDays to milliseconds for comparison
  ) {
    // If the cancellation period has passed, show an error message and return false
    showToast(t("leave_cancellation_not_allowed", adjustAfterDays), "error");
    console.log(
      "Leave cancellation is not allowed after " + adjustAfterDays + " days."
    );
    return false;
  }

  return true; // Cancellation is within the allowed period
};

/**
 * Checks whether the given date is a holiday.
 *
 * @param {Date|string} date - The date to check.
 * @param {Object} employeeInfo - The employee information containing non-working dates and days.
 * @returns {boolean} - Returns `true` if the date is not a holiday, otherwise `false`.
 */
const isNotHoliday = (date, employeeInfo) => {
  const validDays = calculateValidDaysBetweenDates(date, date, employeeInfo);
  return validDays !== 0;
};

/**
 * Validates whether a time-off request is allowed based on the employee's probation and notice period status.
 *
 * @param {Object} employeeInfo - The employee object containing relevant employee data.
 * @param {string} absenceTypeName - The name of the absence type (e.g., "Casual Leave", "Sick Leave").
 * @param {boolean} isAllowedInProbation - Indicates if the absence type is allowed during the probation period.
 * @param {boolean} isAllowedInNoticePeriod - Indicates if the absence type is allowed during the notice period.
 * @param {Date|string} startDate - The start date of the time-off request.
 * @param {Date|string} endDate - The end date of the time-off request.
 * @param {Function} t - The translation function for localized messages.
 * @returns {boolean} - Returns `true` if the time-off request is allowed, otherwise `false`.
 */
const isTimeOffAllowedDuringProbationOrNoticePeriod = (
  employeeInfo,
  absenceTypeName,
  isAllowedInProbation,
  isAllowedInNoticePeriod,
  startDate,
  endDate,
  t
) => {
  // Helper function to check if two dates fall on the same calendar day
  const isSameDay = (date1, date2) =>
    date1.toDateString() === date2.toDateString();

  const currentDate = new Date();
  const { confirmationDate, termDate, noticePeriod } = employeeInfo;

  // Check if absence is disallowed during notice period
  if (
    !isAllowedInNoticePeriod &&
    noticePeriod &&
    noticePeriod > 0 &&
    termDate &&
    termDate.getTime() >= currentDate.getTime()
  ) {
    showToast(t("notice_period_not_allowed", { absenceTypeName }), "error");
    console.log(
      absenceTypeName +
        ": Time-off cannot be requested during the notice period."
    );
    return false;
  }

  // Check if time-off is requested after the termination date
  if (
    isAllowedInNoticePeriod &&
    startDate &&
    endDate &&
    termDate &&
    (isSameDay(termDate, startDate) ||
      termDate.getTime() <= new Date(startDate).getTime() ||
      isSameDay(termDate, endDate) ||
      termDate.getTime() <= new Date(endDate).getTime())
  ) {
    showToast(
      t("after_termination", {
        termDate: termDate.toDateString(),
      }),
      "error"
    );
    console.log(
      "Time-off cannot be requested after the termination date " +
        termDate +
        "."
    );
    return false;
  }

  // Check if absence is disallowed during probation period
  if (
    !isAllowedInProbation &&
    confirmationDate &&
    !isSameDay(confirmationDate, currentDate) &&
    confirmationDate.getTime() >= currentDate.getTime()
  ) {
    showToast(t("probation_period_not_allowed", { absenceTypeName }), "error");
    console.log(
      absenceTypeName +
        ": Time-off cannot be requested during the probation period."
    );
    return false;
  }

  return true;
};

/**
 * Validates the absence dates to ensure there are no conflicts with existing absences.
 *
 * @param {Date|string} startDate - The start date of the absence.
 * @param {Date|string} endDate - The end date of the absence.
 * @param {number} startDayFraction - The fraction of the start day.
 * @param {number} endDayFraction - The fraction of the end day.
 * @param {string} employeeID - The ID of the employee.
 * @param {Object} t - Translation function used to show localized messages.
 * @returns {Promise<boolean>} - Returns `true` if validation passes, otherwise `false`.
 */
const validateAbsenceDates = async (
  startDate,
  endDate,
  startDayFraction,
  endDayFraction,
  employeeID,
  t
) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start.getTime() > end.getTime()) {
    showToast(t("start_date_must_be_less_than_end_date"), "error");
    console.log("Start date must be less than end date.");
    return false;
  }

  const existingAbsences = await fetchExistingAbsences(
    employeeID,
    startDate,
    endDate
  );

  let totalOfStartFractionDays = 0;
  let totalOfEndFractionDays = 0;

  for (const record of existingAbsences) {
    if (
      record.start &&
      record.end &&
      record.employeeID === employeeID &&
      record.adjustAbsence !== true &&
      record.redemption !== true &&
      record.duration > 0 &&
      record.plannedDays > 0
    ) {
      const recordStart = new Date(record.start);
      const recordEnd = new Date(record.end);

      if (
        (start >= recordStart && start <= recordEnd) ||
        (end >= recordStart && end <= recordEnd) ||
        (recordStart >= start && recordStart <= end) ||
        (recordEnd >= start && recordEnd <= end)
      ) {
        if (
          (start.toDateString() === recordStart.toDateString() &&
            end.getTime() === start.getTime()) ||
          start.toDateString() === recordEnd.toDateString() ||
          end.toDateString() === recordStart.toDateString() ||
          (end.toDateString() === recordEnd.toDateString() &&
            end.getTime() === start.getTime())
        ) {
          if (start.toDateString() === recordStart.toDateString()) {
            totalOfStartFractionDays += parseFloat(record.startHalfDay) || 1;
          } else if (start.toDateString() === recordEnd.toDateString()) {
            totalOfStartFractionDays += parseFloat(record.endHalfDay) || 1;
          }

          let absenceExists = false;
          if (
            end.toDateString() === recordStart.toDateString() &&
            parseFloat(endDayFraction) + parseFloat(record.startHalfDay) >= 1
          ) {
            absenceExists = true;
          }
          if (end.toDateString() === recordEnd.toDateString()) {
            totalOfEndFractionDays += parseFloat(record.endHalfDay) || 0;
          } else if (end.toDateString() === recordStart.toDateString()) {
            totalOfEndFractionDays += parseFloat(record.startHalfDay) || 0;
          }
          if (
            totalOfStartFractionDays + parseFloat(startDayFraction) > 1 ||
            totalOfEndFractionDays + parseFloat(endDayFraction) > 1 ||
            absenceExists === true
          ) {
            if (recordStart.toDateString() === recordEnd.toDateString()) {
              showToast(
                t("absence_exists_for_date", {
                  date: recordStart.toDateString(),
                }),
                "error"
              );
              console.log(
                `There is already Time Off Request for ${recordStart.toDateString()}.`
              );
            } else {
              showToast(
                t("absence_exists_for_period", {
                  start: recordStart.toDateString(),
                  end: recordEnd.toDateString(),
                }),
                "error"
              );
              console.log(
                `There is already Time Off Request from ${recordStart.toDateString()} to ${recordEnd.toDateString()}, which overlaps with current Time Off Request.`
              );
            }
            return false;
          }
        } else {
          if (recordStart.toDateString() === recordEnd.toDateString()) {
            showToast(
              t("absence_exists_for_date", {
                date: recordStart.toDateString(),
              }),
              "error"
            );
            console.log(
              `There is already Time Off Request for ${recordStart.toDateString()}.`
            );
          } else {
            showToast(
              t("absence_exists_for_period", {
                start: recordStart.toDateString(),
                end: recordEnd.toDateString(),
              }),
              "error"
            );
            console.log(
              `There is already Time Off Request from ${recordStart.toDateString()} to ${recordEnd.toDateString()}, which overlaps with current Time Off Request.`
            );
          }
          return false;
        }
      }
    }
  }

  return true;
};

/**
 * Validates the duration of absence based on various conditions, ensuring it meets the necessary requirements.
 *
 * @param {number} val - The entered duration value to be validated.
 * @param {number} minValue - The minimum allowed value for the duration.
 * @param {boolean} allowDecimals - Flag to indicate if decimals are allowed for the duration.
 * @param {boolean} isHourlyAbsence - Flag indicating whether the absence is measured in hours.
 * @param {boolean} isDisplayInHours - Flag indicating if the duration is displayed in hours.
 * @param {function} t - Translation function used to fetch localized strings for error messages.
 * @returns {boolean} - Returns `false` if validation fails (duration is not in acceptable multiples), otherwise `true`.
 *
 * The function ensures that the entered duration is a multiple of `minValue` when decimals are allowed,
 * and that it's valid for daily absence (i.e., non-hourly or non-hourly display absence).
 * If the validation fails, it shows a toast error message.
 */
const validateDuration = (
  value,
  minValue,
  allowDecimals,
  isHourlyAbsence,
  isDisplayInHours,
  t
) => {
  console.debug("Validating duration:", {
    value,
    minValue,
    allowDecimals,
    isHourlyAbsence,
    isDisplayInHours,
  });
  // Check for invalid durations when not using hourly absence or displaying duration in hours
  if (
    minValue < 1 && // minValue must be less than 1
    allowDecimals && // Decimals are allowed
    !isHourlyAbsence && // Absence is not in hours
    !isDisplayInHours && // Duration is not displayed in hours
    8 % minValue === 0 && // Ensure minValue is a multiple of 8
    value % minValue !== 0 // Ensure val is a valid multiple of minValue
  ) {
    // Show error message via toast
    showToast(t("duration_multiple_error"), "error");
    console.log("Duration is not a multiple of the minimum value.");
    return false;
  }

  return true;
};

/**
 * Validates that hourly leaves are not booked on holidays.
 *
 * @param {Date|string} startDate - The start date of the leave.
 * @param {Date|string} endDate - The end date of the leave.
 * @param {Object} employeeInfo - The employee information containing non-working dates and days.
 * @param {Function} t - Translation function used to show localized messages.
 * @returns {boolean} - Returns `true` if the leave is valid, otherwise `false`.
 */
const validateHourlyLeavesNotOnHoliday = (
  startDate,
  endDate,
  employeeInfo,
  t
) => {
  const workingDays = calculateValidDaysBetweenDates(
    startDate,
    endDate,
    employeeInfo
  );
  if (workingDays <= 0) {
    showToast(t("time_off_holiday_warning"), "warning");
    console.warn("Time Off starts/finishes on a holiday.");
    return false;
  }
  return true;
};

export {
  adjustDurationForDayFractionsAndHolidays,
  booleanMap,
  calculateValidDaysBetweenDates,
  fetchAbsenceTypes,
  fetchExistingAbsences,
  fetchListData,
  fetchProcessTemplate,
  formatLeaveDuration,
  getAbsenceMilliseconds,
  getAbsenceFields,
  getAbsenceTypeFields,
  getAdjustedDuration,
  handleAbsenceTypeUpdate,
  isLeaveCancellationAllowed,
  isNotHoliday,
  isTimeOffAllowedDuringProbationOrNoticePeriod,
  validateAbsenceDates,
  validateDuration,
  validateHourlyLeavesNotOnHoliday,
};
