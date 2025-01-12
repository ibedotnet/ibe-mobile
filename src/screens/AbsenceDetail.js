import React, { useCallback, useEffect, useState, useRef } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";

import {
  API_ENDPOINTS,
  APP,
  APP_ACTIVITY_ID,
  APP_NAME,
  BUSOBJCAT,
  BUSOBJCATMAP,
  INTSTATUS,
  PREFERRED_LANGUAGES,
  TEST_MODE,
} from "../constants";

import CustomButton from "../components/CustomButton";

import AbsenceDetailGeneral from "./AbsenceDetailGeneral";
import File from "./File";
import Comment from "./Comment";
import History from "./History";

import {
  fetchData,
  getAppNameByCategory,
  isDoNotReplaceAnyList,
} from "../utils/APIUtils";
import {
  getRemarkText,
  isEqual,
  normalizeDateToUTC,
} from "../utils/FormatUtils";
import { setOrClearLock } from "../utils/LockUtils";
import { showToast } from "../utils/MessageUtils";
import { screenDimension } from "../utils/ScreenUtils";
import updateFields from "../utils/UpdateUtils";
import { documentStatusCheck } from "../utils/WorkflowUtils";

import CustomBackButton from "../components/CustomBackButton";
import Loader from "../components/Loader";

import { useAbsenceForceRefresh } from "../../context/ForceRefreshContext";
import { useAbsenceSave } from "../../context/SaveContext";
import useEmployeeInfo from "../hooks/useEmployeeInfo";
import {
  fetchAbsenceTypes,
  fetchListData,
  fetchProcessTemplate,
  getAbsenceFields,
} from "../utils/AbsenceUtils";

const Tab = createMaterialTopTabNavigator();

