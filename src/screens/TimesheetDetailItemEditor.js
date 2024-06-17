import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Switch,
  Button,
} from "react-native";
import { useTranslation } from "react-i18next";

import CustomPicker from "../components/CustomPicker";
import { ScrollView } from "react-native-gesture-handler";

const TimesheetDetailItemEditor = ({ item, onConfirm, onCancel, isEditItem }) => {
  const { t } = useTranslation();
  const [editedItem, setEditedItem] = useState({ ...item });
  const [timeValue, setTimeValue] = useState(
    editedItem.time ? editedItem.time : ""
  );
  const [timeUnit, setTimeUnit] = useState("hours");

  const handleConfirm = () => {
    const totalMilliseconds =
      timeUnit === "hours"
        ? parseInt(timeValue) * 60 * 60 * 1000
        : parseInt(timeValue) * 60 * 1000;
    setEditedItem({ ...editedItem, time: totalMilliseconds.toString() });
    onConfirm(editedItem);
  };

  const handleTimeValueChange = (text) => {
    setTimeValue(text);
  };

  const handleTimeUnitChange = (value) => {
    setTimeUnit(value);
  };

  const timeUnitOptions = [
    { label: "Hours", value: "hours" },
    { label: "Minutes", value: "minutes" },
  ];

  // Sample data for pickers
  const projectOptions = [
    { label: "Project A", value: "001" },
    { label: "Project B", value: "002" },
    { label: "Project C", value: "003" },
    { label: "Project D", value: "004" },
  ];

  const taskOptions = [
    { label: "Development", value: "Development" },
    { label: "Testing", value: "Testing" },
    { label: "Design", value: "Design" },
    { label: "Implement", value: "Implement" },
  ];

  const customerOptions = [
    { label: "Customer X", value: "Customer X" },
    { label: "Customer Y", value: "Customer Y" },
    { label: "Customer Z", value: "Customer Z" },
    { label: "Customer A", value: "Customer A" },
  ];

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
            <Text style={styles.modalInputLabel}>{t("customer")}</Text>
            <CustomPicker
              items={customerOptions}
              initialValue={editedItem.customerId}
              onFilter={(value) =>
                setEditedItem({ ...editedItem, customerId: value })
              }
              disabled={false}
            />
          </View>
          <View style={styles.modalInputContainer}>
            <Text style={styles.modalInputLabel}>{t("project")}</Text>
            <CustomPicker
              items={projectOptions}
              initialValue={editedItem.projectId}
              onFilter={(value) =>
                setEditedItem({ ...editedItem, projectId: value })
              }
              disabled={false}
            />
          </View>
          <View style={styles.modalInputContainer}>
            <Text style={styles.modalInputLabel}>{t("task")}</Text>
            <CustomPicker
              items={taskOptions}
              initialValue={editedItem.taskId}
              onFilter={(value) =>
                setEditedItem({ ...editedItem, taskId: value })
              }
              disabled={false}
            />
          </View>
          <View style={styles.modalInputContainer}>
            <Text style={styles.modalInputLabel}>{t("remark")}</Text>
            <TextInput
              value={editedItem.remark}
              onChangeText={(text) =>
                setEditedItem({ ...editedItem, remark: text })
              }
              style={styles.modalInput}
            />
          </View>
          <View style={styles.rowContainer}>
            <View style={styles.halfInputContainer}>
              <Text style={styles.modalInputLabel}>{t("hours")}</Text>
              <TextInput
                value={editedItem.time}
                onChangeText={(text) =>
                  setEditedItem({ ...editedItem, time: text })
                }
                style={styles.modalInput}
              />
              <TextInput
                value={timeValue}
                onChangeText={handleTimeValueChange}
                keyboardType="numeric"
                style={[styles.modalInput, styles.hourInput]}
              />
              <CustomPicker
                items={timeUnitOptions}
                initialValue={timeUnit}
                onFilter={handleTimeUnitChange}
                disabled={false}
              />
            </View>
            <View style={styles.halfInputContainer}>
              <Text style={[styles.modalInputLabel, styles.switchLabel]}>
                {t("billable")}
              </Text>
              <Switch
                trackColor={{ false: "#767577", true: "#81b0ff" }}
                thumbColor={editedItem.billable ? "#f5dd4b" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                value={editedItem.billable}
                onValueChange={(value) =>
                  setEditedItem({ ...editedItem, billable: value })
                }
              />
            </View>
          </View>
          <View style={styles.modalButtonsContainer}>
            <Button onPress={handleConfirm} title={t("confirm")} />
            <Button onPress={onCancel} title={t("cancel")} />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    padding: "4%",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
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
  },
  modalInputContainer: {
    marginBottom: "2%",
  },
  modalInputLabel: {
    fontSize: 14,
    marginBottom: 5,
    fontWeight: "bold",
  },
  switchLabel: {
    textAlign: "right",
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: "10%",
  },
  halfInputContainer: {
    flex: 1,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: "4%",
  },
  modalButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
});

export default TimesheetDetailItemEditor;
