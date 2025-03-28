import { API_ENDPOINTS } from "../constants";

import { convertToQueryString, fetchData } from "./APIUtils";
import { showToast } from "./MessageUtils";

/**
 * Updates fields with the provided form data on the server.
 * @param {Object} formData - The form data to be updated.
 * @param {Object} queryStringParams - (Optional) Additional query string parameters.
 * @returns {Object} An object containing the success status and message of the update.
 */
const updateFields = async (formData, queryStringParams) => {
  try {
    // Initialize an empty string for the query string
    let queryString = "";

    // Check if queryStringParams is valid (not null and not an empty object)
    if (queryStringParams && Object.keys(queryStringParams).length > 0) {
      queryString = `?${convertToQueryString(queryStringParams)}`;
    }

    // Send update request to the server
    const updateResponse = await fetchData(
      `${API_ENDPOINTS.UPDATE_FIELDS}${queryString}`,
      "POST",
      {
        "Content-Type": "application/json",
      },
      JSON.stringify(formData)
    );

    console.log("Response from updateFields:", JSON.stringify(updateResponse));

    // Extract message text from the response
    const messageText =
      updateResponse?.details?.[0]?.messages?.[0]?.message_text;

    // Handle if updateResponse is null or blank
    if (!updateResponse) {
      throw new Error("Unexpected response from the server.");
    }

    // Return success status and message
    return {
      success: updateResponse.success,
      message: messageText,
      response: updateResponse,
    };
  } catch (error) {
    // Log and display error message
    console.error("Error in updateFields:", error);
    showToast("An unexpected error occurred. Please try again later.", "error");
  }
};

export default updateFields;