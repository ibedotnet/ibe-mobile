import React, { useContext, useEffect, useState, useRef } from "react";
import { Alert, Keyboard, StyleSheet, View } from "react-native";
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

import SaveCancelBar from "../components/SaveCancelBar";
import CustomButton from "../components/CustomButton";

import TimesheetDetailGeneral from "./TimesheetDetailGeneral";
import File from "./File";
import Comment from "./Comment";
import History from "./History";

import {
  fetchBusObjCatData,
  fetchData,
  getAppName,
  isDoNotReplaceAnyList,
} from "../utils/APIUtils";
import {
  convertToDateFNSFormat,
  getRemarkText,
  isEqual,
  normalizeDateToUTC,
  setRemarkText,
} from "../utils/FormatUtils";
import { setOrClearLock } from "../utils/LockUtils";
import { showToast } from "../utils/MessageUtils";
import { screenDimension } from "../utils/ScreenUtils";
import updateFields from "../utils/UpdateUtils";
import { documentStatusCheck } from "../utils/WorkflowUtils";

import Loader from "../components/Loader";

import { useTimesheetForceRefresh } from "../../context/ForceRefreshContext";
import { LoggedInUserInfoContext } from "../../context/LoggedInUserInfoContext";
import { useTimesheetSave } from "../../context/SaveContext";
import { format } from "date-fns";

const Tab = createMaterialTopTabNavigator();

