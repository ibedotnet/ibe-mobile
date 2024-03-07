// Determine the environment dynamically.
// This could be based on the domain, configuration files, or any other method
const determineEnvironment = () => {
  return "testing";
};

const Environment = {
  DEVELOPMENT: "development",
  TESTING: "testing",
  PRODUCTION: "production",
};

const BASE_URL = {
  [Environment.DEVELOPMENT]: "http://172.17.0.80",
  [Environment.TESTING]: "http://testserver.ibenv.net",
  [Environment.PRODUCTION]: "http://appnew.ibenv.net",
};

const currentEnvironment = determineEnvironment();

const baseURL = BASE_URL[currentEnvironment];

const API_ENDPOINTS = {
  AUTHENTICATE: `${baseURL}/api/authenticate`,
  QUERY: `${baseURL}/api/queryfields`,
  UPDATE_FIELDS: `${baseURL}/api/updatefields`,
  RESOURCE: `${baseURL}/resource`,
  NEW_OBJECT_ID: `${baseURL}/api/newobjectid`,
  UPLOAD_BINARY_RESOURCE: `${baseURL}/api/uploadbinaryresource`,
};

const API_TIMEOUT = 120000; // Milliseconds

const getVersion = () => {
  // Determine the version based on the build.
  // This could involve reading it from a file, fetching it from a server, etc.
  return "1.0.0";
};

const APP = {
  VERSION: getVersion(),
  LOGIN_USER_CLIENT: "",
  LOGIN_USER_DATE_FORMAT: "",
  LOGIN_USER_EMPLOYEE_ID: "",
  LOGIN_USER_ID: "",
  LOGIN_USER_LANGUAGE: "en",
};

const APP_ACTIVITY_ID = {
  TIMESHEET: "hrAdmin.timemgt",
  EXPENSE: "accountspayable.expenseclaim",
  ABSENCE: "hrAdmin.absencemgmt",
  EMPLOYEE: "hrAdmin.employeemaster",
};

const BUSOBJCAT = {
  TIMESHEET: "Timesheet",
  EXPENSE: "Expense",
  ABSENCE: "Absence",
  INBOX: "Inbox",
};

const INTSTATUS = {
  ACTIVE: 0,
  DELETED: 3,
};

const LOGIN_INPUTS_MAXLENGTH = {
  USERNAME: 10,
  PASSWORD: 20,
  CLIENTID: 4,
};

const PAGE_SIZE = 20;

const TEST_MODE = false;

export {
  API_ENDPOINTS,
  API_TIMEOUT,
  APP,
  APP_ACTIVITY_ID,
  BUSOBJCAT,
  INTSTATUS,
  LOGIN_INPUTS_MAXLENGTH,
  PAGE_SIZE,
  TEST_MODE,
};
