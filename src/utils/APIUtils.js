import * as FileSystem from "expo-file-system";
import {
  API_ENDPOINTS,
  API_TIMEOUT,
  APP,
  APP_NAME,
  BUSOBJCAT,
  BUSOBJCATMAP,
  INTSTATUS,
  PAGE_SIZE,
  TEST_MODE,
} from "../constants";

import { showToast } from "../utils/MessageUtils";

/**
 * Performs an asynchronous HTTP request to the specified endpoint.
 * @param {string} endpoint - The URL endpoint to which the request will be made.
 * @param {string} method - The HTTP method for the request (e.g., 'GET', 'POST', 'PUT', 'DELETE').
 * @param {Object} headers - (Optional) An object containing request headers.
 * @param {Object} body - (Optional) The request body, typically used for 'POST' or 'PUT' requests.
 * @returns {Promise<Object>} - A promise resolving to the JSON response from the server.
 * @throws {Error} - Throws an error if the request fails or encounters an error.
 */
const fetchData = async (endpoint, method, headers = {}, body = {}) => {
  console.debug("Request url: " + endpoint);
  console.debug("Request method: " + method);
  console.debug("Request headers: " + JSON.stringify(headers));
  console.debug("Request body: " + JSON.stringify(body));

  try {
    let requestOptions = {
      method: method,
    };
    if (Object.keys(headers).length > 0) {
      requestOptions.headers = headers;
    }
    if (Object.keys(body).length > 0) {
      requestOptions.body = body;
    }

    const response = await Promise.race([
      fetch(`${endpoint}`, requestOptions),

      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out")), API_TIMEOUT)
      ),
    ]);

    if (!response.ok) {
      switch (response.status) {
        case 400:
          throw new Error(
            "Bad Request: The request could not be understood or was missing required parameters."
          );
          break;
        case 401:
          throw new Error(
            "Unauthorized: Authentication failed or user lacks necessary permissions."
          );
          break;
        case 403:
          throw new Error(
            "Forbidden: The server understood the request, but it refuses to authorize it."
          );
          break;
        case 404:
          throw new Error(
            "Not Found: The requested resource could not be found."
          );
          break;
        case 409:
          throw new Error(
            "Conflict: A conflict occurred with the current state of the target resource."
          );
          break;
        case 429:
          throw new Error(
            "Too Many Requests: The user has sent too many requests in a given amount of time."
          );
          break;
        case 500:
          throw new Error(
            "Internal Server Error: The server encountered an unexpected condition."
          );
          break;
        case 502:
          throw new Error(
            "Bad Gateway: The server, while acting as a gateway or proxy, received an invalid response from an upstream server."
          );
          break;
        case 503:
          throw new Error(
            "Service Unavailable: The server is not ready to handle the request. Common causes are a server that is down for maintenance or is overloaded."
          );
          break;
        case 504:
          throw new Error(
            "Gateway Timeout: The server, while acting as a gateway or proxy, did not receive a timely response from an upstream server."
          );
          break;
        default:
          throw new Error(
            `HTTP error! Status: ${response.status}, Status Text: ${response.statusText}, Message: ${jsonResponse.message}`
          );
      }
    }

    const responseText = await response.text();
    //console.debug("Response text: " + responseText);

    const jsonResponse = JSON.parse(responseText || "{}"); // Parse JSON response or default to empty object

    if (
      jsonResponse.hasOwnProperty("success") &&
      jsonResponse.success === false
    ) {
      let errorMessage = jsonResponse.errorMessage;

      if (jsonResponse.hasOwnProperty("errorCode")) {
        errorMessage += ` | Code: ${jsonResponse.errorCode}`;
      }

      if (jsonResponse.hasOwnProperty("errorDetail")) {
        errorMessage += ` | Detail: ${jsonResponse.errorDetail}`;
      }

      if (
        jsonResponse.hasOwnProperty("ui_message") &&
        jsonResponse.ui_message.hasOwnProperty("message_id") &&
        jsonResponse.ui_message.hasOwnProperty("message_text")
      ) {
        errorMessage += ` | UI Message ID: ${jsonResponse.ui_message.message_id}, Message Text: ${jsonResponse.ui_message.message_text}`;
      }

      console.error(errorMessage);
      //showToast(errorMessage, "error");
    }

    return jsonResponse;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

/**
 * Fetches a resource with the specified ID from the API, caches it locally, and returns the cached path.
 * @param {string} id - The ID of the resource to fetch and cache.
 * @returns {Promise<string>} - A promise resolving to the cached path of the resource.
 * @throws {Error} - Throws an error if the fetch or caching process fails.
 */
const fetchAndCacheResource = async (id) => {
  try {
    console.debug(`Going to fetch resource with id: ${id}`);

    if (!id) {
      console.debug("Resource ID is blank, skipping fetch");
      return;
    }

    const cachePath = `${FileSystem.cacheDirectory}${id}`;

    // Check if resource is in cache
    const fileInfo = await FileSystem.getInfoAsync(cachePath);

    if (fileInfo.exists) {
      console.debug(`Resource ${id} is in cache, return the cached path`);
      return cachePath;
    } else {
      console.debug(`Resource ${id} not in cache, fetch from API`);
      const apiResponse = await fetch(
        `${API_ENDPOINTS.RESOURCE}/${id}?client=${APP.LOGIN_USER_CLIENT}`
      );

      console.debug(`Fetch resource response status: ${apiResponse.status}`);

      if (!apiResponse.ok) {
        throw new Error(
          `Failed to fetch resource ${id}. Status: ${apiResponse.status}, Status Text: ${apiResponse.statusText}`
        );
      }

      const resourceBlob = await apiResponse.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64String = reader.result.split(",")[1];

          await FileSystem.writeAsStringAsync(cachePath, base64String, {
            encoding: FileSystem.EncodingType.Base64,
          });

          console.debug("Resource saved to cache: ", cachePath);
          resolve(cachePath);
        };

        reader.onerror = (error) => {
          console.error("Error reading resource blob:", error);
          reject(error);
        };

        reader.readAsDataURL(resourceBlob);
      });
    }
  } catch (error) {
    console.error(`Error fetching and caching resource for ID ${id}: `, error);
    throw error;
  }
};