const AbsenceDetail = ({ route, navigation }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const { updateForceRefresh } = useAbsenceForceRefresh();

  const { notifySave } = useAbsenceSave();

  const updatedValuesRef = useRef({});

  const statusTemplateExtId = route?.params?.statusTemplateExtId;
  const openedFromApproval = route?.params?.openedFromApproval;

  const [absenceId, setAbsenceId] = useState(route?.params?.absenceId);
  // Determine if the component is in edit mode (if a absence id is provided)
  // True if editing an existing absence, false if creating a new one
  const [isEditMode, setIsEditMode] = useState(!!absenceId);
  const [itemStatusIDMap, setItemStatusIDMap] = useState(null);
  const [absenceTypeOptions, setAbsenceTypeOptions] = useState(null);
  const [dayFractionOptions, setDayFractionOptions] = useState(null);
  const [currentStatus, setCurrentStatus] = useState({});
  const [listOfNextStatus, setListOfNextStatus] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updatedValues, setUpdatedValues] = useState({});

  const [absenceFiles, setAbsenceFiles] = useState([]);
  const [absenceComments, setAbsenceComments] = useState([]);
  const [absenceType, setAbsenceType] = useState("");
  const [absenceEmployeeId, setAbsenceEmployeeId] = useState("");
  const [absenceEmployeeName, setAbsenceEmployeeName] = useState("");
  const [absenceStart, setAbsenceStart] = useState(null);
  const [absenceEnd, setAbsenceEnd] = useState(null);
  const [absenceStartDayFraction, setAbsenceStartDayFraction] = useState(null);
  const [absenceEndDayFraction, setAbsenceEndDayFraction] = useState(null);
  const [absencePlannedDays, setAbsencePlannedDays] = useState(null);
  const [absenceSubmittedOn, setAbsenceSubmittedOn] = useState(null);
  const [absenceAdjustAbsence, setAbsenceAdjustAbsence] = useState(false);
  const [absenceHoursByDay, setAbsenceHoursByDay] = useState([]);
  const [absenceExtStatus, setAbsenceExtStatus] = useState({});
  const [absenceRemark, setAbsenceRemark] = useState("");
  const [absenceTypeDetails, setAbsenceTypeDetails] = useState({}); // Stores details of the selected absence type, if available
  const [allAbsenceTypes, setAllAbsenceTypes] = useState({}); // Maintains a map of all available absence types

  // Use custom hook to get the employeeInfo based on openedFromApproval flag
  const employeeInfo = useEmployeeInfo(openedFromApproval);

  // Destructuring necessary properties from employeeInfo
  const {} = employeeInfo;

  /**
   * This function checks if there are unsaved changes by verifying if the `updatedValuesRef` object has any keys.
   * It uses the `useCallback` hook to ensure the function is only recreated when necessary, optimizing performance.
   *
   * @param {Object} updatedValuesRef - A reference object containing updated values. If it has any keys, it indicates unsaved changes.
   *
   * @returns {boolean} - Returns `true` if there are unsaved changes, otherwise `false`.
   */
  const hasUnsavedChanges = useCallback(() => {
    console.log(
      "Updated values reference (if any) in hasUnsavedChanges: ",
      JSON.stringify(updatedValuesRef)
    );

    return Object.keys(updatedValuesRef.current).length > 0;
  }, [updatedValuesRef]);

  const showUnsavedChangesAlert = (onDiscard) => {
    Alert.alert(
      t("unsaved_changes_title"),
      t("unsaved_changes_message"),
      [
        {
          text: t("cancel"),
          style: "cancel",
        },
        {
          text: t("discard"),
          style: "destructive",
          onPress: () => {
            // Reset updatedValuesRef.current and call onDiscard
            updatedValuesRef.current = {};
            setUpdatedValues({});
            onDiscard();
          },
        },
      ],
      { cancelable: false }
    );
  };

  const handleLock = async () => {
    /**
     * Proceed only if the edit mode is enabled.
     */
    if (isEditMode) {
      /**
       * Check if changes are allowed based on the document's current status.
       * Calls the `documentStatusCheck` function to validate whether the action can proceed.
       */
      const { changeAllowed } = await documentStatusCheck(
        t,
        APP_ACTIVITY_ID.ABSENCE,
        BUSOBJCATMAP[BUSOBJCAT.ABSENCE],
        absenceId,
        absenceType,
        absenceExtStatus,
        setCurrentStatus,
        setListOfNextStatus
      );

      /**
       * If changes are not allowed (changeAllowed is false), exit the function.
       */
      if (!changeAllowed) {
        return;
      }

      /**
       * Determine whether to lock or unlock based on the current 'isLocked' state.
       * If 'isLocked' is true, action will be 'set' (lock). Otherwise, it will be 'clear' (unlock).
       */
      const action = isLocked ? "set" : "clear";

      /**
       * Perform the lock or unlock operation based on the action determined.
       * The `setOrClearLock` function handles both locking and unlocking, updating UI states (lock status, loading state).
       */
      setOrClearLock(
        action,
        BUSOBJCATMAP[BUSOBJCAT.ABSENCE],
        absenceId,
        setIsLocked,
        setLoading
      );
    }
  };

  /**
   * Handles reloading the absence data.
   * - Fetches the latest absence data if there are no unsaved changes.
   * - Shows an alert to confirm discarding unsaved changes before fetching data.
   */
  const handleReload = () => {
    const reloadData = () => {
      fetchAbsence(); // Fetch the latest absence data
    };

    hasUnsavedChanges() ? showUnsavedChangesAlert(reloadData) : reloadData();
  };

  const handleAbsenceDetailChange = (values) => {
    console.log(`Updated values in Absence Detail: ${JSON.stringify(values)}`);

    const updatedChanges = { ...updatedValues };

    if (
      values.absenceRemark !== undefined &&
      !isEqual(values.absenceRemark, absenceRemark)
    ) {
      setAbsenceRemark(values.absenceRemark);
      updatedChanges["remark:text"] = getRemarkText(
        values.absenceRemark,
        lang,
        PREFERRED_LANGUAGES
      );
    }

    if (
      values.absenceStartDate !== undefined &&
      !isEqual(values.absenceStartDate, absenceStart)
    ) {
      setAbsenceStart(values.absenceStartDate);
      updatedChanges["start"] = values.absenceStartDate;
    }

    if (
      values.absenceEndDate !== undefined &&
      !isEqual(values.absenceEndDate, absenceEnd)
    ) {
      setAbsenceEnd(values.absenceEndDate);
      updatedChanges["end"] = values.absenceEndDate;
    }

    if (
      values.absenceStartDayFraction !== undefined &&
      !isEqual(values.absenceStartDayFraction, absenceStartDayFraction)
    ) {
      setAbsenceStartDayFraction(values.absenceStartDayFraction);
      updatedChanges["startHalfDay"] = values.absenceStartDayFraction;
    }

    if (
      values.absenceEndDayFraction !== undefined &&
      !isEqual(values.absenceEndDayFraction, absenceEndDayFraction)
    ) {
      setAbsenceEndDayFraction(values.absenceEndDayFraction);
      updatedChanges["endHalfDay"] = values.absenceEndDayFraction;
    }

    if (
      values.absenceDuration !== undefined &&
      !isEqual(values.absenceDuration, absencePlannedDays)
    ) {
      setAbsenceEndDayFraction(values.absenceDuration);
      updatedChanges["plannedDays"] = values.absenceDuration;
    }

    if (
      values.absenceType !== undefined &&
      !isEqual(values.absenceType, absenceType)
    ) {
      setAbsenceEndDayFraction(values.absenceType);
      updatedChanges["type"] = values.absenceType;
    }

    if (
      values.absenceFiles !== undefined &&
      !isEqual(values.absenceFiles, absenceFiles)
    ) {
      setAbsenceFiles(values.absenceFiles);
      updatedChanges["files"] = values.absenceFiles;
    }

    if (
      values.absenceComments !== undefined &&
      !isEqual(values.absenceComments, absenceComments)
    ) {
      setAbsenceComments(values.absenceComments);
      updatedChanges["comments"] = values.absenceComments;
    }

    console.log(
      `Updated changes in Absence Detail: ${JSON.stringify(updatedChanges)}`
    );

    // Update the ref
    updatedValuesRef.current = updatedChanges;
    // Update the changes state
    setUpdatedValues(updatedChanges);
  };

  const validateAbsenceOnSave = () => {
    const {} = absenceTypeDetails;

    // Check if the absence start date is provided
    if (!absenceStart) {
      Alert.alert(
        t("validation_error"), // Title of the alert
        t("start_required_message"), // Message of the alert
        [{ text: t("ok"), style: "cancel" }], // Button configuration
        { cancelable: false } // Prevents closing the alert by tapping outside
      );
      return false; // Return false to prevent saving
    }

    // Check if the absence end date is provided
    if (!absenceEnd) {
      Alert.alert(
        t("validation_error"),
        t("end_required_message"),
        [{ text: t("ok"), style: "cancel" }],
        { cancelable: false }
      );
      return false;
    }

    // Check if the absence end date is provided
    if (!absenceType) {
      Alert.alert(
        t("validation_error"),
        t("type_required_message"),
        [{ text: t("ok"), style: "cancel" }],
        { cancelable: false }
      );
      return false;
    }

    // If all validations pass, return true to proceed with saving
    return true;
  };

  const handleSave = async () => {
    try {
      const isValidAbsence = validateAbsenceOnSave();

      if (isValidAbsence) {
        await updateAbsence(updatedValues);
      }
    } catch (error) {
      console.error("Error in saving absence", error);
    }
  };

  const updateAbsence = async (updatedValues = {}) => {
    try {
      const prefixedUpdatedValues = {};
      for (const key in updatedValues) {
        prefixedUpdatedValues[`${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-${key}`] =
          updatedValues[key];
      }

      // Add the prefixed updated values to the formData
      const formData = {
        data: {
          [`${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-id`]: absenceId,
          ...prefixedUpdatedValues,
        },
      };

      const queryStringParams = {
        userID: APP.LOGIN_USER_ID,
        client: APP.LOGIN_USER_CLIENT,
        language: APP.LOGIN_USER_LANGUAGE,
        testMode: TEST_MODE,
        component: "platform",
        doNotReplaceAnyList: isDoNotReplaceAnyList(BUSOBJCAT.ABSENCE),
        appName: JSON.stringify(getAppNameByCategory(BUSOBJCAT.ABSENCE)),
      };

      const updateResponse = await updateFields(formData, queryStringParams);

      // Check if update was successful
      if (updateResponse.success) {
        // Extract the new ID from the response
        const newId = updateResponse.response?.details[0]?.data?.ids?.[0];
        if (newId) {
          setAbsenceId(newId); // Update the absenceId with the new ID
          setIsEditMode(true);
        }

        // Clear updatedValuesRef.current and updatedValues state
        updatedValuesRef.current = {};
        setUpdatedValues({});

        handleReload(); // Call handleReload after saving

        // force refresh absence data on list screen
        updateForceRefresh(true);

        // Notify that save was clicked
        notifySave();

        if (lang !== "en") {
          showToast(t("update_success"));
        }

        updateForceRefresh(true);

        if (updateResponse.message) {
          showToast(updateResponse.message);
        }
      } else {
        showToast(t("update_failure"), "error");
      }
    } catch (error) {
      console.error("Error in updateAbsence of AbsenceDetail", error);
      showToast(t("unexpected_error"), "error");
    }
  };

  const handleDelete = () => {
    if (isEditMode) {
      Alert.alert(
        t("confirm_deletion_title"),
        t("confirm_deletion_message"),
        [
          {
            text: t("cancel"),
            style: "cancel",
          },
          {
            text: t("confirm"),
            onPress: async () => {
              try {
                const formData = {
                  data: {
                    [`${
                      BUSOBJCATMAP[BUSOBJCAT.ABSENCE]
                    }-component`]: `Client-${APP.LOGIN_USER_CLIENT}-all`,
                    [`${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-extID`]: "",
                    [`${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-id`]: absenceId,
                    [`${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-intStatus`]: 3,
                  },
                };

                const queryStringParams = {
                  language: APP.LOGIN_USER_LANGUAGE,
                  userID: APP.LOGIN_USER_ID,
                  appName: APP_NAME.ABSENCE,
                  client: APP.LOGIN_USER_CLIENT,
                };

                const updateResponse = await updateFields(
                  formData,
                  queryStringParams
                );

                // Check if update was successful
                if (updateResponse.success) {
                  if (i18n.language !== "en") {
                    showToast(t("delete_success"));
                  }

                  updateForceRefresh(true);

                  // Go back to the previous screen (absence list)
                  navigation.goBack();
                } else {
                  showToast(t("delete_failure"), "error");
                }

                if (updateResponse.message) {
                  showToast(updateResponse.message);
                }
              } catch (error) {
                console.error("Error in handleDelete of AbsenceDetail", error);
                showToast(t("unexpected_error"), "error");
              }
            },
          },
        ],
        { cancelable: true } // Allow the dialog to be canceled by tapping outside of it
      );
    }
  };

  const loadAbsenceCreateDetail = async () => {
    try {
      const updatedChanges = { ...updatedValues };

      setAbsenceStart(normalizeDateToUTC(new Date()));
      setAbsenceEnd(normalizeDateToUTC(new Date()));
      setAbsenceStartDayFraction("1");
      setAbsenceEndDayFraction(null);
      setAbsencePlannedDays(1);

      updatedChanges["employeeID"] = APP.LOGIN_USER_EMPLOYEE_ID;
      updatedChanges["adjustAbsence"] = false;
      updatedChanges["adjustTaken"] = false;
      updatedChanges["start"] = normalizeDateToUTC(new Date());
      updatedChanges["end"] = normalizeDateToUTC(new Date());
      updatedChanges["startHalfDay"] = "1";
      updatedChanges["endHalfDay"] = "0";
      updatedChanges["plannedDays"] = 1;

      // Update the ref
      updatedValuesRef.current = updatedChanges;
      // Update the changes state
      setUpdatedValues(updatedChanges);

      // The status check is not required in create mode, as there's no need to verify
      // if the document can be modified. However, since this operation also sets the
      // current status and next possible statuses, enabling the customStatus component
      // to display the workflow status, we are calling it here.
      await documentStatusCheck(
        t,
        APP_ACTIVITY_ID.ABSENCE,
        BUSOBJCATMAP[BUSOBJCAT.ABSENCE],
        absenceId,
        absenceType,
        null, // Absence extStatus
        setCurrentStatus,
        setListOfNextStatus
      );
    } catch (error) {
      console.error("Error in loading absence create detail: ", error);
    } finally {
    }
  };

  const loadAbsenceDetail = async () => {
    try {
      const queryFields = {
        fields: getAbsenceFields(),
        where: [
          {
            fieldName: `${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-id`,
            operator: "=",
            value: absenceId,
          },
        ],
      };

      const commonQueryParams = {
        testMode: TEST_MODE,
        client: parseInt(APP.LOGIN_USER_CLIENT),
        user: APP.LOGIN_USER_ID,
        userID: APP.LOGIN_USER_ID,
        language: APP.LOGIN_USER_LANGUAGE,
        intStatus: JSON.stringify([INTSTATUS.ACTIVE]),
      };

      const formData = {
        query: JSON.stringify(queryFields),
        ...commonQueryParams,
      };

      const response = await fetchData(
        API_ENDPOINTS.QUERY,
        "POST",
        {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        new URLSearchParams(formData).toString()
      );

      if (
        response.success === true &&
        response.data &&
        response.data instanceof Array &&
        response.data.length > 0
      ) {
        const data = response.data[0];

        setAbsenceFiles(data[`${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-files`]);
        setAbsenceComments(data[`${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-comments`]);
        setAbsenceEmployeeId(
          data[`${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-employeeID`]
        );
        setAbsenceEmployeeName(
          data[
            `${
              BUSOBJCATMAP[BUSOBJCAT.ABSENCE]
            }-employeeID:Resource-core-name-knownAs`
          ]
        );
        setAbsenceStart(data[`${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-start`]);
        setAbsenceEnd(data[`${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-end`]);
        setAbsenceStartDayFraction(
          data[`${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-startHalfDay`]
        );
        setAbsenceEndDayFraction(
          data[`${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-endHalfDay`]
        );
        setAbsencePlannedDays(
          data[`${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-plannedDays`]
        );
        setAbsenceSubmittedOn(
          data[`${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-submittedOn`]
        );
        setAbsenceAdjustAbsence(
          data[`${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-adjustAbsence`]
        );
        setAbsenceHoursByDay(
          data[`${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-hoursByDay`]
        );
        setAbsenceRemark(data[`${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-remark`]);

        const fetchedAbsenceExtStatus =
          data[`${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-extStatus`] || {};
        setAbsenceExtStatus(fetchedAbsenceExtStatus);

        const fetchedAbsenceType =
          data[`${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-type`] || "";
        setAbsenceType(fetchedAbsenceType);

        setAbsenceTypeDetails({
          absenceTypeExtId:
            data[`${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-type:AbsenceType-extID`] ||
            "",
          absenceTypeName:
            data[`${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-type:AbsenceType-name`] ||
            "",
          absenceTypePolicyText:
            data[
              `${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-type:AbsenceType-policyText`
            ] || "",
          absenceTypeHourlyLeave:
            data[
              `${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-type:AbsenceType-hourlyLeave`
            ] || "",
          absenceTypeDisplayInHours:
            data[
              `${
                BUSOBJCATMAP[BUSOBJCAT.ABSENCE]
              }-type:AbsenceType-displayInHours`
            ] || "",
          absenceTypeIsFixedCalendar:
            data[
              `${
                BUSOBJCATMAP[BUSOBJCAT.ABSENCE]
              }-type:AbsenceType-isFixedCalendar`
            ] || "",
        });

        const { changeAllowed } = await documentStatusCheck(
          t,
          APP_ACTIVITY_ID.ABSENCE,
          BUSOBJCATMAP[BUSOBJCAT.ABSENCE],
          absenceId,
          fetchedAbsenceType,
          fetchedAbsenceExtStatus,
          setCurrentStatus,
          setListOfNextStatus
        );

        if (!changeAllowed) {
          setIsLocked(true);
        } else {
          setOrClearLock(
            "set",
            BUSOBJCATMAP[BUSOBJCAT.ABSENCE],
            absenceId,
            setIsLocked,
            setLoading
          );
        }
      }
    } catch (error) {
      console.error("Error in loading absence detail: ", error);
    }
  };

  const fetchAbsence = async () => {
    setLoading(true);

    try {
      const [_, processTemplate, absenceTypesMap, dayFractionsMap] =
        await Promise.all([
          isEditMode ? loadAbsenceDetail() : loadAbsenceCreateDetail(),
          fetchProcessTemplate(statusTemplateExtId, setItemStatusIDMap),
          fetchAbsenceTypes(),
          fetchListData("DayFraction"),
        ]);

      setItemStatusIDMap(processTemplate || {});

      setAllAbsenceTypes(absenceTypesMap);

      setAbsenceTypeOptions(
        Object.entries(absenceTypesMap).map(([key, value]) => ({
          label: value["AbsenceType-name"], // Access name for the label
          value: key,
        }))
      );
      setDayFractionOptions(
        Object.entries(dayFractionsMap).map(([key, value]) => ({
          label: value,
          value: key,
        }))
      );
    } catch (error) {
      console.error("Error in either loading absence: ", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Memoized function to render the headerLeft with CustomBackButton and title text.
   * The function re-renders only when `hasUnsavedChanges`, `isEditMode`, or `t` changes.
   */
  const headerLeft = useCallback(() => {
    return (
      <View style={styles.headerLeftContainer}>
        <CustomBackButton
          navigation={navigation}
          hasUnsavedChanges={hasUnsavedChanges()}
          t={t}
        />
        <Text
          style={styles.headerLeftText}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {isEditMode ? t("absence_edit") : t("absence_create")}
        </Text>
      </View>
    );
  }, [hasUnsavedChanges, isEditMode, t]);

  /**
   * Memoized function to render the headerRight with multiple buttons.
   * The function re-renders only when `isEditMode`, `isLocked`, `loading` or `updatedValues` change.
   */
  const headerRight = useCallback(() => {
    return (
      <View style={styles.headerRightContainer}>
        <CustomButton
          onPress={handleLock}
          label=""
          icon={{
            name: isLocked ? "lock" : "lock-open-variant",
            library: "MaterialCommunityIcons",
            size: 24,
          }}
          disabled={!isEditMode || loading}
        />
        <CustomButton
          onPress={handleReload}
          label=""
          icon={{
            name: "refresh-circle",
            library: "MaterialCommunityIcons",
            size: 24,
          }}
          disabled={!isEditMode || loading}
        />
        <CustomButton
          onPress={handleDelete}
          label=""
          icon={{
            name: "delete",
            library: "MaterialCommunityIcons",
            size: 24,
          }}
          disabled={!isEditMode || loading || isLocked}
        />
        <CustomButton
          onPress={handleSave}
          label=""
          icon={{
            name: "content-save",
            library: "MaterialCommunityIcons",
            size: 24,
          }}
          disabled={
            loading || isLocked || Object.keys(updatedValues).length === 0
          }
        />
      </View>
    );
  }, [isEditMode, isLocked, loading, updatedValues]);

  /**
   * Sets the header options for the screen, including the custom headerLeft and headerRight components.
   * This useEffect will run whenever dependencies in the header functions change.
   */
  useEffect(() => {
    navigation.setOptions({
      headerTitle: "",
      headerLeft: headerLeft,
      headerRight: headerRight,
    });
  }, [headerLeft, headerRight, navigation]);

  /**
   * This effect is responsible for fetching absence details when the component is mounted.
   * It also ensures that any lock is cleared if the user is in edit mode when the component unmounts or re-renders.
   */
  useEffect(() => {
    fetchAbsence();

    return () => {
      /**
       * Cleanup function to clear the lock when leaving the edit mode.
       * This will be executed when the component is unmounted or when dependencies change.
       * Clears the lock if `isEditMode` is true to ensure no lingering lock remains after the user exits edit mode.
       */
      if (isEditMode) {
        setOrClearLock(
          "clear",
          BUSOBJCATMAP[BUSOBJCAT.ABSENCE],
          absenceId,
          setIsLocked,
          setLoading
        );
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <Loader />
      ) : (
        /* 
        The set functions in React, like setAbsenceType(fetchedAbsenceType), are asynchronous.
        This means that when you call setAbsenceType, the state update doesn't happen immediately.
        React schedules the update to happen at a later point in the rendering cycle.
    
        As a result, there may be a brief moment where the component renders before the absenceType state update is applied.
        To prevent errors or unintended behavior during this initial render, we need to check if absenceType is defined 
        before rendering components that depend on it, such as the absence-related screens or logic.
  
        Similarly, itemStatusIDMap and other state variables are initially set to null and will be updated asynchronously 
        after fetching data, so they must be checked before being used in rendering.
        */
        (isEditMode ? absenceType : true) &&
        itemStatusIDMap && (
          <>
            <Tab.Navigator screenOptions={{ swipeEnabled: false }}>
              <Tab.Screen
                name={t("general")}
                options={{
                  tabBarLabel: ({ focused, color }) => (
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={{
                        color,
                        fontSize: 14,
                        textTransform: "uppercase",
                      }}
                    >
                      {t("general")}
                    </Text>
                  ),
                }}
              >
                {() => (
                  <GestureHandlerRootView>
                    <AbsenceDetailGeneral
                      navigation={navigation}
                      busObjCat={BUSOBJCAT.ABSENCE}
                      busObjId={absenceId}
                      isParentLocked={isLocked}
                      isEditMode={isEditMode}
                      currentStatus={currentStatus}
                      listOfNextStatus={listOfNextStatus}
                      handleReload={handleReload}
                      loading={loading}
                      setLoading={setLoading}
                      onAbsenceDetailChange={handleAbsenceDetailChange}
                      allAbsenceTypes={allAbsenceTypes}
                      absenceTypeDetails={absenceTypeDetails}
                      employeeInfo={employeeInfo}
                      pickerOptions={{ absenceTypeOptions, dayFractionOptions }}
                      absenceDetails={{
                        absenceType,
                        absenceEmployeeId,
                        absenceEmployeeName,
                        absenceStart,
                        absenceEnd,
                        absenceStartDayFraction,
                        absenceEndDayFraction,
                        absencePlannedDays,
                        absenceSubmittedOn,
                        absenceAdjustAbsence,
                        absenceHoursByDay,
                        absenceExtStatus,
                        absenceRemark,
                        itemStatusIDMap,
                      }}
                    />
                  </GestureHandlerRootView>
                )}
              </Tab.Screen>
              <Tab.Screen
                name={t("files")}
                options={{
                  tabBarLabel: ({ focused, color }) => (
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={{
                        color,
                        fontSize: 14,
                        textTransform: "uppercase",
                      }}
                    >
                      {t("files")}
                    </Text>
                  ),
                }}
              >
                {() => (
                  <File
                    busObjCat={BUSOBJCAT.ABSENCE}
                    busObjId={absenceId}
                    initialFilesIdList={absenceFiles}
                    isParentLocked={isLocked}
                  />
                )}
              </Tab.Screen>
              <Tab.Screen
                name={t("comments")}
                options={{
                  tabBarLabel: ({ focused, color }) => (
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={{
                        color,
                        fontSize: 14,
                        textTransform: "uppercase",
                      }}
                    >
                      {t("comments")}
                    </Text>
                  ),
                }}
              >
                {() => (
                  <Comment
                    busObjCat={BUSOBJCAT.ABSENCE}
                    busObjId={absenceId}
                    initialComments={absenceComments}
                    isParentLocked={isLocked}
                  />
                )}
              </Tab.Screen>
              <Tab.Screen
                name={t("history")}
                options={{
                  tabBarLabel: ({ focused, color }) => (
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={{
                        color,
                        fontSize: 14,
                        textTransform: "uppercase",
                      }}
                    >
                      {t("history")}
                    </Text>
                  ),
                }}
              >
                {() => (
                  <History busObjCat={BUSOBJCAT.ABSENCE} busObjID={absenceId} />
                )}
              </Tab.Screen>
            </Tab.Navigator>
          </>
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerLeftContainer: {
    maxWidth: screenDimension.width / 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  headerLeftText: {
    fontSize: screenDimension.width > 400 ? 18 : 16,
    fontWeight: "bold",
    color: "white",
  },
  headerRightContainer: {
    maxWidth: screenDimension.width / 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    columnGap: 8,
  },
});

export default AbsenceDetail;
