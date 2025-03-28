import React from "react";
import { StyleSheet, Text, View } from "react-native";

import CustomButton from "./CustomButton";

import {
  fetchData,
  getAppNameByCategory,
  isDoNotReplaceAnyList,
} from "../utils/APIUtils";
import { showToast } from "../utils/MessageUtils";
import updateFields from "../utils/UpdateUtils";

import {
  API_ENDPOINTS,
  APP,
  BUSOBJCAT,
  BUSOBJCATMAP,
  TEST_MODE,
} from "../constants";

import { disableOpacity } from "../styles/common";

import {
  useTimesheetForceRefresh,
  useExpenseForceRefresh,
  useAbsenceForceRefresh,
} from "../../context/ForceRefreshContext";

/**
 * CustomStatus Component renders the current status of a business object along with available next statuses.
 * @param {Object} props - The props object.
 * @param {string} props.busObjCat - Business Object Category.
 * @param {string} props.busObjId - Business Object ID.
 * @param {string} props.busObjType - Business Object Type.
 * @param {Object} props.busObjExtStatus - External status of the business object.
 * @param {boolean} props.isParentLocked - Flag indicating if the parent is locked.
 * @param {boolean} props.isEditMode - Flag indicating if it's in edit mode.
 * @param {Object} props.currentStatus - Current status of the business object.
 * @param {Array} props.listOfNextStatus - List of possible next statuses.
 * @param {Function} props.handleReload - Function to handle reloading of the parent detail screen.
 * @param {boolean} props.loading - Loading state flag.
 * @param {Function} [props.validate] - Optional validation function to be called before changing status.
 */