const TimesheetDetail = ({ route, navigation }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const { loggedInUserInfo } = useContext(LoggedInUserInfoContext);

  const { updateForceRefresh } = useTimesheetForceRefresh();

  const { notifySave } = useTimesheetSave();

  const updatedValuesRef = useRef({});

  const statusTemplateExtId = route?.params?.statusTemplateExtId;
  const selectedDate = route?.params?.selectedDate;

  const [timesheetId, setTimesheetId] = useState(route?.params?.timesheetId);
  // Determine if the component is in edit mode (if a timesheet ID is provided)
  // True if editing an existing timesheet, false if creating a new one
  const [isEditMode, setIsEditMode] = useState(!!timesheetId);
  const [keyboardShown, setKeyboardShown] = useState(false);
  const [itemStatusIDMap, setItemStatusIDMap] = useState(null);
  const [currentStatus, setCurrentStatus] = useState({});
  const [listOfNextStatus, setListOfNextStatus] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updatedValues, setUpdatedValues] = useState({});

  const [timesheetFiles, setTimesheetFiles] = useState([]);
  const [timesheetComments, setTimesheetComments] = useState([]);
  const [timesheetType, setTimesheetType] = useState("");
  const [timesheetExtStatus, setTimesheetExtStatus] = useState({});
  const [timesheetStart, setTimesheetStart] = useState(null);
  const [timesheetEnd, setTimesheetEnd] = useState(null);
  const [timesheetRemark, setTimesheetRemark] = useState("");
  const [timesheetTotalTime, setTimesheetTotalTime] = useState(0);
  const [timesheetBillableTime, setTimesheetBillableTime] = useState(0);
  const [timesheetOverTime, setTimesheetOverTime] = useState(0);
  const [timesheetTasks, setTimesheetTasks] = useState([]);
  const [timesheetAbsences, setTimesheetAbsences] = useState(null);
  const [timesheetCompanyId, setTimesheetCompanyId] = useState("");
  const [timesheetEmployeeId, setTimesheetEmployeeId] = useState("");

  const [timesheetTypeDetails, setTimesheetTypeDetails] = useState({
    defaultAsHomeDefault: "",
    defaultInputDays: "",
    headerCommentRequired: "",
    itemCommentRequired: "",
    minTimeIncrement: "",
    nonBillableComments: false,
    overtimeAllowed: false,
    validateWorkSchedule: "",
  });

  const fetchSelectedDatePeriodFromTimesheetType = async (
    timesheetTypeExtId
  ) => {
    const queryFields = {
      fields: [
        `TimeConfType-extID`,
        `TimeConfType-defaultAsHomeDefault`,
        `TimeConfType-defaultInputDays`,
        `TimeConfType-headerCommentRequired`,
        `TimeConfType-itemCommentRequired`,
        `TimeConfType-maxTasksPreload`,
        `TimeConfType-minTimeIncrement`,
        `TimeConfType-nonBillableComments`,
        `TimeConfType-overtimeAllowed`,
        `TimeConfType-validateWorkSchedule`,
        `TimeConfType-periodSchedules`,
      ],
      where: [
        {
          fieldName: "TimeConfType-busObjCat",
          operator: "=",
          value: "TimeConfirmationType",
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
      // Find the data object with the desired extID
      const data = response.data.find(
        (item) => item["TimeConfType-extID"] === timesheetTypeExtId
      );

      if (data) {
        // Set the timesheet type details with the found data
        const fetchedPeriodSchedules =
          data[`TimeConfType-periodSchedules`] || [];

        setTimesheetTypeDetails({
          defaultAsHomeDefault: data[`TimeConfType-defaultAsHomeDefault`] || "",
          defaultInputDays: data[`TimeConfType-defaultInputDays`] || "",
          headerCommentRequired:
            data[`TimeConfType-headerCommentRequired`] || "",
          itemCommentRequired: data[`TimeConfType-itemCommentRequired`] || "",
          minTimeIncrement: data[`TimeConfType-minTimeIncrement`] || "",
          nonBillableComments:
            data[`TimeConfType-nonBillableComments`] || false,
          overtimeAllowed: data[`TimeConfType-overtimeAllowed`] || false,
          validateWorkSchedule: data[`TimeConfType-validateWorkSchedule`] || "",
          periodSchedules: fetchedPeriodSchedules,
        });

        // Get the most recent period from timsheet type
        const mostRecentPeriod = await getValidPeriodFromTimesheetType(
          fetchedPeriodSchedules
        );

        if (mostRecentPeriod && mostRecentPeriod.periodSchedule) {
          console.debug(
            "Most recent valid period id:",
            mostRecentPeriod.periodSchedule
          );

          const validPeriodForSelectedDate =
            await getValidPeriodDatesFromPeriodSchedule(
              mostRecentPeriod.periodSchedule
            );

          return validPeriodForSelectedDate;
        } else {
          showToast(t("no_valid_period_in_timesheet_type"), "error");
          console.debug("No valid period found in timsheet type.");
        }
      } else {
        console.error(
          `No timesheet type found with extID ${timesheetTypeExtId}`
        );
      }
    }
  };

  const getValidPeriodFromTimesheetType = (periodSchedules) => {
    // Convert the selectedDate to a JavaScript Date object if it is not already
    const selectedDateObj = new Date(selectedDate);

    // Filter the period schedules to find the valid ones
    const validPeriods = periodSchedules.filter((record) => {
      const validFromDate = new Date(record.validFromDate);
      return validFromDate.getTime() <= selectedDateObj.getTime();
    });

    // Sort the valid periods by validFromDate in descending order
    validPeriods.sort((a, b) => {
      return (
        new Date(b.validFromDate).getTime() -
        new Date(a.validFromDate).getTime()
      );
    });

    // Return the most recent valid period or null if none are found
    return validPeriods.length > 0 ? validPeriods[0] : null;
  };

  const getValidPeriodDatesFromPeriodSchedule = async (periodScheduleId) => {
    const queryFields = {
      fields: [
        `PeriodSchedule-id`,
        `PeriodSchedule-extID`,
        `PeriodSchedule-periods`,
      ],
      where: [
        {
          fieldName: "PeriodSchedule-extID",
          operator: "=",
          value: periodScheduleId,
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

    try {
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

        const validPeriodDates = getValidPeriodFromPeriodSchedule(
          data["PeriodSchedule-periods"],
          selectedDate
        );

        if (!validPeriodDates) {
          showToast(
            t("period_schedule_missing_valid_date", { periodScheduleId }),
            "error"
          );
          console.error(
            `The period schedule with extID ${periodScheduleId} has an incorrect valid from date setup`
          );

          return;
        }

        return validPeriodDates;
      } else {
        showToast(t("period_schedule_missing", { periodScheduleId }), "error");
        console.error(
          `No period schedule data found with extID ${periodScheduleId}`
        );

        return;
      }
    } catch (error) {
      console.error("Failed to fetch period schedule data:", error);
      return;
    }
  };

  const getValidPeriodFromPeriodSchedule = (periods, selectedDate) => {
    if (periods && periods.length > 0) {
      // Normalize the selectedDate to ignore the time part
      const normalizedSelectedDate = normalizeDateToUTC(new Date(selectedDate));

      // Start searching from the end of the array
      for (let i = periods.length - 1; i >= 0; i--) {
        const periodRec = periods[i];

        if (!periodRec.start || !periodRec.end) {
          continue;
        }

        const startPeriod = normalizeDateToUTC(new Date(periodRec.start));
        const endPeriod = normalizeDateToUTC(new Date(periodRec.end));

        const locPeriod = { from: startPeriod, to: endPeriod };

        if (dateLiesInRange(normalizedSelectedDate, locPeriod)) {
          return {
            start: periodRec.start, // Return original date strings
            end: periodRec.end,
          };
        }
      }
    }
    return null;
  };

  // Function to check if a date lies within a range
  const dateLiesInRange = (date, range) => {
    return date >= range.from && date <= range.to;
  };

  const handleTimesheetDetailChange = (values) => {
    // Return early if timesheetType is not set to avoid comparing with initial empty value.
    if (!timesheetType) {
      return;
    }

    console.debug(
      `Updated values in Timesheet Detail: ${JSON.stringify(values)}`
    );

    const updatedChanges = { ...updatedValues };

    if (
      values.timesheetRemark !== undefined &&
      !isEqual(values.timesheetRemark, timesheetRemark)
    ) {
      setTimesheetRemark(values.timesheetRemark);
      updatedChanges["remark:text"] = getRemarkText(
        values.timesheetRemark,
        lang,
        PREFERRED_LANGUAGES
      );
    }
    if (
      values.timesheetTasks !== undefined &&
      !isEqual(values.timesheetTasks, timesheetTasks)
    ) {
      setTimesheetTasks(values.timesheetTasks);
      updatedChanges["tasks"] = values.timesheetTasks;
      if (
        values.timesheetTotalTime !== undefined &&
        values.timesheetTotalTime !== timesheetTotalTime
      ) {
        setTimesheetTotalTime(values.timesheetTotalTime);
        updatedChanges["totalTime"] = values.timesheetTotalTime;
      }
      if (
        values.timesheetBillableTime !== undefined &&
        values.timesheetBillableTime !== timesheetBillableTime
      ) {
        setTimesheetBillableTime(values.timesheetBillableTime);
        updatedChanges["billableTime"] = values.timesheetBillableTime;
      }
      if (
        values.timesheetOverTime !== undefined &&
        values.timesheetOverTime !== timesheetOverTime
      ) {
        setTimesheetBillableTime(values.timesheetOverTime);
        updatedChanges["totalOvertime"] = values.timesheetOverTime;
      }
    }
    if (
      values.timesheetFiles !== undefined &&
      !isEqual(values.timesheetFiles, timesheetFiles)
    ) {
      setTimesheetFiles(values.timesheetFiles);
      updatedChanges["files"] = values.timesheetFiles;
    }
    if (
      values.timesheetComments !== undefined &&
      !isEqual(values.timesheetComments, timesheetComments)
    ) {
      setTimesheetComments(values.timesheetComments);
      updatedChanges["comments"] = values.timesheetComments;
    }

    console.debug(
      `Updated changes in Timesheet Detail: ${JSON.stringify(updatedChanges)}`
    );

    // Update the ref
    updatedValuesRef.current = updatedChanges;
    // Update the changes state
    setUpdatedValues(updatedChanges);
  };

  const validateTimesheetOnSave = () => {
    const { headerCommentRequired } = timesheetTypeDetails;

    if (!timesheetStart) {
    }
    if (!timesheetEnd) {
    }
    if (!timesheetCompanyId) {
    }
    if (!timesheetEmployeeId) {
    }

    const headerRemarkText = getRemarkText(
      timesheetRemark,
      lang,
      PREFERRED_LANGUAGES
    );

    if (!headerRemarkText) {
      if (headerCommentRequired === "E") {
        Alert.alert(
          t("validation_error"),
          t("timesheet_header_remark_required_message"),
          [{ text: t("ok"), style: "cancel" }],
          { cancelable: false }
        );
        return false;
      }
      if (headerCommentRequired === "W") {
        showToast(t("timesheet_header_remark_recommended_message"), "warning");
      }
    }

    return true;
  };

  const hasUnsavedChanges = () => {
    console.debug(
      "Upated values reference (if any) in hasUnsavedChanges: ",
      JSON.stringify(updatedValuesRef)
    );

    return Object.keys(updatedValuesRef.current).length > 0;
  };

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

  const onCancel = () => {
    if (!hasUnsavedChanges()) {
      navigation.goBack(); // Simply navigate back (timesheet list)
      return;
    }

    showUnsavedChangesAlert(() => {
      navigation.goBack();
    });
  };

  const onSave = async () => {
    try {
      const isValidTimesheet = validateTimesheetOnSave();

      if (isValidTimesheet) {
        await updateTimesheet(updatedValues);
      }
    } catch (error) {
      console.error("Error in saving timesheet", error);
    }
  };

  const updateTimesheet = async (updatedValues = {}) => {
    try {
      const prefixedUpdatedValues = {};
      for (const key in updatedValues) {
        prefixedUpdatedValues[`${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-${key}`] =
          updatedValues[key];
      }

      // Add the prefixed updated values to the formData
      const formData = {
        data: {
          [`${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-id`]: timesheetId,
          ...prefixedUpdatedValues,
        },
      };

      const queryStringParams = {
        userID: APP.LOGIN_USER_ID,
        client: APP.LOGIN_USER_CLIENT,
        language: APP.LOGIN_USER_LANGUAGE,
        testMode: TEST_MODE,
        component: "platform",
        doNotReplaceAnyList: isDoNotReplaceAnyList(BUSOBJCAT.TIMESHEET),
        appName: JSON.stringify(getAppName(BUSOBJCAT.TIMESHEET)),
      };

      const updateResponse = await updateFields(formData, queryStringParams);

      // Check if update was successful
      if (updateResponse.success) {
        // Extract the new ID from the response
        const newId = updateResponse.response?.details[0]?.data?.ids?.[0];
        if (newId) {
          setTimesheetId(newId); // Update the timesheetId with the new ID
          setIsEditMode(true);
        }

        // Clear updatedValuesRef.current and updatedValues state
        updatedValuesRef.current = {};
        setUpdatedValues({});

        handleReload(); // Call handleReload after saving

        // force refresh timhseet data on list screen
        updateForceRefresh(true);

        // Notify that save was clicked
        notifySave();

        if (lang !== "en") {
          showToast(t("update_success"));
        }

        updateForceRefresh(true);
      } else {
        showToast(t("update_failure"), "error");
      }

      if (updateResponse.message) {
        showToast(updateResponse.message);
      }
    } catch (error) {
      console.error("Error in updateTimesheet of TimesheetDetail", error);
      showToast(t("unexpected_error"), "error");
    }
  };

  const handleLock = async () => {
    if (isEditMode) {
      const { changeAllowed } = await documentStatusCheck(
        t,
        APP_ACTIVITY_ID.TIMESHEET,
        BUSOBJCATMAP[BUSOBJCAT.TIMESHEET],
        timesheetId,
        timesheetType,
        timesheetExtStatus,
        setCurrentStatus,
        setListOfNextStatus
      );

      if (!changeAllowed) {
        return;
      }

      const action = isLocked ? "set" : "clear";
      setOrClearLock(
        action,
        BUSOBJCATMAP[BUSOBJCAT.TIMESHEET],
        timesheetId,
        setIsLocked,
        setLoading
      );
    }
  };

  /**
   * Handles reloading the timesheet data.
   * - Fetches the latest timesheet and absence data if there are no unsaved changes.
   * - Shows an alert to confirm discarding unsaved changes before fetching data.
   */
  const handleReload = () => {
    const reloadData = () => {
      fetchTimeAndAbsence(); // Fetch the latest timesheet and absence data
    };

    hasUnsavedChanges() ? showUnsavedChangesAlert(reloadData) : reloadData();
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
                      BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]
                    }-component`]: `Client-${APP.LOGIN_USER_CLIENT}-all`,
                    [`${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-extID`]: "",
                    [`${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-id`]: timesheetId,
                    [`${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-intStatus`]: 3,
                  },
                };

                const queryStringParams = {
                  language: APP.LOGIN_USER_LANGUAGE,
                  userID: APP.LOGIN_USER_ID,
                  appName: APP_NAME.TIMESHEET,
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

                  // Go back to the previous screen (timesheet list)
                  navigation.goBack();
                } else {
                  showToast(t("delete_failure"), "error");
                }

                if (updateResponse.message) {
                  showToast(updateResponse.message);
                }
              } catch (error) {
                console.error(
                  "Error in handleDelete of TimesheetDetail",
                  error
                );
                showToast(t("unexpected_error"), "error");
              }
            },
          },
        ],
        { cancelable: true } // Allow the dialog to be canceled by tapping outside of it
      );
    }
  };

  const getTimesheetTypeFields = () => [
    `${
      BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]
    }-type:TimeConfType-defaultAsHomeDefault`,
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-type:TimeConfType-defaultInputDays`,
    `${
      BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]
    }-type:TimeConfType-headerCommentRequired`,
    `${
      BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]
    }-type:TimeConfType-itemCommentRequired`,
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-type:TimeConfType-maxTasksPreload`,
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-type:TimeConfType-minTimeIncrement`,
    `${
      BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]
    }-type:TimeConfType-nonBillableComments`,
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-type:TimeConfType-overtimeAllowed`,
    `${
      BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]
    }-type:TimeConfType-validateWorkSchedule`,
  ];

  const getTimesheetFields = () => [
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-id`,
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-type`,
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-extStatus`,
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-busUnitID`,
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-employeeID`,
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-files`,
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-comments`,
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-start`,
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-end`,
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-remark`,
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-totalTime`,
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-billableTime`,
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-totalOvertime`,
    // Below line is commented because when I send this in query a few task properties don't come in the response
    // `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-tasks`, // commented out
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-tasks-subID`,
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-tasks-customerID`,
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-tasks-customerID:Customer-name-text`,
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-tasks-projectWbsID`,
    `${
      BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]
    }-tasks-projectWbsID:ProjectWBS-text-text`,
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-tasks-projectWbsID:ProjectWBS-extID`,
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-tasks-taskID`,
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-tasks-taskID:Task-text-text`,
    `${
      BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]
    }-tasks-taskID:Task-quantities-unitTime`,
    `${
      BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]
    }-tasks-taskID:Task-quantities-actualQuantity`,
    `${
      BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]
    }-tasks-taskID:Task-quantities-plannedQuantity`,
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-tasks-taskID:Task-type`,
    `${
      BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]
    }-tasks-taskID:Task-timeItemTypeNonEditable`,
    `${
      BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]
    }-tasks-taskID:Task-type:TaskType-quantityAllowed`,
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-tasks-billable`,
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-tasks-timeType`,
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-tasks-items`,
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-tasks-extStatus`,
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-tasks-extStatus-recipient`,
    `${
      BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]
    }-tasks-extStatus-recipient:Person-name-knownAs`,
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-tasks-extStatus-setBy`,
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-tasks-extStatus-setBy:User-personID`,
    `${
      BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]
    }-tasks-extStatus-setBy:User-personID:Person-name-knownAs`,
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-tasks-extStatus-statusID`,
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-tasks-taskTime`,
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-tasks-taskID:Task-dates-actualFinish`,
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-tasks-department`,
    `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-tasks-department:BusUnit-name-text`,
    ...getTimesheetTypeFields(), // Include the TimeConfType fields
  ];

  const loadTimesheetCreateDetail = async () => {
    try {
      if (!selectedDate) {
        return;
      }

      if (!loggedInUserInfo.workScheduleExtId) {
        showToast(t("no_workschedule_assigned"), "error");
        return;
      }

      const validPeriodDates = await fetchSelectedDatePeriodFromTimesheetType(
        loggedInUserInfo.timeConfirmationType
      );

      if (
        !validPeriodDates ||
        !validPeriodDates.start ||
        !validPeriodDates.end
      ) {
        showToast(t("timesheet_creation_error"), "error");
        console.error(
          "Timesheet cannot be created, start or end date missing."
        );

        return;
      }

      if (validPeriodDates) {
        setTimesheetStart(validPeriodDates.start);
        setTimesheetEnd(validPeriodDates.end);
        setTimesheetCompanyId(loggedInUserInfo.companyId);
        setTimesheetEmployeeId(APP.LOGIN_USER_EMPLOYEE_ID);

        const defaultTimesheetRemark = `Timesheet from ${format(
          validPeriodDates.start,
          convertToDateFNSFormat(APP.LOGIN_USER_DATE_FORMAT)
        )} to ${format(
          validPeriodDates.end,
          convertToDateFNSFormat(APP.LOGIN_USER_DATE_FORMAT)
        )}`;
        setTimesheetRemark(
          setRemarkText(undefined, lang, defaultTimesheetRemark)
        );

        // Set the timesheet type here to ensure all required settings (e.g., start and end dates) are correctly applied,
        // preventing rendering issues or errors from incomplete configuration.
        setTimesheetType(loggedInUserInfo.timeConfirmationType);

        const updatedChanges = { ...updatedValues };

        updatedChanges["type"] = loggedInUserInfo.timeConfirmationType;
        updatedChanges["start"] = normalizeDateToUTC(validPeriodDates.start);
        updatedChanges["end"] = normalizeDateToUTC(validPeriodDates.end);
        updatedChanges["busUnitID"] = loggedInUserInfo.companyId;
        updatedChanges["employeeID"] = APP.LOGIN_USER_EMPLOYEE_ID;
        updatedChanges["responsible"] = loggedInUserInfo.personId;
        updatedChanges["remark:text"] = defaultTimesheetRemark;

        // Update the ref
        updatedValuesRef.current = updatedChanges;
        // Update the changes state
        setUpdatedValues(updatedChanges);
      }

      // The status check is not required in create mode, as there's no need to verify
      // if the document can be modified. However, since this operation also sets the
      // current status and next possible statuses, enabling the customStatus component
      // to display the workflow status, we are calling it here.
      await documentStatusCheck(
        t,
        APP_ACTIVITY_ID.TIMESHEET,
        BUSOBJCATMAP[BUSOBJCAT.TIMESHEET],
        timesheetId,
        loggedInUserInfo.timeConfirmationType,
        null, // Timesheet extStatus
        setCurrentStatus,
        setListOfNextStatus
      );
    } catch (error) {
      console.error("Error in loading timesheet create detail: ", error);
    } finally {
    }
  };

  const loadTimesheetDetail = async () => {
    try {
      const queryFields = {
        fields: getTimesheetFields(),
        where: [
          {
            fieldName: `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-id`,
            operator: "=",
            value: timesheetId,
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

        setTimesheetFiles(data[`${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-files`]);
        setTimesheetComments(
          data[`${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-comments`]
        );
        setTimesheetCompanyId(
          data[`${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-busUnitID`]
        );
        setTimesheetEmployeeId(
          data[`${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-employeeID`]
        );
        setTimesheetStart(data[`${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-start`]);
        setTimesheetEnd(data[`${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-end`]);
        setTimesheetRemark(data[`${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-remark`]);
        setTimesheetTotalTime(
          data[`${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-totalTime`]
        );
        setTimesheetBillableTime(
          data[`${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-billableTime`]
        );
        setTimesheetOverTime(
          data[`${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-totalOvertime`]
        );
        setTimesheetTasks(data[`${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-tasks`]);

        const fetchedTimesheetExtStatus =
          data[`${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-extStatus`] || {};
        setTimesheetExtStatus(fetchedTimesheetExtStatus);

        const fetchedTimesheetType =
          data[`${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-type`] || "";
        setTimesheetType(fetchedTimesheetType);

        setTimesheetTypeDetails({
          defaultAsHomeDefault:
            data[
              `${
                BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]
              }-type:TimeConfType-defaultAsHomeDefault`
            ] || "",
          defaultInputDays:
            data[
              `${
                BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]
              }-type:TimeConfType-defaultInputDays`
            ] || "",
          headerCommentRequired:
            data[
              `${
                BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]
              }-type:TimeConfType-headerCommentRequired`
            ] || "",
          itemCommentRequired:
            data[
              `${
                BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]
              }-type:TimeConfType-itemCommentRequired`
            ] || "",
          maxTasksPreload:
            data[
              `${
                BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]
              }-type:TimeConfType-maxTasksPreload`
            ] || "",
          minTimeIncrement:
            data[
              `${
                BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]
              }-type:TimeConfType-minTimeIncrement`
            ] || "",
          nonBillableComments:
            data[
              `${
                BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]
              }-type:TimeConfType-nonBillableComments`
            ] || false,
          overtimeAllowed:
            data[
              `${
                BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]
              }-type:TimeConfType-overtimeAllowed`
            ] || false,
          validateWorkSchedule:
            data[
              `${
                BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]
              }-type:TimeConfType-validateWorkSchedule`
            ] || "",
        });

        const { changeAllowed } = await documentStatusCheck(
          t,
          APP_ACTIVITY_ID.TIMESHEET,
          BUSOBJCATMAP[BUSOBJCAT.TIMESHEET],
          timesheetId,
          fetchedTimesheetType,
          fetchedTimesheetExtStatus,
          setCurrentStatus,
          setListOfNextStatus
        );

        if (!changeAllowed) {
          setIsLocked(true);
        } else {
          setOrClearLock(
            "set",
            BUSOBJCATMAP[BUSOBJCAT.TIMESHEET],
            timesheetId,
            setIsLocked,
            setLoading
          );
        }
      }
    } catch (error) {
      console.error("Error in loading timesheet detail: ", error);
    }
  };

  const loadAbsences = async () => {
    try {
      const queryFields = {
        fields: [
          `${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-id`,
          `${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-employeeID`,
          `${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-type:AbsenceType-name`,
          `${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-start`,
          `${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-end`,
          `${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-hoursByDay`,
          `${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-remark:text`,
        ],
        where: [
          {
            fieldName: `${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-employeeID`,
            operator: "=",
            value: APP.LOGIN_USER_EMPLOYEE_ID,
          },
          {
            fieldName: `${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-adjustAbsence`,
            operator: "=",
            value: false,
          },
          {
            fieldName: `${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-redemption`,
            operator: "=",
            value: false,
          },
          {
            fieldName: `${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-submittedOn`,
            operator: "!=",
            value: null,
          },
        ],
      };

      const commonQueryParams = {
        appName: APP_NAME.ABSENCE,
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

      if (response.success === true) {
        setTimesheetAbsences(response.data || []);
      }
    } catch (error) {
      console.error("Error in loading absences: ", error);
    }
  };

  const fetchProcessTemplate = async () => {
    if (!statusTemplateExtId) {
      setItemStatusIDMap({});
      return;
    }

    try {
      const queryFields = {
        fields: [
          "ProcessTemplate-id",
          "ProcessTemplate-extID",
          "ProcessTemplate-steps",
        ],
      };

      const whereConditions = [];
      const orConditions = [];

      whereConditions.push({
        fieldName: "ProcessTemplate-extID",
        operator: "=",
        value: statusTemplateExtId,
      });

      const response = await fetchBusObjCatData(
        "ProcessTemplate",
        null,
        null,
        queryFields,
        whereConditions,
        orConditions
      );

      let statusLabelAndStepMap = {};

      if (!response.error && response.data) {
        statusLabelAndStepMap = createExtIdStatusLabelMap(response.data);
      } else {
        console.error("Error fetching process template data:", response.error);
      }

      setItemStatusIDMap(statusLabelAndStepMap);
    } catch (error) {
      console.error("Error fetching process template data:", error);
    }
  };

  /**
   * Creates a map of extID and associated status labels.
   *
   * @param {Array} data - Process template data.
   * @returns {Object} - Map of extID and status labels.
   */
  const createExtIdStatusLabelMap = (data) => {
    const extIdStatusLabelMap = {};

    // Loop through each returned process template
    data.forEach((processTemplate) => {
      const steps = processTemplate["ProcessTemplate-steps"];

      // Check if steps is not null and is an array
      if (steps && Array.isArray(steps)) {
        // Loop through steps in each process template
        steps.forEach((step) => {
          const { extID, statusLabel } = step;
          // Add the extID and statusLabel to the map
          extIdStatusLabelMap[extID] = statusLabel;
        });
      }
    });

    return extIdStatusLabelMap;
  };

  const fetchTimeAndAbsence = async () => {
    setLoading(true);

    try {
      await Promise.all([
        isEditMode ? loadTimesheetDetail() : loadTimesheetCreateDetail(),
        loadAbsences(),
        fetchProcessTemplate(),
      ]);
    } catch (error) {
      console.error(
        "Error in either loading timesheet details or absences: ",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardShown(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardShown(false);
      }
    );

    // cleanup function
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    const beforeRemoveListener = navigation.addListener("beforeRemove", (e) => {
      if (!hasUnsavedChanges()) {
        // If we don't have unsaved changes, then we don't need to do anything
        return;
      }

      e.preventDefault();
      showUnsavedChangesAlert(() => {
        navigation.dispatch(e.data.action);
      });
    });

    return beforeRemoveListener;
  }, [navigation]);

  useEffect(() => {
    // Change header left text on mount
    navigation.setOptions({
      headerTitle: isEditMode ? t("timesheet_edit") : t("timesheet_create"),
      headerRight: () => {
        return (
          <View style={styles.headerRightContainer}>
            <CustomButton
              onPress={handleLock}
              label=""
              icon={{
                name: isLocked ? "lock" : "lock-open-variant", // Change icon based on lock state
                library: "MaterialCommunityIcons",
                size: 24,
              }}
              disabled={!isEditMode || loading} // Disable lock button when not in edit mode or when loading
            />
            <CustomButton
              onPress={handleReload}
              label=""
              icon={{
                name: "refresh-circle",
                library: "MaterialCommunityIcons",
                size: 24,
              }}
              disabled={!isEditMode || loading} // Disable reload button when not in edit mode or when loading
            />
            <CustomButton
              onPress={handleDelete}
              label=""
              icon={{
                name: "delete",
                library: "MaterialCommunityIcons",
                size: 24,
              }}
              disabled={!isEditMode || loading || isLocked} // Disable delete button when not in edit mode, when loading, or when locked
            />
          </View>
        );
      },
    });
  }, [isEditMode, isLocked, loading]);

  useEffect(() => {
    if (!loggedInUserInfo.workScheduleExtId) {
      showToast(t("no_workschedule_assigned"), "error");
      return;
    }

    fetchTimeAndAbsence();

    return () => {
      if (isEditMode) {
        setOrClearLock(
          "clear",
          BUSOBJCATMAP[BUSOBJCAT.TIMESHEET],
          timesheetId,
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
        The set functions in React, like setTimesheetType(fetchedTimesheetType), are asynchronous.
        This means that when you call setTimesheetType, the state update doesn't happen immediately.
        React schedules the update to happen at a later point in the rendering cycle.
        
        Because of this, there may be a brief moment where the component renders before the state update is applied.
        Therefore, it's necessary to check if timesheetType is defined before rendering the Tab.Navigator and its screens.
        This ensures that we don't attempt to render the components that rely on timesheetType being defined,
        preventing potential errors or unintended behavior during the initial render.

        Similarly, timesheetAbsences and itemStatusIDMap is initially set to null and will be updated asynchronously after fetching data.
      */
        timesheetType &&
        timesheetAbsences &&
        itemStatusIDMap && (
          <>
            <Tab.Navigator screenOptions={{ swipeEnabled: false }}>
              <Tab.Screen name={t("general")}>
                {() => (
                  <GestureHandlerRootView>
                    <TimesheetDetailGeneral
                      busObjCat={BUSOBJCAT.TIMESHEET}
                      busObjId={timesheetId}
                      isParentLocked={isLocked}
                      isEditMode={isEditMode}
                      currentStatus={currentStatus}
                      listOfNextStatus={listOfNextStatus}
                      handleReload={handleReload}
                      loading={loading}
                      setLoading={setLoading}
                      onTimesheetDetailChange={handleTimesheetDetailChange}
                      timesheetTypeDetails={timesheetTypeDetails}
                      timesheetDetail={{
                        timesheetType,
                        timesheetExtStatus,
                        timesheetStart,
                        timesheetEnd,
                        timesheetTotalTime,
                        timesheetBillableTime,
                        timesheetRemark,
                        timesheetTasks,
                        timesheetAbsences,
                        itemStatusIDMap,
                      }}
                    />
                  </GestureHandlerRootView>
                )}
              </Tab.Screen>
              <Tab.Screen name={t("files")}>
                {() => (
                  <File
                    busObjCat={BUSOBJCAT.TIMESHEET}
                    busObjId={timesheetId}
                    initialFilesIdList={timesheetFiles}
                    isParentLocked={isLocked}
                  />
                )}
              </Tab.Screen>
              <Tab.Screen name={t("comments")}>
                {() => (
                  <Comment
                    busObjCat={BUSOBJCAT.TIMESHEET}
                    busObjId={timesheetId}
                    initialComments={timesheetComments}
                    isParentLocked={isLocked}
                  />
                )}
              </Tab.Screen>
              <Tab.Screen name={t("history")}>
                {() => (
                  <History
                    busObjCat={BUSOBJCAT.TIMESHEET}
                    busObjID={timesheetId}
                  />
                )}
              </Tab.Screen>
            </Tab.Navigator>
            {!keyboardShown && (
              <SaveCancelBar
                onSave={onSave}
                onCancel={onCancel}
                saveIcon="save"
                cancelIcon="times"
                saveDisable={loading || isLocked}
                isFloating={true}
              />
            )}
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
  headerRightContainer: {
    width: screenDimension.width / 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
});

export default TimesheetDetail;
