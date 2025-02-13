/**
 * Change a Date object to the API-compatible date format.
 * @param {Date} date - The Date object to be formatted.
 * @returns {string} - The API-compatible date string.
 */
const changeDateToAPIFormat = (date) => {
  if (date) {
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, "0");
    var day = String(date.getDate()).padStart(2, "0");
    var hours = String(date.getHours()).padStart(2, "0");
    var minutes = String(date.getMinutes()).padStart(2, "0");
    var seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}-0000`;
  }
  return null;
};

/**
 * Convert amount and currency to a displayable format.
 * @param {Object} amountObj - An object containing amount and currency.
 * @param {number} amountObj.amount - The amount to be formatted.
 * @param {string} amountObj.currency - The currency code.
 * @returns {string} - The formatted currency string.
 */
const convertAmountToDisplayFormat = (amountObj) => {
  const { amount, currency } = amountObj;

  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  const displayFormat = `${formattedAmount}`;

  return displayFormat;
};

/**
 * Converts bytes to megabytes and returns a string representation with two decimal places.
 * @param {number} bytes - The size in bytes to convert to megabytes.
 * @returns {string} A string representation of the size in megabytes with two decimal places followed by "MB".
 */
const convertBytesToMegaBytes = (bytes) => {
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes.toFixed(2)} MB`;
};

/**
 * Converts a duration value to milliseconds if the conversion is enabled.
 * @param {number} duration - The duration value to be converted.
 * @param {string} unit - The unit of time for the duration value.
 * @param {boolean} convertToMillisecondsEnabled - A flag indicating whether to convert the duration to milliseconds.
 * @returns {number|null} - The converted value in milliseconds if conversion is enabled and successful, otherwise returns the original value or null if an error occurs.
 */
const convertDurationToMilliseconds = (
  duration,
  unit,
  convertToMillisecondsEnabled
) => {
  try {
    // Ensure duration is a valid number
    if ((!duration && duration !== 0) || isNaN(duration) || duration < 0) {
      console.log(`Invalid duration value ${duration}. Returning null.`);
      return null;
    }

    if (!convertToMillisecondsEnabled) {
      return duration;
    }

    return convertToMilliseconds(duration, unit);
  } catch (error) {
    console.error("Error converting duration to milliseconds:", error.message);
    return null;
  }
};

/**
 * Converts milliseconds to duration format based on the specified unit.
 * @param {number} milliseconds - The time duration in milliseconds.
 * @param {string} unit - The unit to which the duration should be converted. Should be one of: "d" (days), "h" (hours), "m" (minutes), "s" (seconds).
 * @returns {string} - The duration string in the format corresponding to the specified unit.
 */
const convertMillisecondsToDuration = (milliseconds, unit = "hours") => {
  try {
    // Ensure milliseconds is a valid number
    if (
      (!milliseconds && milliseconds !== 0) ||
      isNaN(milliseconds) ||
      milliseconds < 0
    ) {
      console.log(
        `Invalid milliseconds value ${milliseconds}. Returning null.`
      );
      return null;
    }

    // Convert milliseconds to the specified unit
    let convertedValue;
    switch (unit) {
      case "days":
        convertedValue = milliseconds / (1000 * 60 * 60 * 24);
        break;
      case "hours":
        convertedValue = milliseconds / (1000 * 60 * 60);
        break;
      case "minutes":
        convertedValue = milliseconds / (1000 * 60);
        break;
      case "seconds":
        convertedValue = milliseconds / 1000;
        break;
      default:
        throw new Error(
          "Invalid unit. Unit should be one of: 'days', 'hours', 'minutes', 'seconds'."
        );
    }

    let roundedValue = convertedValue;
    // Check if the value has decimal places
    if (convertedValue % 1 !== 0) {
      // Round the converted value to two decimal places
      roundedValue = convertedValue.toFixed(2);
    }

    // Construct the duration string
    const durationString = String(roundedValue);

    return durationString;
  } catch (error) {
    console.error("Error converting milliseconds to duration:", error.message);
    return null;
  }
};

/**
 * Convert milliseconds to a specified time unit and dynamically determine the unit.
 * @param {number} milliseconds - The time in milliseconds.
 * @param {string} unit - The default unit ('hours' for hours, 'minutes' for minutes).
 * @returns {Object} - An object with the formatted time and unit.
 */
