import { API_ENDPOINTS, APP } from "../constants";
import { fetchData } from "./APIUtils";
import { showToast } from "./MessageUtils";

/**
 * Checks the status of a document based on various business object parameters
 * and determines if certain activities are allowed based on the document's status.
 * This function makes an asynchronous API call to retrieve the document status
 * and then processes the response to determine if the current activity is allowed.
 *
 * @param {Function} translation - A function used for translating messages.
 * It takes a key and returns the corresponding translated message.
 * @param {string} busObjCatActivityId - The activity Id associated with the business object category.
 * @param {string} busObjCat - The category of the business object.
 * @param {string} busObjId - The ID of the business object.
 * @param {string} busObjType - The type of the business object.
 * @param {string} busObjExtStatus - The external status of the business object.
 * @param {Function} setCurrentStatus - A function to set the current status of the document.
 * @param {Function} setListOfNextStatus - A function to set the list of next possible statuses for the document.
 * @returns {Promise<{ changeAllowed: boolean, displayCustomStatus: boolean }>}
 * An object indicating if changes are allowed in the document and whether to display the CustomStatus component.
 */
const documentStatusCheck = async (
  translation,
  busObjCatActivityId,
  busObjCat,
  busObjId,
  busObjType,
  busObjExtStatus,
  setCurrentStatus,
  setListOfNextStatus
) => {
  // If busObjType is not provided, assume no status check is required and return true.
  if (!busObjType) {
    return { changeAllowed: true, displayCustomStatus: false };
  }

  // Construct the payload object with necessary details including user information, business object details, and external status.
  const payload = {
    statusUIData: JSON.stringify({
      busObjCat,
      busObjID: busObjId,
      busObjType,
      subID: null,
      multiSubProcessField: null,
      extStatus: busObjExtStatus,
      userID: APP.LOGIN_USER_ID,
      client: parseInt(APP.LOGIN_USER_CLIENT),
      languageID: APP.LOGIN_USER_LANGUAGE,
      readDate: null,
    }),
  };

  console.debug("Payload in get document status", JSON.stringify(payload));

  // Convert the payload object into URLSearchParams format for form-encoded submission.
  const formData = new URLSearchParams(payload);

  try {
    // Make an asynchronous call to the GET_DOCUMENT_STATUS endpoint using fetchData.
    const response = await fetchData(
      API_ENDPOINTS.GET_DOCUMENT_STATUS,
      "POST",
      {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      formData.toString()
    );

    // If the response is null or undefined, show an error toast message and log an error to the console.
    if (!response) {
      showToast(translation("failed_to_retrieve_document_status"), "error");
      console.error(
        "Response is null or undefined in getting document status.",
        response
      );
      return { changeAllowed: false, displayCustomStatus: false };
    }

    // Check if the response indicates a failure.
    if (
      response.success === false &&
      response.errorDetail ===
        "RuntimeException: No process instance or template found for given parameters"
    ) {
      // If the response indicates that no process template is assigned to the business object category.
      console.debug("No workflow is assigned to this document type.");

      // Return indicating changes are allowed but CustomStatus should not be displayed.
      return { changeAllowed: true, displayCustomStatus: false };
    }

    // Set the current status and list of next possible statuses using the provided state-setting functions.
    setCurrentStatus(response.data?.primaryStateUI || {});
    setListOfNextStatus(response.data?.nextStatesUI || []);

    // Process the activityInfluence from the response to identify activities that are not allowed (displayModeOnly activities).
    const activityInfluence = response.data?.activityInfluence || [];
    const notAllowedActivities = activityInfluence
      .filter((activity) => activity?.displayModeOnly)
      .map((activity) => activity.activityID);

    // Check if the current activity Id (busObjCatActivityId) is in the list of not allowed activities.
    if (notAllowedActivities.includes(busObjCatActivityId)) {
      showToast(translation("workflow_status_not_allow_activity"), "error");
      return { changeAllowed: false, displayCustomStatus: true };
    }

    // If all checks pass, return true indicating the activity is allowed.
    return { changeAllowed: true, displayCustomStatus: true };
  } catch (error) {
    // Log the error and show a toast message indicating an error occurred while checking document status.
    console.error("Error in get document status: ", error);
    showToast(translation("error_checking_document_status"), "error");
    return { changeAllowed: false, displayCustomStatus: false };
  }
};

export { documentStatusCheck };
