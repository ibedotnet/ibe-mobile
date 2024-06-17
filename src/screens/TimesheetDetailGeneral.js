import React, { useContext, useEffect, useRef, useState } from "react";
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
import {
  addDays,
  format,
  eachDayOfInterval,
  isValid,
  isWeekend,
} from "date-fns";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import TimesheetDetailItemEditor from "./TimesheetDetailItemEditor";

import CustomButton from "../components/CustomButton";
import CustomStatus from "../components/CustomStatus";
import CollapsiblePanel from "../components/CollapsiblePanel";
import CustomDateTimePicker from "../components/CustomDateTimePicker";

import {
  convertMillisecondsToDuration,
  convertToDateObject,
} from "../utils/FormatUtils";
import { screenDimension } from "../utils/ScreenUtils";

import { BUSOBJCAT, BUSOBJCATMAP } from "../constants";

import { LoggedInUserInfoContext } from "../../context/LoggedInUserInfoContext";

const TimesheetDetailGeneral = ({
  busObjCat,
  busObjId,
  isParentLocked,
  isEditMode,
  currentStatus,
  listOfNextStatus,
  handleReload,
  loading,
  setLoading,
  timesheetDetail,
}) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const preferredLanguages = [lang, "en", "en_GB"];

  const [weekendList, setWeekendList] = useState([]);
  const [holidayList, setHolidayList] = useState([]);
  const [absenceList, setAbsenceList] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [visibleDates, setVisibleDates] = useState([]);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [timesheetItemsMap, setTimesheetItemsMap] = useState({});

  const dateListRef = useRef(null);
  const timesheetItemsRef = useRef(null);

  const {
    loggedInUserInfo: { nonWorkingDates, nonWorkingDays, startOfWeek },
  } = useContext(LoggedInUserInfoContext);

  const {
    timesheetType,
    timesheetExtStatus,
    timesheetStart,
    timesheetEnd,
    timesheetRemark,
    timesheetTotalTime,
    timesheetTasks,
    timesheetAbsences,
  } = timesheetDetail;

  const timesheetStartDate = convertToDateObject(timesheetStart);
  const timesheetEndDate = convertToDateObject(timesheetEnd);

  const [start, setStart] = useState(timesheetStartDate);
  const [end, setEnd] = useState(convertToDateObject(timesheetEndDate));
  const [remark, setRemark] = useState(() => {
    const matchingRemark = timesheetRemark.find((remark) =>
      preferredLanguages.includes(remark.language)
    );
    return matchingRemark ? matchingRemark.text : ""; // Return the text if a matching remark is found
  });
  const [totalTime, setTotalTime] = useState(timesheetTotalTime);

  const generateTimesheetItemsMap = (timesheetTasks) => {
    const map = {};

    timesheetTasks.forEach((task) => {
      const {
        customerID,
        "customerID:Customer-name-text": customerText,
        projectID,
        "projectWbsID:ProjectWBS-extID": projectExtID,
        "projectWbsID:ProjectWBS-text-text": projectText,
        taskID,
        "taskID:Task-text-text": taskText,
        billable,
        items,
        extStatus,
      } = task;

      items.forEach((item) => {
        const { actualQuantity, actualTime, end, remark, start } = item;

        // Format the start date consistently to match the required date format (YYYY-MM-DD).
        // This ensures that the date can be used correctly in further operations, such as comparisons or data lookups.
        const formattedStart = format(new Date(start), "yyyy-MM-dd");

        // Constructing the timesheet item object
        const timesheetItem = {
          customerID: customerID || "",
          customerText: customerText || "",
          projectID: projectID || "",
          projectExtID: projectExtID || "",
          projectText: projectText || "",
          taskID: taskID || "",
          taskText: taskText || "",
          billable: billable || false,
          start: start || "",
          end: end || "",
          actualTime: actualTime || 0,
          actualQuantity: actualQuantity || { quantity: 0, unit: "" },
          remark: remark || [],
          extStatus: extStatus || {},
        };

        // Check if the start time already exists in the map
        if (!map[formattedStart]) {
          map[formattedStart] = [];
        }

        // Add the timesheet item to the list for the given start time
        map[formattedStart].push(timesheetItem);
      });
    });

    return map;
  };

  /**
   * Function to generate a list of absence date entries
   * @param {Array} timesheetAbsences - list of all absences of the employee (and more filtered based on some other conditions)
   * @param {String} startDate - The start date in 'YYYY-MM-DD' format
   * @param {String} endDate - The end date in 'YYYY-MM-DD' format
   * @returns {Array} - List of objects containing date, absence reason, and absence type name
   */
  const buildAbsenceDateEntries = (data, startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Initialize the list to store dates with absence type and reason
    let absenceDateEntries = [];

    // Iterate over the absence records
    data.forEach((record) => {
      const absenceReason =
        record[`${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-remark:text`];
      const absenceTypeName =
        record[`${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-type:AbsenceType-name`];

      // Iterate over the day records within each absence record
      record[`${BUSOBJCATMAP[BUSOBJCAT.ABSENCE]}-hoursByDay`].forEach(
        (dayRecord) => {
          const splitDate = dayRecord.splitDate;
          const dayDate = new Date(splitDate);
          const hours = dayRecord.hours;

          // Check if the day falls within the specified date range
          if (dayDate >= start && dayDate <= end) {
            // Add an object with date (splitDate), reason, absence type name and hours to the list
            absenceDateEntries.push({
              date: splitDate,
              absenceReason: absenceReason,
              absenceTypeName: absenceTypeName,
              absenceHours: convertMillisecondsToDuration(hours) + " h",
            });
          }
        }
      );
    });

    return absenceDateEntries;
  };

  const handleDateSelection = (index, date) => {
    setSelectedDate(date);
  };

  const generateVisibleDates = (start, end) => {
    const interval = { start, end };
    const dates = eachDayOfInterval(interval);

    return dates.map((date) => ({
      day: format(date, "EEE").toUpperCase().slice(0, 2),
      date: format(date, "dd"),
      fullDate: date,
    }));
  };

  const fetchPreviousDates = () => {
    const newEnd = addDays(visibleDates[0], -1);
    const newStart = addDays(newEnd, -6);
    setStart(newStart);
    setEnd(newEnd);

    // Scroll to the left
    dateListRef.current.scrollTo({ x: 0, animated: true });
  };

  const fetchNextDates = () => {
    const newStart = addDays(visibleDates[visibleDates.length - 1], 1);
    const newEnd = addDays(newStart, 6);
    setStart(newStart);
    setEnd(newEnd);

    // Scroll to the left
    dateListRef.current.scrollTo({ x: 0, animated: true });
  };

  const isHolidayOnDate = (date) => {
    if (!date) {
      return { isHoliday: false, holidayName: "" };
    }

    for (let holiday of holidayList) {
      if (!holiday) {
        continue;
      }

      const holidayDate = new Date(holiday.date);
      if (
        holidayDate.getDate() === date.getDate() &&
        holidayDate.getMonth() === date.getMonth() &&
        holidayDate.getFullYear() === date.getFullYear()
      ) {
        return { isHoliday: true, holidayName: holiday.name };
      }
    }

    return { isHoliday: false, holidayName: "" };
  };

  const isAbsenceOnDate = (date, absenceDateEntries) => {
    if (!date) {
      return {
        isAbsence: false,
        absenceReason: "",
        absenceTypeName: "",
        absenceHours: "",
      };
    }

    for (let absence of absenceList) {
      if (!absence) {
        continue;
      }

      const absenceDate = new Date(absence.date);
      if (
        absenceDate.getDate() === date.getDate() &&
        absenceDate.getMonth() === date.getMonth() &&
        absenceDate.getFullYear() === date.getFullYear()
      ) {
        return {
          isAbsence: true,
          absenceReason: absence.absenceReason,
          absenceTypeName: absence.absenceTypeName,
          absenceHours: absence.absenceHours,
        };
      }
    }

    return {
      isAbsence: false,
      absenceReason: "",
      absenceTypeName: "",
      absenceHours: "",
    };
  };

  const renderDateItem = ({ item, index }) => {
    const dayOfWeek = item?.fullDate?.getDay();
    const isWeekend = weekendList.includes(dayOfWeek);
    const { isHoliday } = isHolidayOnDate(item.fullDate);
    const { isAbsence } = isAbsenceOnDate(item.fullDate);

    const formattedItemDate = item.fullDate
      ? format(new Date(item.fullDate), "yyyy-MM-dd")
      : null;

    const formattedSelectedDate = selectedDate
      ? format(new Date(selectedDate), "yyyy-MM-dd")
      : null;

    return (
      <Pressable
        style={[
          styles.dateItem,
          isAbsence && { backgroundColor: "#ffcccb" },
          isHoliday && { backgroundColor: "#ffeb3b" },
          isWeekend && { backgroundColor: "#d3d3d3" },
          formattedItemDate === formattedSelectedDate &&
            styles.selectedDateItem,
        ]}
        onPress={() => handleDateSelection(index, item.fullDate)}
      >
        <Text style={styles.dayText} numberOfLines={1} ellipsizeMode="tail">
          {item.day}
        </Text>
        <Text style={styles.dateText} numberOfLines={1} ellipsizeMode="tail">
          {item.date}
        </Text>
        <Text style={styles.monthText} numberOfLines={1} ellipsizeMode="tail">
          {format(start, "MMM").toUpperCase()}
        </Text>
      </Pressable>
    );
  };

  const binarySearch = (dates, targetDate) => {
    let left = 0;
    let right = dates.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const date = new Date(dates[mid].date);

      if (date < targetDate) {
        left = mid + 1;
      } else if (date > targetDate) {
        right = mid - 1;
      } else {
        return mid;
      }
    }

    return left;
  };

  const findNonWorkingDatesInRange = (nonWorkingDates, start, end) => {
    if (!nonWorkingDates || nonWorkingDates.length === 0 || !start || !end) {
      return [];
    }

    const nonWorkingDatesInRange = [];
    const startDateIndex = binarySearch(nonWorkingDates, start);
    const endDateIndex = binarySearch(nonWorkingDates, end);

    for (let i = startDateIndex; i <= endDateIndex; i++) {
      nonWorkingDatesInRange.push(nonWorkingDates[i]);
    }

    return nonWorkingDatesInRange;
  };

  const findAbsencesInRange = (absenceDateEntries, start, end) => {
    if (
      !absenceDateEntries ||
      absenceDateEntries.length === 0 ||
      !start ||
      !end
    ) {
      return [];
    }

    const absencesInRange = [];
    const startDateIndex = binarySearch(absenceDateEntries, start);
    const endDateIndex = binarySearch(absenceDateEntries, end);

    for (let i = startDateIndex; i <= endDateIndex; i++) {
      if (absenceDateEntries[i]) {
        absencesInRange.push(absenceDateEntries[i]);
      }
    }

    return absencesInRange;
  };

  const handleEditItem = (item) => {
    setCurrentItem(item);
    setIsEditingItem(true);
  };

  const handleCancelEditItem = () => {
    setIsEditingItem(false);
    setCurrentItem(null);
  };

  const handleConfirmEditItem = (updatedItem) => {
    setIsEditingItem(false);
    setCurrentItem(null);
  };

  const renderTimesheetItems = () => {
    const { isHoliday, holidayName } = isHolidayOnDate(selectedDate);

    if (isHoliday) {
      let holidayMessage = "";
      if (holidayName) {
        holidayMessage += "Holiday: " + holidayName;
      } else {
        holidayMessage += t("absence_message");
      }

      return (
        <View style={styles.emptyMessageContainer}>
          <Text style={styles.emptyMessageText}>{holidayMessage}</Text>
        </View>
      );
    }

    const { isAbsence, absenceReason, absenceTypeName, absenceHours } =
      isAbsenceOnDate(selectedDate);

    if (isAbsence) {
      let absenceMessage = "";
      if (absenceReason) {
        absenceMessage += "Reason: " + absenceReason + "\n\n";
      }
      if (absenceTypeName) {
        absenceMessage += "Type: " + absenceTypeName + "\n\n";
      }
      if (absenceHours) {
        absenceMessage += "Hours: " + absenceHours;
      }
      if (!absenceMessage) {
        absenceMessage = t("absence_message");
      }

      return (
        <View style={styles.emptyMessageContainer}>
          <Text style={styles.emptyMessageText}>{absenceMessage}</Text>
        </View>
      );
    }

    const weekendComponent = isWeekend && (
      <Text style={styles.weekendMessageText}>{t("non_working_day")}</Text>
    );

    // Format the selected date consistently to match the keys in the timesheetItemsMap.
    // This ensures we can accurately retrieve the timesheet items for the selected date.
    const selectedDateFormatted = selectedDate
      ? format(selectedDate, "yyyy-MM-dd")
      : null;

    // Retrieve the timesheet items for the formatted selected date from the map.
    // If no date is selected or the date is not found in the map, return an empty array.
    const timesheetItems =
      selectedDateFormatted && timesheetItemsMap[selectedDateFormatted]
        ? timesheetItemsMap[selectedDateFormatted]
        : [];

    if (timesheetItems.length === 0) {
      return (
        <View style={styles.emptyMessageContainer}>
          {weekendComponent}
          <Text style={styles.emptyMessageText}>
            {t("no_entry_found_selected_date")}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        ref={timesheetItemsRef}
        contentContainerStyle={styles.itemsScrollViewContent}
      >
        {weekendComponent}
        {timesheetItems.map((item, index) => (
          <View key={index} style={styles.itemsCardContainer}>
            <View style={styles.itemsCardHeader}>
              <Text numberOfLines={1} ellipsizeMode="tail">
                {
                  item.remark.find((remark) =>
                    preferredLanguages.includes(remark.language)
                  )?.text
                }
              </Text>
              {!isParentLocked && (
                <CustomButton
                  onPress={() => handleEditItem(item)}
                  label=""
                  icon={{
                    name: "square-edit-outline",
                    library: "MaterialCommunityIcons",
                    size: 24,
                    color: "#005eb8",
                  }}
                  backgroundColor={false}
                  style={{ paddingHorizontal: 0, paddingVertical: 0 }}
                />
              )}
            </View>
            <View style={styles.itemsCardSeparator} />
            <View>
              <View style={styles.itemsCardFirstRow}>
                <View>
                  <Text style={styles.itemsCardFirstRowLabel}>
                    {t("project")} ID
                  </Text>
                  <Text numberOfLines={1} ellipsizeMode="tail">
                    {item.projectExtID}
                  </Text>
                </View>
                <View>
                  <Text style={styles.itemsCardFirstRowLabel}>
                    {item.actualQuantity?.quantity ? t("quantity") : t("hours")}
                  </Text>
                  <Text style={styles.timeText}>
                    {item.actualQuantity?.quantity ||
                      convertMillisecondsToDuration(item.actualTime)}
                    {" h"}
                  </Text>
                </View>
                <View>
                  <Text style={styles.itemsCardFirstRowLabel}>
                    {t("billable")}
                  </Text>
                  <Text>{item.billable ? t("yes") : "No"} </Text>
                </View>
              </View>
              {item.projectText && (
                <View style={styles.itemsCardRow}>
                  <Text style={styles.itemsCardRowLabel}>{t("project")}:</Text>
                  <Text
                    style={styles.itemsCardRowValue}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.projectText.trim()}
                  </Text>
                </View>
              )}
              {item.taskText && (
                <View style={styles.itemsCardRow}>
                  <Text style={styles.itemsCardRowLabel}>{t("task")}:</Text>
                  <Text
                    style={styles.itemsCardRowValue}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.taskText.trim()}
                  </Text>
                </View>
              )}
              {item.customerText && (
                <View style={styles.itemsCardRow}>
                  <Text style={styles.itemsCardRowLabel}>{t("customer")}:</Text>
                  <Text
                    style={styles.itemsCardRowValue}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.customerText.trim()}
                  </Text>
                </View>
              )}
              {item.extStatus && (
                <View style={styles.itemsCardRow}>
                  <Text style={styles.itemsCardRowLabel}>{t("status")}:</Text>
                  <Text
                    style={styles.itemsCardRowValue}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.extStatus.setBy}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  useEffect(() => {
    if (!isValid(start) || !isValid(end)) {
      return;
    }

    setVisibleDates(generateVisibleDates(start, end));
  }, [start, end]);

  useEffect(() => {
    // Calculate non-working days based on nonWorking days and startOfWeek
    const calculatedNonWorkingDays =
      nonWorkingDays && nonWorkingDays.length > 0
        ? nonWorkingDays.map((day) => (day - startOfWeek + 7) % 7)
        : [];

    setWeekendList(calculatedNonWorkingDays);
  }, [nonWorkingDays, startOfWeek]);

  useEffect(() => {
    setHolidayList(findNonWorkingDatesInRange(nonWorkingDates, start, end));
  }, [nonWorkingDates, start, end]);

  useEffect(() => {
    const absencesDateEntries = buildAbsenceDateEntries(
      timesheetAbsences,
      start,
      end
    );

    setAbsenceList(findAbsencesInRange(absencesDateEntries, start, end));
  }, [timesheetAbsences, start, end]);

  useEffect(() => {
    // Generate timesheet items map when timesheet tasks change
    const newTimesheetItemsMap = generateTimesheetItemsMap(timesheetTasks);
    setTimesheetItemsMap(newTimesheetItemsMap);

    // Set selected date to the first date (start)
    setSelectedDate(start);
  }, [timesheetTasks]);

  console.debug(
    `Weekend list: ${JSON.stringify(
      weekendList
    )}, Holiday list: ${JSON.stringify(
      holidayList
    )}, Absence list: ${JSON.stringify(absenceList)}`
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ScrollView
          ref={dateListRef}
          horizontal
          contentContainerStyle={styles.horizontalScrollContent}
        >
          <View style={styles.hoursContainer}>
            <Text style={styles.hoursLabel}>{t("total")}:</Text>
            <Text style={styles.hoursValue}>
              {convertMillisecondsToDuration(totalTime)} h
            </Text>
          </View>
          <View style={styles.statusContainer}>
            <CustomStatus
              busObjCat={busObjCat}
              busObjId={busObjId}
              busObjType={timesheetType}
              busObjExtStatus={timesheetExtStatus}
              isParentLocked={isParentLocked}
              isEditMode={isEditMode}
              currentStatus={currentStatus}
              listOfNextStatus={listOfNextStatus}
              handleReload={handleReload}
              loading={loading}
            />
          </View>
        </ScrollView>
      </View>
      {isPanelVisible && (
        <CollapsiblePanel title={t("summary")} initiallyCollapsed={true}>
          <View style={styles.rowContainer}>
            <View style={[styles.rowChilds, { marginRight: 5 }]}>
              <Text style={styles.panelChildLabel}>{t("start")}</Text>
              <CustomDateTimePicker
                initialValue={start}
                onFilter={setStart}
                isDisabled={true}
              />
            </View>
            <View style={styles.rowChilds}>
              <Text style={styles.panelChildLabel}>{t("end")}</Text>
              <CustomDateTimePicker
                initialValue={end}
                onFilter={setEnd}
                isDisabled={true}
              />
            </View>
          </View>
          <View style={styles.panelChild}>
            <Text style={styles.panelChildLabel}>{t("remark")}</Text>
            <TextInput
              style={[
                styles.remarkInput,
                {
                  borderColor: isParentLocked && "rgba(0, 0, 0, 0.5)",
                },
              ]}
              value={remark}
              placeholder={t("placeholder_remark")}
              onChangeText={setRemark}
              editable={!isParentLocked}
            />
          </View>
          <View style={styles.indicatorContainer}>
            <View>
              <Text style={styles.panelChildLabel}>{t("weekend")}</Text>
              <View style={styles.weekendIndicator}>
                <View style={styles.weekendColorBox} />
              </View>
            </View>
            <View>
              <Text style={styles.panelChildLabel}>{t("selected")}</Text>
              <View style={styles.selectedIndicator}>
                <View style={styles.selectedColorBox} />
              </View>
            </View>
            <View>
              <Text style={styles.panelChildLabel}>{t("holiday")}</Text>
              <View style={styles.holidayIndicator}>
                <View style={styles.holidayColorBox} />
              </View>
            </View>
            <View>
              <Text style={styles.panelChildLabel}>{t("absence")}</Text>
              <View style={styles.absenceIndicator}>
                <View style={styles.absenceColorBox} />
              </View>
            </View>
          </View>
        </CollapsiblePanel>
      )}
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
      {renderTimesheetItems()}
      {!loading && (
        <View style={styles.floatingContainer}>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={isPanelVisible ? "#f5dd4b" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            value={isPanelVisible}
            onValueChange={() =>
              setIsPanelVisible((previousState) => !previousState)
            }
            style={styles.floatingButton}
          />
          <CustomButton
            onPress={() => {}}
            label=""
            icon={{
              name: "plus",
              library: "MaterialCommunityIcons",
              size: 40,
              color: "#fff",
            }}
            disabled={
              isParentLocked ||
              isHolidayOnDate(selectedDate).isHoliday ||
              isAbsenceOnDate(selectedDate).isAbsence
            }
            style={styles.floatingButton}
          />
        </View>
      )}
      {isEditingItem && (
        <TimesheetDetailItemEditor
          item={currentItem}
          onConfirm={handleConfirmEditItem}
          onCancel={handleCancelEditItem}
          isEditItem={true}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    backgroundColor: "#e5eef7",
  },
  header: {
    padding: "2%",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    backgroundColor: "#fff",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    marginBottom: 10,
  },
  horizontalScrollContent: {
    flexGrow: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hoursContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
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
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    backgroundColor: "white",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    marginBottom: 10,
  },
  dateList: {
    padding: "4%",
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
    borderWidth: 2,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  dayText: {
    fontSize: 12,
    color: "#555",
  },
  dateText: {
    fontSize: 22,
    color: "#000",
  },
  monthText: {
    fontSize: 12,
    color: "#555",
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
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2%",
  },
  rowChilds: {
    flex: 1,
  },
  panelChild: {
    marginBottom: "2%",
  },
  panelChildLabel: {
    marginBottom: "1%",
    fontSize: 16,
    fontWeight: "bold",
  },
  remarkInput: {
    borderWidth: 1,
    padding: "2%",
    borderRadius: 8,
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
    justifyContent: "space-between",
  },
  itemsCardSeparator: {
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
    marginVertical: "2%",
  },
  itemsCardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: "1%",
  },
  itemsCardRowLabel: {
    fontSize: 14,
    fontWeight: "bold",
    flexShrink: 0, // This prevents the label from shrinking
    marginRight: 5,
  },
  itemsCardRowValue: {
    fontSize: 14,
    flexShrink: 1, // This allows the value to shrink if needed
    flexWrap: "wrap", // Allow the text to wrap if it's too long
  },
  itemsCardFirstRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  itemsCardFirstRowLabel: {
    fontWeight: "bold",
  },
  timeText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "green",
  },
  floatingContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    alignItems: "center",
  },
  floatingButton: {
    marginBottom: 10,
    width: 50,
    height: 50,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#005eb8",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  floatingContainer1: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    right: 120,
    top: screenDimension.height / 2,
    borderRadius: 8,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  indicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "2%",
    paddingHorizontal: "1%",
  },
  weekendIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectedIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  holidayIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  absenceIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  weekendColorBox: {
    width: 20,
    height: 20,
    backgroundColor: "#d3d3d3",
    borderWidth: 0.5,
  },
  selectedColorBox: {
    width: 20,
    height: 20,
    backgroundColor: "#bdcff1",
    borderWidth: 0.5,
  },
  holidayColorBox: {
    width: 20,
    height: 20,
    backgroundColor: "#ffeb3b",
    borderWidth: 0.5,
  },
  absenceColorBox: {
    width: 20,
    height: 20,
    backgroundColor: "#ffcccb",
    borderWidth: 0.5,
  },
  emptyMessageContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    padding: "4%",
  },
  emptyMessageText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
  },
  weekendMessageText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginVertical: "4%"
  }
});

export default TimesheetDetailGeneral;