const convertMillisecondsToUnit = (
  milliseconds,
  unit = "hours",
  uptoDecimalPlaces = 2
) => {
  let formattedTime;
  let formattedUnit;

  // Check if milliseconds is a valid non-negative number
  if (typeof milliseconds !== "number" || milliseconds < 0) {
    console.error("Invalid milliseconds value");
    return {}; // Return an empty object if milliseconds value is invalid
  }

  // Convert milliseconds to the specified unit
  if (unit === "hours") {
    formattedTime = milliseconds / (60 * 60 * 1000);
    formattedUnit = timeUnitAbbreviations["hours"]; // Set formatted unit to 'h' for hours
  } else if (unit === "minutes") {
    formattedTime = milliseconds / (60 * 1000);
    formattedUnit = timeUnitAbbreviations["minutes"]; // Set formatted unit to 'm' for minutes
  } else {
    console.error("Invalid unit specified");
    return {}; // Return an empty object if unit specified is invalid
  }

  const roundedTime = formattedTime.toFixed(uptoDecimalPlaces);

  // Construct the display time string with the rounded time and formatted unit
  const displayTime = `${
    roundedTime % 1 === 0 ? parseInt(roundedTime) : roundedTime
  } ${formattedUnit}`;

  return {
    formattedTime,
    formattedUnit,
    displayTime,
  };
};

/**
 * Convert user preference date format to the corresponding date-fns format.
 * @param {string} userPreferenceFormat - The user preference date format.
 * @param {boolean} [showTime=false] - Indicates whether to include time in the format.
 * @returns {string} - The corresponding date-fns format, optionally including time.
 */
const convertToDateFNSFormat = (userPreferenceFormat, showTime = false) => {
  let dateFormat;
  switch (userPreferenceFormat) {
    case "d/m/y":
    case "d/mm/y":
      dateFormat = "d/MM/y";
      break;
    case "dd/mm/y":
      dateFormat = "dd/MM/y";
      break;
    case "dd/mm/yy":
      dateFormat = "dd/MM/yyyy";
      break;
    case "dd-mm-y":
      dateFormat = "dd-MM-y";
      break;
    case "d.m.y":
      dateFormat = "d.M.y";
      break;
    case "dd.mm.y":
      dateFormat = "dd.MM.y";
      break;
    case "m/d/y":
      dateFormat = "M/d/y";
      break;
    case "y/m/d":
      dateFormat = "yyyy/M/d";
      break;
    case "yy/m/d":
      dateFormat = "yy/M/d";
      break;
    case "yy/mm/dd":
      dateFormat = "yy/MM/dd";
      break;
    case "y-m-d":
    case "y-mm-dd":
      dateFormat = "yyyy-MM-dd";
      break;
    case "y.mm.dd":
      dateFormat = "yyyy.MM.dd";
      break;
    default:
      dateFormat = userPreferenceFormat;
  }

  return showTime ? `${dateFormat} HH:mm:ss` : dateFormat;
};

/**
 * Converts a date string to a Date object.
 * @param {string} dateString - The date string to be converted.
 * @returns {Date} - The Date object.
 */
const convertToDateObject = (dateString) => {
  try {
    if (!dateString) {
      return null;
    }
    // Attempt to parse the date string into a Date object
    const dateObject = new Date(dateString);
    // Check if the parsed date is a valid date
    if (isNaN(dateObject.getTime())) {
      throw new Error("Invalid date string");
    }
    return dateObject;
  } catch (error) {
    console.error(
      "Error converting date string to Date object:",
      error.message
    );
    return null;
  }
};

/**
 * Converts a number representing days, hours, minutes, or seconds to milliseconds.
 * @param {number} number - The number of days, hours, minutes, or seconds to convert.
 * @param {string} unit - The unit of time to convert. Should be one of: "days", "hours", "minutes", "seconds".
 * @returns {number} - The total number of milliseconds.
 */
const convertToMilliseconds = (number, unit) => {
  if (isNaN(number)) {
    throw new Error(`Invalid ${number} cannot be converted to milliseconds.`);
  }

  // Number of milliseconds in a day, hour, and minute
  const millisecondsInADay = 24 * 60 * 60 * 1000;
  const millisecondsInAnHour = 60 * 60 * 1000;
  const millisecondsInAMinute = 60 * 1000;

  let totalMilliseconds = 0;

  // Convert the provided number to milliseconds based on the unit of time
  switch (unit) {
    case "days":
      totalMilliseconds = number * millisecondsInADay;
      break;
    case "hours":
      totalMilliseconds = number * millisecondsInAnHour;
      break;
    case "minutes":
      totalMilliseconds = number * millisecondsInAMinute;
      break;
    case "seconds":
      totalMilliseconds = number * 1000;
      break;
    default:
      throw new Error(
        `Invalid ${unit}. Unit should be one of: 'days', 'hours', 'minutes', 'seconds'.`
      );
  }

  return totalMilliseconds;
};