/**
 * Returns the query fields configuration based on the specified business object category.
 * @param {string} busObjCat - The business object category.
 * @param {Array} extraFields - Extra fields to be added to the fields array. It can be used in detail screen.
 * @returns {Object} - The query fields configuration object.
 */
const getQueryFields = (busObjCat, extraFields = []) => {
  switch (busObjCat) {
    case BUSOBJCAT.TIMESHEET:
      return {
        fields: [
          "TimeConfirmation-id",
          "TimeConfirmation-start",
          "TimeConfirmation-end",
          "TimeConfirmation-totalTime",
          "TimeConfirmation-extStatus-statusID:ProcessTemplate-steps-statusLabel",
          "TimeConfirmation-remark:text",
          "TimeConfirmation-absenceTime",
          "TimeConfirmation-billableTime",
          "TimeConfirmation-totalTime",
          "TimeConfirmation-totalOvertime",
          ...extraFields,
        ],
        where: [
          {
            fieldName: "TimeConfirmation-employeeID",
            operator: "=",
            value: APP.LOGIN_USER_EMPLOYEE_ID,
          },
        ],
      };
    case BUSOBJCAT.EXPENSE:
      return {
        fields: [
          "ExpenseClaim-id",
          "ExpenseClaim-extID",
          "ExpenseClaim-remark:text",
          "ExpenseClaim-amountBU",
          "ExpenseClaim-date",
          "ExpenseClaim-extStatus-statusID:ProcessTemplate-steps-statusLabel",
          ...extraFields,
        ],
        where: [
          {
            fieldName: "ExpenseClaim-type:ExpenseClaimType-singleVendor",
            operator: "=",
            value: false,
          },
          {
            fieldName: "ExpenseClaim-type",
            operator: "!=",
            value: "CASH_ADVANCE",
          },
          {
            fieldName: "ExpenseClaim-employeeID",
            operator: "=",
            value: APP.LOGIN_USER_EMPLOYEE_ID,
          },
        ],
      };
    case BUSOBJCAT.ABSENCE:
      return {
        fields: [
          "Absence-id",
          "Absence-adjustAbsence",
          "Absence-adjustTaken",
          "Absence-type:AbsenceType-name",
          "Absence-type:AbsenceType-hourlyLeave",
          "Absence-type:AbsenceType-displayInHours",
          "Absence-start",
          "Absence-end",
          "Absence-remark:text",
          "Absence-plannedDays",
          "Absence-extStatus-statusID:ProcessTemplate-steps-statusLabel",
          ...extraFields,
        ],
        where: [
          {
            fieldName: "Absence-employeeID",
            operator: "=",
            value: APP.LOGIN_USER_EMPLOYEE_ID,
          },
        ],
      };
    default:
      console.debug("None of the case matched in getQueryFields:", busObjCat);
      return;
  }
};

