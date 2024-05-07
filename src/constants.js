/**
 * Function to determine the current environment dynamically.
 * This function can be based on various factors such as the domain, configuration files, etc.
 * @returns {string} - The current environment (e.g., "development", "testing", "production").
 */
const determineEnvironment = () => {
  return "testing"; // Default environment for demonstration purposes
};

/**
 * Object representing different environments with their base URLs.
 */
const Environment = {
  DEVELOPMENT: "development",
  TESTING: "testing",
  PRODUCTION: "production",
};

/**
 * Base URLs for different environments.
 */
const BASE_URL = {
  [Environment.DEVELOPMENT]: "http://172.17.0.80",
  [Environment.TESTING]: "http://testserver.ibenv.net",
  [Environment.PRODUCTION]: "http://appnew.ibenv.net",
};

// Determine the current environment
const currentEnvironment = determineEnvironment();

/**
 * Base URL for the current environment.
 */
const baseURL = BASE_URL[currentEnvironment];

/**
 * Object containing API endpoints based on the current environment's base URL.
 */
const API_ENDPOINTS = {
  AUTHENTICATE: `${baseURL}/api/authenticate`,
  LOGOUT: `${baseURL}/api/logout`,
  QUERY: `${baseURL}/api/queryfields`,
  UPDATE_FIELDS: `${baseURL}/api/updatefields`,
  RESOURCE: `${baseURL}/resource`,
  NEW_OBJECT_ID: `${baseURL}/api/newobjectid`,
  UPLOAD_BINARY_RESOURCE: `${baseURL}/api/uploadbinaryresource`,
  INVOKE: `${baseURL}/api/invoke`,
  INVOKE_API_NEW: `${baseURL}/api/invokeApiNew`,
};

/**
 * Timeout duration for API requests in milliseconds.
 */
const API_TIMEOUT = 120000; // 2 minutes

/**
 * Function to determine the application version dynamically.
 * This function could involve reading the version from a file, fetching it from a server, etc.
 * @returns {string} - The application version.
 */
const getVersion = () => {
  return "1.0.0"; // Default version for demonstration purposes
};

/**
 * Object containing application-related constants.
 */
const APP = {
  VERSION: getVersion(),
  LOGIN_USER_CLIENT: "",
  LOGIN_USER_DATE_FORMAT: "",
  LOGIN_USER_EMPLOYEE_ID: "",
  LOGIN_USER_ID: "",
  LOGIN_USER_LANGUAGE: "en", // Default language is English
};

/**
 * Object containing activity IDs for different application modules.
 */
const APP_ACTIVITY_ID = {
  TIMESHEET: "hrAdmin.timemgt",
  EXPENSE: "accountspayable.expenseclaim",
  ABSENCE: "hrAdmin.absencemgmt",
  EMPLOYEE: "hrAdmin.employeemaster",
};

/**
 * Object containing business object categories and their mappings.
 */
const BUSOBJCAT = {
  TIMESHEET: "Timesheet",
  EXPENSE: "Expense",
  ABSENCE: "Absence",
  INBOX: "Inbox",
};

/**
 * Object mapping business object categories to their respective data models.
 */
const BUSOBJCATMAP = {
  [BUSOBJCAT.TIMESHEET]: "TimeConfirmation",
  [BUSOBJCAT.EXPENSE]: "ExpenseClaim",
  [BUSOBJCAT.ABSENCE]: "Absence",
};

/**
 * Time duration (in milliseconds) representing the interval between consecutive clicks
 * in a double-click event.
 */
const DOUBLE_CLICK_DELTA = 400;

/**
 * Object containing internal status codes.
 */
const INTSTATUS = {
  ACTIVE: 0,
  DELETED: 3,
};

/**
 * Maximum lengths for login input fields.
 */
const LOGIN_INPUTS_MAXLENGTH = {
  USERNAME: 10,
  PASSWORD: 20,
  CLIENTID: 4,
};

/*
 *Maximum allowed upload file size in MB
 */
const MAX_UPLOAD_FILE_SIZE = 10;

/**
 * Default page size for paginated data.
 */
const PAGE_SIZE = 20;

/**
 * Flag indicating whether the application is running in test mode.
 */
const TEST_MODE = false;

/**
 * Array containing valid file extensions.
 * These extensions are commonly used for text documents, images, and other file types.
 * @type {string[]}
 */
const VALID_FILE_EXTENSIONS = [
  ".txt",
  ".docx",
  ".pdf",
  ".jpg",
  ".png",
  ".xlsx",
  ".xls",
  ".mp4",
  ".jpeg",
  ".zip",
  ".html",
  ".mp3",
  ".pptx",
  ".csv",
  ".json",
  ".xml",
  ".svg",
  ".wav",
  ".avi",
];

export {
  API_ENDPOINTS,
  API_TIMEOUT,
  APP,
  APP_ACTIVITY_ID,
  BUSOBJCAT,
  BUSOBJCATMAP,
  DOUBLE_CLICK_DELTA,
  INTSTATUS,
  LOGIN_INPUTS_MAXLENGTH,
  MAX_UPLOAD_FILE_SIZE,
  PAGE_SIZE,
  TEST_MODE,
  VALID_FILE_EXTENSIONS,
};