/**
 * Helper function to check if two dates represent the same calendar day.
 *
 * This function ensures that both inputs are valid `Date` objects
 * and avoids runtime errors if invalid values are passed.
 *
 * @param {Date} date1 - The first date to compare.
 * @param {Date} date2 - The second date to compare.
 * @returns {boolean} - Returns `true` if the dates are the same calendar day, otherwise `false`.
 */
const datesAreForSameDay = (date1, date2) => {
  // Ensure both inputs are valid Date objects
  if (
    !(date1 instanceof Date) ||
    isNaN(date1) ||
    !(date2 instanceof Date) ||
    isNaN(date2)
  ) {
    return false;
  }

  // Compare year, month, and day for equality
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * Retrieves the text of a remark for a specific language from an array of remarks.
 * If the remark for the specified language is not found, it falls back to the preferred languages.
 *
 * @param {Array} remarks - Array of remark objects.
 * @param {string} language - Primary language code of the remark to retrieve.
 * @param {Array} preferredLanguages - Array of fallback language codes.
 * @returns {string} The text of the remark in the specified language, or an empty string if not found.
 */
const getRemarkText = (remarks = [], language, preferredLanguages = []) => {
  // Ensure remarks is an array
  if (!Array.isArray(remarks)) {
    return "";
  }

  // Combine primary language and preferred languages for search
  const searchLanguages = [language, ...preferredLanguages];

  // Find the remark object with the matching language code from search languages
  const remark = searchLanguages
    .map((lang) => remarks.find((remark) => remark.language === lang))
    .find((remark) => remark !== undefined);

  // Return the text of the found remark or an empty string if not found
  return remark ? remark.text : "";
};

/**
 * Normalizes a given date by setting its time according to the specified default time.
 *
 * @param {Date | string | null} base - The base date to normalize. If null, the current date is used. If a string is provided, it will be parsed into a Date object.
 * @param {string} [defaultTime='date'] - Specifies how to set the time:
 *   'date' - Sets the time to 12:00:00 GMT.
 *   'timeFrom' - Sets the time to 00:00:00.
 *   'timeTo' - Sets the time to 23:59:59.
 *   'now' - Sets the time to the current time for today only, otherwise sets to 12:00:00.
 * @param {boolean} [nowTimeForTodayOnly=false] - If true, sets the time to the current time for today only.
 * @returns {Date | null} The normalized date, or null if the base date is invalid.
 */
const normalizeDateToUTC = (
  base = new Date(),
  defaultTime = "date",
  nowTimeForTodayOnly = false
) => {
  if (typeof base === "string") {
    base = new Date(base);
  }

  if (isNaN(base) || !isFinite(base)) return null;

  const setMidday = (date) =>
    new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0)
    );
  const setStartOfDay = (date) =>
    new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)
    );
  const setEndOfDay = (date) =>
    new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
    );
  const setCurrentTime = (date, current) =>
    new Date(
      Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        current.getUTCHours(),
        current.getUTCMinutes(),
        current.getUTCSeconds(),
        current.getUTCMilliseconds()
      )
    );

  let date;
  switch (defaultTime) {
    case "timeFrom":
      date = setStartOfDay(base);
      break;
    case "timeTo":
      date = setEndOfDay(base);
      break;
    case "now":
      if (nowTimeForTodayOnly) {
        const today = new Date();
        if (today.toDateString() === base.toDateString()) {
          date = setCurrentTime(base, today);
        } else {
          date = setMidday(base);
        }
      } else {
        date = setCurrentTime(base, new Date());
      }
      break;
    default:
      date = setMidday(base);
  }
  return date;
};

/**
 * Sets the text of a remark for a specific language in an array of remarks.
 * If a remark for the specified language is found, updates its text with the new text;
 * otherwise, creates a new remark object for the language.
 * If the remark for the specified language is not found, it falls back to the preferred languages.
 *
 * @param {Array} remarks - Array of remark objects containing language and text properties.
 * @param {string} language - Primary language code of the remark to update.
 * @param {string} newText - New text to set for the remark in the specified language.
 * @returns {Array} Updated array of remarks with the remark text updated or added.
 */
