/**
 * Function to dynamically determine the current environment.
 * This function can be based on various factors such as the domain, configuration files, etc.
 * @returns {string} - The current environment (e.g., "development", "testing", "production").
 */
const determineEnvironment = () => {
  return "testing"; // Default environment for demonstration purposes
};

/**
 * Enum representing different environments with their base URLs.
 * @readonly
 * @enum {string}
 */
const Environment = {
  /** Development environment. */
  DEVELOPMENT: "development",
  /** Testing environment. */
  TESTING: "testing",
  /** Production environment. */
  PRODUCTION: "production",
};

/**
 * Base URLs for different environments.
 * @constant
 * @type {Object.<string, string>}
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
 * @constant
 * @type {string}
 */
const baseURL = BASE_URL[currentEnvironment];

/**
 * Object containing API endpoints based on the current environment's base URL.
 * @constant
 * @type {Object.<string, string>}
 */
const API_ENDPOINTS = {
  /** Endpoint for authentication. */
  AUTHENTICATE: `${baseURL}/api/authenticate`,
  /** Endpoint for user logout. */
  LOGOUT: `${baseURL}/api/logout`,
  /** Endpoint for querying fields. */
  QUERY: `${baseURL}/api/queryfields`,
  /** Endpoint for updating fields. */
  UPDATE_FIELDS: `${baseURL}/api/updatefields`,
  /** Endpoint for accessing resources. */
  RESOURCE: `${baseURL}/resource`,
  /** Endpoint for obtaining a new object ID. */
  NEW_OBJECT_ID: `${baseURL}/api/newobjectid`,
  /** Endpoint for uploading binary resources. */
  UPLOAD_BINARY_RESOURCE: `${baseURL}/api/uploadbinaryresource`,
  /** Endpoint for invoking APIs. */
  INVOKE: `${baseURL}/api/invoke`,
  /** Endpoint for invoking new APIs. */
  INVOKE_API_NEW: `${baseURL}/api/invokeApiNew`,
  /** Endpoint for invoking get document workflow status. */
  GET_DOCUMENT_STATUS: `${baseURL}/api/getdocstatus`,
  /** Endpoint for invoking set document workflow status. */
  SET_DOCUMENT_STATUS: `${baseURL}/api/setdocstatus`,
};

/**
 * Timeout duration for API requests in milliseconds.
 * @constant
 * @type {number}
 */
const API_TIMEOUT = 120000; // 2 minutes

/**
 * Function to dynamically determine the application version.
 * This function could involve reading the version from a file, fetching it from a server, etc.
 * @returns {string} - The application version.
 */
const getVersion = () => {
  return "1.0.0"; // Default version for demonstration purposes
};

/**
 * Object containing application-related constants.
 * @constant
 * @type {Object}
 */
const APP = {
  /** The application version. */
  VERSION: getVersion(),
  /** Client ID of the logged-in user. */
  LOGIN_USER_CLIENT: "",
  /** Date format for the logged-in user. */
  LOGIN_USER_DATE_FORMAT: "",
  /** Employee ID of the logged-in user. */
  LOGIN_USER_EMPLOYEE_ID: "",
  /** ID of the logged-in user. */
  LOGIN_USER_ID: "",
  /** Language preference of the logged-in user. Default is English. */
  LOGIN_USER_LANGUAGE: "en",
  /** Work schedule external name of the logged-in user.*/
  LOGIN_USER_WORKSCHEDULE_NAME: "",
  /** Timesheet type of the logged-in user work schedule.*/
  LOGIN_USER_WORK_SCHEDULE_TIMESHEET_TYPE: "",
};

/**
 * Object containing activity IDs for different application modules.
 * @constant
 * @type {Object}
 */
const APP_ACTIVITY_ID = {
  /** Activity ID for timesheet module. */
  TIMESHEET: "manage.timemgt.timesheet",
  /** Activity ID for expense module. */
  EXPENSE: "manage.expensemgt.expenseclaim",
  /** Activity ID for absence module. */
  ABSENCE: "manage.absencemgt.myabsencerequest",
  /** Activity ID for inbox module. */
  INBOX: "platform.bpm.inbox",
};

/**
 * Object containing app path names for different application modules.
 * @constant
 * @type {Object}
 */
const APP_NAME = {
  /** App name for timesheet module. */
  TIMESHEET: "hrAdmin.timemgt",
  /** App name for expense module. */
  EXPENSE: "accountspayable.expenseclaim",
  /** App name for absence module. */
  ABSENCE: "hrAdmin.absencemgmt",
  /** App name for employee module. */
  EMPLOYEE: "hrAdmin.employeemaster",
};

/**
 * Object containing business object categories and their mappings.
 * @constant
 * @type {Object}
 */
const BUSOBJCAT = {
  /** Business object category for timesheet. */
  TIMESHEET: "Timesheet",
  /** Business object category for expense. */
  EXPENSE: "Expense",
  /** Business object category for absence. */
  ABSENCE: "Absence",
  /** Business object category for inbox. */
  INBOX: "Inbox",
};

/**
 * Object mapping business object categories to their respective data models.
 * @constant
 * @type {Object}
 */
const BUSOBJCATMAP = {
  [BUSOBJCAT.TIMESHEET]: "TimeConfirmation",
  [BUSOBJCAT.EXPENSE]: "ExpenseClaim",
  [BUSOBJCAT.ABSENCE]: "Absence",
};

/**
 * Time duration (in milliseconds) representing the interval between consecutive clicks
 * in a double-click event.
 * @constant
 * @type {number}
 */
const DOUBLE_CLICK_DELTA = 400;

/**
 * Object containing internal status codes.
 * @constant
 * @enum {number}
 */
const INTSTATUS = {
  /** Indicates an active status. */
  ACTIVE: 0,
  /** Indicates a deleted status. */
  DELETED: 3,
};

/**
 * Maximum lengths for login input fields.
 * @constant
 * @type {Object}
 */
const LOGIN_INPUTS_MAXLENGTH = {
  /** Maximum length for username field. */
  USERNAME: 10,
  /** Maximum length for password field. */
  PASSWORD: 20,
  /** Maximum length for client ID field. */
  CLIENTID: 4,
};

/**
 * Maximum allowed upload file size in MB.
 * @constant
 * @type {number}
 */
const MAX_UPLOAD_FILE_SIZE = 10;

/**
 * Default page size for paginated data.
 * @constant
 * @type {number}
 */
const PAGE_SIZE = 20;

/**
 * Flag indicating whether the application is running in test mode.
 * @constant
 * @type {boolean}
 */
const TEST_MODE = false;

/**
 * Array containing valid file extensions.
 * These extensions are commonly used for text documents, images, and other file types.
 * @constant
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
  APP_NAME,
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
