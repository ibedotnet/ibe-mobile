import { API_ENDPOINTS, APP, BUSOBJCAT, TEST_MODE } from "../constants";

import { fetchData, getAppNameByCategory } from "../utils/APIUtils";
import { normalizeDateToUTC } from "./FormatUtils";

/**
 * Checks if a timesheet exists for the given date.
 * @param {Date} date - The date to check.
 * @returns {Promise<Object>} - The response object containing the result.
 */
const checkTimesheetExistsForDate = async (date, showInfoInCreate, t) => {
  if (showInfoInCreate) {
    showInfoInCreate(t("checking_timesheet"));
  }

  const formattedDate = normalizeDateToUTC(date)?.toISOString();

  // Define query fields to fetch time confirmation data
  const queryFields = {
    fields: [
      "TimeConfirmation-id",
      "TimeConfirmation-start",
      "TimeConfirmation-end",
      "TimeConfirmation-employeeID",
      "TimeConfirmation-extStatus",
      "TimeConfirmation-extStatus-processTemplateID",
    ],
    where: [
      {
        fieldName: "TimeConfirmation-employeeID",
        operator: "=",
        value: APP.LOGIN_USER_EMPLOYEE_ID,
      },
      {
        fieldName: "TimeConfirmation-start",
        operator: "<=",
        value: formattedDate,
      },
      {
        fieldName: "TimeConfirmation-end",
        operator: ">=",
        value: formattedDate,
      },
    ],
  };

  // Define common query parameters
  const commonQueryParams = {
    testMode: TEST_MODE,
    client: parseInt(APP.LOGIN_USER_CLIENT),
    user: APP.LOGIN_USER_ID,
    userID: APP.LOGIN_USER_ID,
    appName: JSON.stringify(getAppNameByCategory(BUSOBJCAT.TIMESHEET)),
    language: APP.LOGIN_USER_LANGUAGE,
    intStatus: JSON.stringify([0, 1, 2]),
  };

  // Construct form data for the request
  const formData = {
    query: JSON.stringify(queryFields),
    ...commonQueryParams,
  };

  try {
    // Fetch data from the server
    const response = await fetchData(
      API_ENDPOINTS.QUERY,
      "POST",
      {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      new URLSearchParams(formData).toString()
    );

    // Process the response if successful and data is available
    if (
      response.success === true &&
      response.data &&
      response.data instanceof Array &&
      response.data.length > 0
    ) {
      // Map fetched time confirmations to desired format
      const fetchedTimeConfirmation = response.data.map((confirmation) => {
        const id = confirmation["TimeConfirmation-id"];
        const start = confirmation["TimeConfirmation-start"];
        const end = confirmation["TimeConfirmation-end"];
        const employeeID = confirmation["TimeConfirmation-employeeID"];
        const statusTemplateExtId =
          confirmation["TimeConfirmation-extStatus-processTemplateID"];
        return {
          id,
          start,
          end,
          employeeID,
          statusTemplateExtId,
        };
      });

      return { exists: true, data: fetchedTimeConfirmation };
    } else {
      return { exists: false, data: [] };
    }
  } catch (error) {
    console.error("Error checking timesheet existence:", error);
    throw error;
  } finally {
    if (showInfoInCreate) {
      showInfoInCreate(null);
    }
  }
};

export { checkTimesheetExistsForDate };