const setRemarkText = (remarks = [], language = "en", newText) => {
  // Clone the remarks array to avoid mutating the original state directly
  const updatedRemarks = [...remarks];

  // Find the index of the remark with the matching language code
  const index = updatedRemarks.findIndex(
    (remark) => remark.language === language
  );

  if (index !== -1) {
    // Update the existing remark if found
    updatedRemarks[index] = { ...updatedRemarks[index], text: newText };
  } else if (newText) {
    // If remark for the language doesn't exist and newText is not empty, create a new one
    updatedRemarks.push({ language, text: newText });
  }

  return updatedRemarks;
};

/**
 * Recursively compares two values for equality, handling arrays, objects, dates, and primitive types.
 * @param {*} value1 - The first value to compare.
 * @param {*} value2 - The second value to compare.
 * @returns {boolean} True if the values are equal, false otherwise.
 */
const isEqual = (value1, value2) => {
  // Check for null or undefined values
  if (value1 === null || value2 === null) {
    return value1 === value2;
  }

  // Check if both values are Date objects
  if (value1 instanceof Date && value2 instanceof Date) {
    return value1.getTime() === value2.getTime();
  }

  // If both values are arrays
  if (Array.isArray(value1) && Array.isArray(value2)) {
    // Check if arrays have the same length
    if (value1.length !== value2.length) {
      return false;
    }
    // Sort both arrays to ensure consistent comparison
    const sortedValue1 = [...value1].sort();
    const sortedValue2 = [...value2].sort();
    // Compare each element of the arrays recursively
    return sortedValue1.every((element, index) =>
      isEqual(element, sortedValue2[index])
    );
  }

  // If both values are objects (but not null)
  else if (typeof value1 === "object" && typeof value2 === "object") {
    // Get the keys of both objects
    const keys1 = Object.keys(value1);
    const keys2 = Object.keys(value2);
    // Check if objects have the same keys
    if (
      keys1.length !== keys2.length ||
      !keys1.every((key) => keys2.includes(key))
    ) {
      return false;
    }
    // Compare each key-value pair of the objects recursively
    return keys1.every((key) => isEqual(value1[key], value2[key]));
  }

  // If both values are primitive types, perform a simple comparison
  else {
    return value1 === value2;
  }
};

/**
 * Convert the first letter of a string to lowercase.
 * @param {string} str - The input string.
 * @returns {string} - The modified string with the first letter converted to lowercase.
 */
const makeFirstLetterLowercase = (str) => {
  if (typeof str !== "string" || str.length === 0) {
    return str;
  }
  return str.charAt(0).toLowerCase() + str.slice(1);
};

/**
 * Strips specified HTML tags from the given content.
 *
 * @param {string} content - The content from which to strip the HTML tags.
 * @param {string} htmlToReplace - The HTML tag to replace.
 *                                 This should be a valid regex string for the tag to be replaced.
 * @param {string} replaceWith - The string to replace the specified HTML tag with. Defaults to an empty string.
 * @returns {string} - The content with the specified HTML tags replaced.
 * If the tag is not found, or if an error occurs, the original content is returned unchanged.
 */
const stripHTMLTags = (content, htmlToReplace, replaceWith = "") => {
  try {
    // Ensure content is a string to avoid replace method errors
    if (typeof content !== "string") {
      return content; // Return unchanged content if it's not a string
    }

    // Ensure htmlToReplace is valid for regex
    const regex = new RegExp(htmlToReplace, "g");

    // Perform the replacement
    return content.replace(regex, replaceWith);
  } catch (error) {
    console.error("Error stripping HTML tags:", error);
    return content; // Return unchanged content if an error occurs
  }
};

/**
 * Map of time units to their abbreviated forms.
 * Used for displaying abbreviated units in various contexts.
 */
const timeUnitAbbreviations = {
  days: "d",
  hours: "h",
  minutes: "m",
  seconds: "s",
  milliseconds: "ms",
};

/**
 * Maps unit abbreviations to their corresponding labels.
 * Useful for converting unit abbreviations to human-readable labels.
 * Example usage: timeUnitLabels["h"] returns "hours"
 */
const timeUnitLabels = {
  d: "days",
  h: "hours",
  m: "minutes",
  s: "seconds",
  ms: "milliseconds",
};

export {
  changeDateToAPIFormat,
  convertAmountToDisplayFormat,
  convertBytesToMegaBytes,
  convertDurationToMilliseconds,
  convertMillisecondsToDuration,
  convertMillisecondsToUnit,
  convertToDateFNSFormat,
  convertToDateObject,
  convertToMilliseconds,
  datesAreForSameDay,
  getRemarkText,
  normalizeDateToUTC,
  setRemarkText,
  isEqual,
  makeFirstLetterLowercase,
  stripHTMLTags,
  timeUnitAbbreviations,
  timeUnitLabels,
};
