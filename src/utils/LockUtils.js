import { API_ENDPOINTS, APP } from "../constants";
import { fetchData } from "./APIUtils";
import { showToast } from "./MessageUtils";

/**
 * Clear the lock of a resource using the LockApiController.
 * This function sends a request to the API to clear the lock of the specified resource.
 * @param {string} busObjCat - The category of the business object.
 * @param {string} busObjID - The ID of the business object.
 * @param {string} [userID=APP.LOGIN_USER_ID] - The ID of the user initiating the request. Defaults to APP.LOGIN_USER_ID.
 * @param {number} [clientID=APP.LOGIN_USER_CLIENT] - The ID of the client. Defaults to APP.LOGIN_USER_CLIENT.
 * @param {string[]} [users=[]] - An array of user IDs to clear locks associated with specific users.
 * @param {boolean} [forceClearLock=false] - Whether to force clear the lock.
 * @returns {Promise<{ msg: string, success: boolean }[]>} A Promise that resolves with an array of objects representing the response from the API.
 * Each object contains information about the success of clearing the lock.
 * @throws {Error} If there's an error while clearing the lock.
 */
const clearLock = async (
  busObjCat,
  busObjID,
  userID = APP.LOGIN_USER_ID,
  clientID = APP.LOGIN_USER_CLIENT,
  users = [],
  forceClearLock = false
) => {
  try {
    // Prepare the request body
    const requestBody = {
      interfaceName: "controllers.LockApiController",
      methodName: "clearLock",
      userID,
      paramsMap: {
        userID,
        busObjCat,
        busObjID: [busObjID],
        since: "",
        users,
        clientID,
        forceClearLock,
      },
    };

    const response = await fetchData(
      API_ENDPOINTS.INVOKE_API_NEW,
      "POST",
      {
        "Content-Type": "application/json",
      },
      JSON.stringify(requestBody)
    );

    if (response) {
      return response;
    }
  } catch (error) {
    console.error("Error clearing lock:", error);
    throw error; // Throw the error for handling at the caller level
  }
};

/**
 * This function sends a request to the API to determine if the specified resource
 * is currently locked. If it's not acquire the lock using the LockApiController.
 * @param {string} busObjCat - The category of the business object.
 * @param {string} busObjID - The ID of the business object.
 * @param {string} [userID=APP.LOGIN_USER_ID] - The ID of the user initiating the request. Defaults to APP.LOGIN_USER_ID.
 * @param {string} [clientID=APP.LOGIN_USER_CLIENT] - The ID of the client. Defaults to APP.LOGIN_USER_CLIENT.
 * @returns {Promise<{ msg: string, success: boolean }[]>} A Promise that resolves with an object representing the response from the API.
 * The object contains information about the success of the lock set.
 * @throws {Error} If there's an error while checking the lock status.
 */
const setLock = async (
  busObjCat,
  busObjID,
  userID = APP.LOGIN_USER_ID,
  clientID = APP.LOGIN_USER_CLIENT
) => {
  try {
    // Prepare the request body
    const requestBody = {
      interfaceName: "controllers.LockApiController",
      methodName: "setLock",
      userID,
      paramsMap: {
        userID,
        busObjCat,
        clientID,
        busObjID: [busObjID],
      },
    };

    const response = await fetchData(
      API_ENDPOINTS.INVOKE_API_NEW,
      "POST",
      {
        "Content-Type": "application/json",
      },
      JSON.stringify(requestBody)
    );

    if (response) {
      return response;
    }
  } catch (error) {
    console.error("Error checking lock status:", error);
    throw error; // Throw the error for handling at the caller level
  }
};

/**
 * Asynchronously sets or clears a lock for a resource.
 *
 * @param {string} action - The action to perform, either "set" to set the lock or "clear" to clear it.
 * @param {string} resourceCategory - The category of the resource.
 * @param {string} resourceId - The ID of the resource.
 * @param {function} setIsLocked - A function to set the lock status.
 * @param {function} setLoading - A function to set the loading status.
 * @returns {void}
 */
const setOrClearLock = async (
  action,
  resourceCategory,
  resourceId,
  setIsLocked,
  setLoading
) => {
  setLoading(true); // Set loading to true indicating an ongoing operation
  try {
    let response; // Declare a variable to hold the response from API
    if (action === "set") {
      // If the action is to set the lock
      response = await setLock(resourceCategory, resourceId); // Call setLock API
    } else {
      // Otherwise, if the action is to clear the lock
      const clearResponse = await clearLock(resourceCategory, resourceId); // Call clearLock API
      if (Array.isArray(clearResponse) && clearResponse.length > 0) {
        // Check if clearResponse is an array with at least one item
        const [responseItem] = clearResponse; // Extract the first item from the response array
        const { msg, success } = responseItem; // Destructure msg and success from the response item
        response = { msg, success }; // Construct a response object with msg and success properties
      } else {
        // If clearResponse is empty or invalid
        throw new Error(
          `Empty or invalid response received in clear lock of ${resourceId}`
        );
      }
    }
    const { msg, success } = response; // Destructure msg and success from the response object
    // Update the lock status based on the action performed
    setIsLocked(action === "set" ? !success : success);
    setLoading(false); // Set loading to false as the operation is complete
    if (success === false) {
      // If the operation was not successful, show a toast with the message
      showToast(msg, "error");
    }
    console.log(
      `${
        action === "set" ? "Set" : "Clear"
      } lock message of TimeConfirmation (${resourceId}): ${msg}`
    );
  } catch (error) {
    // Handle errors that occur during the operation
    console.error(
      `Error in ${action === "set" ? "set" : "clear"} lock status:`,
      error
    );
    setLoading(false); // Set loading to false indicating the operation is complete (even if it failed)
  }
};

export { setOrClearLock };
