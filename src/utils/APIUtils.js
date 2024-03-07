import * as FileSystem from "expo-file-system";

import {
  API_ENDPOINTS,
  API_TIMEOUT,
  APP,
  APP_ACTIVITY_ID,
  BUSOBJCAT,
  INTSTATUS,
  PAGE_SIZE,
  TEST_MODE,
} from "../constants";
import { changeDateToAPIFormat } from "./FormatUtils";
import { showToast } from "../utils/MessageUtils";

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
    console.debug("Response text: " + responseText);
    const jsonResponse = JSON.parse(responseText);
    return jsonResponse;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const fetchAndCacheImage = async (id) => {
  try {
    console.debug(`Going to fetch image with id: ${id}`);

    if (!id) {
      console.debug("Image ID is blank, skipping fetch");
      return;
    }

    const cachePath = `${FileSystem.cacheDirectory}${id}.png`;

    // Check if image is in cache
    const fileInfo = await FileSystem.getInfoAsync(cachePath);

    if (fileInfo.exists) {
      console.debug(`Image ${id} is in cache, return the cached path`);
      return cachePath;
    } else {
      console.debug(`Image ${id} not in cache, fetch from API`);
      const apiResponse = await fetch(
        `${API_ENDPOINTS.RESOURCE}/${id}?client=${APP.LOGIN_USER_CLIENT}`
      );

      console.debug(apiResponse.status);

      if (!apiResponse.ok) {
        throw new Error(
          `Failed to fetch image ${id}. Status: ${apiResponse.status}, Status Text: ${apiResponse.statusText}`
        );
      }

      const imageBlob = await apiResponse.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64String = reader.result.split(",")[1];

          await FileSystem.writeAsStringAsync(cachePath, base64String, {
            encoding: FileSystem.EncodingType.Base64,
          });

          console.debug("Image saved to cache: ", cachePath);
          resolve(cachePath);
        };

        reader.onerror = (error) => {
          console.error("Error reading image blob:", error);
          reject(error);
        };

        reader.readAsDataURL(imageBlob);
      });
    }
  } catch (error) {
    console.error(`Error fetching and caching image for ID ${id}: `, error);
    throw error;
  }
};

const getQueryFields = (busObjCat) => {
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
      console.error("Invalid busObjCat:", busObjCat);
      return;
  }
};

const getAppName = (busObjCat) => {
  switch (busObjCat) {
    case BUSOBJCAT.TIMESHEET:
      return APP_ACTIVITY_ID.TIMESHEET;
    case BUSOBJCAT.EXPENSE:
      return APP_ACTIVITY_ID.EXPENSE;
    case BUSOBJCAT.ABSENCE:
      return APP_ACTIVITY_ID.ABSENCE;
    default:
      console.error("Invalid busObjCat:", busObjCat);
      return;
  }
};

const getSortConditions = (busObjCat) => {
  switch (busObjCat) {
    case BUSOBJCAT.TIMESHEET:
      return [{ property: "TimeConfirmation-changedOn", direction: "DESC" }];
    case BUSOBJCAT.EXPENSE:
      return [{ property: "ExpenseClaim-changedOn", direction: "DESC" }];
    case BUSOBJCAT.ABSENCE:
      return [{ property: "Absence-start", direction: "DESC" }];
    default:
      console.error("Invalid busObjCat:", busObjCat);
      return;
  }
};

