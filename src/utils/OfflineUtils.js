import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

/**
 * Add a new request to the queue
 * @param {Object} requestData - The data of the request to be added to the queue.
 * @param {Array} requestQueue - The current request queue. Default is an empty array.
 * @returns {Promise<void>} - A promise indicating the completion of adding the request to the queue.
 */
export const addToRequestQueue = async (requestData, requestQueue = []) => {
  try {
    console.log(
      `Adding request to the queue: ${JSON.stringify(requestData)}`
    );

    // Add the request to the queue
    const queue = [...requestQueue, requestData];
    await AsyncStorage.setItem("requestQueue", JSON.stringify(queue));

    console.log(`After addition queue: ${JSON.stringify(queue)}`);
    return true;
  } catch (error) {
    console.error("Error adding to request queue:", error);
  }
};

/**
 * Checks the network connectivity and returns a boolean indicating whether the device is connected to the internet.
 * @returns {Promise<boolean>} - A promise resolving to true if the device is connected, otherwise false.
 */
const checkNetworkConnectivity = async () => {
  try {
    const networkState = await NetInfo.fetch();
    return networkState.isConnected;
  } catch (error) {
    console.error("Error checking network connectivity:", error);
    return false;
  }
};

/**
 * Retrieves the value of isRequestQueueEnabled from AsyncStorage.
 * @returns {Promise<boolean>} - A promise resolving to the value of isRequestQueueEnabled.
 *                              Returns true if the value exists in AsyncStorage and can be parsed as a boolean,
 *                              otherwise returns false.
 */
const getIsRequestQueueEnabled = async () => {
  try {
    const value = await AsyncStorage.getItem("isRequestQueueEnabled");
    return value !== null ? JSON.parse(value) : false; // If value is not found, default to false
  } catch (error) {
    console.error(
      "Error getting isRequestQueueEnabled from AsyncStorage: ",
      error
    );
    return false; // Return false in case of error
  }
};

/**
 * Handles offline requests by adding them to the request queue or throwing an error if the queue mechanism is not enabled.
 * @param {Object} requestData - The data of the failed request including endpoint, method, headers, and body.
 * @param {boolean} isRequestQueueEnabled - Flag indicating whether the request queue mechanism is enabled.
 * @returns {Promise<void>} - A promise indicating the completion of handling the offline request.
 * @throws {Error} - Throws an error if the request queue mechanism is not enabled and the request cannot be added to the queue.
 */
const handleOfflineRequest = async (requestData, isRequestQueueEnabled) => {
  try {
    // If request queue is enabled, add the failed request to the queue for later retry
    if (isRequestQueueEnabled) {
      const enqueueResult = await addToRequestQueue(requestData);
      return enqueueResult;
    } else {
      // If request queue is not enabled, throw an error indicating offline status
      throw new Error("Device is offline. Failed to fetch.");
    }
  } catch (error) {
    console.error("Error handling offline request:", error);
    throw error;
  }
};

/**
 * Function to process a single request
 * @param {Object} request - The request to be processed.
 * @returns {Promise<void>} - A promise indicating the completion of the request processing.
 */
const processRequest = async (request) => {
  // Process the request (e.g., send it to the server)
  console.log("Processing request:", request);
  try {
    // Simulate sending request to the server
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log("Request processed successfully");
  } catch (error) {
    console.error("Error processing request:", error);
  }
};

/**
 * Function to process the request queue
 * @param {Array} requestQueue - The request queue to be processed.
 * @returns {Promise<void>} - A promise indicating the completion of the request queue processing.
 */
const processRequestQueue = async (requestQueue) => {
  // Process requests if the device is online and there are pending requests
  if (requestQueue.length > 0) {
    // Process requests
    for (const request of requestQueue) {
      await processRequest(request);
    }
    // Clear request queue after processing
    await AsyncStorage.removeItem("requestQueue");
  }
};

export {
  checkNetworkConnectivity,
  getIsRequestQueueEnabled,
  handleOfflineRequest,
  processRequestQueue,
};
