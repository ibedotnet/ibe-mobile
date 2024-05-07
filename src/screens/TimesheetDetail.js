import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useTranslation } from "react-i18next";

import {
  API_ENDPOINTS,
  APP,
  APP_ACTIVITY_ID,
  BUSOBJCAT,
  BUSOBJCATMAP,
  INTSTATUS,
  TEST_MODE,
} from "../constants";

import SaveCancelBar from "../components/SaveCancelBar";
import CustomButton from "../components/CustomButton";

import File from "./File";
import Comment from "./Comment";
import History from "./History";

import { fetchData } from "../utils/APIUtils";
import { setOrClearLock } from "../utils/LockUtils";
import { showToast } from "../utils/MessageUtils";
import { screenDimension } from "../utils/ScreenUtils";
import { updateFields } from "../utils/UpdateUtils";

import Loader from "../components/Loader";

import { useTimesheetForceRefresh } from "../../context/ForceRefreshContext";

const Tab = createMaterialTopTabNavigator();

const TimesheetDetail = ({ route, navigation }) => {
  // Initialize useTranslation hook
  const { t, i18n } = useTranslation();

  const { updateForceRefresh } = useTimesheetForceRefresh();

  const timesheetId = route?.params?.timesheetId;
  const isEditMode = !!timesheetId;

  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(false);

  const [timesheetFiles, setTimesheetFiles] = useState([]);

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

  const handleLock = () => {
    if (isEditMode) {
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
                // Update the intstatus in Timesheet
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
                  appName: APP_ACTIVITY_ID.TIMESHEET,
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
                  showToast(t("delete_failure"));
                }

                if (updateResponse.message) {
                  showToast(updateResponse.message);
                }
              } catch (error) {
                console.error(
                  "Error in handleDelete of TimesheetDetail",
                  error
                );
                showToast(t("unexpected_error"));
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
    loadTimesheetDetail();

    // Effect to handle initial lock setting
    if (isEditMode) {
      setOrClearLock(
        "set",
        BUSOBJCATMAP[BUSOBJCAT.TIMESHEET],
        timesheetId,
        setIsLocked,
        setLoading
      );
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
          `${BUSOBJCATMAP[BUSOBJCAT.TIMESHEET]}-files`,
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
      }
    } catch (error) {
      console.error("Error in load timesheet detail load: ", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Tab.Navigator>
        <Tab.Screen name={t("general")} component={General} />
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
        <Tab.Screen name={t("comments")} component={Comment} />
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
        saveLabel={t("save")}
        cancelLabel={t("cancel")}
        saveIcon="save"
        cancelIcon="times"
        saveDisable={loading || isLocked}
      />
    </View>
  );
};

const General = () => (
  <View style={styles.tabContainer}>
    <Text>General Tab Content</Text>
  </View>
);

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