const fetchBusObjCatData = async (
  busObjCat,
  page = 1,
  limit = PAGE_SIZE,
  whereConditionsFromFilter = []
) => {
  try {
    const queryFields = getQueryFields(busObjCat);

    // Add where conditions from filters to the list of where conditions
    // in business object category query
    whereConditionsFromFilter.forEach((whereCondition) => {
      queryFields.where.push(whereCondition);
    });

    const commonQueryData = {
      userID: APP.LOGIN_USER_ID,
      client: parseInt(APP.LOGIN_USER_CLIENT),
      language: APP.LOGIN_USER_LANGUAGE,
      query: JSON.stringify(queryFields),
      testMode: TEST_MODE,
      appName: JSON.stringify(getAppName(busObjCat)),
      intStatus: JSON.stringify([INTSTATUS.ACTIVE]),
      page,
      start: (page - 1) * limit,
      limit,
      sort: JSON.stringify(getSortConditions(busObjCat)),
    };

    console.debug(
      `Query data for ${busObjCat}: ${JSON.stringify(commonQueryData)}`
    );

    const formData = new URLSearchParams(commonQueryData);

    const busObjCatData = await fetchData(
      API_ENDPOINTS.QUERY,
      "POST",
      {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      formData.toString()
    );

    if (!busObjCatData || busObjCatData.errorCode) {
      console.error(busObjCatData.errorMessage);
      showToast("An error occurred during fetching " + busObjCat + " data.");
      return { error: busObjCatData.errorMessage };
    }

    return { data: busObjCatData.data, page, limit };
  } catch (error) {
    console.error("Error: fetching " + busObjCat + " data: ", error);
  }
};

const busObjCatMap = {
  [BUSOBJCAT.TIMESHEET]: "TimeConfirmation",
  [BUSOBJCAT.EXPENSE]: "ExpenseClaim",
  [BUSOBJCAT.ABSENCE]: "Absence",
};

const loadMoreData = async (
  busObjCat,
  page,
  limit,
  whereConditionsFromFilter,
  setListData,
  setLoading,
  setError
) => {
  try {
    console.debug("Loading more data for busObjCat:", busObjCat);
    console.debug("Page:", page);
    console.debug("Limit:", limit);

    // Set loading state to indicate that the load more operation is in progress
    setLoading(true);

    // Fetch additional data for the specified page and limit
    const fetchResponse = await fetchBusObjCatData(
      busObjCat,
      page,
      limit,
      whereConditionsFromFilter
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
          newData.map((item) => item[`${busObjCatMap[busObjCat]}-id`])
        );

        // Concatenate the new data with the existing data
        setListData((prevData) => {
          // Log keys of the previous data
          console.debug(
            "Previous data keys:",
            prevData.map((item) => item[`${busObjCatMap[busObjCat]}-id`])
          );
          return [...prevData, ...newData];
        });
      } else {
        // Show a message if there is no more data to load
        showToast("No more data to load");
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

const uploadBinaryResource = async (imagePath) => {
  try {
    const queryStringParams = convertToQueryString({
      count: 50,
    });

    const objectIds = await fetchData(
      `${API_ENDPOINTS.NEW_OBJECT_ID}?${queryStringParams}`
    );

    if (!objectIds || !(objectIds instanceof Array) || objectIds.length === 0) {
      throw new Error("Failed to obtain new object ID");
    }

    const photoId = objectIds[objectIds.length - 1];
    const thumbId = objectIds.length > 1 ? objectIds[objectIds.length - 2] : "";

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

    if (!uploadResourceResponse.success) {
      throw new Error("Failed to upload binary resource");
    }

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

const updateFields = async (formData, customQueryStringParams) => {
  try {
    const queryStringParams = convertToQueryString({
      changeDate: changeDateToAPIFormat(new Date()),
      userID: APP.LOGIN_USER_ID,
      client: parseInt(APP.LOGIN_USER_CLIENT),
      language: APP.LOGIN_USER_LANGUAGE,
      testMode: APP.TEST_MODE ? APP.TEST_MODE : null,
      ...customQueryStringParams,
    });

    const updateResponse = await fetchData(
      `${API_ENDPOINTS.UPDATE_FIELDS}?${queryStringParams}`,
      "POST",
      {
        "Content-Type": "application/json",
      },
      JSON.stringify(formData)
    );

    if (!updateResponse.success) {
      showToast("Failed to update");
      throw new Error(JSON.stringify(updateResponse));
    }

    console.debug(JSON.stringify(updateResponse));
    const messageText =
      updateResponse?.details?.[0]?.messages?.[0]?.message_text;
    showToast(messageText);
  } catch (error) {
    console.error("Error in updateFields:", error);
  }
};

const convertToQueryString = (params) => {
  return Object.keys(params)
    .map(
      (key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
    )
    .join("&");
};

export {
  fetchData,
  fetchAndCacheImage,
  fetchBusObjCatData,
  loadMoreData,
  updateFields,
  uploadBinaryResource,
};