/**
 * Returns the sort conditions based on the specified business object category.
 * @param {string} busObjCat - The business object category.
 * @returns {Array<Object>} - An array of sort condition objects.
 */
const getSortConditions = (busObjCat) => {
  switch (busObjCat) {
    case BUSOBJCAT.TIMESHEET:
      return [{ property: "TimeConfirmation-changedOn", direction: "DESC" }];
    case BUSOBJCAT.EXPENSE:
      return [{ property: "ExpenseClaim-changedOn", direction: "DESC" }];
    case BUSOBJCAT.ABSENCE:
      return [{ property: "Absence-start", direction: "DESC" }];
    default:
      console.debug(
        "None of the case matched in getSortConditions: " + busObjCat
      );
      return;
  }
};

/**
 * Fetches data for the specified business object category using a query with optional pagination, query fields, and conditions.
 * @param {string} busObjCat - The business object category for which data is to be fetched.
 * @param {number} [page=1] - The page number for pagination (default is 1).
 * @param {number} [limit=PAGE_SIZE] - The limit of items per page (default is PAGE_SIZE).
 * @param {Object} [queryFields={}] - (Optional) Query fields configuration object.
 * @param {Array<Object>} [whereConditions=[]] - (Optional) Array of where conditions for the query.
 * @param {Array<Object>} [orConditions=[]] - (Optional) Array of OR conditions for the query.
 * @returns {Promise<Object>} - A promise resolving to an object containing fetched data, page number, and limit.
 */
