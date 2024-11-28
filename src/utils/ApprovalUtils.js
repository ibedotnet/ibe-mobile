import { formatDistanceToNow } from "date-fns";

import { API_ENDPOINTS, APP, INTSTATUS, TEST_MODE } from "../constants";
import { fetchData } from "./APIUtils";
import { showToast } from "./MessageUtils";

/**
 * Filters the message log data based on the provided filters.
 *
 * @param {Array<Object>} data - The array of message log data to filter.
 * @param {Object} filters - The object containing filter criteria.
 * @param {string} [filters.documentCategory] - The document category to filter by (optional).
 * @param {string} [filters.messageType] - The message type to filter by (optional).
 *
 * @returns {Array<Object>} The filtered array of message log data.
 *
 */
const applyLocalFilters = (data, filters) => {
  return data.filter((item) => {
    // Check if the document category matches the filter (or match all if no filter applied)
    const matchCategory = filters.documentCategory
      ? item.busObjCat === filters.documentCategory
      : true;

    // Check if the message type matches the filter (or match all if no filter applied)
    const matchMessageType = filters.messageType
      ? item.type === filters.messageType
      : true;

    // Return true if both conditions are met
    return matchCategory && matchMessageType;
  });
};

/**
 * Map to define which screen should be navigated to for specific categories.
 * Keys represent the business object category, and values specify the corresponding detail screen.
 */
const componentMap = {
  TimeConfirmation: "TimesheetDetail", // Navigate to TimesheetDetail for TimeConfirmation
  Expense: "ExpenseDetail", // Navigate to ExpenseDetail for Expense category
  Absence: "AbsenceDetail", // Navigate to AbsenceDetail for Absence category
};

/**
 * Map to define the parameters required when navigating to detail screens for different categories.
 * Keys represent the business object category, and values define the required parameters for each category.
 */
const detailScreenParamsMap = {
  TimeConfirmation: {
    documentId: "timesheetId", // Parameter: timesheet ID for TimeConfirmation
    statusTemplateExtId: "statusTemplateExtId", // Parameter: status template external ID
  },
  Expense: {
    documentId: "expenseId", // Parameter: expense ID for Expense category
    statusTemplateExtId: "statusTemplateExtId", // Parameter: status template external ID
  },
  Absence: {
    documentId: "absenceId", // Parameter: absence ID for Absence category
    statusTemplateExtId: "statusTemplateExtId", // Parameter: status template external ID
  },
};

/**
 * Fetches data from the API based on a given category and maps `extID` to `name:text`.
 *
 * @param {string} category - The category to query (e.g., "MessageType" or "BusObjCat").
 * @returns {Promise<Object>} - A Promise resolving to a map with `extID` as the key and `name:text` as the value.
 */
const fetchCategoryData = async (category) => {
  try {
    const queryFields = {
      fields: [`${category}-id`, `${category}-extID`, `${category}-name:text`],
      where:
        category === "MessageType"
          ? [
              {
                fieldName: `${category}-busObjCat`,
                operator: "=",
                value: category,
              },
            ]
          : [
              {
                fieldName: `${category}-isMetaModel`,
                operator: "!=",
                value: true,
              },
              {
                fieldName: `${category}-isSetting`,
                operator: "!=",
                value: true,
              },
              {
                fieldName: `${category}-kindOfBusData`,
                operator: "!=",
                value: true,
              },
            ],
    };

    const formData = {
      query: JSON.stringify(queryFields),
      testMode: TEST_MODE,
      client: parseInt(APP.LOGIN_USER_CLIENT, 10), // parseInt with radix for clarity
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
      return response.data.reduce((map, item) => {
        const extID = item[`${category}-extID`];
        const name = item[`${category}-name:text`];
        if (extID && name) map[extID] = name;
        return map;
      }, {});
    } else {
      console.error(`Unexpected response format for ${category}.`);
      return {};
    }
  } catch (error) {
    console.error(`Error in fetching ${category} data:`, error);
    return {};
  }
};

/** Fetches MessageType data from the API */
const fetchMessageTypeData = () => fetchCategoryData("MessageType");

/** Fetches BusObjCat data from the API */
const fetchBusObjCatData = () => fetchCategoryData("BusObjCat");

/**
 * Converts a JavaScript Date object to a custom ISO 8601 string format.
 * The format returned is "YYYY-MM-DDTHH:MM:SS-0000" which includes year,
 * month, day, hour, minute, second, and a fixed "-0000" time zone offset.
 *
 * @param {Date} date - The Date object to be formatted.
 * @returns {string} A string representing the date in the "YYYY-MM-DDTHH:MM:SS-0000" format.
 */
