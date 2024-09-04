import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { FlatList } from "react-native-gesture-handler";
import { addDays, format, eachDayOfInterval, isValid, parse } from "date-fns";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import TimesheetDetailItemEditor from "./TimesheetDetailItemEditor";

import CollapsiblePanel from "../components/CollapsiblePanel";
import CustomButton from "../components/CustomButton";
import CustomStatus from "../components/CustomStatus";
import CustomTextInput from "../components/CustomTextInput";

import {
  convertMillisecondsToDuration,
  convertToDateFNSFormat,
  convertToDateObject,
  getRemarkText,
  normalizeDateToUTC,
  setRemarkText,
} from "../utils/FormatUtils";
import { screenDimension } from "../utils/ScreenUtils";
import {
  APP,
  BUSOBJCAT,
  BUSOBJCATMAP,
  PREFERRED_LANGUAGES,
} from "../constants";
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
  selectedDateInCreate,
  onTimesheetDetailChange,
  OnFindingLeaveDates,
  timesheetTypeDetails,
  timesheetDetail,
}) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const {
    loggedInUserInfo: {
      hireDate,
      termDate,
      nonWorkingDates,
      nonWorkingDays,
      dailyStdHours,
      patterns,
    },
  } = useContext(LoggedInUserInfoContext);

  const dateListRef = useRef(null);
  const timesheetItemsRef = useRef(null);

  const {
    timesheetType,
    timesheetExtStatus,
    timesheetStart,
    timesheetEnd,
    timesheetRemark,
    timesheetTotalTime,
    timesheetBillableTime,
    timesheetOverTime,
    timesheetTasks,
    timesheetAbsences,
    itemStatusIDMap,
  } = timesheetDetail;

  const [keyboardShown, setKeyboardShown] = useState(false);

  const { timesheetTypePeriod = 7 } = timesheetTypeDetails; // Default period is 7 days (weekly)
  const timesheetStartDate = convertToDateObject(timesheetStart);
  const timesheetEndDate = convertToDateObject(timesheetEnd);
  const [type, setType] = useState(timesheetType);
  const [period, setPeriod] = useState(timesheetTypePeriod);
  const [headerExtStatus, setHeaderExtStatus] = useState(timesheetExtStatus);
  const [weekendList, setWeekendList] = useState([]);
  const [holidayList, setHolidayList] = useState([]);
  const [absenceList, setAbsenceList] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    selectedDateInCreate ? new Date(selectedDateInCreate) : null
  );
  const [visibleDates, setVisibleDates] = useState([]);
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [isItemEditMode, setIsItemEditMode] = useState(false);
  const [currentItem, setCurrentItem] = useState({});
  const [timesheetItemsMap, setTimesheetItemsMap] = useState(new Map());
  const [start, setStart] = useState(timesheetStartDate);
  const [end, setEnd] = useState(convertToDateObject(timesheetEndDate));
  const [totalTime, setTotalTime] = useState(timesheetTotalTime || 0);
  const [totalTimesheetTime, setTimesheetTotalTime] = useState(
    timesheetTotalTime || 0
  );
  const [billableTime, setBillableTime] = useState(timesheetBillableTime || 0);
  const [overTime, setOverTime] = useState(timesheetOverTime || 0);
  const [dayTotalTime, setDayTotalTime] = useState(0);
  const [holidayDayTotalMap, setHolidayDayTotalMap] = useState(new Map());
  const [absenceDayTotalMap, setAbsenceDayTotalMap] = useState(new Map());
  const [dayTotalMap, setDayTotalMap] = useState(new Map());
  const [tasks, SetTasks] = useState(timesheetTasks);
  const [headerRemarkText, setHeaderRemarkText] = useState(
    getRemarkText(timesheetRemark, lang, PREFERRED_LANGUAGES)
  );

  /**
   * Sums the hours from the holiday and absence lists.
   *
   * - For holidays, it uses the daily standard hours.
   * - For absences, it uses the corresponding absence hours.
   *
   * @returns {number} - The total sum of hours in milliseconds.
   */
  const sumHolidayAndAbsenceHours = () => {
    let totalAbsenceHolidayTime = 0;

    // Sum holiday hours using the daily standard hours
    holidayList.forEach((holiday) => {
      totalAbsenceHolidayTime += dailyStdHours;
    });

    // Sum absence hours
    absenceList.forEach((absence) => {
      totalAbsenceHolidayTime += absence.absenceHours;
    });

    return totalAbsenceHolidayTime;
  };

  useEffect(() => {
    // Extract dates from a list
    const extractDates = (list) => {
      return list.map((item) => {
        const date = new Date(item.date);
        return date.toDateString(); // Convert date to a string format
      });
    };

    // Extract and format dates
    const holidayDates = extractDates(holidayList);
    const absenceDates = extractDates(absenceList);

    // Create a map for absence dates with corresponding absence hours
    const absenceDateHoursMap = absenceList.reduce((map, item) => {
      const date = new Date(item.date).toDateString(); // Format the date
      map[date] = item.absenceHours; // Store the corresponding absence hours
      return map;
    }, {});

    // Combine and deduplicate dates
    const leaveDates = [...new Set([...holidayDates, ...absenceDates])]; // Combine and remove duplicates

    if (OnFindingLeaveDates) {
      OnFindingLeaveDates(leaveDates, absenceDateHoursMap);
    }
  }, [holidayList, absenceList]);

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
    const updatedTimesheetRemark = setRemarkText(
      timesheetRemark,
      lang,
      headerRemarkText
    );

    // Call the callback function to propagate the changes for the header remark text
    onTimesheetDetailChange({ timesheetRemark: updatedTimesheetRemark });
  }, [headerRemarkText]);

  useEffect(() => {
    const updatedValues = {
      timesheetTotalTime: totalTime,
      timesheetBillableTime: billableTime,
      timesheetOverTime: overTime,
      timesheetTasks: tasks,
    };

    // Call the callback function to propagate the changes
    onTimesheetDetailChange(updatedValues);
  }, [totalTime, billableTime, overTime, tasks]);

  const handleHeaderRemarkChange = (text) => {
    // Update local state for the header remark text
    setHeaderRemarkText(text);
  };

  const recalculateActualTimeMap = (
    updatedTimesheetItemsMap,
    holidayDayTotalMap,
    absenceDayTotalMap
  ) => {
    let totalWorkTimeInMilli = 0;
    let totalTimeInMilli = 0;
    let totalBillableTime = 0;

    console.debug("holidayDayTotalMap:");
    holidayDayTotalMap.forEach((value, key) => {
      console.debug(`date: ${key}, time: ${value / 3600000} h`);
    });

    console.debug("absenceDayTotalMap:");
    absenceDayTotalMap.forEach((value, key) => {
      console.debug(`date: ${key}, time: ${value / 3600000} h`);
    });

    console.debug("updatedTimesheetItemsMap:");
    updatedTimesheetItemsMap.forEach((value, key) => {
      console.debug(`Key: ${key}, time (in hours):`);
      value.forEach((item, index) => {
        console.debug(`  Item ${index}:`, item.actualTime / 3600000);
        if (item.billable) {
          totalBillableTime += item.actualTime;
        }
        totalWorkTimeInMilli += item.actualTime;
      });
    });

    const updatedDayTotalMap = new Map();

    // Add all dates from holidayDayTotalMap to updatedDayTotalMap
    holidayDayTotalMap.forEach((time, date) => {
      updatedDayTotalMap.set(date, time);
    });

    // Add all dates from absenceDayTotalMap to updatedDayTotalMap
    absenceDayTotalMap.forEach((time, date) => {
      if (updatedDayTotalMap.has(date)) {
        updatedDayTotalMap.set(date, updatedDayTotalMap.get(date) + time);
      } else {
        updatedDayTotalMap.set(date, time);
      }
    });

    // Iterate through the timesheet items map
    updatedTimesheetItemsMap.forEach((items, date) => {
      let totalActualTimeForDate = 0;
      items.forEach((item) => {
        const { actualTime } = item;
        totalActualTimeForDate += actualTime || 0;
      });

      // Initialize total for the date if it doesn't exist in updatedDayTotalMap
      if (!updatedDayTotalMap.has(date)) {
        updatedDayTotalMap.set(date, 0);
      }

      // Add the total actual time for the date
      updatedDayTotalMap.set(
        date,
        updatedDayTotalMap.get(date) + totalActualTimeForDate
      );
    });

    console.debug("updatedDayTotalMap:");
    updatedDayTotalMap.forEach((value, key) => {
      console.debug(`date: ${key}, total time: ${value / 3600000} h`);
    });

    // Update dayTotalMap state
    setDayTotalMap(new Map(updatedDayTotalMap));

    // Calculate total time (including holidays and absence time) in milliseconds
    for (const timeInMilli of updatedDayTotalMap.values()) {
      totalTimeInMilli += timeInMilli;
    }

    setTotalTime(totalWorkTimeInMilli);
    setTimesheetTotalTime(totalTimeInMilli);
    setBillableTime(totalBillableTime);
  };

  const generateTimesheetItemsMap = (tasks) => {
    console.debug(
      "Tasks (or timesheet items) before converting to timesheetItemsMap:",
      JSON.stringify(tasks)
    );

    const timesheetItemsMap = new Map();

    tasks.forEach((task) => {
      const {
        customerID,
        "customerID:Customer-extID": customerExtID,
        "customerID:Customer-name-text": customerText,
        projectWbsID,
        "projectWbsID:ProjectWBS-extID": projectExtID,
        "projectWbsID:ProjectWBS-text-text": projectText,
        taskID,
        "taskID:Task-extID": taskExtID,
        "taskID:Task-text-text": taskText,
        department,
        "department:BusUnit-extID": departmentExtID,
        "department:BusUnit-name-text": departmentText,
        billable,
        items,
        extStatus,
        timeType,
        "timeType:TimeItemType-id": timeItemTypeId,
        "timeType:TimeItemType-name": timeItemTypeText,
      } = task;

      items.forEach((item) => {
        const {
          actualQuantity,
          actualTime,
          billableTime,
          productive,
          end,
          remark,
          start,
        } = item;

        const formattedStart = format(new Date(start), "yyyy-MM-dd");

        const timesheetItem = {
          customerId: customerID || "",
          customerText: customerText || "",
          customerExtId: customerExtID || "",
          projectId: projectWbsID || "",
          projectExtId: projectExtID || "",
          projectText: projectText || "",
          taskId: taskID || "",
          taskExtId: taskExtID || "",
          taskText: taskText || "",
          departmentId: department || "",
          departmentExtId: departmentExtID || "",
          departmentText: departmentText || "",
          billable: billable || false,
          start: start || "",
          end: end || "",
          actualTime: actualTime || 0,
          billableTime: billableTime || 0,
          productive: productive || false,
          actualQuantity: actualQuantity || { quantity: 0, unit: "" },
          remark: remark || [],
          extStatus: extStatus || {},
          statusLabel: itemStatusIDMap?.[extStatus?.statusID] || "",
          timeItemTypeExtId: timeType || "",
          timeItemTypeId: timeItemTypeId || "",
          timeItemTypeText: timeItemTypeText || "",
        };

        if (!timesheetItemsMap.has(formattedStart)) {
          timesheetItemsMap.set(formattedStart, []);
        }

        timesheetItemsMap.get(formattedStart).push(timesheetItem);
      });
    });

    console.debug(
      "Timesheet items map after conversion:",
      Array.from(timesheetItemsMap.entries()).map(([key, value]) => ({
        date: key,
        items: JSON.stringify(value),
      }))
    );

    return timesheetItemsMap;
  };

  const convertTimesheetItemsMapToTasks = (timesheetItemsMap) => {
    const tasks = [];

    timesheetItemsMap.forEach((items, date) => {
      items.forEach((item) => {
        const {
          customerId,
          customerText,
          customerExtId,
          projectId,
          projectExtId,
          projectText,
          taskId,
          taskExtId,
          taskText,
          departmentId,
          departmentExtId,
          departmentText,
          billable,
          productive,
          billableTime,
          start,
          end,
          actualTime,
          actualQuantity,
          remark,
          extStatus,
          statusLabel,
          timeItemTypeExtId,
          timeItemTypeId,
          timeItemTypeText,
        } = item;

        // Convert date string back to the original format
        const originalDate = format(
          parse(date, "yyyy-MM-dd", new Date()),
          "yyyy-MM-dd'T'HH:mm:ssxxx"
        );

        // Create a unique key based on a combination of departmentId and taskId
        const uniqueKey = `${departmentId || ""}${taskId || ""}`;

        // Find or create the task entry
        let task = tasks.find((t) => t.uniqueKey === uniqueKey);

        if (!task) {
          task = {
            uniqueKey, // Add uniqueKey to the task for easier lookup
            customerID: customerId,
            "customerID:Customer-extID": customerExtId,
            "customerID:Customer-name-text": customerText,
            projectWbsID: projectId,
            "projectWbsID:ProjectWBS-extID": projectExtId,
            "projectWbsID:ProjectWBS-text-text": projectText,
            taskID: taskId,
            "taskID:Task-extID": taskExtId,
            "taskID:Task-text-text": taskText,
            department: departmentId,
            "department:BusUnit-extID": departmentExtId,
            "department:BusUnit-name-text": departmentText,
            billable: billable,
            items: [],
            extStatus: extStatus,
            timeType: timeItemTypeExtId,
            "timeType:TimeItemType-id": timeItemTypeId,
            "timeType:TimeItemType-name": timeItemTypeText,
          };
          tasks.push(task);
        }

        // Add the item to the task's items
        task.items.push({
          actualQuantity,
          actualTime,
          productive,
          billableTime,
          start: start || normalizeDateToUTC(originalDate),
          end: end || normalizeDateToUTC(originalDate),
          remark,
          // TODO: The backend currently only processes remarks in the "en" language.
          // As a temporary workaround, we are sending the remark using "remark:text".
          // Once the backend supports multiple languages for remarks,
          // uncomment the full "remark" array and remove the "remark:text" property.
          //"remark:text": getRemarkText(remark, lang, PREFERRED_LANGUAGES),
          extStatus,
          statusID: itemStatusIDMap?.[statusLabel] || "",
        });
      });
    });

    // Remove the uniqueKey before returning tasks
    tasks.forEach((task) => {
      delete task.uniqueKey;
    });

    console.debug(
      "Updated tasks (or timesheet items) after converting from timesheetItemsMap:",
      JSON.stringify(tasks)
    );

    return tasks;
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
              absenceHours: hours,
            });
          }
        }
      );
    });

    return absenceDateEntries;
  };

  // Handler for selecting a date
  const handleDateSelection = (index, date) => {
    setSelectedDate(date); // Update the selected date in state
  };

  // Determine the index of the selected date, only if not in edit mode
  const selectedIndex = !isEditMode
    ? visibleDates.findIndex(
        (item) =>
          format(item.fullDate, "yyyy-MM-dd") ===
          format(selectedDate, "yyyy-MM-dd")
      )
    : -1; // Set to -1 if in edit mode, indicating no need to find index

  // Get layout information for each item in the date list
  const getDateListItemLayout = (data, index) => ({
    length: 40, // Fixed height of each item in the list
    offset: 40 * index, // Calculate the offset for the item based on its index
    index,
  });

  // Fallback handler for scrolling to an index if the operation fails
  const handleDateListScrollToIndexFailed = (error) => {
    console.error("Scrolling failed in date list", error); // Log the error
    if (dateListRef.current) {
      dateListRef.current.scrollToIndex({
        index: 0, // Scroll to the start of the list
        animated: true, // Animate the scroll
      });
    }
  };

  // Generate an array of visible dates between start and end dates
  const generateVisibleDates = (start, end) => {
    const interval = { start, end };
    const dates = eachDayOfInterval(interval); // Create an array of dates in the interval

    return dates.map((date) => ({
      day: format(date, "EEE").toUpperCase().slice(0, 2), // Format the day as an abbreviated string
      date: format(date, "dd"), // Format the date as a day of the month
      month: format(date, "MMM").toUpperCase(), // Format the month as an abbreviated string
      fullDate: date, // Store the full date object
    }));
  };

  const fetchPreviousDates = () => {
    // Extract and convert the fullDate of the first visible date
    const firstVisibleDate = new Date(visibleDates[0].fullDate);

    // Calculate new end and start dates using the period
    const newEnd = addDays(firstVisibleDate, -1);
    const newStart = addDays(newEnd, -(period - 1)); // period - 1 to cover the entire period

    setStart(newStart);
    setEnd(newEnd);

    // Scroll to the left
    dateListRef?.current?.scrollToIndex({
      index: 0,
      animated: true,
    });
  };

  const fetchNextDates = () => {
    // Extract and convert the fullDate of the last visible date
    const lastVisibleDate = new Date(
      visibleDates[visibleDates.length - 1].fullDate
    );

    // Calculate new start and end dates using the period
    const newStart = addDays(lastVisibleDate, 1);
    const newEnd = addDays(newStart, period - 1); // period - 1 to cover the entire period

    setStart(newStart);
    setEnd(newEnd);

    // Scroll to the right
    dateListRef?.current?.scrollToIndex({
      index: dateListRef.current.scrollWidth,
      animated: true,
    });
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

  const isAbsenceOnDate = (date) => {
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
          absenceHours: convertMillisecondsToDuration(absence.absenceHours),
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

  const isWeekendOnDate = (date) => {
    if (!date) {
      return { isWeekend: false };
    }

    const dayOfWeek = date.getDay();
    return { isWeekend: weekendList.includes(dayOfWeek) };
  };

  const renderDateItem = ({ item, index }) => {
    const { isWeekend } = isWeekendOnDate(item.fullDate);
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
          isHoliday && { backgroundColor: "#aaf0c9" },
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
          {item.month}
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
      const date = new Date(nonWorkingDates[i].date);
      if (date >= start && date <= end) {
        nonWorkingDatesInRange.push(nonWorkingDates[i]);
      }
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

  /**
   * Creates a map with daySeq as the key and stdWorkHours as the value.
   *
   * @param {Array} patterns - Array of pattern objects.
   * @returns {Map} A map with daySeq as keys and stdWorkHours as values.
   */
  const createDaySeqMap = (patterns) => {
    const daySeqMap = new Map();

    patterns.forEach((pattern) => {
      // Skip the pattern if its intStatus is 3
      if (pattern.intStatus === 3) {
        return;
      }

      pattern.details.forEach((detail) => {
        // Add to the map only if detail's intStatus is not 3
        if (detail.intStatus !== 3 && detail.stdWorkHours > 0) {
          daySeqMap.set(detail.daySeq, detail.stdWorkHours);
        }
      });
    });

    return daySeqMap;
  };

  const validateItemCreateOrEdit = () => {
    if (hireDate && selectedDate.getTime() < new Date(hireDate).getTime()) {
      showToast(
        t("error_hire_date", {
          date: format(
            hireDate,
            convertToDateFNSFormat(APP.LOGIN_USER_DATE_FORMAT)
          ),
        }),
        "error"
      );
      return false;
    }

    if (termDate && selectedDate.getTime() > new Date(termDate).getTime()) {
      showToast(
        t("error_term_date", {
          date: format(
            termDate,
            convertToDateFNSFormat(APP.LOGIN_USER_DATE_FORMAT)
          ),
        }),
        "error"
      );
      return false;
    }

    return true;
  };

  const handleCreateItemClick = (item) => {
    // Perform item validation
    if (!validateItemCreateOrEdit()) {
      return; // Exit the function if validation fails
    }

    setIsItemEditMode(false);

    setCurrentItem({
      // Set default values for a new item
      customerId: "",
      customerText: "",
      customerExtId: "",
      projectId: "",
      projectExtId: "",
      projectText: "",
      taskId: "",
      taskExtId: "",
      taskText: "",
      departmentIdId: "",
      departmentExtId: "",
      departmentText: "",
      billable: false,
      productive: false,
      billableTime: 0,
      start: "",
      end: "",
      actualTime: 0,
      actualQuantity: { quantity: 0, unit: "" },
      remark: [],
      extStatus: {},
      statusLabel: "",
    });
    setIsEditingItem(true);
  };

  const handleEditItemClick = (item) => {
    // Perform item validation
    if (!validateItemCreateOrEdit()) {
      return; // Exit the function if validation fails
    }

    setIsItemEditMode(true);
    setCurrentItem(item);
    setIsEditingItem(true);
  };

  const handleDeleteItemClick = (item) => {
    Alert.alert(
      t("delete_item"),
      t("delete_item_confirmation"),
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        { text: "OK", onPress: () => onDeleteItem(item) },
      ],
      { cancelable: false }
    );
  };

  const onDeleteItem = (itemToDelete) => {
    const selectedDateFormatted = format(new Date(selectedDate), "yyyy-MM-dd");

    let items = timesheetItemsMap.has(selectedDateFormatted)
      ? [...timesheetItemsMap.get(selectedDateFormatted)]
      : [];

    // Find the index based on either departmentId or taskId
    const index = items.findIndex(
      (item) =>
        item.taskId === itemToDelete.taskId ||
        item.departmentId === itemToDelete.departmentId
    );

    if (index !== -1) {
      // Remove the item from the array
      items.splice(index, 1);

      // If there are no more items for the selected date, remove the date entry from the map
      const updatedTimesheetItemsMap = new Map(timesheetItemsMap);
      if (items.length === 0) {
        updatedTimesheetItemsMap.delete(selectedDateFormatted);
      } else {
        updatedTimesheetItemsMap.set(selectedDateFormatted, items);
      }

      console.debug(
        `On delete the items remaining on date ${selectedDateFormatted} is/are ${JSON.stringify(
          items
        )}`
      );

      setTimesheetItemsMap(updatedTimesheetItemsMap);
      SetTasks(convertTimesheetItemsMapToTasks(updatedTimesheetItemsMap));
    }
  };

  const handleCancelEditItem = () => {
    setIsEditingItem(false);
    setCurrentItem({});
  };

  /**
   * Handles the confirmation of editing an item in the timesheet.
   * It updates the existing item if it matches the `taskId` or `departmentId`,
   * or adds it as a new item if no match is found.
   * Checks for duplicate `taskId` or `departmentId` values to prevent duplicates.
   *
   * @function handleConfirmCreateOrEditItem
   * @param {Object} editedItem - The item with updated values to be saved.
   * @param {string} editedItem.taskId - The ID of the task.
   * @param {string} editedItem.departmentId - The ID of the department.
   * @param {string} editedItem.otherField - Example additional fields of the task.
   * @returns {void}
   */
  const handleConfirmCreateOrEditItem = (editedItem) => {
    const selectedDateFormatted = format(new Date(selectedDate), "yyyy-MM-dd");

    // Get the existing items for the selected date
    let items = timesheetItemsMap.has(selectedDateFormatted)
      ? [...timesheetItemsMap.get(selectedDateFormatted)]
      : [];

    // Generate a unique key combining departmentId and taskId for comparison
    const generateUniqueKey = (item) =>
      `${item.departmentId || ""}${item.taskId || ""}`;

    const editedItemKey = generateUniqueKey(editedItem);

    // Check for duplicate taskId or departmentId in items that are not the current item being edited
    const duplicateItemIndex = items.findIndex(
      (item) =>
        generateUniqueKey(item) === editedItemKey &&
        generateUniqueKey(item) !== generateUniqueKey(currentItem)
    );

    if (duplicateItemIndex !== -1) {
      // An item with the same taskId or departmentId already exists and it's not the same as the edited item
      Alert.alert(
        t("validation_error"),
        t("item_exists", { selectedDate: selectedDateFormatted }),
        [{ text: t("ok"), style: "cancel" }],
        { cancelable: false }
      );
      return; // Exit the function to prevent further processing
    }

    // Check if the item already exists in the list
    const existingItemIndex = items.findIndex(
      (item) => generateUniqueKey(item) === generateUniqueKey(currentItem)
    );

    if (existingItemIndex !== -1) {
      // Item exists; update it
      items[existingItemIndex] = editedItem;
    } else {
      // Item does not exist; add it to the list
      items.push(editedItem);
    }

    // Update the timesheet items map with the new list
    const updatedTimesheetItemsMap = new Map(timesheetItemsMap);
    updatedTimesheetItemsMap.set(selectedDateFormatted, items);

    console.debug(
      `On confirm, the items going to be updated on date ${selectedDateFormatted} are ${JSON.stringify(
        items
      )}`
    );

    setTimesheetItemsMap(updatedTimesheetItemsMap);
    setCurrentItem({});
    setIsEditingItem(false);

    SetTasks(convertTimesheetItemsMapToTasks(updatedTimesheetItemsMap));
  };

  const renderTimesheetItems = () => {
    const { isHoliday, holidayName } = isHolidayOnDate(selectedDate);

    let holidayMessage = "";
    if (isHoliday) {
      if (holidayName) {
        holidayMessage +=
          t("holiday") +
          ": " +
          holidayName +
          "\n" +
          t("hours") +
          ": " +
          convertMillisecondsToDuration(dailyStdHours) +
          " h";
      } else {
        holidayMessage += t("absence_message");
      }
    }

    const { isAbsence, absenceReason, absenceTypeName, absenceHours } =
      isAbsenceOnDate(selectedDate);

    let absenceMessage = "";
    if (isAbsence) {
      if (absenceReason) {
        absenceMessage += t("reason") + ": " + absenceReason + "\n";
      }
      if (absenceTypeName) {
        absenceMessage += t("type") + ": " + absenceTypeName + "\n";
      }
      if (absenceHours) {
        absenceMessage += t("hours") + ": " + absenceHours + " h";
      }
      if (!absenceMessage) {
        absenceMessage = t("absence_message");
      }
    }

    const { isWeekend } = isWeekendOnDate(selectedDate);

    // Format the selected date consistently to match the keys in the timesheetItemsMap.
    // This ensures we can accurately retrieve the timesheet items for the selected date.
    const selectedDateFormatted = selectedDate
      ? format(new Date(selectedDate), "yyyy-MM-dd")
      : null;

    // Retrieve the timesheet items for the formatted selected date from the map.
    // If no date is selected or the date is not found in the map, return an empty array.
    const timesheetItems =
      selectedDateFormatted && timesheetItemsMap.has(selectedDateFormatted)
        ? timesheetItemsMap.get(selectedDateFormatted)
        : [];

    if (timesheetItems.length === 0) {
      return (
        <View style={styles.emptyMessageContainer}>
          {isHoliday && (
            <Text style={styles.dayTypeMessage}>{holidayMessage}</Text>
          )}
          {isAbsence && (
            <Text style={styles.dayTypeMessage}>{absenceMessage}</Text>
          )}
          {isWeekend && (
            <Text style={styles.dayTypeMessage}>{t("non_working_day")}</Text>
          )}
          <Text style={styles.emptyMessageText}>
            {t("no_entry_found_selected_date", {
              selectedDate: selectedDate
                ? format(
                    selectedDate,
                    convertToDateFNSFormat(APP.LOGIN_USER_DATE_FORMAT)
                  )
                : "",
            })}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        ref={timesheetItemsRef}
        contentContainerStyle={styles.itemsScrollViewContent}
      >
        {isHoliday && (
          <Text style={styles.dayTypeMessage}>{holidayMessage}</Text>
        )}
        {isAbsence && (
          <Text style={styles.dayTypeMessage}>{absenceMessage}</Text>
        )}
        {isWeekend && (
          <Text style={styles.dayTypeMessage}>{t("non_working_day")}</Text>
        )}
        {timesheetItems.map((item, index) => (
          <View
            key={index}
            style={[
              styles.itemsCardContainer,
              item.isDirty && styles.dirtyItem,
            ]}
          >
            <View style={styles.itemsCardHeader}>
              <View style={styles.remarkContainer}>
                <Text numberOfLines={1} ellipsizeMode="tail">
                  {getRemarkText(item.remark, lang, PREFERRED_LANGUAGES) ||
                    `${t("no_remarks_available")}...`}
                </Text>
              </View>

              <View style={styles.itemButtonContainer}>
                <View style={styles.editButtonContainer}>
                  <CustomButton
                    onPress={() => handleEditItemClick(item)}
                    label=""
                    icon={{
                      name: !isParentLocked
                        ? "square-edit-outline"
                        : "eye-outline",
                      library: "MaterialCommunityIcons",
                      size: 24,
                      color: "#005eb8",
                    }}
                    backgroundColor={false}
                    style={{ paddingHorizontal: 0, paddingVertical: 0 }}
                  />
                </View>
                {!isParentLocked && (
                  <View style={styles.deleteButtonContainer}>
                    <CustomButton
                      onPress={() => handleDeleteItemClick(item)}
                      label=""
                      icon={{
                        name: "trash-can-outline",
                        library: "MaterialCommunityIcons",
                        size: 24,
                        color: "#d9534f",
                      }}
                      backgroundColor={false}
                      style={{ paddingHorizontal: 0, paddingVertical: 0 }}
                    />
                  </View>
                )}
              </View>
            </View>
            <View style={styles.itemsCardSeparator} />
            <View>
              <View style={styles.itemsCardFirstRow}>
                {item.projectExtId && (
                  <View>
                    <Text style={styles.itemsCardFirstRowLabel}>
                      {t("project")} ID
                    </Text>
                    <Text numberOfLines={1} ellipsizeMode="tail">
                      {item.projectExtId}
                    </Text>
                  </View>
                )}
                <View>
                  <Text style={styles.itemsCardFirstRowLabel}>
                    {t("hours")}
                  </Text>
                  <Text style={styles.timeText}>
                    {convertMillisecondsToDuration(item.actualTime)}
                    {" h"}
                    {item.actualQuantity?.quantity
                      ? ` (Qty: ${item.actualQuantity?.quantity} ${item.actualQuantity?.unit})`
                      : ""}
                  </Text>
                </View>
                <View>
                  <Text style={styles.itemsCardFirstRowLabel}>
                    {t("billable")}
                  </Text>
                  <Text>{item.billable ? t("yes") : "No"} </Text>
                </View>
              </View>
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
                    {item.taskText?.trim()}
                  </Text>
                </View>
              )}
              {item.departmentText && (
                <View style={styles.itemsCardRow}>
                  <Text style={styles.itemsCardRowLabel}>
                    {t("department")}:
                  </Text>
                  <Text
                    style={styles.itemsCardRowValue}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.departmentText?.trim()}
                  </Text>
                </View>
              )}
              <View style={styles.itemsCardRow}>
                <Text style={styles.itemsCardRowLabel}>{t("time_type")}:</Text>
                <Text
                  style={styles.itemsCardRowValue}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.timeItemTypeText || t("standard_timesheet")}
                </Text>
              </View>
              {item.statusLabel && (
                <View style={styles.itemsCardRow}>
                  <Text style={styles.itemsCardRowLabel}>{t("status")}:</Text>
                  <Text
                    style={styles.itemsCardRowValue}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.statusLabel}
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
    // Get non working days from patterns if it's defined
    if (patterns.length > 0) {
      // Initialize all potential daySeq values
      const allDaysOfWeek = new Set([0, 1, 2, 3, 4, 5, 6]);

      const daySeqMap = createDaySeqMap(patterns);

      // Add keys of daySeqMap to nonWorkingDays if not already present and not any key of daySeqMap
      allDaysOfWeek.forEach((dayOfWeek) => {
        if (!nonWorkingDays.includes(dayOfWeek) && !daySeqMap.has(dayOfWeek)) {
          nonWorkingDays.push(dayOfWeek);
        }
      });
    }

    setWeekendList(nonWorkingDays);
  }, [nonWorkingDays, patterns]);

  useEffect(() => {
    const nonWorkingDatesInRange = findNonWorkingDatesInRange(
      nonWorkingDates,
      start,
      end
    );

    setHolidayList(nonWorkingDatesInRange);

    const updatedHolidayDayTotalMap = new Map();
    nonWorkingDatesInRange.forEach((nonWorkingDateEntry) => {
      const formattedNonWorkingDate = nonWorkingDateEntry?.date
        ? format(new Date(nonWorkingDateEntry.date), "yyyy-MM-dd")
        : null;
      if (formattedNonWorkingDate !== null) {
        const currentTotal =
          updatedHolidayDayTotalMap.get(formattedNonWorkingDate) || 0;
        updatedHolidayDayTotalMap.set(
          formattedNonWorkingDate,
          currentTotal + dailyStdHours
        );
      }
    });

    setHolidayDayTotalMap(updatedHolidayDayTotalMap);
  }, [nonWorkingDates, start, end]);

  useEffect(() => {
    const absencesDateEntries = buildAbsenceDateEntries(
      timesheetAbsences,
      start,
      end
    );
    const absencesInRange = findAbsencesInRange(
      absencesDateEntries,
      start,
      end
    );

    setAbsenceList(absencesInRange);

    const updatedAbsenceDayTotalMap = new Map();
    absencesInRange.forEach((absenceEntry) => {
      const formattedAbsenceDate = absenceEntry?.date
        ? format(new Date(absenceEntry.date), "yyyy-MM-dd")
        : null;
      if (formattedAbsenceDate !== null) {
        const currentTotal =
          updatedAbsenceDayTotalMap.get(formattedAbsenceDate) || 0;
        updatedAbsenceDayTotalMap.set(
          formattedAbsenceDate,
          currentTotal + (absenceEntry.absenceHours || 0)
        );
      }
    });

    setAbsenceDayTotalMap(updatedAbsenceDayTotalMap);
  }, [timesheetAbsences, start, end]);

  useEffect(() => {
    // Generate timesheet items map when timesheet tasks change
    const newTimesheetItemsMap = generateTimesheetItemsMap(tasks);

    setTimesheetItemsMap(newTimesheetItemsMap);

    // On opening the timesheet detail use the date selected at the time of timesheet creation
    // Otherwise, set the selected date to the start date if it's valid
    if (!selectedDate && isValid(start)) {
      setSelectedDate(start);
    }
  }, []);

  useEffect(() => {
    const formattedDate = selectedDate
      ? format(new Date(selectedDate), "yyyy-MM-dd")
      : null;
    setDayTotalTime(dayTotalMap.get(formattedDate) || 0);
  }, [selectedDate, dayTotalMap]);

  // Scroll to the selected date when the component mounts
  useEffect(() => {
    if (selectedIndex !== -1 && dateListRef && dateListRef.current) {
      dateListRef.current.scrollToIndex({
        index: selectedIndex,
        animated: true,
        viewPosition: 0.5,
      });
    }
  }, [selectedIndex]);

  useEffect(() => {
    recalculateActualTimeMap(
      timesheetItemsMap,
      holidayDayTotalMap,
      absenceDayTotalMap
    );
  }, [holidayDayTotalMap, absenceDayTotalMap, timesheetItemsMap]);

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
          horizontal
          contentContainerStyle={styles.horizontalScrollContent}
        >
          <View style={styles.hoursContainer}>
            <Text style={styles.hoursLabel}>{t("day_total")}:</Text>
            <Text style={styles.hoursValue}>
              {convertMillisecondsToDuration(dayTotalTime)} h (
              {convertMillisecondsToDuration(totalTimesheetTime)} h)
            </Text>
          </View>
          <View style={styles.statusContainer}>
            <CustomStatus
              busObjCat={BUSOBJCATMAP[busObjCat]}
              busObjId={busObjId}
              busObjType={type}
              busObjExtStatus={headerExtStatus}
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
      <CollapsiblePanel title={t("overview")} initiallyCollapsed={true}>
        <View style={styles.separator} />
        <View style={styles.rowContainer}>
          <View style={[styles.rowChilds, { marginRight: 5 }]}>
            <Text style={styles.panelChildLabel}>
              {t("start")}:{" "}
              <Text style={{ fontWeight: "normal" }}>
                {format(
                  start,
                  convertToDateFNSFormat(APP.LOGIN_USER_DATE_FORMAT)
                )}
              </Text>
            </Text>
          </View>
          <View style={styles.rowChilds}>
            <Text style={styles.panelChildLabel}>
              {t("end")}:{" "}
              <Text style={{ fontWeight: "normal" }}>
                {format(
                  end,
                  convertToDateFNSFormat(APP.LOGIN_USER_DATE_FORMAT)
                )}
              </Text>
            </Text>
          </View>
        </View>
        <View style={styles.panelChild}>
          <Text style={styles.panelChildLabel}>{t("remark")}</Text>
          <CustomTextInput
            containerStyle={{
              borderColor: isParentLocked && "rgba(0, 0, 0, 0.5)",
            }}
            value={headerRemarkText}
            placeholder={`${t("placeholder_remark")}...`}
            onChangeText={handleHeaderRemarkChange} // Set header remark
            editable={!isParentLocked}
          />
        </View>
        <View style={styles.separator} />
        <View style={styles.KPIDataContainer}>
          <View style={styles.KPIData}>
            <View style={styles.KPIDataLabelContainer}>
              <Text
                style={styles.KPIDataLabel}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t("timesheet_work_time")}
              </Text>
            </View>
            <View style={styles.KPIDataContainer}>
              <Text style={styles.KPIDataValue}>
                {convertMillisecondsToDuration(totalTime)} h
              </Text>
            </View>
          </View>
          <View style={styles.KPIData}>
            <View style={styles.KPIDataLabelContainer}>
              <Text
                style={styles.KPIDataLabel}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t("timesheet_billable_time")}
              </Text>
            </View>
            <View style={styles.KPIDataContainer}>
              <Text style={styles.KPIDataValue}>
                {convertMillisecondsToDuration(billableTime)} h
              </Text>
            </View>
          </View>
          <View style={styles.KPIData}>
            <View style={styles.KPIDataLabelContainer}>
              <Text
                style={styles.KPIDataLabel}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t("timesheet_holiday_absence_time")}
              </Text>
            </View>
            <View style={styles.KPIDataContainer}>
              <Text style={styles.KPIDataValue}>
                {convertMillisecondsToDuration(sumHolidayAndAbsenceHours())} h
              </Text>
            </View>
          </View>
          <View style={styles.KPIData}>
            <View style={styles.KPIDataLabelContainer}>
              <Text
                style={styles.KPIDataLabel}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t("timesheet_over_time")}
              </Text>
            </View>
            <View style={styles.KPIDataContainer}>
              <Text style={styles.KPIDataValue}>
                {convertMillisecondsToDuration(overTime)} h
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.separator} />
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
      <View style={styles.dateListContainer}>
        <Pressable
          style={styles.dateArrow}
          onPress={fetchPreviousDates}
          disabled={true}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={36}
            color="#005eb8"
          />
        </Pressable>
        <FlatList
          ref={dateListRef}
          getItemLayout={getDateListItemLayout}
          onScrollToIndexFailed={handleDateListScrollToIndexFailed}
          data={visibleDates}
          renderItem={renderDateItem}
          keyExtractor={(item, index) => index.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateList}
        />
        <Pressable
          style={styles.dateArrow}
          onPress={fetchNextDates}
          disabled={true}
        >
          <MaterialCommunityIcons
            name="chevron-right"
            size={36}
            color="#005eb8"
          />
        </Pressable>
      </View>
      {renderTimesheetItems()}
      {!loading && !keyboardShown && (
        <View style={styles.floatingContainer}>
          <CustomButton
            onPress={() => handleCreateItemClick()}
            label=""
            icon={{
              name: "plus",
              library: "MaterialCommunityIcons",
              size: 40,
              color: "#fff",
            }}
            disabled={isParentLocked}
            style={styles.floatingButton}
          />
        </View>
      )}
      {isEditingItem && (
        <TimesheetDetailItemEditor
          item={currentItem}
          timesheetDetail={{
            timesheetStart: start,
            selectedDate: selectedDate,
          }}
          timesheetTypeDetails={timesheetTypeDetails}
          onConfirm={handleConfirmCreateOrEditItem}
          onCancel={handleCancelEditItem}
          isItemEditMode={isItemEditMode}
          isParentLocked={isParentLocked}
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
    marginLeft: 20,
    marginRight: 10,
  },
  hoursLabel: {
    fontWeight: "bold",
    marginRight: 5,
  },
  hoursValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#008000",
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
    backgroundColor: "#ffeb3b",
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
    fontSize: 14,
    fontWeight: "bold",
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
  remarkContainer: {
    flex: 1,
    marginRight: 10,
  },
  itemButtonContainer: {
    flexDirection: "row",
  },
  editButtonContainer: {
    width: 35,
    alignItems: "flex-end",
  },
  deleteButtonContainer: {
    width: 35,
    alignItems: "flex-end",
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
    right: 20,
    alignItems: "center",
  },
  floatingButton: {
    marginBottom: 10,
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#005eb8",
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
    backgroundColor: "#ffeb3b",
    borderWidth: 0.5,
  },
  holidayColorBox: {
    width: 20,
    height: 20,
    backgroundColor: "#aaf0c9",
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
  dayTypeMessage: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    textAlign: "center",
    marginVertical: "4%",
  },
  dirtyItem: {
    borderColor: "#f00",
    borderWidth: 2,
  },
  separator: {
    borderBottomColor: "#ccc",
    borderBottomWidth: 2,
    borderStyle: "dashed",
    marginVertical: 10,
  },
  KPIDataContainer: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: "2%",
  },
  KPIData: {
    width: "50%",
    height: "50%",
    justifyContent: "center",
    alignItems: "center",
  },
  KPIDataLabelContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  KPIDataValueContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  KPIDataLabel: {
    fontWeight: "bold",
  },
  KPIDataValue: {},
});

export default TimesheetDetailGeneral;
