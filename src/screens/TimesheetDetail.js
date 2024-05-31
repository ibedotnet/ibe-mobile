import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
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

import TimesheetGeneral from "./TimesheetGeneral";
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

const Tab = createMaterialTopTabNavigator();

const TimesheetDetail = ({ route, navigation }) => {
  // Initialize useTranslation hook
  const { t, i18n } = useTranslation();

  const { updateForceRefresh } = useTimesheetForceRefresh();

  const timesheetId = route?.params?.timesheetId;

  // Determine if the component is in edit mode (if a timesheet ID is provided)
  const isEditMode = !!timesheetId; // True if editing an existing timesheet, false if creating a new one

  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(false);

  const [timesheetStartDate, setTimesheetStartDate] = useState(null);
  const [timesheetEndDate, setTimesheetEndDate] = useState(null);
  const [timesheetRemark, setTimesheetRemark] = useState("");
  const [timesheetType, setTimesheetType] = useState("");
  const [timesheetExtStatus, setTimesheetExtStatus] = useState({});
  const [timesheetFiles, setTimesheetFiles] = useState([]);
  const [timesheetComments, setTimesheetComments] = useState([]);

  const [currentStatus, setCurrentStatus] = useState({});
  const [listOfNextStatus, setListOfNextStatus] = useState([]);

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
    if (isEditMode) {
      loadTimesheetDetail();
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
    if (isEditMode) {
      loadTimesheetDetail();
    } else {
      loadTimesheetCreateDetail();
    }

    // Effect to handle cleanup
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

  const loadTimesheetDetail = async () => {
    try {
      setLoading(true);

      const queryFields = {
        fields: [
          `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-id`,
          `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-type`,
          `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-extStatus`,
          `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-files`,
          `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-comments`,
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
        setTimesheetFiles(
          response.data[0][`${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-files`] || []
        );
        setTimesheetComments(
          response.data[0][`${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-comments`] ||
            []
        );
        const fetchedTimesheetType =
          response.data[0][`${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-type`] || "";
        const fetchedTimesheetExtStatus =
          response.data[0][`${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-extStatus`] ||
          {};

        setTimesheetType(fetchedTimesheetType);
        setTimesheetExtStatus(fetchedTimesheetExtStatus);

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
    } finally {
      setLoading(false);
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
        const fetchedTimesheetType =
          APP.LOGIN_USER_WORK_SCHEDULE_TIMESHEET_TYPE;
        const fetchedTimesheetExtStatus = null;

        // The status check is not required in create mode, as there's no need to verify
        // if the document can be modified. However, since this operation also sets the
        // current status and next possible statuses, enabling the customStatus component
        // to display the workflow status, we are calling it here.
        await documentStatusCheck(
          t,
          APP_ACTIVITY_ID.TIMESHEET,
          BUSOBJCATMAP[BUSOBJCAT.TIMESHEET],
          timesheetId,
          fetchedTimesheetType,
          fetchedTimesheetExtStatus,
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

  return (
    <View style={styles.container}>
      <Tab.Navigator screenOptions={{ swipeEnabled: false }}>
        <Tab.Screen name={t("general")}>
          {() => (
            <GestureHandlerRootView>
              <TimesheetGeneral
                busObjCat={BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}
                busObjId={timesheetId}
                busObjType={timesheetType}
                busObjExtStatus={timesheetExtStatus}
                isParentLocked={isLocked}
                isEditMode={isEditMode}
                currentStatus={currentStatus}
                listOfNextStatus={listOfNextStatus}
                handleReload={handleReload}
                timesheetDetailProps={{
                  timesheetStartDate,
                  timesheetEndDate,
                  timesheetRemark,
                  setTimesheetStartDate,
                  setTimesheetEndDate,
                  setTimesheetRemark,
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
      {loading && <Loader />}
      <SaveCancelBar
        onSave={onSave}
        onCancel={onCancel}
        saveIcon="save"
        cancelIcon="times"
        saveDisable={loading || isLocked}
        isFloating={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerRightContainer: {
    width: screenDimension.width / 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
});

export default TimesheetDetail;