const CustomStatus = ({
  busObjCat,
  busObjId = "",
  busObjType = "",
  busObjExtStatus = {},
  isParentLocked = false,
  isEditMode = true,
  currentStatus = {},
  listOfNextStatus = [],
  handleReload,
  loading,
  validate,
}) => {
  // Check if both currentStatus and listOfNextStatus are empty
  const isEmpty =
    Object.keys(currentStatus).length === 0 && listOfNextStatus.length === 0;

  // If both currentStatus and listOfNextStatus are empty, don't render status container
  if (isEmpty) {
    return null;
  }

  // Determine the appropriate function to force refresh based on the business object category
  let updateForceRefresh = null;

  // If the business object category is Timesheet, retrieve the update function from the Timesheet force refresh context
  if (busObjCat === BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]) {
    ({ updateForceRefresh } = useTimesheetForceRefresh());
  }
  // If the business object category is Expense, retrieve the update function from the Expense force refresh context
  else if (busObjCat === BUSOBJCATMAP[BUSOBJCAT.EXPENSE]) {
    ({ updateForceRefresh } = useExpenseForceRefresh());
  }
  // If the business object category is Absence, retrieve the update function from the Absence force refresh context
  else if (busObjCat === BUSOBJCATMAP[BUSOBJCAT.ABSENCE]) {
    ({ updateForceRefresh } = useAbsenceForceRefresh());
  }
  // If the business object category doesn't match any specific context, assign an empty function
  else {
    updateForceRefresh = () => {};
  }

  // Extract the current status text, defaulting to an empty string if not provided
  const currentStatusText = currentStatus?.text || "";

  /**
   * Updates the document status using the setDocStatus API call.
   * @param {string} nextStateId - The ID of the next status to transition to.
   */
  const updateStatusWithSetDocStatusAPI = async (nextStateId) => {
    // Prepare payload for API call
    const payload = {
      statusUIData: JSON.stringify({
        busObjCat,
        busObjID: busObjId,
        busObjType,
        subID: null,
        multiSubProcessField: "",
        sourceRefID: currentStatus.extStatusID,
        userID: APP.LOGIN_USER_ID,
        client: parseInt(APP.LOGIN_USER_CLIENT),
        recepientsOverride: [],
        extStatusIDs: null,
        openPreviousGateways: null,
        languageID: APP.LOGIN_USER_LANGUAGE,
        extStatus: { statusID: nextStateId },
        remark: "",
        messageLogID: "",
      }),
    };

    const formData = new URLSearchParams(payload);

    try {
      // Make API call to update document status
      const response = await fetchData(
        API_ENDPOINTS.SET_DOCUMENT_STATUS,
        "POST",
        {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        formData.toString()
      );

      if (!response) {
        showToast("failed_to_update_document_status", "error");
        console.error(
          "Response is null or undefined in updating document status."
        );
        return;
      }

      if (response.success) {
        updateForceRefresh(true);
        handleReload();
        console.log(`Workflow status successfully updated in ${busObjId}`);
      }
    } catch (error) {
      console.error("Error in updating document status:", error);
      showToast("error_in_update_document_status", "error");
    }
  };

  /**
   * Updates the document status using the updateFields API call.
   * @param {string} nextStateId - The ID of the next status to transition to.
   */
  const updateStatusWithUpdateFieldsAPI = async (nextStateId) => {
    // Update the external status with the new status ID
    busObjExtStatus["statusID"] = nextStateId;

    // Prepare the form data for the update
    const formData = {
      data: {
        [`${busObjCat}-extStatus`]: busObjExtStatus,
        [`${busObjCat}-id`]: busObjId,
      },
    };

    // Prepare query string parameters
    const queryStringParams = {
      userID: APP.LOGIN_USER_ID,
      client: APP.LOGIN_USER_CLIENT,
      language: APP.LOGIN_USER_LANGUAGE,
      testMode: TEST_MODE,
      doNotReplaceAnyList: isDoNotReplaceAnyList(busObjCat),
      appName: JSON.stringify(getAppNameByCategory(busObjCat)),
      component: "platform",
    };

    // Call the update API
    const updateResponse = await updateFields(formData, queryStringParams);

    if (updateResponse.success) {
      updateForceRefresh(true);
      handleReload();
      console.log(`Workflow status successfully updated in ${busObjId}`);
    } else {
      console.log(`Workflow status update failed in ${busObjId}`);
    }
  };

  /**
   * Handles the click event for changing the status.
   * If the external status exists and nextStateId is provided and the parent is not locked,
   * it updates the external status using the updateFields API; otherwise, it uses the setDocStatus API.
   * @param {string} nextStateId - The ID of the next status to transition to.
   */
  const onClickStatus = async (nextStateId) => {
    try {
      // Check if validation is required and fails
      if (validate && typeof validate === "function" && !validate()) {
        console.warn("Validation failed. Cannot proceed with status change.");
        return;
      }

      // If the user clicks either on save or one of the next status buttons, it updates the external status
      // using the updateFields API, which internally calls the setDocStatus API.
      // In display mode, since the save functionality is disabled, we have to explicitly call the setDocStatus API directly.
      // We cannot call the setDocStatus API directly in both cases because in create mode, the document is not yet created,
      // and calling setDocStatus before the document creation will result in an error.
      if (
        busObjExtStatus &&
        busObjExtStatus.hasOwnProperty("statusID") &&
        nextStateId &&
        !isParentLocked // Not in display mode
      ) {
        await updateStatusWithUpdateFieldsAPI(nextStateId);
        return;
      }

      await updateStatusWithSetDocStatusAPI(nextStateId);
    } catch (error) {
      console.error(
        `Error in onClickStatus in step ${nextStateId}(${busObjId}): `,
        error
      );
    }
  };

  /**
   * Sorts next statuses by their preference in descending order.
   * @param {Object} a - First status object.
   * @param {Object} b - Second status object.
   * @returns {number} Sorting order.
   */
  const sortNextStepByPreference = (a, b) => {
    return b.preferred - a.preferred;
  };

  // Sort list of next statuses according to their preference
  const sortedNextStatuses = listOfNextStatus.sort(sortNextStepByPreference);

  return (
    <View style={styles.statusContainer}>
      <Text style={styles.statusText} numberOfLines={1} ellipsizeMode="tail">
        {currentStatusText}
        {listOfNextStatus.length === 0 ? "" : ":"}
      </Text>
      <View style={styles.statusButtonsContainer}>
        {sortedNextStatuses.map((status, index) => (
          <CustomButton
            key={index}
            onPress={() => onClickStatus(status.extStatusID)}
            label={status.response}
            icon={{}}
            backgroundColor={false}
            labelStyle={{
              fontSize: 14,
              color:
                loading || !isEditMode ? `#b0c4de${disableOpacity}` : "#005eb8",
              textDecorationLine: loading ? "none" : "underline",
            }}
            disabled={loading || !isEditMode}
            style={{
              marginRight: 5,
              paddingHorizontal: "1%",
              paddingVertical: 0,
            }}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statusContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  statusText: {
    fontWeight: "bold",
    marginRight: 5,
  },
  statusButtonsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
});

export default CustomStatus;