const fetchBusObjCatData = async (
  busObjCat,
  page = 1,
  limit = PAGE_SIZE,
  queryFields = {},
  whereConditions = [],
  orConditions = []
) => {
  try {
    // If query fields are not provided, get them based on the business object category
    if (!queryFields || Object.keys(queryFields).length === 0) {
      queryFields = getQueryFields(busObjCat);
    }

    // Add where conditions to the query fields if whereConditions is provided
    if (whereConditions && whereConditions.length > 0) {
      // Initialize queryFields.where as an array if it's undefined
      if (!queryFields.where) {
        queryFields.where = [];
      }
      whereConditions.forEach((whereCondition) => {
        queryFields.where.push(whereCondition);
      });
    }

    // Add OR conditions to the query fields if orConditions is provided
    if (orConditions && orConditions.length > 0) {
      // Initialize queryFields.where as an array if it's undefined
      if (!queryFields.or) {
        queryFields.or = [];
      }
      orConditions.forEach((orCondition) => {
        queryFields.or.push(orCondition);
      });
    }

    // Common query data for the API request
    const commonQueryData = {
      userID: APP.LOGIN_USER_ID,
      client: parseInt(APP.LOGIN_USER_CLIENT),
      language: APP.LOGIN_USER_LANGUAGE,
      query: JSON.stringify(queryFields),
      testMode: TEST_MODE,
      appName: JSON.stringify(getAppName(busObjCat)),
      intStatus: JSON.stringify([INTSTATUS.ACTIVE]),
    };

    // Add optional parameters if any
    if (page !== null) {
      commonQueryData.page = page;
      if (limit !== null && page >= 1) {
        commonQueryData.limit = limit;
        commonQueryData.start = (page - 1) * limit;
      }
    }

    if (getSortConditions(busObjCat)) {
      commonQueryData.sort = JSON.stringify(getSortConditions(busObjCat));
    }

    console.debug(
      `Query data for ${busObjCat}: ${JSON.stringify(commonQueryData)}`
    );

    // Convert common query data to URLSearchParams
    const formData = new URLSearchParams(commonQueryData);

    // Fetch data using the fetchData function
    const busObjCatData = await fetchData(
      API_ENDPOINTS.QUERY,
      "POST",
      {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      formData.toString()
    );

    // Handle errors if present in the response
    if (!busObjCatData || busObjCatData.errorCode) {
      console.error(busObjCatData.errorMessage);
      showToast(
        "An error occurred during fetching " + busObjCat + " data.",
        "error"
      );
      return { error: busObjCatData.errorMessage };
    }

    // Return fetched data along with page number and limit
    return { data: busObjCatData.data, page, limit };
  } catch (error) {
    console.error("Error: fetching " + busObjCat + " data: ", error);
  }
};

/**
 * Returns the application app path name based on the specified business object category.
 * @param {string} busObjCat - The business object category.
 * @returns {string} - The application path name.
 */
const getAppName = (busObjCat) => {
  switch (busObjCat) {
    case BUSOBJCAT.TIMESHEET:
      return APP_NAME.TIMESHEET;
    case BUSOBJCAT.EXPENSE:
      return APP_NAME.EXPENSE;
    case BUSOBJCAT.ABSENCE:
      return APP_NAME.ABSENCE;
    default:
      console.debug("None of the case matched in getAppName :", busObjCat);
      return;
  }
};

/**
 * Determines whether any list should not be replaced based on the specified business object category.
 * @param {string} busObjCat - The business object category.
 * @returns {boolean} - Returns true if the list should not be replaced; otherwise, false.
 */
const isDoNotReplaceAnyList = (busObjCat) => {
  switch (busObjCat) {
    case BUSOBJCAT.TIMESHEET:
      return true;
    case BUSOBJCAT.EXPENSE:
      return false;
    case BUSOBJCAT.ABSENCE:
      return true;
    default:
      console.debug(
        "None of the case matched in doNotReplaceAnyList :",
        busObjCat
      );
      return;
  }
};

/**
 * Loads more data for the specified business object category and updates the list data state.
 * @param {string} busObjCat - The business object category for which data is being loaded.
 * @param {number} page - The page number to load.
 * @param {number} limit - The limit of items per page.
 * @param {Object} queryFields - The query fields configuration.
 * @param {Array<Object>} whereConditions - Array of where conditions for the query.
 * @param {Array<Object>} orConditions - Array of OR conditions for the query.
 * @param {function} setListData - Function to update the list data state.
 * @param {function} setLoading - Function to update the loading state.
 * @param {function} setError - Function to update the error state.
 * @returns {void}
 */
const loadMoreData = async (
  busObjCat,
  page,
  limit,
  queryFields,
  whereConditions,
  orConditions,
  setListData,
  setLoading,
  setError
) => {
  try {
    console.debug(
      `Loading more data for busObjCat: ${busObjCat}. Current page is ${page}. Limit is ${limit}.`
    );

    // Set loading state to indicate that the load more operation is in progress
    setLoading(true);

    // Fetch additional data for the specified page and limit
    const fetchResponse = await fetchBusObjCatData(
      busObjCat,
      page,
      limit,
      queryFields,
      whereConditions,
      orConditions
    );

    // Check if there is an error in the fetch response
    if (!fetchResponse.error) {
      // Extract new data from the fetch response
      const newData = fetchResponse.data;

      // Check if there is new data to append
      if (newData.length > 0) {
        // Log keys of the new data
        console.debug(
          "New Data Keys:",
          newData.map((item) => item[`${BUSOBJCATMAP[busObjCat]}-id`])
        );

        setListData((prevData) => {
          // Log keys of the previous data
          console.debug(
            "Previous data keys:",
            prevData.map((item) => item[`${BUSOBJCATMAP[busObjCat]}-id`])
          );

          // Filter out new data items that are already present in the previous data
          const filteredNewData = newData.filter(
            (newItem) =>
              !prevData.some(
                (prevItem) =>
                  prevItem[`${BUSOBJCATMAP[busObjCat]}-id`] ===
                  newItem[`${BUSOBJCATMAP[busObjCat]}-id`]
              )
          );

          // Log keys of the filtered new data
          console.debug(
            "Filtered New Data Keys:",
            filteredNewData.map((item) => item[`${BUSOBJCATMAP[busObjCat]}-id`])
          );

          // Concatenate the filtered new data with the existing data
          return [...prevData, ...filteredNewData];
        });
      }

      // Reset error state
      setError(null);
    } else {
      // Handle the case where there is an error in fetching data
      setError(fetchResponse.error);
    }
  } catch (error) {
    // Handle any errors that occur during the load more operation
    console.error(`Error loading more data: ${error}`);
    setError(`Error loading more data: ${error}`);
  } finally {
    // Reset the loading state regardless of success or failure
    setLoading(false);
  }
};

/**
 * Uploads a binary resource (e.g., image) to the server.
 * @param {string} imagePath - The local path of the image to be uploaded.
 * @returns {Promise<Object>} - A promise resolving to an object containing uploaded photo and thumbnail IDs.
 */
const uploadBinaryResource = async (imagePath) => {
  try {
    // Obtain new object IDs from the server
    const queryStringParams = convertToQueryString({ count: 50 });
    const objectIds = await fetchData(
      `${API_ENDPOINTS.NEW_OBJECT_ID}?${queryStringParams}`
    );

    // Check if new object IDs were obtained successfully
    if (!objectIds || !(objectIds instanceof Array) || objectIds.length === 0) {
      throw new Error("Failed to obtain new object ID");
    }

    // Extract photo and thumbnail IDs from the obtained object IDs
    const photoId = objectIds[objectIds.length - 1];
    const thumbId = objectIds.length > 1 ? objectIds[objectIds.length - 2] : "";

    // Prepare form data for upload
    const formData = new FormData();
    formData.append("resourceFile", {
      uri: imagePath,
      type: "image/png",
      name: "user-photo.jpg",
    });
    formData.append("tHeight", "600");
    formData.append("tWidth", "400");
    formData.append("photoID", photoId);
    formData.append("thumbID", thumbId);
    formData.append("convertToPng", "true");

    // Upload the binary resource
    const queryStringParams1 = convertToQueryString({
      client: APP.LOGIN_USER_CLIENT,
      allClient: false,
    });
    const uploadResourceResponse = await fetchData(
      `${API_ENDPOINTS.UPLOAD_BINARY_RESOURCE}?${queryStringParams1}`,
      "POST",
      {
        "Content-Type": "multipart/form-data",
      },
      formData
    );

    // Check if the upload was successful
    if (!uploadResourceResponse.success) {
      throw new Error("Failed to upload binary resource");
    }

    // Log upload status and return uploaded photo and thumbnail IDs
    console.debug(
      "Binary Resource upload status:",
      JSON.stringify(uploadResourceResponse)
    );

    const binaryResource = {
      photoId: uploadResourceResponse.id,
      thumbId: uploadResourceResponse.thumbID,
    };

    return binaryResource;
  } catch (error) {
    console.error("Error in uploadBinaryResource:", error);
  }
};

/**
 * Converts an object to a query string.
 * @param {Object} params - The object containing key-value pairs to be converted to a query string.
 * @returns {string} - The generated query string.
 */
const convertToQueryString = (params) => {
  return Object.keys(params)
    .map(
      (key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
    )
    .join("&");
};

export {
  convertToQueryString,
  fetchData,
  fetchAndCacheResource,
  fetchBusObjCatData,
  getAppName,
  isDoNotReplaceAnyList,
  loadMoreData,
  uploadBinaryResource,
};