const formatDateToISOString = (date) => {
  return (
    date.getUTCFullYear() +
    "-" +
    String(date.getUTCMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getUTCDate()).padStart(2, "0") +
    "T" +
    String(date.getUTCHours()).padStart(2, "0") +
    ":" +
    String(date.getUTCMinutes()).padStart(2, "0") +
    ":" +
    String(date.getUTCSeconds()).padStart(2, "0") +
    "-0000"
  );
};

/**
 * Calculates and returns the time elapsed since a given date in a human-readable format.
 * Uses the `date-fns` library’s `formatDistanceToNow` function.
 *
 * @param {string | Date} publishedOn - The date of publication in string format or as a Date object.
 * @returns {string} A human-readable string representing the time elapsed since the date.
 */
const getPublishedAge = (publishedOn) => {
  if (!publishedOn) return "";
  const publishedDate = new Date(publishedOn);
  return formatDistanceToNow(publishedDate, { addSuffix: true });
};

/**
 * Returns the start date (in ISO format) for a given filter.
 * The filter specifies the date range (e.g., today, this week, last 2 months, etc.).
 *
 * @param {string} filter - The name of the filter to calculate the date range for.
 * Supported filters include:
 *   - "today": Start of the current day (midnight)
 *   - "yesterday": Start of the previous day (midnight)
 *   - "thisWeek": Start of the current week (Sunday at midnight)
 *   - "lastWeek": Start of the previous week (Sunday at midnight)
 *   - "thisMonth": Start of the current month (1st of the month at midnight)
 *   - "lastMonth": Start of the previous month (1st of the previous month at midnight)
 *   - "lastTwoMonths": Start of the date two months ago (1st of the month)
 *   - "lastSixMonths": Start of the date six months ago (1st of the month)
 *   - "thisYear": Start of the current year (1st January at midnight)
 *   - "lastYear": Start of the previous year (1st January of the previous year at midnight)
 *
 * @returns {string | null} ISO string of the start date for the filter, or `null` for "allTime".
 * @throws {Error} If the filter is invalid or not supported.
 */
const getStartDateForFilter = (filter) => {
  // Get the current date
  const today = new Date();

  // Helper function to return the start of the day (midnight)
  // This will reset the hours, minutes, seconds, and milliseconds to zero
  const startOfDay = (date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);

  // Switch statement to handle different filter cases
  switch (filter) {
    case "today":
      // Return the start of today (midnight)
      return startOfDay(today).toISOString();

    case "yesterday":
      // Create a new Date object for yesterday and return the start of yesterday (midnight)
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      return startOfDay(yesterday).toISOString();

    case "thisWeek":
      // Set the date to the start of the current week (Sunday)
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday of the current week
      return startOfDay(startOfWeek).toISOString();

    case "lastWeek":
      // Set the date to the start of the previous week (Sunday)
      const startOfLastWeek = new Date(today);
      startOfLastWeek.setDate(today.getDate() - 7 - today.getDay()); // Sunday of the last week
      return startOfDay(startOfLastWeek).toISOString();

    case "thisMonth":
      // Get the first day of the current month
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return startOfDay(startOfMonth).toISOString();

    case "lastMonth":
      // Get the first day of the previous month
      const startOfLastMonth = new Date(
        today.getFullYear(),
        today.getMonth() - 1,
        1
      );
      return startOfDay(startOfLastMonth).toISOString();

    case "lastTwoMonths":
      // Get the first day of the month two months ago
      const startOfLastTwoMonths = new Date(
        today.getFullYear(),
        today.getMonth() - 2,
        1
      );
      return startOfDay(startOfLastTwoMonths).toISOString();

    case "lastSixMonths":
      // Get the first day of the month six months ago
      const startOfLastSixMonths = new Date(
        today.getFullYear(),
        today.getMonth() - 6,
        1
      );
      return startOfDay(startOfLastSixMonths).toISOString();

    case "thisYear":
      // Get the first day of the current year (January 1st)
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      return startOfDay(startOfYear).toISOString();

    case "lastYear":
      // Get the first day of the previous year (January 1st)
      const startOfLastYear = new Date(today.getFullYear() - 1, 0, 1);
      return startOfDay(startOfLastYear).toISOString();

    default:
      // Throw an error if an invalid filter is provided
      throw new Error(`Invalid filter: ${filter}`);
  }
};

/**
 * Handles status change management and updates status based on `processMessage`.
 *
 * @param {Object} processMessage - The message object with status update details.
 * @param {Function} callback - Callback function to execute after status change.
 * @param {string} remarkComment - Additional comments for the status change.
 * @param {string} recipient - Recipient information.
 * @param {Array<string>} nextStatusCodes - Array of status codes.
 * @param {boolean} openPreviousGateways - Flag for previous gateways.
 */
