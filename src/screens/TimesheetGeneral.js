import React, { useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { FlatList } from "react-native-gesture-handler";

import Checkbox from "expo-checkbox";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import CustomStatus from "../components/CustomStatus";
import CollapsiblePanel from "../components/CollapsiblePanel";
import CustomDateTimePicker from "../components/CustomDateTimePicker";

import { screenDimension } from "../utils/ScreenUtils";

const initialDates = [
  { day: "MO", date: "11" },
  { day: "TU", date: "12" },
  { day: "WE", date: "13" },
  { day: "TH", date: "14" },
  { day: "FR", date: "15" },
  { day: "SA", date: "16" },
  { day: "MO", date: "17" },
  { day: "TU", date: "18" },
  { day: "WE", date: "19" },
  { day: "TH", date: "20" },
  { day: "FR", date: "21" },
  { day: "SA", date: "22" },
];

const timesheetItems = [
  {
    project: "Project A",
    projectId: "001",
    task: "Development",
    customer: "Customer X",
    billable: true,
    timeStatus: "Approved",
    time: "2h",
    remark: "Initial work on the project",
  },
  {
    project: "Project B",
    projectId: "002",
    task: "Testing",
    customer: "Customer Y",
    billable: false,
    timeStatus: "Pending",
    time: "6h",
    remark: "Testing the new features",
  },
  {
    project: "Project C",
    projectId: "003",
    task: "Design",
    customer: "Customer Z",
    billable: true,
    timeStatus: "Rejected",
    time: "",
    remark: "",
  },
  {
    project: "Project D",
    projectId: "004",
    task: "Implement",
    customer: "Customer A",
    billable: true,
    timeStatus: "Rejected",
    time: "",
    remark: "",
  },
];

const TimesheetGeneral = ({
  busObjCat,
  busObjId,
  busObjType,
  busObjExtStatus,
  isParentLocked,
  isEditMode,
  currentStatus,
  listOfNextStatus,
  handleReload,
  timesheetDetailProps,
}) => {
  const { t } = useTranslation();

  const dateListRef = useRef(null);
  const timesheetItemsRef = useRef(null);

  const {
    timesheetStartDate,
    timesheetEndDate,
    timesheetRemark,
    setTimesheetStartDate,
    setTimesheetEndDate,
    setTimesheetRemark,
  } = timesheetDetailProps;

  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(timesheetStartDate || null);
  const [endDate, setEndDate] = useState(timesheetEndDate || null);
  const [remark, setRemark] = useState(timesheetRemark || "");
  const [totalHours, setTotalHours] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);
  const [visibleDates, setVisibleDates] = useState(initialDates);
  const [isPanelVisible, setIsPanelVisible] = useState(false);

  const renderDateItem = ({ item, index }) => (
    <Pressable
      style={[
        styles.dateItem,
        selectedDate === index && styles.selectedDateItem,
      ]}
      onPress={() => setSelectedDate(index)}
    >
      <Text style={styles.dayText} numberOfLines={1} ellipsizeMode="tail">
        {item.day}
      </Text>
      <Text style={styles.dateText} numberOfLines={1} ellipsizeMode="tail">
        {item.date}
      </Text>
    </Pressable>
  );

  const fetchPreviousDates = () => {
    // Fetch or calculate the previous set of dates and update the state
    const newDates = [
      { day: "WE", date: "5" },
      { day: "TH", date: "6" },
      { day: "FR", date: "7" },
      { day: "SA", date: "8" },
      { day: "MO", date: "9" },
      { day: "TU", date: "10" },
      { day: "WE", date: "11" },
      { day: "TH", date: "12" },
      { day: "FR", date: "13" },
      { day: "SA", date: "14" },
      { day: "MO", date: "15" },
      { day: "TU", date: "16" },
    ];
    setVisibleDates(newDates);
    // Scroll to the left
    dateListRef.current.scrollTo({ x: 0, animated: true });
  };

  const fetchNextDates = () => {
    // Fetch or calculate the next set of dates and update the state
    const newDates = [
      { day: "SU", date: "23" },
      { day: "MO", date: "24" },
      { day: "TU", date: "25" },
      { day: "WE", date: "26" },
      { day: "TH", date: "27" },
      { day: "FR", date: "28" },
      { day: "SA", date: "29" },
      { day: "SU", date: "30" },
      { day: "MO", date: "31" },
      { day: "TU", date: "1" },
      { day: "WE", date: "2" },
      { day: "TH", date: "3" },
    ];
    setVisibleDates(newDates);
    // Scroll to the left
    dateListRef.current.scrollTo({ x: 0, animated: true });
  };

  const renderTimesheetItems = () => {
    return (
      <ScrollView
        ref={timesheetItemsRef}
        contentContainerStyle={styles.itemsScrollViewContent}
      >
        {timesheetItems.map((item, index) => (
          <View key={index} style={styles.itemsCardContainer}>
            <View style={styles.itemsCardHeader}>
              <TextInput
                style={styles.itemsRemarkInput}
                numberOfLines={1}
                ellipsizeMode="tail"
                value={item.remark}
                editable={!isParentLocked}
                placeholder={t("placeholder_remark")}
              />
            </View>
            <View style={styles.separator} />
            <View style={styles.itemRow}>
              <View style={styles.itemDetails}>
                <View style={styles.labelValueContainer}>
                  <Text style={styles.detailLabel}>{t("project")}:</Text>
                  <Text
                    style={styles.detailValue}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.project} ({item.projectId})
                  </Text>
                </View>
                <View style={styles.labelValueContainer}>
                  <Text style={styles.detailLabel}>{t("task")}:</Text>
                  <Text
                    style={styles.detailValue}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.task}
                  </Text>
                </View>
                <View style={styles.labelValueContainer}>
                  <Text style={styles.detailLabel}>{t("customer")}:</Text>
                  <Text
                    style={styles.detailValue}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.customer}
                  </Text>
                </View>
                <View style={styles.labelValueContainer}>
                  <Text style={styles.detailLabel}>{t("status")}:</Text>
                  <Text
                    style={styles.detailValue}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.timeStatus}
                  </Text>
                </View>
              </View>
              <View style={styles.timeBillableContainer}>
                <View style={styles.timeContainer}>
                  <Text style={styles.billableLabel}>{t("hours")}</Text>
                  <TextInput
                    style={styles.timeText}
                    value={item.time}
                    editable={!isParentLocked}
                    placeholder={"0"}
                  />
                </View>
                <View style={styles.billableContainer}>
                  <Text style={styles.billableLabel}>{t("billable")}</Text>
                  <Checkbox value={item.billable} disabled={isParentLocked} />
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={dateListRef}
        horizontal
        contentContainerStyle={styles.horizontalScrollContent}
      >
        <View style={styles.hoursContainer}>
          <Text style={styles.hoursLabel}>{t("total")}:</Text>
          <Text style={styles.hoursValue}>{totalHours}</Text>
        </View>
        <View style={styles.statusContainer}>
          <CustomStatus
            busObjCat={busObjCat}
            busObjId={busObjId}
            busObjType={busObjType}
            busObjExtStatus={busObjExtStatus}
            isParentLocked={isParentLocked}
            isEditMode={isEditMode}
            currentStatus={currentStatus}
            listOfNextStatus={listOfNextStatus}
            handleReload={handleReload}
            loading={loading}
          />
        </View>
      </ScrollView>
      <View style={styles.dateListContainer}>
        <Pressable style={styles.dateArrow} onPress={fetchPreviousDates}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={36}
            color="#005eb8"
          />
        </Pressable>
        <FlatList
          data={visibleDates}
          renderItem={renderDateItem}
          keyExtractor={(item, index) => index.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateList}
        />
        <Pressable style={styles.dateArrow} onPress={fetchNextDates}>
          <MaterialCommunityIcons
            name="chevron-right"
            size={36}
            color="#005eb8"
          />
        </Pressable>
      </View>
      {isPanelVisible && (
        <CollapsiblePanel title={t("")} initiallyCollapsed={true}>
          <View style={styles.panelChild}>
            <Text style={styles.panelChildLabel}>{t("start")}</Text>
            <CustomDateTimePicker
              placeholder={t("from")}
              initialValue={startDate}
              onFilter={setStartDate}
              isDisabled={isParentLocked}
            />
          </View>
          <View style={styles.panelChild}>
            <Text style={styles.panelChildLabel}>{t("end")}</Text>
            <CustomDateTimePicker
              placeholder={t("to")}
              initialValue={endDate}
              onFilter={setEndDate}
              isDisabled={isParentLocked}
            />
          </View>
          <View style={styles.panelChild}>
            <Text style={styles.panelChildLabel}>{t("remark")}</Text>
            <TextInput
              style={[
                styles.remarkInput,
                {
                  borderColor: isParentLocked ? "rgba(0, 0, 0, 0.5)" : "black",
                },
              ]}
              value={remark}
              placeholder={t("placeholder_remark")}
              onChangeText={setRemark}
              editable={!isParentLocked}
            />
          </View>
        </CollapsiblePanel>
      )}
      <View style={styles.floatingContainer}>
        <Switch
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={isPanelVisible ? "#f5dd4b" : "#f4f3f4"}
          ios_backgroundColor="#3e3e3e"
          onValueChange={() =>
            setIsPanelVisible((previousState) => !previousState)
          }
          value={isPanelVisible}
        />
        <Pressable onPress={() => {}}>
          <MaterialCommunityIcons name="plus" size={36} color="#005eb8" />
        </Pressable>
      </View>
      {renderTimesheetItems()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "flex-start",
    backgroundColor: "#e5eef7",
  },
  horizontalScrollContent: {
    flexGrow: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: "2%",
    minHeight: "6%",
    backgroundColor: "#fff",
    borderWidth: 2,
  },
  hoursContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  hoursLabel: {
    fontWeight: "bold",
    marginRight: 5,
  },
  hoursValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "green",
  },
  dateListContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
    backgroundColor: "white",
  },
  dateList: {
    padding: "2%",
  },
  dateItem: {
    alignItems: "center",
    marginHorizontal: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#005eb8",
    borderRadius: 5,
  },
  selectedDateItem: {
    backgroundColor: "#bdcff1",
  },
  dayText: {
    fontSize: 16,
    color: "#555",
  },
  dateText: {
    fontSize: 24,
    color: "#000",
  },
  dateArrow: {
    justifyContent: "center",
    paddingHorizontal: "1%",
  },
  navButton: {
    paddingHorizontal: 10,
    marginHorizontal: 10,
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "#005eb8",
    borderRadius: 5,
  },
  navButtonText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#005eb8",
  },
  panelChildLabel: {
    marginBottom: "1%",
    fontSize: 16,
    fontWeight: "bold",
  },
  panelChild: {
    marginBottom: "2%",
  },
  remarkInput: {
    borderWidth: 2,
    padding: "4%",
    borderRadius: 5,
  },
  itemsScrollViewContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: "2%",
    paddingBottom: screenDimension.height / 2,
  },
  itemsCardContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 0.5,
    borderRadius: 5,
    paddingVertical: "2%",
    paddingHorizontal: "4%",
    marginVertical: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  itemsCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemsRemarkInput: {
    width: "100%",
  },
  separator: {
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
    marginVertical: "2%",
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 10,
    paddingHorizontal: 8,
  },
  toggleLabel: {
    fontSize: 16,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemDetails: {
    flexDirection: "column",
    flex: 1,
  },
  labelValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: "2%",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginRight: 2,
  },
  detailValue: {
    fontSize: 14,
  },
  timeBillableContainer: {
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  timeContainer: {
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "flex-start",
  },
  timeText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    color: "#666",
  },
  billableContainer: {
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "flex-end",
  },
  billableLabel: {
    fontSize: 14,
    fontWeight: "bold",
  },
  floatingContainer: {
    position: "absolute",
    width: 50,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    left: 10,
    bottom: 10,
    backgroundColor: "#fff",
    borderRadius: 5,
    elevation: 8,
  },
});

export default TimesheetGeneral;
