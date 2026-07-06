import React, {
  useContext,
  useEffect,
  useState,
  useImperativeHandle,
} from "react";

import {
  Alert,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { useTranslation } from "react-i18next";

import {
  APP,
  APP_NAME,
  INTSTATUS,
} from "../../constants";

import CustomRemotePicker from "../../components/CustomRemotePicker";
import CustomButton from "../../components/CustomButton";
import { LoggedInUserInfoContext } from "../../../context/LoggedInUserInfoContext";
import CustomTextInput from "../../components/CustomTextInput";

const AddOrEditClassificationForm = React.forwardRef(
  (
    {
      item,
      setTempItem,
      isParentLocked,
      isEditingItem,
      selectedRadioOption,
      handleCloseClassificationClick,
    },
    ref
  ) => {
    const { t, i18n } = useTranslation();
    const lang = i18n.language;
    const { loggedInUserInfo } = useContext(LoggedInUserInfoContext);

    const [editedItem, setEditedItem] = useState({ ...item });
    const [initialItem, setInitialItem] = useState({ ...item });

    const [clearProjectSearchData, setClearProjectSearchData] = useState(false);
    const [clearTaskSearchData, setClearTaskSearchData] = useState(false);
    const [clearDepartmentSearchData, setClearDepartmentSearchData] =
      useState(false);

    const [taskBillable, setTaskBillable] = useState(false);

    const commonQueryParams = {
      filterQueryValue: "",
      userID: APP.LOGIN_USER_ID,
      client: parseInt(APP.LOGIN_USER_CLIENT),
      language: APP.LOGIN_USER_LANGUAGE,
      testMode: "",
      appName: APP_NAME.EXPENSE,
      intStatus: JSON.stringify([INTSTATUS.ACTIVE, 1]),
      page: 1,
      start: 0,
      limit: 20,
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

    const taskQueryParams = {
      fields: [
        "Task-id",
        "Task-extID",
        "Task-text",
        "Task-text:text",
        "Task-remark:text",
        "Task-text-text",
        "Task-billable",
        "Task-intStatus",
        "Task-percentComplete",
        "Task-dates-actualFinish",
        "Task-projectWbsID",
        "Task-projectWbsID:ProjectWBS-extID",
        "Task-projectWbsID:ProjectWBS-text-text",
        "Task-type:TaskType-quantityAllowed",
        "Task-resources",
      ],
      where: [
        {
          fieldName: "Task-intStatus",
          operator: "in",
          value: ["0", "1", "2", null],
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

    const busUnitQueryParams = {
      fields: [
        "BusUnit-id",
        "BusUnit-extID",
        "BusUnit-type",
        "BusUnit-name",
        "BusUnit-name:text",
        "BusUnit-inactive",
        "BusUnit-busFunction",
      ],
      where: [
        {
          fieldName: "BusUnit-busFunction",
          operator: "=",
          value: "Department",
        },
        { fieldName: "BusUnit-inactive", operator: "!=", value: true },
      ],
      sort: [
        {
          property: "BUsUnit-changedOn",
          direction: "DESC",
        },
        {
          property: "BusUnit-name:text",
          direction: "ASC",
        },
      ],
    };

    if (editedItem.projectId) {
      taskQueryParams.where.push({
        fieldName: "Task-projectWbsID",
        operator: "=",
        value: editedItem.projectId,
      });
    }

    const saveChanges = () => {
      const updatedItem = { ...editedItem };

      if (!isParentLocked && !isEqual(updatedItem, initialItem)) {
        updatedItem.isDirty = true;
      }

      let index = updatedItem.itemCount ?? 0;

      setTempItem((prev) => ({
        ...prev,
        [index]: updatedItem, // Add or update the specific index
      }));

      console.log(`Leaving tab 2, item: ${JSON.stringify(updatedItem)}`);
    };

    useImperativeHandle(ref, () => ({
      saveChanges,
    }));

    const handleProjectChange = ({ value, label, additionalData }) => {
      console.log(
        `Additonal data in project: ${JSON.stringify(additionalData)}`
      );

      const extID = additionalData.extID ?? "";

      setEditedItem((prevItem) => ({
        ...prevItem,
        billable: false,
        projectId: value ?? "",
        projectText: label ?? "",
        projectExtId: extID ?? "",
        taskId: null,
        taskText: "",
        taskExtId: "",
        departmentId: "",
        departmentText: "",
        departmentExtId: "",
      }));

      setTaskBillable(false);

      setClearTaskSearchData([]);
      setClearDepartmentSearchData([]);
    };

    const handleTaskChange = ({ value, label, additionalData }) => {
      console.log(`Additonal data in task: ${JSON.stringify(additionalData)}`);

      const extID = additionalData.extID || "";
      const taskBillable = additionalData.taskBillable || false;
      const taskQuantityAllowed = additionalData.taskQuantityAllowed || false;
      const taskResources = additionalData.taskResources || [];

      setEditedItem((prevItem) => ({
        ...prevItem,
        billable: retrieveBillableStatus(
          taskBillable,
          taskQuantityAllowed,
          taskResources
        ),
        taskId: value,
        taskText: label,
        taskExtId: extID,
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
        departmentId: "",
        departmentText: "",
        departmentExtId: "",
      }));

      setTaskBillable(taskBillable);

      setClearProjectSearchData([]);
      setClearDepartmentSearchData([]);
    };

    const retrieveBillableStatus = (
      taskBillable,
      taskQuantityAllowed,
      taskResources
    ) => {
      // Return true if the task is quantity-based and allowed.
      if (taskQuantityAllowed) {
        console.log("Task is quantity allowed, so expense is billable.");
        return true;
      }

      // If the task is not billable by default, return false.
      if (!taskBillable) {
        console.log("Task is not billable by default.");
        return false;
      }

      // Log the task resources for debugging purposes.
      console.log("Checking task resources:", taskResources);

      // Find the resource matching the logged-in person.
      const resource = taskResources?.find(
        (resource) => resource.personID === loggedInUserInfo.personId
      );

      // Return the billable status of the matched resource, or false if no resource is found.
      return resource ? resource.billable : false;
    };

    const handleDepartmentChange = ({ value, label, additionalData }) => {
      console.log(
        `Additonal data in department: ${JSON.stringify(additionalData)}`
      );

      const extID = additionalData.extID ?? "";

      setEditedItem((prevItem) => ({
        ...prevItem,
        billable: false,
        departmentId: value ?? "",
        departmentText: label ?? "",
        departmentExtId: extID ?? "",
        projectId: "",
        projectText: "",
        projectExtId: "",
        taskId: "",
        taskText: "",
        taskExtId: "",
      }));

      setTaskBillable(false);

      setClearProjectSearchData([]);
      setClearTaskSearchData([]);
    };

    const validateBillableChange = () => {
      if (editedItem.departmentId) {
        Alert.alert("Error", t("expense_allocated_to_department"));
        return false;
      }
      if (!editedItem.taskId) {
        Alert.alert("Error", t("select_task_first"));
        return false;
      }
      if (!taskBillable && !editedItem.billable) {
        Alert.alert("Error", t("selected_task_not_billable"));
        return false;
      }

      return true;
    };

    const handleBillableChange = (value) => {
      const isAllowed = validateBillableChange();
      if (isAllowed) {
        setEditedItem((prevItem) => ({
          ...prevItem,
          billable: value,
        }));
      }
    };

    useEffect(() => {
      if (editedItem.billable === true) {
        setEditedItem((prevItem) => ({
          ...prevItem,
          billableQuantity: prevItem.expenseQuantity,
        }));
      }
    }, [editedItem.billable]);

    const handleSplitPercentChange = (value) => {
      setEditedItem((prevItem) => ({
        ...prevItem,
        splitPercent: Number(value),
      }));
    };

    function isEqual(obj1, obj2) {
      return JSON.stringify(obj1) === JSON.stringify(obj2);
    }

    return (
      <>
        <View style={styles.buttonContainer}>
          <CustomButton
            onPress={() => handleCloseClassificationClick()}
            label="CLOSE"
            icon={{
              name: "close",
              library: "MaterialCommunityIcons",
              size: 16,
              color: "#d9534f",
            }}
            backgroundColor={false}
            labelStyle={{ color: "#d9534f", fontSize: 16 }}
            style={{
              paddingHorizontal: 0,
              paddingVertical: 0,
            }}
          />
        </View>
        <View style={styles.itemsCardSeparator} />
        {selectedRadioOption === "project" && (
          <>
            <View style={styles.modalInputContainer}>
              <CustomRemotePicker
                queryParams={{
                  queryFields: projectQueryParams,
                  commonQueryParams: commonQueryParams,
                }}
                pickerLabel={t("project")}
                initialAdditionalLabel={editedItem.projectExtId}
                initialItemLabel={editedItem.projectText}
                initialItemValue={editedItem.projectWbsID}
                labelItemField={"ProjectWBS-text:text"}
                valueItemField={"ProjectWBS-id"}
                additionalFields={[
                  {
                    extID: "ProjectWBS-extID",
                  },
                  { projectCustomerId: "ProjectWBS-customerID" },
                  {
                    projectCustomerExtId:
                      "ProjectWBS-customerID:Customer-extID",
                  },
                  {
                    projectCustomerText:
                      "ProjectWBS-customerID:Customer-name-text",
                  },
                ]}
                searchFields={["ProjectWBS-text-text", "ProjectWBS-extID"]}
                multiline={true}
                onValueChange={handleProjectChange}
                disabled={isParentLocked}
                clearSearchData={clearProjectSearchData}
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
                  { extID: "Task-extID" },
                  { taskBillable: "Task-billable" },
                  { taskResources: "Task-resources" },
                  { taskQuantityAllowed: "Task-type:TaskType-quantityAllowed" },
                  { taskProjectWBSId: "Task-projectWbsID" },
                  { taskProjectWBSExtId: "Task-projectWbsID:ProjectWBS-extID" },
                  {
                    taskProjectWBSText:
                      "Task-projectWbsID:ProjectWBS-text-text",
                  },
                ]}
                searchFields={["Task-text-text", "Task-extID"]}
                multiline={true}
                onValueChange={handleTaskChange}
                disabled={isParentLocked}
                clearSearchData={clearTaskSearchData}
              />
            </View>
            <View style={styles.rowContainer}>
              <View style={styles.modalInputContainer}>
                <Text style={styles.modalInputLabel}>{t("billable")}</Text>
                <Switch
                  trackColor={{ false: "#d3d3d3", true: "#81b0ff" }}
                  thumbColor={editedItem.billable ? "#b0b0b0" : "#d3d3d3"}
                  ios_backgroundColor="#d3d3d3"
                  value={editedItem.billable}
                  onValueChange={handleBillableChange}
                  disabled={isParentLocked}
                />
              </View>
            </View>
          </>
        )}
        {selectedRadioOption === "department" && (
          <View style={styles.modalInputContainer}>
            <CustomRemotePicker
              queryParams={{
                queryFields: busUnitQueryParams,
                commonQueryParams: commonQueryParams,
              }}
              pickerLabel={t("department")}
              initialAdditionalLabel={editedItem.departmentExtId}
              initialItemLabel={editedItem.departmentText}
              initialItemValue={editedItem.departmentId}
              labelItemField={"BusUnit-name:text"}
              valueItemField={"BusUnit-id"}
              additionalFields={[{ extID: "BusUnit-extID" }]}
              searchFields={["BusUnit-name-text", "BusUnit-extID"]}
              multiline={true}
              onValueChange={handleDepartmentChange}
              disabled={isParentLocked}
              clearSearchData={clearDepartmentSearchData}
            />
          </View>
        )}
        {editedItem.isSplit && (
          <View style={styles.modalInputContainer}>
            <Text style={styles.modalInputLabel}>{t("split")}</Text>
            <View style={styles.quantityContainer}>
              <CustomTextInput
                value={
                  editedItem.splitPercent != undefined
                    ? `${editedItem.splitPercent}`
                    : ""
                }
                placeholder={"0"}
                onChangeText={handleSplitPercentChange}
                showClearButton={false}
                keyboardType="numeric"
                containerStyle={styles.valueInput}
                editable={!isParentLocked}
              />
              <View style={styles.unitContainer}>
                <Text>%</Text>
              </View>
            </View>
          </View>
        )}
      </>
    );
  }
);

const styles = StyleSheet.create({
  itemsCardSeparator: {
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
    marginVertical: "2%",
  },
  modalInputContainer: {
    marginBottom: "5%",
  },
  modalInputLabel: {
    fontSize: 14,
    marginBottom: 5,
    fontWeight: "bold",
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    // marginBottom: "2%",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    width: "50%",
  },
  valueInput: {
    flex: 2,
    borderWidth: 0,
  },
  unitContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: "#f0f0f0",
    borderWidth: 0,
    borderTopStartRadius: 0,
    borderBottomStartRadius: 0,
    marginBottom: 0,
  },
  buttonContainer: {
    flexDirection: "row",
    // justifyContent: "space-around",
    alignSelf: "flex-end",
  },
});

export default AddOrEditClassificationForm;
