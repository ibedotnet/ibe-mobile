import React, { useContext, useEffect, useState } from "react";
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
  TEST_MODE,
} from "../constants";

import SaveCancelBar from "../components/SaveCancelBar";
import CustomButton from "../components/CustomButton";

import TimesheetDetailGeneral from "./TimesheetDetailGeneral";
import File from "./File";
import Comment from "./Comment";
import History from "./History";

import { fetchData } from "../utils/APIUtils";
import { setOrClearLock } from "../utils/LockUtils";
import { showToast } from "../utils/MessageUtils";
import { screenDimension } from "../utils/ScreenUtils";
import updateFields from "../utils/UpdateUtils";
import { documentStatusCheck } from "../utils/WorkflowUtils";

import Loader from "../components/Loader";

import { useTimesheetForceRefresh } from "../../context/ForceRefreshContext";
import { LoggedInUserInfoContext } from "../../context/LoggedInUserInfoContext";

const Tab = createMaterialTopTabNavigator();

const TimesheetDetail = ({ route, navigation }) => {
  const { t, i18n } = useTranslation();

  const { loggedInUserInfo } = useContext(LoggedInUserInfoContext);

  const { updateForceRefresh } = useTimesheetForceRefresh();

  const timesheetId = route?.params?.timesheetId;

  // Determine if the component is in edit mode (if a timesheet ID is provided)
  const isEditMode = !!timesheetId; // True if editing an existing timesheet, false if creating a new one

  const [keyboardShown, setKeyboardShown] = useState(false);

  const [timesheetFiles, setTimesheetFiles] = useState([]);
  const [timesheetComments, setTimesheetComments] = useState([]);
  const [timesheetType, setTimesheetType] = useState("");
  const [timesheetExtStatus, setTimesheetExtStatus] = useState({});
  const [timesheetStart, setTimesheetStart] = useState(null);
  const [timesheetEnd, setTimesheetEnd] = useState(null);
  const [timesheetRemark, setTimesheetRemark] = useState("");
  const [timesheetTotalTime, setTimesheetTotalTime] = useState("");
  const [timesheetTasks, setTimesheetTasks] = useState([]);
  const [timesheetAbsences, setTimesheetAbsences] = useState(null);
  const [currentStatus, setCurrentStatus] = useState({});
  const [listOfNextStatus, setListOfNextStatus] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSave = async () => {
    try {
      updateForceRefresh(true);
      navigation.goBack();
    } catch (error) {
      console.error("Error in saving timesheet", error);
    }
  };

  const onCancel = () => {
    navigation.goBack(); // Simply navigate back (timesheet list)
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

  const handleReload = () => {
    fetchTimeAndAbsence();
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

  const loadTimesheetCreateDetail = async () => {
    try {
      setLoading(true);

      const queryFields = {
        fields: [
          `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-id`,
          `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-start`,
          `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-end`,
          `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-employeeID`,
        ],
        where: [
          {
            fieldName: `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-employeeID`,
            operator: "=",
            value: APP.LOGIN_USER_EMPLOYEE_ID,
          },
          {
            fieldName: `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-start`,
            operator: "=",
            value: new Date(), // TODO
          },
          {
            fieldName: `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-end`,
            operator: "=",
            value: new Date(), // TODO
          },
        ],
      };

      const commonQueryParams = {
        testMode: TEST_MODE,
        client: parseInt(APP.LOGIN_USER_CLIENT),
        user: APP.LOGIN_USER_ID,
        userID: APP.LOGIN_USER_ID,
        language: APP.LOGIN_USER_LANGUAGE,
        intStatus: JSON.stringify([INTSTATUS.ACTIVE, 1, 2]),
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
      }
    } catch (error) {
      console.error("Error in loading timesheet create detail: ", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTimesheetDetail = async () => {
    try {
      const queryFields = {
        fields: [
          `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-id`,
          `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-type`,
          `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-extStatus`,
          `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-files`,
          `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-comments`,
          `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-start`,
          `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-end`,
          `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-remark`,
          `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-totalTime`,
          // Below line is commented because when I send this in query a few task properties don't come in the response
          // `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-tasks`,
          `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-tasks-subID`,
          `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-tasks-customerID`,
          `${
            BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]
          }-tasks-customerID:Customer-name-text`,
          `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-tasks-projectWbsID`,
          `${
            BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]
          }-tasks-projectWbsID:ProjectWBS-text-text`,
          `${
            BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]
          }-tasks-projectWbsID:ProjectWBS-extID`,
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
          `${
            BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]
          }-tasks-extStatus-setBy:User-personID`,
          `${
            BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]
          }-tasks-extStatus-setBy:User-personID:Person-name-knownAs`,
          `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-tasks-extStatus-statusID`,
          `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-tasks-taskTime`,
          `${
            BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]
          }-tasks-taskID:Task-dates-actualFinish`,
          `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-tasks-department`,
          `${
            BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]
          }-tasks-department:BusUnit-name-text`,
        ],
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
        setTimesheetStart(data[`${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-start`]);
        setTimesheetEnd(data[`${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-end`]);
        setTimesheetRemark(data[`${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-remark`]);
        setTimesheetTotalTime(
          data[`${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-totalTime`]
        );
        setTimesheetTasks(data[`${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-tasks`]);

        const fetchedTimesheetExtStatus =
          data[`${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-extStatus`] || {};
        setTimesheetExtStatus(fetchedTimesheetExtStatus);

        const fetchedTimesheetType =
          data[`${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-type`] || "";
        setTimesheetType(fetchedTimesheetType);

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

  const fetchTimeAndAbsence = async () => {
    setLoading(true);
    try {
      await Promise.all([
        isEditMode ? loadTimesheetDetail() : loadTimesheetCreateDetail(),
        loadAbsences(),
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

        Similarly, timesheetAbsences is initially set to null and will be updated asynchronously after fetching absences data.
      */
        timesheetType &&
        timesheetAbsences && (
          <>
            <Tab.Navigator screenOptions={{ swipeEnabled: false }}>
              <Tab.Screen name={t("general")}>
                {() => (
                  <GestureHandlerRootView>
                    <TimesheetDetailGeneral
                      busObjCat={BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}
                      busObjId={timesheetId}
                      isParentLocked={isLocked}
                      isEditMode={isEditMode}
                      currentStatus={currentStatus}
                      listOfNextStatus={listOfNextStatus}
                      handleReload={handleReload}
                      loading={loading}
                      setLoading={setLoading}
                      timesheetDetail={{
                        timesheetType,
                        timesheetExtStatus,
                        timesheetStart,
                        timesheetEnd,
                        timesheetTotalTime,
                        timesheetRemark,
                        timesheetTasks,
                        timesheetAbsences,
                      }}
                    />
                  </GestureHandlerRootView>
                )}
              </Tab.Screen>
              <Tab.Screen name={t("files")}>
                {() => (
                  <File
                    busObjCat={BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}
                    busObjId={timesheetId}
                    initialFilesIdList={timesheetFiles}
                    isParentLocked={isLocked}
                  />
                )}
              </Tab.Screen>
              <Tab.Screen name={t("comments")}>
                {() => (
                  <Comment
                    busObjCat={BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}
                    busObjId={timesheetId}
                    initialComments={timesheetComments}
                    isParentLocked={isLocked}
                  />
                )}
              </Tab.Screen>
              <Tab.Screen name={t("history")}>
                {() => (
                  <History
                    busObjCat={BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}
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