const handleStatusChangeMgmt = async (
  processMessage,
  callback,
  remarkComment,
  recipient,
  nextStatusCodes = [],
  openPreviousGateways
) => {
  try {
    // Build the status data object
    const statusUIData = (processMessage?.record?.fields || []).reduce(
      (data, field) => {
        data[field.name] = field.value;
        return data;
      },
      {}
    );

    if (remarkComment) statusUIData.remark = remarkComment;
    if (recipient) statusUIData.recipientsOverride = recipient;
    if (nextStatusCodes.length > 0) statusUIData.extStatusIDs = nextStatusCodes;
    if (openPreviousGateways)
      statusUIData.openPreviousGateways = openPreviousGateways;

    // Process updFields for any additional fields or overrides
    processMessage?.updFields.forEach(({ name, value }) => {
      if (name === "extStatus.statusID") {
        statusUIData["extStatus"] = { statusID: value };
      } else {
        statusUIData[name] = value;
      }
    });

    // Add other fixed fields
    statusUIData.messageLogID = processMessage?.record?.id;
    statusUIData.userID = APP.LOGIN_USER_ID;
    statusUIData.client = APP.LOGIN_USER_CLIENT;
    statusUIData.languageID = APP.LOGIN_USER_LANGUAGE;

    // Wrap statusUIData in a parent object and stringify
    const payload = {
      statusUIData: JSON.stringify(statusUIData),
    };

    // Serialize the payload as URL-encoded
    const encodedPayload = new URLSearchParams(payload).toString();

    // Make API call
    const response = await fetchData(
      API_ENDPOINTS.SET_DOCUMENT_STATUS,
      "POST",
      { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      encodedPayload
    );

    // Handle the API response
    if (response?.success) {
      showToast(response.message || "Status updated successfully.");
      if (callback) callback();
    } else {
      console.error(
        "Status update failed:",
        response.ui_message?.message_text || "Unknown error"
      );
      showToast(
        response.ui_message?.message_text || "Status update failed",
        "error"
      );
    }
  } catch (error) {
    console.error("Status update failed:", error);
    showToast("Status update failed", "error");
  }
};

/**
 * Checks if a string contains meaningful content (non-empty, non-whitespace).
 *
 * @param {string} text - The text to check.
 * @returns {boolean} - Returns `true` if the text has meaningful content, otherwise `false`.
 */
const hasContent = (text) => typeof text === "string" && text.trim().length > 0;

/**
 * Map to define the time filter options for messages with corresponding labels.
 * Keys represent the time range identifiers, and values define the labels displayed to the user.
 */
const messageWithinMap = {
  today: "0. Today", // Messages from today
  yesterday: "1. Yesterday", // Messages from yesterday
  thisWeek: "2. This Week", // Messages from the current week
  lastWeek: "3. Last Week", // Messages from the previous week
  thisMonth: "4. This Month", // Messages from the current month
  lastMonth: "5. Last Month", // Messages from the previous month
  lastTwoMonths: "6. Last Two Months", // Messages from the last two months
  lastSixMonths: "7. Last Six Months", // Messages from the last six months
  thisYear: "8. This Year", // Messages from the current year
  lastYear: "9. Last Year", // Messages from the previous year
};

/**
 * Processes update fields for a given set of data.
 *
 * @param {Array<Object>} updFields - The update fields to process.
 * @returns {Object} - An object containing all processed fields.
 */
const processUpdateFields = (updFields = []) => {
  const processedFields = {
    changeRecipient: false,
    comment: false,
    nextStatusCodes: [],
    openPreviousGateways: null,
    numOfRecpDefOnStep: null,
  };

  updFields.forEach((field) => {
    switch (field.name) {
      case "comment":
        processedFields.comment =
          field.value === "true" || field.value === true;
        break;
      case "changeRecipient":
        processedFields.changeRecipient =
          field.value === "true" || field.value === true;
        break;
      case "openPreviousGateways":
        processedFields.openPreviousGateways = field.value;
        break;
      case "nextStatusCodes":
        processedFields.nextStatusCodes.push(field.value);
        break;
      case "numOfRecpDefOnStep":
        processedFields.numOfRecpDefOnStep = field.value;
        break;
    }
  });

  console.log(
    "Processed Update Fields:",
    JSON.stringify(processedFields, null, 2)
  );

  return processedFields;
};

export {
  applyLocalFilters,
  componentMap,
  detailScreenParamsMap,
  fetchMessageTypeData,
  fetchBusObjCatData,
  formatDateToISOString,
  getPublishedAge,
  getStartDateForFilter,
  handleStatusChangeMgmt,
  hasContent,
  messageWithinMap,
  processUpdateFields,
};
