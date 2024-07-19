import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Modal,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native-gesture-handler";
import CustomRemotePicker from "../components/CustomRemotePicker";
import CustomPicker from "../components/CustomPicker";
import CustomTextInput from "../components/CustomTextInput";
import { APP, APP_NAME, INTSTATUS, PREFERRED_LANGUAGES } from "../constants";
import { LoggedInUserInfoContext } from "../../context/LoggedInUserInfoContext";
import { getRemarkText, setRemarkText } from "../utils/FormatUtils";
import { showToast } from "../utils/MessageUtils";

const TimesheetDetailItemEditor = ({
  item,
  timesheetDetail,
  timesheetTypeDetails,
  onConfirm,
  onCancel,
  isEditItem,
}) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const { loggedInUserInfo } = useContext(LoggedInUserInfoContext);

  const { itemCommentRequired } = timesheetTypeDetails;

  const [editedItem, setEditedItem] = useState({ ...item });
  const [initialItem, setInitialItem] = useState({ ...item });
  const [timeValue, setTimeValue] = useState("");
  const [timeUnit, setTimeUnit] = useState("hours");

  const timeUnitOptions = [
    { label: "Hours", value: "hours" },
    { label: "Minutes", value: "minutes" },
  ];

  // Effect to update initial values whenever item changes
  useEffect(() => {
    console.debug(`Before edit item: ${JSON.stringify(item)}`);
    setInitialItem({ ...item });
    updateInitialTimeValues(item);
  }, [item]);

  const updateInitialTimeValues = (item) => {
    let initialTimeValue = "";
    let initialTimeUnit = "hours"; // Default to hours if editedItem.actualTime is 0 or undefined

    if (item.actualTime) {
      const totalMilliseconds = parseInt(item.actualTime);
      const totalHours = totalMilliseconds / (60 * 60 * 1000);
      initialTimeValue = totalHours.toString();

      if (totalHours < 1) {
        initialTimeValue = (totalMilliseconds / (60 * 1000)).toString();
        initialTimeUnit = "minutes";
      }
    }

    setTimeValue(initialTimeValue);
    setTimeUnit(initialTimeUnit);
  };

  const calculateActualTime = (value, unit) => {
    let parsedValue = parseInt(value);

    // Check if the parsed value is NaN or less than 0 (handle empty input or non-numeric input)
    if (isNaN(parsedValue) || parsedValue < 0) {
      parsedValue = 0;
    }

    let totalMilliseconds = 0;
    if (unit === "hours") {
      totalMilliseconds = parsedValue * 60 * 60 * 1000;
    } else {
      totalMilliseconds = parsedValue * 60 * 1000;
    }

    return totalMilliseconds;
  };

  const handleTimeValueChange = (text) => {
    setTimeValue(text);

    // Calculate actualTime based on current timeValue and timeUnit
    const actualTime = calculateActualTime(text, timeUnit);

    // Update editedItem with the new actualTime
    setEditedItem({
      ...editedItem,
      actualTime: actualTime,
    });
  };

  const handleTimeUnitChange = (value) => {
    setTimeUnit(value);

    // Calculate actualTime based on current timeValue and the new timeUnit
    const actualTime = calculateActualTime(timeValue, value);

    // Update editedItem with the new actualTime
    setEditedItem({
      ...editedItem,
      actualTime: actualTime,
    });
  };

  const handleRemarkChange = (text) => {
    const updatedRemark = setRemarkText(editedItem.remark, lang, text);
    setEditedItem({ ...editedItem, remark: updatedRemark });
  };

  const remarkText = getRemarkText(
    editedItem.remark,
    lang,
    PREFERRED_LANGUAGES
  );

  const validateChanges = () => {
    const validationErrorMessages = {
      task: t("task_required_message"),
      time: t("time_required_message"),
      remark: t("remark_required_message"),
    };

    const validationWarningMessages = {
      remark: t("remark_recommended_message"),
    };

    if (!editedItem.taskId) {
      Alert.alert(
        t("validation_error"),
        validationErrorMessages.task,
        [{ text: t("ok"), style: "cancel" }],
        { cancelable: false }
      );
      return false;
    }

    if (!editedItem.actualTime) {
      Alert.alert(
        t("validation_error"),
        validationErrorMessages.time,
        [{ text: t("ok"), style: "cancel" }],
        { cancelable: false }
      );
      return false;
    }

    if (!remarkText) {
      if (itemCommentRequired === "E") {
        Alert.alert(
          t("validation_error"),
          validationErrorMessages.remark,
          [{ text: t("ok"), style: "cancel" }],
          { cancelable: false }
        );
        return false;
      }
      if (itemCommentRequired === "W") {
        showToast(validationWarningMessages.remark, "warning");
      }
    }

    return true;
  };

  const handleConfirm = () => {
    if (!validateChanges()) {
      return;
    }

    const updatedItem = { ...editedItem };

    if (!isEqual(updatedItem, initialItem)) {
      updatedItem.isDirty = true;
    }

    setEditedItem(updatedItem);
    onConfirm(updatedItem);

    console.debug(`After edit item: ${JSON.stringify(updatedItem)}`);
  };

  const handleCancel = () => {
    if (!isEqual(editedItem, initialItem)) {
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
            onPress: onCancel,
          },
        ],
        { cancelable: false }
      );
    } else {
      // No changes, directly cancel
      onCancel();
    }
  };

  function isEqual(obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  const commonQueryParams = {
    filterQueryValue: "",
    userID: APP.LOGIN_USER_ID,
    client: parseInt(APP.LOGIN_USER_CLIENT),
    language: APP.LOGIN_USER_LANGUAGE,
    testMode: "",
    appName: APP_NAME.TIMESHEET,
    intStatus: JSON.stringify([INTSTATUS.ACTIVE, 1]),
    page: 1,
    start: 0,
    limit: 20,
  };

  const customerQueryParams = {
    fields: [
      "Customer-id",
      "Customer-extID",
      "Customer-type",
      "Customer-text",
      "Customer-name",
      "Customer-name:text",
    ],
    sort: [
      {
        property: "Customer-changedOn",
        direction: "DESC",
      },
      {
        property: "Customer-name-text",
        direction: "ASC",
      },
    ],
  };

  const projectQueryParams = {
    fields: [
      "ProjectWBS-id",
      "ProjectWBS-extID",
      "ProjectWBS-type",
      "ProjectWBS-text",
      "ProjectWBS-text:text",
      "ProjectWBS-remark:text",
      "ProjectWBS-text-text",
      "ProjectWBS-financeData-companyID",
      "ProjectWBS-financeData-companyID:BusUnit-name-text",
      "ProjectWBS-responsible",
      "ProjectWBS-responsible:Person-name-knownAs",
      "ProjectWBS-customerID",
      "ProjectWBS-customerID:Customer-extID",
      "ProjectWBS-customerID:Customer-name-text",
      "ProjectWBS-assigned",
      "ProjectWBS-percentComplete",
    ],
    where: [
      {
        fieldName: "ProjectWBS-assigned",
        operator: "in",
        value: loggedInUserInfo.personId,
      },
      { fieldName: "ProjectWBS-percentComplete", operator: "!=", value: 100 },
    ],
    sort: [
      {
        property: "ProjectWBS-changedOn",
        direction: "DESC",
      },
      {
        property: "ProjectWBS-text:text",
        direction: "ASC",
      },
    ],
  };

  if (editedItem.customerId) {
    projectQueryParams.where.push({
      fieldName: "ProjectWBS-customerID",
      operator: "=",
      value: editedItem.customerId,
    });
  }

  const taskQueryParams = {
    fields: [
      "Task-id",
      "Task-extID",
      "Task-type",
      "Task-text",
      "Task-text:text",
      "Task-remark:text",
      "Task-text-text",
      "Task-customerID",
      "Task-customerID:Customer-extID",
      "Task-customerID:Customer-name-text",
      "Task-projectWbsID",
      "Task-projectWbsID:ProjectWBS-extID",
      "Task-projectWbsID:ProjectWBS-text-text",
      "Task-allResources",
      "Task-timeConfAllowed",
      "Task-percentComplete",
      "Task-client",
      "Task-assigned",
      "Task-dates-actualFinish",
      "Task-type:TaskType-timeConfAllowed",
      "Task-type:TaskType-doNotAllowExpenses",
      "Task-quantities-plannedQuantity",
      "Task-quantities-actualQuantity",
      "Task-billable",
      "Task-resources-personID",
      "Task-resources-billable",
      "Task-resources-intStatus",
      "Task-resources-percentComplete",
      "Task-fixDatesAndCapacity",
      "Task-dates-plannedLateStart",
      "Task-dates-plannedLateFinish",
      "Task-dates-actualStart",
      "Task-duration",
      "Task-timeItemTypes",
      "Task-timeItemTypeNonEditable",
      "Task-intStatus",
    ],
    where: [
      {
        fieldName: "Task-type:TaskType-timeConfAllowed",
        operator: "=",
        value: true,
      },
      {
        fieldName: "Task-client",
        operator: "=",
        value: parseInt(APP.LOGIN_USER_CLIENT),
        or: true,
        nestedConditions: [
          {
            fieldName: "Task-assigned",
            operator: "in",
            value: loggedInUserInfo.personId,
          },
          { fieldName: "Task-allResources", operator: "=", value: true },
        ],
      },
      {
        fieldName: "Task-intStatus",
        operator: "in",
        value: ["0", "1", "2", null],
        or: true,
        nestedConditions: [
          { fieldName: "Task-percentComplete", operator: "!=", value: 100 },
          {
            fieldName: "Task-dates-actualFinish",
            operator: ">=",
            value: timesheetDetail?.timesheetStart ?? new Date(),
          },
        ],
      },
    ],
    sort: [
      {
        property: "Task-changedOn",
        direction: "DESC",
      },
      {
        property: "Task-text:text",
        direction: "ASC",
      },
    ],
  };

  const timeTypeQueryParams = {
    fields: ["TimeItemType-id", "TimeItemType-extID", "TimeItemType-name"],
    where: [
      {
        fieldName: "TimeItemType-busObjCat",
        operator: "=",
        value: "TimeItemType",
      },
    ],
    sort: [
      {
        property: "TimeItemType-name",
        direction: "ASC",
      },
    ],
  };

  if (editedItem.customerId) {
    taskQueryParams.where.push({
      fieldName: "Task-customerID",
      operator: "=",
      value: editedItem.customerId,
    });
  }

  if (editedItem.projectId) {
    taskQueryParams.where.push({
      fieldName: "Task-projectWbsID",
      operator: "=",
      value: editedItem.projectId,
    });
  }

  const handleCustomerChange = ({ value, label, additionalData }) => {
    const extID = additionalData.extID ?? "";

    console.debug(
      `Additonal data in customer: ${JSON.stringify(additionalData)}`
    );

    setEditedItem({
      ...editedItem,
      customerId: value ?? "",
      customerText: label ?? "",
      customerExtId: extID ?? "",
      // Reset project and task fields if customer is blank (null, undefined, or empty string)
      projectId: !value ? null : editedItem.projectId,
      projectText: !value ? "" : editedItem.projectText,
      projectExtId: !value ? "" : editedItem.projectExtId,
      taskId: !value ? null : editedItem.taskId,
      taskText: !value ? "" : editedItem.taskText,
      taskExtId: !value ? "" : editedItem.taskExtId,
    });
  };

  const handleProjectChange = ({ value, label, additionalData }) => {
    const extID = additionalData.extID ?? "";

    console.debug(
      `Additonal data in project: ${JSON.stringify(additionalData)}`
    );

    setEditedItem({
      ...editedItem,
      projectId: value ?? "",
      projectText: label ?? "",
      projectExtId: extID ?? "",
      // Reset task fields if project is blank (null, undefined, or empty string)
      taskId: !value ? null : editedItem.taskId,
      taskText: !value ? "" : editedItem.taskText,
      taskExtId: !value ? "" : editedItem.taskExtId,
      // If customer is blank, set the project's corresponding customer details
      customerId:
        !editedItem.customerId && additionalData.projectCustomerId
          ? additionalData.projectCustomerId
          : editedItem.customerId,
      customerText:
        !editedItem.customerText && additionalData.projectCustomerText
          ? additionalData.projectCustomerText
          : editedItem.customerText,
      customerExtId:
        !editedItem.customerExtId && additionalData.projectCustomerExtId
          ? additionalData.projectCustomerExtId
          : editedItem.customerExtId,
    });
  };

  const handleTaskChange = ({ value, label, additionalData }) => {
    const extID = additionalData.extID ?? "";

    console.debug(`Additonal data in task: ${JSON.stringify(additionalData)}`);

    setEditedItem({
      ...editedItem,
      taskId: value,
      taskText: label,
      taskExtId: extID,
      // If customer is blank, set the task's corresponding customer details
      customerId:
        !editedItem.customerId && additionalData.taskCustomerId
          ? additionalData.taskCustomerId
          : editedItem.customerId,
      customerText:
        !editedItem.customerText && additionalData.taskCustomerText
          ? additionalData.taskCustomerText
          : editedItem.customerText,
      customerExtId:
        !editedItem.customerExtId && additionalData.taskCustomerExtId
          ? additionalData.taskCustomerExtId
          : editedItem.customerExtId,
      // If project is blank, set the task's corresponding project details
      projectId:
        !editedItem.projectId && additionalData.taskProjectWBSId
          ? additionalData.taskProjectWBSId
          : editedItem.projectId,
      projectText:
        !editedItem.projectText && additionalData.taskProjectWBSText
          ? additionalData.taskProjectWBSText
          : editedItem.projectText,
      projectExtId:
        !editedItem.projectExtId && additionalData.taskProjectWBSExtId
          ? additionalData.taskProjectWBSExtId
          : editedItem.projectExtId,
    });
  };

  const handleTimeTypeChange = ({ value, label, additionalData }) => {
    const extID = additionalData.extID ?? "";

    setEditedItem({
      ...editedItem,
      timeItemTypeId: value,
      timeItemTypeText: label,
      timeItemTypeExtId: extID,
    });
  };

  const handleBillableValueChange = (value, editedItem) => {
    // Determine if the value is billable
    const billable = value;
    const productive = billable; // If billable is true, then productive is also true
    let billableTime = "";

    // Set billableTime based on your logic
    if (billable) {
      billableTime = editedItem.actualTime;
    }

    // Update the state with new values
    setEditedItem({
      ...editedItem,
      billable: billable,
      productive: productive,
      billableTime: billableTime,
    });
  };

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.modalContainer}>
        <ScrollView contentContainerStyle={styles.modalContent}>
          <Text
            style={styles.modalTitle}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {isEditItem ? t("timesheet_edit_item") : t("timesheet_create_item")}
          </Text>
          <View style={styles.modalInputContainer}>
            <CustomRemotePicker
              queryParams={{
                queryFields: customerQueryParams,
                commonQueryParams: commonQueryParams,
              }}
              pickerLabel={t("customer")}
              initialAdditionalLabel={editedItem.customerExtId}
              initialItemLabel={editedItem.customerText}
              initialItemValue={editedItem.customerId}
              labelItemField={"Customer-name:text"}
              valueItemField={"Customer-id"}
              additionalFields={[{ extID: "Customer-extID" }]}
              searchFields={["Customer-name-text", "Customer-extID"]}
              multiline={true}
              onValueChange={handleCustomerChange}
            />
          </View>
          <View style={styles.modalInputContainer}>
            <CustomRemotePicker
              queryParams={{
                queryFields: projectQueryParams,
                commonQueryParams: commonQueryParams,
              }}
              pickerLabel={t("project")}
              initialAdditionalLabel={editedItem.projectExtId}
              initialItemLabel={editedItem.projectText}
              initialItemValue={editedItem.projectId}
              labelItemField={"ProjectWBS-text:text"}
              valueItemField={"ProjectWBS-id"}
              additionalFields={[
                {
                  extID: "ProjectWBS-extID",
                },
                { projectCustomerId: "ProjectWBS-customerID" },
                {
                  projectCustomerExtId: "ProjectWBS-customerID:Customer-extID",
                },
                {
                  projectCustomerText:
                    "ProjectWBS-customerID:Customer-name-text",
                },
              ]}
              searchFields={["ProjectWBS-text-text", "ProjectWBS-extID"]}
              multiline={true}
              onValueChange={handleProjectChange}
            />
          </View>
          <View style={styles.modalInputContainer}>
            <CustomRemotePicker
              queryParams={{
                queryFields: taskQueryParams,
                commonQueryParams: commonQueryParams,
              }}
              pickerLabel={t("task")}
              initialAdditionalLabel={editedItem.taskExtId}
              initialItemLabel={editedItem.taskText}
              initialItemValue={editedItem.taskId}
              labelItemField={"Task-text:text"}
              valueItemField={"Task-id"}
              additionalFields={[
                {
                  extID: "Task-extID",
                },
                { taskCustomerId: "Task-customerID" },
                { taskCustomerExtId: "Task-customerID:Customer-extID" },
                { taskCustomerText: "Task-customerID:Customer-name-text" },
                { taskProjectWBSId: "Task-projectWbsID" },
                { taskProjectWBSExtId: "Task-projectWbsID:ProjectWBS-extID" },
                {
                  taskProjectWBSText: "Task-projectWbsID:ProjectWBS-text-text",
                },
              ]}
              searchFields={["Task-text-text", "Task-extID"]}
              multiline={true}
              onValueChange={handleTaskChange}
            />
          </View>
          <View style={styles.modalInputContainer}>
            <Text style={styles.modalInputLabel}>{t("remark")}</Text>
            <CustomTextInput
              value={remarkText}
              onChangeText={handleRemarkChange}
              placeholder={`${t("placeholder_remark")}...`}
              multiline={true}
            />
          </View>
          <View style={styles.modalInputContainer}>
            <CustomRemotePicker
              queryParams={{
                queryFields: timeTypeQueryParams,
                commonQueryParams: commonQueryParams,
              }}
              pickerLabel={t("time_type")}
              initialAdditionalLabel={editedItem.timeItemTypeExtId}
              initialItemLabel={editedItem.timeItemTypeText}
              initialItemValue={editedItem.timeItemTypeId}
              labelItemField={"TimeItemType-name"}
              valueItemField={"TimeItemType-id"}
              additionalFields={[
                {
                  extID: "TimeItemType-extID",
                },
              ]}
              searchFields={["TimeItemType-name", "TimeItemType-extID"]}
              multiline={true}
              onValueChange={handleTimeTypeChange}
            />
          </View>
          <View style={styles.rowContainer}>
            <View>
              <Text style={styles.modalInputLabel}>{t("billable")}</Text>
              <Switch
                trackColor={{ false: "#767577", true: "#81b0ff" }}
                thumbColor={editedItem.billable ? "#f5dd4b" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                value={editedItem.billable}
                onValueChange={(value) =>
                  handleBillableValueChange(value, editedItem)
                }
              />
            </View>
            <View style={[styles.modalInputContainer, styles.flexContainer]}>
              <Text style={styles.modalInputLabel}>{t("time")}</Text>
              <View style={styles.hoursContainer}>
                <CustomTextInput
                  value={timeValue}
                  placeholder={"0"}
                  onChangeText={handleTimeValueChange}
                  showClearButton={false}
                  keyboardType="numeric"
                  containerStyle={styles.hourInput}
                />
                <CustomPicker
                  items={timeUnitOptions}
                  initialValue={timeUnit}
                  onFilter={handleTimeUnitChange}
                  hideSearchInput={true}
                  containerStyle={styles.unitPickerContainer}
                />
              </View>
            </View>
          </View>
          <Text style={styles.note}>{`${t("note")}:`}</Text>
          <Text style={styles.note}>{`1. ${t(
            "note_timesheet_item_project"
          )}`}</Text>
          <Text style={styles.note}>{`2. ${t(
            "note_timesheet_item_task"
          )}`}</Text>
        </ScrollView>
        <View style={styles.modalButtonsContainer}>
          <Button onPress={handleConfirm} title={t("confirm")} />
          <Button onPress={handleCancel} title={t("cancel")} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    padding: "4%",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.85)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: "4%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  modalInputContainer: {
    marginBottom: "5%",
  },
  modalInputLabel: {
    fontSize: 14,
    marginBottom: 5,
    fontWeight: "bold",
  },
  modalInputLabelRight: {
    color: "#808080",
    fontWeight: "bold",
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: "4%",
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: "2%",
  },
  hoursContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    width: "80%",
  },
  flexContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
  hourInput: {
    flex: 1,
    borderWidth: 0,
  },
  unitPickerContainer: {
    flex: 3,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: "#f0f0f0",
    borderWidth: 0,
    borderTopStartRadius: 0,
    borderBottomStartRadius: 0,
    marginBottom: 0,
  },
  modalButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 20,
  },
  note: {
    fontSize: 12,
    color: "#00f",
    marginTop: 5,
  },
});

export default TimesheetDetailItemEditor;
