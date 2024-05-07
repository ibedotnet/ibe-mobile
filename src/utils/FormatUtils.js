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
      console.debug(`Invalid duration value ${duration}. Returning null.`);
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
const convertMillisecondsToDuration = (
  milliseconds,
  unit = "hours",
  convertToMillisecondsEnabled
) => {
  try {
    // Ensure milliseconds is a valid number
    if (
      (!milliseconds && milliseconds !== 0) ||
      isNaN(milliseconds) ||
      milliseconds < 0
    ) {
      console.debug(
        `Invalid milliseconds value ${milliseconds}. Returning null.`
      );
      return null;
    }

    if (!convertToMillisecondsEnabled) {
      return milliseconds;
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
 * @returns {string} - The corresponding date-fns format.
 */
const convertToDateFNSFormat = (userPreferenceFormat) => {
  if (userPreferenceFormat === "d/m/y") {
    return "d/MM/y";
  } else if (userPreferenceFormat === "d/mm/y") {
    return "d/MM/y";
  } else if (userPreferenceFormat === "dd/mm/y") {
    return "dd/MM/y";
  } else if (userPreferenceFormat === "dd/mm/yy") {
    return "dd/MM/yyyy";
  } else if (userPreferenceFormat === "dd-mm-y") {
    return "dd-MM-y";
  } else if (userPreferenceFormat === "d.m.y") {
    return "d.M.y";
  } else if (userPreferenceFormat === "dd.mm.y") {
    return "dd.MM.y";
  } else if (userPreferenceFormat === "m/d/y") {
    return "M/d/y";
  } else if (userPreferenceFormat === "y/m/d") {
    return "yyyy/M/d";
  } else if (userPreferenceFormat === "yy/m/d") {
    return "yy/M/d";
  } else if (userPreferenceFormat === "yy/mm/dd") {
    return "yy/MM/dd";
  } else if (userPreferenceFormat === "y-m-d") {
    return "yyyy-MM-dd";
  } else if (userPreferenceFormat === "y-mm-dd") {
    return "yyyy-MM-dd";
  } else if (userPreferenceFormat === "y.mm.dd") {
    return "yyyy.MM.dd";
  } else {
    return userPreferenceFormat;
  }
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
 * Convert planned leave unit to hours or days based on leave type.
 * @param {number} planned - The planned leave quantity.
 * @param {boolean} isHourly - Indicates whether the leave is hourly.
 * @param {boolean} isDisplayInHours - Indicates whether the leave is hourly.
 * @param {boolean} adjustAbsence - Indicates whether the leave is an adjustment.
 * @returns {Object} - An object with the formatted unit.
 */
const formatLeaveDuration = (
  planned,
  isHourly = false,
  isDisplayInHours = false,
  adjustAbsence = false
) => {
  let formattedUnit;

  let displayPlanned = `${planned}`;

  if (isHourly || isDisplayInHours) {
    formattedUnit = "h";
  } else {
    formattedUnit = "d";
  }

  displayPlanned = `${displayPlanned} ${formattedUnit}`;

  if (adjustAbsence && planned > 0) {
    displayPlanned = `+${displayPlanned}`;
  }

  return displayPlanned;
};

/**
 * Recursively compares two values for equality, handling arrays, objects, and primitive types.
 * @param {*} value1 - The first value to compare.
 * @param {*} value2 - The second value to compare.
 * @returns {boolean} True if the values are equal, false otherwise.
 */
const isEqual = (value1, value2) => {
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
  // If both values are objects
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
  formatLeaveDuration,
  isEqual,
  makeFirstLetterLowercase,
  timeUnitAbbreviations,
  timeUnitLabels,
};
