import React, { useCallback, useMemo, useState, useEffect } from "react";
import { ScrollView, StyleSheet, View, Text, Switch } from "react-native";

import { useTranslation } from "react-i18next";
import { format, parse } from "date-fns";

import CustomStatus from "../components/CustomStatus";
import CustomPicker from "../components/CustomPicker";
import CustomDateTimePicker from "../components/CustomDateTimePicker";
import CustomTextInput from "../components/CustomTextInput";

import { APP, BUSOBJCATMAP, PREFERRED_LANGUAGES } from "../constants";
import {
  handleAbsenceTypeUpdate,
  validateDuration,
  calculateEndDate,
  calculateDuration,
  fetchWorkCalendar,
  validateStatusChange,
  isTimeOffOnHoliday,
  updateKPIBalances,
} from "../utils/AbsenceUtils";
import {
  convertToDateFNSFormat,
  getRemarkText,
  setRemarkText,
} from "../utils/FormatUtils";
import { showToast } from "../utils/MessageUtils";

/**
 * AbsenceDetailGeneral - A component for displaying and editing details related to an employee's absence.
 *
 * @param {Object} props - The props passed to the component.
 * @param {string} props.busObjCat - The business object category.
 * @param {string} props.busObjId - The business object ID.
 * @param {boolean} props.isParentLocked - Determines if the parent fields are locked.
 * @param {boolean} props.isEditMode - Flag indicating if the form is in edit mode.
 * @param {string} props.currentStatus - The current status of the absence.
 * @param {Array} props.listOfNextStatus - List of next possible statuses.
 * @param {Function} props.handleReload - Callback function to reload data.
 * @param {boolean} props.loading - Flag indicating if data is loading.
 * @param {Function} props.onAbsenceDetailChange - Callback function to handle updates to absence details.
 *   This function is called whenever an update is made to any field in the absence detail form.
 *   It accepts an object containing the field name and its new value.
 * @param {Object} props.allAbsenceTypes - Map of all available absence types.
 * @param {Object} props.absenceTypeDetails -  Contains information about the currently selected absence type, if applicable.
 * @param {Object} props.pickerOptions - Picker options for custom pickers.
 * @param {Object} props.absenceDetails - The details of the absence.
 * @param {Object} props.employeeInfo - The employee information containing non-working dates and days.
 * @returns {JSX.Element} - The rendered component.
 */

const AbsenceDetailGeneral = ({
  busObjCat,
  busObjId,
  isParentLocked,
  isEditMode,
  currentStatus,
  listOfNextStatus,
  handleReload,
  loading,
  onAbsenceDetailChange,
  allAbsenceTypes,
  absenceTypeDetails,
  employeeInfo,
  pickerOptions,
  absenceDetails,
}) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const {
    absenceType,
    absencePlannedDays,
    absenceStart,
    absenceEnd,
    absenceStartDayFraction,
    absenceEndDayFraction,
    absenceAdjustAbsence,
    absenceAdjustTaken,
    absenceEmployeeName,
    absenceExtStatus,
    absenceRemark,
  } = absenceDetails;

  const {
    absenceTypePolicyText,
    absenceTypeHourlyLeave,
    absenceTypeDisplayInHours,
    absenceTypeFixedCalendar,
    absenceTypeAdminAdjustOnly,
    absenceTypeHalfDaysNotAllowed,
    absenceTypeAllowedInProbation,
    absenceTypeAllowedInTermination,
    absenceTypeMinRequest,
    absenceTypeMaxRequest,
  } = absenceTypeDetails;

  const { absenceTypeOptions = {}, dayFractionOptions = {} } = pickerOptions;

  const [localAbsenceType, setLocalAbsenceType] = useState(absenceType);
  const [localAbsenceTypeHourlyLeave, setLocalAbsenceTypeHourlyLeave] =
    useState(absenceTypeHourlyLeave);
  const [localAbsenceTypeFixedCalendar, setLocalAbsenceTypeFixedCalendar] =
    useState(absenceTypeFixedCalendar);
  const [localAbsenceTypeDisplayInHours, setLocalAbsenceTypeDisplayInHours] =
    useState(absenceTypeDisplayInHours);
  const [localAbsenceStart, setLocalAbsenceStart] = useState(
    new Date(absenceStart) || new Date()
  );
  const [localAbsenceEnd, setLocalAbsenceEnd] = useState(
    new Date(absenceEnd) || new Date()
  );
  const [localAbsenceStartDayFraction, setLocalAbsenceStartDayFraction] =
    useState(absenceStartDayFraction || "1");
  const [localAbsenceEndDayFraction, setLocalAbsenceEndDayFraction] = useState(
    absenceEndDayFraction || null
  );
  const [localPolicyText, setLocalPolicyText] = useState(absenceTypePolicyText);
  const [localRemark, setLocalRemark] = useState(
    getRemarkText(absenceRemark, lang, PREFERRED_LANGUAGES)
  );
  const [localDuration, setLocalDuration] = useState(() => {
    return Number.isFinite(absencePlannedDays)
      ? Math.abs(absencePlannedDays).toString()
      : "";
  });
  const [hoursPerDay, setHoursPerDay] = useState(
    employeeInfo.dailyStdHours || 8
  );
  const [
    localAbsenceTypeHalfDaysNotAllowed,
    setLocalAbsenceTypeHalfDaysNotAllowed,
  ] = useState(absenceTypeHalfDaysNotAllowed);
  const [
    localAbsenceTypeAllowedInProbation,
    setLocalAbsenceTypeAllowedInProbation,
  ] = useState(absenceTypeAllowedInProbation);
  const [
    localAbsenceTypeAllowedInTermination,
    setLocalAbsenceTypeAllowedInTermination,
  ] = useState(absenceTypeAllowedInTermination);
  const [localAbsenceTypeMinRequest, setLocalAbsenceTypeMinRequest] = useState(
    absenceTypeMinRequest
  );
  const [localAbsenceTypeMaxRequest, setLocalAbsenceTypeMaxRequest] = useState(
    absenceTypeMaxRequest
  );
  const [showDateFields, setShowDateFields] = useState({
    showStart: true,
    showEnd: true,
    showStartDayFraction: true,
    showEndDayFraction: true,
  });
  const [showDuration, setShowDuration] = useState(true);
  const [showHoliday, setShowHoliday] = useState(false);
  const [showAdjustmentFields, setShowAdjustmentFields] =
    useState(absenceAdjustAbsence);
  const [nonWorkingDates, setNonWorkingDates] = useState(
    employeeInfo.nonWorkingDates || []
  );
  const [isAddToBalance, setIsAddToBalance] = useState(
    parseFloat(absencePlannedDays) > 0
  );
  const [adjustTaken, setAdjustTaken] = useState(absenceAdjustTaken);
  const [kpiValues, setKPIValues] = useState({
    balanceBefore: "-",
    balanceAfter: "-",
    projectedBalance: "-",
    projectedCarryForward: "-",
  });

  const balances = useMemo(
    () => [
      { label: t("before"), value: kpiValues.balanceBefore },
      { label: t("after"), value: kpiValues.balanceAfter },
      { label: t("balance"), value: kpiValues.projectedBalance },
      { label: t("carry_forward"), value: kpiValues.projectedCarryForward },
    ],
    [kpiValues, t]
  );

  const updateKPIs = useCallback((kpiData) => {
    setKPIValues(kpiData);
  }, []);

  const currentDate = new Date();
  const endOfYear = new Date(currentDate.getFullYear(), 11, 31); // End of the current year (December 31st)
  const formatDate = useCallback((date) => {
    return format(
      new Date(date),
      convertToDateFNSFormat(APP.LOGIN_USER_DATE_FORMAT)
    );
  }, []);

  /**
   * Sets the visibility of various fields based on the absence type.
   *
   * @param {boolean} showDuration - Whether to show the duration field.
   * @param {Object} showDateFields - An object containing the visibility states for date fields.
   * @param {boolean} showHoliday - Whether to show the holidays field.
   * @param {boolean} showAdjustmentFields - Whether to show the adjustment fields.
   */
  const setFieldVisibility = (
    showDuration,
    showDateFields,
    showHoliday,
    showAdjustmentFields
  ) => {
    setShowDuration(showDuration);
    setShowDateFields((prevFields) => ({
      ...prevFields,
      ...showDateFields,
    }));
    setShowHoliday(showHoliday);
    setShowAdjustmentFields(showAdjustmentFields);
  };

  /**
   * Handles changes to fields within the absence detail form.
   * Can handle both single field updates and batched updates.
   *
   * @param {string|Object} field - The name of the field or an object of field-value pairs.
   * @param {*} [value] - The new value for the specified field (if `field` is a string).
   */
  const handleFieldChange = useCallback(
    (field, value) => {
      let updatedValues;

      // Check if the input is a single field or batched fields
      if (typeof field === "string") {
        updatedValues = { [field]: value }; // Single field update
      } else if (typeof field === "object") {
        updatedValues = field; // Batched updates
      } else {
        console.warn("Invalid field input for handleFieldChange");
        return;
      }

      // Propagate the changes to the parent callback function
      onAbsenceDetailChange(updatedValues);
    },
    [onAbsenceDetailChange]
  );

  /**
   * Updates local state variables and handles field changes based on the updated fields.
   *
   * @param {Object} updatedFields - The updated fields containing new values for the local state variables.
   */
  const updateLocalStateAndHandleFieldChange = (updatedFields) => {
    // Define a mapping of fields to local state setters and batched changes keys
    const fieldMappings = [
      {
        key: "absenceType",
        setter: setLocalAbsenceStart,
        batchKey: "absenceType",
      },
      {
        key: "absenceStart",
        setter: setLocalAbsenceStart,
        batchKey: "absenceStartDate",
      },
      {
        key: "absenceEnd",
        setter: setLocalAbsenceEnd,
        batchKey: "absenceEndDate",
      },
      {
        key: "absenceStartHalfDay",
        setter: setLocalAbsenceStartDayFraction,
        batchKey: "absenceStartDayFraction",
      },
      {
        key: "absenceEndHalfDay",
        setter: setLocalAbsenceEndDayFraction,
        batchKey: "absenceEndDayFraction",
      },
      {
        key: "absenceDuration",
        setter: setLocalDuration,
        batchKey: "absenceDuration",
      },
      {
        key: "absenceTypeFixedCalendar",
        setter: setLocalAbsenceTypeFixedCalendar,
        batchKey: "absenceTypeFixedCalendar",
      },
      {
        key: "absenceTypeHourlyLeave",
        setter: setLocalAbsenceTypeHourlyLeave,
        batchKey: "absenceTypeHourlyLeave",
      },
      {
        key: "absenceTypeDisplayInHours",
        setter: setLocalAbsenceTypeDisplayInHours,
        batchKey: "absenceTypeDisplayInHours",
      },
      {
        key: "absenceTypeHalfDaysNotAllowed",
        setter: setLocalAbsenceTypeHalfDaysNotAllowed,
        batchKey: "absenceTypeHalfDaysNotAllowed",
      },
      {
        key: "absenceTypeAllowedInProbation",
        setter: setLocalAbsenceTypeAllowedInProbation,
        batchKey: "absenceTypeAllowedInProbation",
      },
      {
        key: "absenceTypeAllowedInTermination",
        setter: setLocalAbsenceTypeAllowedInTermination,
        batchKey: "absenceTypeAllowedInTermination",
      },
      {
        key: "absenceTypeMinRequest",
        setter: setLocalAbsenceTypeMinRequest,
        batchKey: "absenceTypeMinRequest",
      },
      {
        key: "absenceTypeMaxRequest",
        setter: setLocalAbsenceTypeMaxRequest,
        batchKey: "absenceTypeMaxRequest",
      },
    ];

    const batchedChanges = {};

    // Iterate over the field mappings and apply updates
    fieldMappings.forEach(({ key, setter, batchKey }) => {
      if (updatedFields[key] !== undefined) {
        setter(updatedFields[key]); // Update local state
        batchedChanges[batchKey] = updatedFields[key]; // Add to batched changes
      }
    });

    // Notify the parent with all batched changes
    if (Object.keys(batchedChanges).length > 0) {
      handleFieldChange(batchedChanges);
    }
  };

  /**
   * Handles the UI behavior and field visibility based on the absence type details.
   *
   * @param {boolean} absenceTypeFixedCalendar - Indicates if the absence type has a fixed calendar.
   * @param {boolean} absenceTypeHourlyLeave - Indicates if the absence type is hourly leave.
   * @param {boolean} absenceTypeDisplayInHours - Indicates if the absence type is displayed in hours.
   */
  const handleAbsenceTypeBehavior = useCallback(
    (
      absenceTypeFixedCalendar,
      absenceTypeHourlyLeave,
      absenceTypeDisplayInHours
    ) => {
      if (absenceTypeFixedCalendar) {
        setFieldVisibility(
          true,
          {
            showStart: false,
            showEnd: false,
            showStartDayFraction: false,
            showEndDayFraction: false,
          },
          true,
          false
        );

        return;
      }

      if (absenceTypeHourlyLeave && absenceTypeDisplayInHours) {
        setBehaviourOfUIForNonHourlyLeaves();
        showToast(t("error_both_hourly_and_display_in_hours"), "error");
        return;
      } else if (absenceTypeHourlyLeave) {
        setBehaviourOfUIForHourlyLeaves();
      } else if (absenceTypeDisplayInHours) {
        setBehaviourOfUIForNonHourlyLeaves();
        setBehaviourOfUIForDisplayInHours();
      } else {
        setBehaviourOfUIForNonHourlyLeaves();
      }

      // Handle enabling/disabling day fractions based on half-day rules
      if (absenceTypeHalfDaysNotAllowed) {
        setLocalAbsenceStartDayFraction("1");
        setLocalAbsenceEndDayFraction("1");

        if (localDuration <= 1) {
          setLocalAbsenceStartDayFraction("1");
          setLocalAbsenceEndDayFraction(null);
        }

        setFieldVisibility(
          true,
          {
            showStart: true,
            showEnd: true,
            showStartDayFraction: false,
            showEndDayFraction: false,
          },
          false,
          false
        );
      } else {
        setFieldVisibility(
          true,
          {
            showStart: true,
            showEnd: true,
            showStartDayFraction: true,
            showEndDayFraction: true,
          },
          false,
          false
        );
      }
    },
    []
  );

  /**
   * Handles changes to the absence type, updating state and UI behavior.
   *
   * @param {string} value - The ID of the newly selected absence type.
   *
   * Steps:
   * 1. Skips update if the selected type matches the current one.
   * 2. Validates the absence type and displays an error if invalid.
   * 3. Updates local state and notifies the parent component.
   * 4. Fetches fields related to the absence type and applies updates.
   * 5. Adjusts UI visibility and behavior based on the selected type.
   */
  const handleAbsenceTypeChange = useCallback((value) => {
    if (value === localAbsenceType) return;

    showToast(t("absence_fields_default_values_message"), "warning");

    setLocalAbsenceType(value);

    // Fetch updated fields based on the new absence type
    const { updatedFields: absenceTypeDetails } = handleAbsenceTypeUpdate({
      absenceType: value,
      allAbsenceTypes,
    });

    console.log(
      "Absence Type Change: Updated fields after selection of type:",
      {
        absenceType: value,
        absenceTypeDetails,
      }
    );

    // Batch all changes into a single update
    const allChanges = {
      absenceType: value,
      absenceStart: new Date(),
      absenceEnd: new Date(),
      absenceStartHalfDay: "1",
      absenceEndHalfDay: null,
      absenceDuration: "1",
      ...absenceTypeDetails,
    };

    // Update local state and propagate changes to the parent
    updateLocalStateAndHandleFieldChange(allChanges);

    // Adjust UI behavior based on the new absence type
    handleAbsenceTypeBehavior(
      absenceTypeDetails.absenceTypeFixedCalendar,
      absenceTypeDetails.absenceTypeHourlyLeave,
      absenceTypeDetails.absenceTypeDisplayInHours
    );

    updateKPIBalances(
      {
        absenceType: value,
        absenceEmployeeId: absenceDetails.absenceEmployeeId,
        absenceEnd: absenceDetails.absenceEnd,
        absenceDuration: absenceDetails.absencePlannedDays,
      },
      (kpiData) => {
        setKPIValues(kpiData);
      }
    );
  }, []);

  const renderHolidayPicker = useCallback(() => {
    if (!showHoliday || !nonWorkingDates.length) return null;

    const currentYear = new Date().getFullYear();
    const holidayOptions = nonWorkingDates
      .filter((date) => new Date(date.date).getFullYear() === currentYear)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((date) => ({
        label: format(new Date(date.date), "dd/MM/yyyy") + " - " + date.name,
        value: date.date,
      }));

    // Calculate initial value from the start date
    const initialHolidayValue =
      holidayOptions.find(
        (option) =>
          new Date(option.value).toDateString() ===
          new Date(localAbsenceStart).toDateString()
      )?.value || null;

    return (
      <View style={styles.detailItem}>
        <Text style={styles.label}>{t("holiday")}</Text>
        <CustomPicker
          containerStyle={styles.inputBorder}
          placeholder={""}
          items={holidayOptions}
          initialValue={initialHolidayValue}
          onFilter={(itemValue) => {
            const updatedFields = {
              absenceStartDate: new Date(itemValue),
              absenceEndDate: new Date(itemValue),
              selectedHoliday: itemValue,
            };
            setLocalAbsenceStart(new Date(itemValue));
            setLocalAbsenceEnd(new Date(itemValue));
            handleFieldChange(updatedFields);
          }}
          hideSearchInput={true}
          disabled={isParentLocked}
          accessibilityLabel="Holiday picker"
          accessibilityRole="dropdownlist"
          testID="holiday-picker"
        />
      </View>
    );
  }, [showHoliday, isParentLocked, nonWorkingDates, handleFieldChange]);

  /**
   * Handles changes to the start date of the absence.
   * Updates the end date based on the new start date and current duration.
   * Validates the start date and adjusts the duration if displayed in hours.
   * @param {Date} value - The new value for the start date.
   */
  const handleAbsenceStartDateChange = (value) => {
    console.log("Handling start date change:", value);

    setLocalAbsenceStart(value);
    handleFieldChange("absenceStartDate", value);

    // If the absence has a fixed calendar, exit the function
    if (localAbsenceTypeFixedCalendar) {
      console.log("Skipping further operations due to fixed calendar.");
      return;
    }

    // If the absence is an adjustment, set the end date to the same value as the start date
    if (absenceAdjustAbsence) {
      console.log("Adjusting absence: setting end date to start date:", value);
      setLocalAbsenceEnd(value);
      handleFieldChange("absenceEndDate", value);
      return;
    }

    // Validate the start date
    const currentDate = new Date();
    const startDate = new Date(value);
    startDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);

    // Show a warning message if the start date is in the past
    if (startDate < currentDate) {
      showToast(t("start_date_in_past_warning"), "warning");
    }

    // Additional validation for hourly leave
    if (localAbsenceTypeHourlyLeave) {
      console.log("Hourly leave detected. Validating leave period.");
      if (localAbsenceEnd) {
        isTimeOffOnHoliday(value, localAbsenceEnd, t, employeeInfo);
      } else {
        console.log("Cannot validate hourly leave: end date is missing.");
      }
      return;
    }

    // Adjust duration if displayed in hours
    let adjustedDuration = parseFloat(localDuration) || 0;
    if (localAbsenceTypeDisplayInHours) {
      adjustedDuration = adjustedDuration / hoursPerDay;
      console.log("Adjusted duration (in hours):", adjustedDuration);
    }

    if (adjustedDuration <= 0) {
      showToast(t("duration_must_be_positive"), "error");
      return;
    }

    console.log("Adjusted duration in start date change:", adjustedDuration);

    // Calculate and update the end date based on the new start date and current duration
    const newEndDate = calculateEndDate(
      value,
      adjustedDuration,
      employeeInfo,
      localAbsenceStartDayFraction,
      localAbsenceEndDayFraction,
      absenceDetails,
      updateKPIs
    );
    console.log("Calculated new end date:", newEndDate);

    setLocalAbsenceEnd(newEndDate);
    handleFieldChange("absenceEndDate", newEndDate);
  };

  /**
   * Handles changes to the end date of the absence.
   * Updates the duration based on the new end date and current start date.
   * @param {Date} value - The new value for the end date.
   */
  const handleAbsenceEndDateChange = useCallback(
    (value) => {
      console.log("Handling end date change:", value);

      setLocalAbsenceEnd(value);
      handleFieldChange("absenceEndDate", value);

      if (absenceAdjustAbsence || localAbsenceTypeFixedCalendar) {
        console.log(
          "Skipping duration calculation due to fixed calendar or absence adjustment."
        );
        return;
      }

      // Additional validation for hourly leave
      if (localAbsenceTypeHourlyLeave) {
        console.log("Hourly leave detected. Validating hourly leave.");
        if (localAbsenceStart) {
          isTimeOffOnHoliday(localAbsenceStart, value, t, employeeInfo);
        } else {
          console.log("Cannot validate hourly leave: start date is missing.");
        }
        return;
      }

      // Calculate and update the duration based on the new end date and current start date
      if (localAbsenceStart) {
        const newDuration = calculateDuration(
          localAbsenceStart,
          value,
          employeeInfo,
          localAbsenceStartDayFraction,
          localAbsenceEndDayFraction,
          absenceDetails,
          updateKPIs
        );
        console.log("New calculated duration (in days):", newDuration);

        // Adjust duration if displayed in hours
        let adjustedDuration = newDuration;
        if (localAbsenceTypeDisplayInHours) {
          adjustedDuration = newDuration * hoursPerDay;
          console.log("Adjusted duration (in hours):", adjustedDuration);
        }

        console.log("Adjusted duration in end date change:", adjustedDuration);

        setLocalDuration(adjustedDuration);
        handleFieldChange("absenceDuration", adjustedDuration);
      }
    },
    [absenceAdjustAbsence, hoursPerDay, employeeInfo, handleFieldChange]
  );

  /**
   * Handles changes to the duration of the absence.
   * Updates the end date based on the new duration and current start date.
   * @param {string} value - The new value for the duration.
   */
  const handleDurationChange = useCallback(
    (value) => {
      console.log("Duration change triggered with value:", value);

      // Update local duration state and notify parent component
      setLocalDuration(value);
      handleFieldChange("absenceDuration", value);

      if (absenceAdjustAbsence || localAbsenceTypeFixedCalendar) {
        console.log(
          "Exit: Absence adjustment or fixed calendar type detected."
        );
        return;
      }

      // Find the minimum fraction value from dayFractionOptions
      const minFraction =
        Array.isArray(dayFractionOptions) && dayFractionOptions.length > 0
          ? dayFractionOptions.reduce((min, option) => {
              const fractionValue = parseFloat(option.value);
              return fractionValue < min ? fractionValue : min;
            }, 1)
          : 1;

      // Validate the duration value
      const isValidDuration = validateDuration(
        value,
        localAbsenceTypeMinRequest,
        localAbsenceTypeMaxRequest,
        localAbsenceTypeHalfDaysNotAllowed,
        localAbsenceTypeHourlyLeave,
        localAbsenceTypeDisplayInHours,
        hoursPerDay,
        t,
        minFraction
      );

      if (!isValidDuration) {
        console.log("Invalid duration value:", value);
        setLocalAbsenceStartDayFraction(null);
        setLocalAbsenceEndDayFraction(null);
        return;
      }

      if (value === ".") {
        console.log("Duration value is just a dot; ignoring update.");
        return;
      }

      // Determine the new end date based on the duration value
      let newEndDate;
      if (!value) {
        newEndDate = localAbsenceStart;
        console.log(
          "No duration value provided. Using start date as end date:",
          newEndDate
        );
      } else {
        newEndDate = calculateEndDate(
          localAbsenceStart,
          value,
          employeeInfo,
          localAbsenceStartDayFraction,
          localAbsenceEndDayFraction,
          absenceDetails,
          updateKPIs
        );
        console.log("Calculated new end date:", newEndDate);
      }

      // Update local end date state and notify parent component
      setLocalAbsenceEnd(newEndDate);
      handleFieldChange("absenceEndDate", newEndDate);

      const parsedDuration = parseFloat(value);
      if (localAbsenceTypeHalfDaysNotAllowed || parsedDuration === 1) {
        setLocalAbsenceStartDayFraction("1");
        setLocalAbsenceEndDayFraction(null);
      } else if (parsedDuration > 1) {
        setLocalAbsenceStartDayFraction("1");
        setLocalAbsenceEndDayFraction("1");
      } else {
        setLocalAbsenceStartDayFraction(
          parsedDuration <= minFraction ? minFraction.toString() : "1"
        );
        setLocalAbsenceEndDayFraction(
          parsedDuration <= minFraction ? null : minFraction.toString()
        );
      }
    },
    [
      absenceAdjustAbsence,
      absenceTypeMinRequest,
      absenceTypeHalfDaysNotAllowed,
      hoursPerDay,
      employeeInfo,
      handleFieldChange,
      t,
    ]
  );

  /**
   * Handles changes to the start day fraction of the absence.
   * Updates the local state and recalculates the absence duration based on the new fraction.
   * Propagates the updated duration and start day fraction to the parent component.
   *
   * @param {number} fraction - The new fraction of the start day (value between 0 and 1).
   */
  const handleAbsenceStartDayFractionChange = (fraction) => {
    console.log("Start Day Fraction Changed:", fraction);

    // Update the start day fraction locally
    setLocalAbsenceStartDayFraction(fraction);

    // Recalculate the duration based on the updated fraction
    if (localAbsenceStart && localAbsenceEnd) {
      const updatedDuration = calculateDuration(
        localAbsenceStart,
        localAbsenceEnd,
        employeeInfo,
        fraction,
        localAbsenceEndDayFraction,
        absenceDetails,
        updateKPIs
      );
      console.log(
        "Updated Duration after Start Day Fraction Change:",
        updatedDuration
      );

      // Update the parent and local state
      setLocalDuration(updatedDuration);
      handleFieldChange({
        absenceStartDayFraction: fraction,
        absenceDuration: updatedDuration,
      });
    }
  };

  /**
   * Handles changes to the end day fraction of the absence.
   * Updates the local state and recalculates the absence duration based on the new fraction.
   * Propagates the updated duration and end day fraction to the parent component.
   *
   * @param {number} fraction - The new fraction of the end day (value between 0 and 1).
   */
  const handleAbsenceEndDayFractionChange = (fraction) => {
    console.log("End Day Fraction Changed:", fraction);

    // Update the end day fraction locally
    setLocalAbsenceEndDayFraction(fraction);

    // Recalculate the duration based on the updated fraction
    if (localAbsenceStart && localAbsenceEnd) {
      const updatedDuration = calculateDuration(
        localAbsenceStart,
        localAbsenceEnd,
        employeeInfo,
        localAbsenceStartDayFraction,
        fraction,
        absenceDetails,
        updateKPIs
      );
      console.log(
        "Updated Duration after End Day Fraction Change:",
        updatedDuration
      );

      // Update the parent and local state
      setLocalDuration(updatedDuration);
      handleFieldChange({
        absenceEndDayFraction: fraction,
        absenceDuration: updatedDuration,
      });
    }
  };

  /**
   * Handles changes to the remark for the absence.
   *
   * @param {string} value - The new value for the remark.
   */
  const handleRemarkChange = useCallback(
    (value) => {
      setLocalRemark(value);
      const updatedAbsenceRemark = setRemarkText(absenceRemark, lang, value);
      handleFieldChange("absenceRemark", updatedAbsenceRemark);
    },
    [absenceRemark, lang, handleFieldChange]
  );

  /**
   * Sets the UI behavior for hourly leaves.
   * This function hides or shows fields based on the hourly leave condition.
   */
  const setBehaviourOfUIForHourlyLeaves = useCallback(() => {
    setLocalAbsenceStartDayFraction("1");
    setLocalAbsenceEndDayFraction(null);
    setFieldVisibility(
      true,
      {
        showStart: true,
        showEnd: true,
        showStartDayFraction: true,
        showEndDayFraction: true,
      },
      false,
      false
    );
  }, []);

  /**
   * Sets the UI behavior for non-hourly leaves.
   * This function hides or shows fields based on the non-hourly leave condition.
   */
  const setBehaviourOfUIForNonHourlyLeaves = useCallback(() => {
    setFieldVisibility(
      true,
      {
        showStart: true,
        showEnd: true,
        showStartDayFraction: true,
        showEndDayFraction: true,
      },
      false,
      false
    );
  }, []);

  /**
   * Sets the UI behavior for display in hours.
   * This function hides or shows fields based on the display in hours condition.
   */
  const setBehaviourOfUIForDisplayInHours = useCallback(() => {
    setFieldVisibility(
      true,
      {
        showStart: true,
        showEnd: true,
        showStartDayFraction: true,
        showEndDayFraction: true,
      },
      false,
      false
    );
  }, []);

  /**
   * Sets the UI behavior for adjustment.
   * This function hides or shows fields based on the adjustment condition.
   */
  const setBehaviourOfUIForAdjustment = useCallback(() => {
    setFieldVisibility(
      false,
      {
        showStart: false,
        showEnd: false,
        showStartDayFraction: false,
        showEndDayFraction: false,
      },
      false,
      true
    );
  }, []);

  const toggleAddToBalance = () => {
    const newValue = !isAddToBalance;
    setIsAddToBalance(newValue);
    handleFieldChange("isAddToBalance", newValue);
  };

  const toggleAdjustTaken = () => {
    const newValue = !adjustTaken;
    setAdjustTaken(newValue);
    handleFieldChange("adjustTaken", newValue);
  };

  // Handle absence type validation when absenceTypeOptions are available
  useEffect(() => {
    if (isEditMode && absenceType && absenceTypeOptions?.length) {
      const isEligible = absenceTypeOptions.some(
        (option) => option.value === absenceType
      );
      if (!isEligible) {
        const absenceTypeName =
          allAbsenceTypes[absenceType]?.["AbsenceType-name"] || "unknown";
        showToast(
          t("employee_not_eligible_for_absence_type", {
            absenceTypeName,
          }),
          "error"
        );
      }
    }
  }, [absenceType, absenceTypeOptions]);

  // Handle UI behavior based on absence type and adjustment status
  useEffect(() => {
    if (absenceType) {
      if (absenceAdjustAbsence) {
        setBehaviourOfUIForAdjustment();
      } else {
        handleAbsenceTypeBehavior(
          localAbsenceTypeFixedCalendar,
          localAbsenceTypeHourlyLeave,
          localAbsenceTypeDisplayInHours
        );
      }
    }
  }, [absenceType]);

  useEffect(() => {
    const updateNonWorkingDates = async () => {
      if (
        localAbsenceTypeFixedCalendar &&
        localAbsenceTypeFixedCalendar !== employeeInfo.calendarExtId
      ) {
        console.log(
          "Fetching non-working dates: localAbsenceTypeFixedCalendar differs from employeeInfo.calendarExtId.",
          {
            localAbsenceTypeFixedCalendar,
            employeeCalendarExtId: employeeInfo.calendarExtId,
          }
        );

        const fetchedNonWorkingDates = await fetchWorkCalendar(
          localAbsenceTypeFixedCalendar
        );
        setNonWorkingDates(fetchedNonWorkingDates);

        console.log(
          `Fetched ${fetchedNonWorkingDates.length} non-working dates from API.`
        );
      } else if (!localAbsenceTypeFixedCalendar) {
        console.log(
          "Using non-working dates from employeeInfo because localAbsenceTypeFixedCalendar is not set."
        );
        setNonWorkingDates(employeeInfo.nonWorkingDates || []);
      } else {
        console.log(
          "Using non-working dates from employeeInfo because localAbsenceTypeFixedCalendar matches employeeInfo.calendarExtId.",
          {
            localAbsenceTypeFixedCalendar,
            employeeCalendarExtId: employeeInfo.calendarExtId,
          }
        );
        setNonWorkingDates(employeeInfo.nonWorkingDates || []);
      }
    };

    updateNonWorkingDates();
  }, [localAbsenceTypeFixedCalendar, employeeInfo.calendarExtId]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* Horizontal ScrollView for the status section */}
        <ScrollView
          horizontal
          contentContainerStyle={styles.horizontalScrollContent}
        >
          <View style={styles.statusContainer}>
            <CustomStatus
              busObjCat={BUSOBJCATMAP[busObjCat]}
              busObjId={busObjId}
              busObjType={absenceType}
              busObjExtStatus={absenceExtStatus}
              isParentLocked={isParentLocked}
              isEditMode={isEditMode}
              currentStatus={currentStatus}
              listOfNextStatus={listOfNextStatus}
              handleReload={handleReload}
              loading={loading}
              validate={() =>
                validateStatusChange(
                  processTemplate,
                  currentStatus,
                  maxCancellationDays,
                  localAbsenceEnd
                )
              }
            />
          </View>
        </ScrollView>
      </View>

      {absenceEmployeeName && (
        /* Employee Name */
        <Text style={styles.topRow} numberOfLines={1} ellipsizeMode="tail">
          {absenceEmployeeName}
        </Text>
      )}
      {/* Conditionally Render the Balance Section */}
      {!absenceAdjustAbsence && !isParentLocked && (
        <View style={styles.kpiContainer}>
          {/* Titles for Balance */}
          <View style={styles.titleRow}>
            <View style={styles.titleBox}>
              <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                {t("balance_as_on")}: {formatDate(currentDate)}
              </Text>
            </View>
            <View style={styles.titleBox}>
              <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                {" "}
                {t("projected")}: {formatDate(endOfYear)}
              </Text>
            </View>
          </View>

          {/* Tiles for Balance */}
          <View style={styles.tileRow}>
            {/* Group 1 - Before and After balances */}
            <View style={styles.tileGroup}>
              {balances.slice(0, 2).map((item, index) => (
                <View key={index} style={styles.tile}>
                  <Text
                    style={styles.tileLabel}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.label}
                  </Text>
                  <Text style={styles.tileValue}>{item.value}</Text>
                </View>
              ))}
            </View>

            {/* Separator between tile groups */}
            <View style={styles.groupSeparator} />

            {/* Group 2 - Balance and After balances */}
            <View style={styles.tileGroup}>
              {balances.slice(2).map((item, index) => (
                <View key={index + 2} style={styles.tile}>
                  <Text
                    style={styles.tileLabel}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.label}
                  </Text>
                  <Text style={styles.tileValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Main Scrollable Content */}
      <ScrollView contentContainerStyle={styles.detailContainer}>
        {/* Absence Type and Duration Inputs */}
        <View style={styles.row}>
          {/* Absence Type */}
          <View style={styles.firstColumn}>
            <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
              {t("absence_type")}
            </Text>
            {absenceTypeOptions?.length > 0 && (
              <CustomPicker
                containerStyle={styles.inputBorder}
                items={absenceTypeOptions}
                initialValue={localAbsenceType}
                onFilter={handleAbsenceTypeChange}
                hideSearchInput={true}
                disabled={isParentLocked || absenceAdjustAbsence}
                accessibilityLabel="Absence type picker"
                accessibilityRole="dropdownlist"
                testID="absence-type-picker"
              />
            )}
          </View>
          {/* Adjustment */}
          {absenceAdjustAbsence && (
            <View style={styles.secondColumn}>
              <View style={styles.detailItem}>
                <Text style={styles.label}>{t("adjustment")}</Text>
                <Text style={styles.value}>{t("yes")}</Text>
              </View>
            </View>
          )}
          {/* Duration */}
          {showDuration && (
            <View style={styles.secondColumn}>
              <Text style={styles.label}>{t("duration")}</Text>
              <View style={styles.hoursContainer}>
                <CustomTextInput
                  value={localDuration}
                  placeholder={"0"}
                  onChangeText={handleDurationChange} // Update local state and parent
                  showClearButton={false}
                  keyboardType="numeric"
                  containerStyle={styles.durationInput}
                  editable={
                    !isParentLocked &&
                    !absenceAdjustAbsence &&
                    Boolean(localAbsenceType) &&
                    !localAbsenceTypeFixedCalendar &&
                    !localAbsenceTypeDisplayInHours
                  }
                />
                <View style={styles.unitPickerContainer}>
                  <Text style={styles.unitText}>
                    {`${t(localAbsenceTypeHourlyLeave ? "hour" : "day")}(s)`}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Start Date and Start Day Fraction (Same Row) */}
        {showDateFields.showStart && (
          <View style={styles.row}>
            <View style={styles.firstColumn}>
              <Text style={styles.label}>{t("start")}</Text>
              <CustomDateTimePicker
                placeholder={""}
                value={localAbsenceStart}
                isTimePickerVisible={false}
                showClearButton={false}
                isDisabled={
                  isParentLocked || absenceAdjustAbsence || !localAbsenceType
                }
                onFilter={handleAbsenceStartDateChange}
                style={{ pickerContainer: styles.pickerContainer }}
              />
            </View>
            {showDateFields.showStartDayFraction && (
              <View style={styles.secondColumn}>
                <Text
                  style={styles.label}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {t("start_day_fraction")}
                </Text>
                {dayFractionOptions && dayFractionOptions.length > 0 && (
                  <CustomPicker
                    containerStyle={styles.inputBorder}
                    items={dayFractionOptions}
                    initialValue={localAbsenceStartDayFraction}
                    onFilter={handleAbsenceStartDayFractionChange}
                    hideSearchInput={true}
                    disabled={
                      isParentLocked ||
                      absenceAdjustAbsence ||
                      !localAbsenceType ||
                      localAbsenceTypeHalfDaysNotAllowed ||
                      localAbsenceTypeHourlyLeave
                    }
                    accessibilityLabel="Start Day Fraction picker"
                    accessibilityRole="dropdownlist"
                    testID="start-day-fraction-picker"
                  />
                )}
              </View>
            )}
          </View>
        )}

        {/* End Date and End Day Fraction (Same Row) */}
        {showDateFields.showEnd && (
          <View style={styles.row}>
            <View style={styles.firstColumn}>
              <Text style={styles.label}>{t("end")}</Text>
              <CustomDateTimePicker
                placeholder={""}
                value={localAbsenceEnd}
                isTimePickerVisible={false}
                showClearButton={false}
                isDisabled={
                  isParentLocked || absenceAdjustAbsence || !localAbsenceType
                }
                onFilter={handleAbsenceEndDateChange}
                style={{ pickerContainer: styles.pickerContainer }}
              />
            </View>
            {showDateFields.showEndDayFraction && (
              <View style={styles.secondColumn}>
                <Text
                  style={styles.label}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {t("end_day_fraction")}
                </Text>
                {dayFractionOptions && dayFractionOptions.length > 0 && (
                  <CustomPicker
                    containerStyle={styles.inputBorder}
                    items={dayFractionOptions}
                    initialValue={localAbsenceEndDayFraction}
                    onFilter={handleAbsenceEndDayFractionChange}
                    hideSearchInput={true}
                    disabled={
                      isParentLocked ||
                      absenceAdjustAbsence ||
                      !localAbsenceType ||
                      localAbsenceTypeHalfDaysNotAllowed ||
                      localAbsenceTypeHourlyLeave
                    }
                    accessibilityLabel="End Day Fraction picker"
                    accessibilityRole="dropdownlist"
                    testID="end-day-fraction-picker"
                  />
                )}
              </View>
            )}
          </View>
        )}

        {/* Adjustment Fields */}
        {showAdjustmentFields && (
          <>
            <View style={styles.row}>
              <View style={styles.firstColumn}>
                <Text style={styles.label}>{t("request_date")}</Text>
                <CustomDateTimePicker
                  placeholder={""}
                  value={localAbsenceStart}
                  isTimePickerVisible={false}
                  showClearButton={false}
                  isDisabled={isParentLocked}
                  onFilter={handleAbsenceStartDateChange}
                  style={{ pickerContainer: styles.pickerContainer }}
                />
              </View>
              <View style={styles.secondColumn}>
                <Text style={styles.label}>
                  {localAbsenceTypeHourlyLeave || localAbsenceTypeDisplayInHours
                    ? t("number_of_hours")
                    : t("number_of_days")}
                </Text>

                <View style={styles.hoursContainer}>
                  <CustomTextInput
                    value={localDuration}
                    placeholder={"0"}
                    onChangeText={handleDurationChange}
                    showClearButton={false}
                    keyboardType="numeric"
                    containerStyle={styles.durationInput}
                    editable={!isParentLocked}
                  />
                  <View style={styles.unitPickerContainer}>
                    <Text style={styles.unitText}>
                      {`${t(localAbsenceTypeHourlyLeave ? "hour" : "day")}(s)`}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.firstColumn}>
                <Text style={styles.label}>
                  {isAddToBalance
                    ? t("add_to_remaining_balance")
                    : t("deduct_from_remaining_balance")}
                </Text>
                <View style={styles.switchContainer}>
                  <Switch
                    onValueChange={toggleAddToBalance}
                    value={isAddToBalance}
                    disabled={isParentLocked}
                  />
                </View>
              </View>
              <View style={styles.secondColumn}>
                <Text style={styles.label}>{t("adjust_taken")}</Text>
                <View style={styles.switchContainer}>
                  <Switch
                    onValueChange={toggleAdjustTaken}
                    value={adjustTaken}
                    disabled={isParentLocked}
                  />
                </View>
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.firstColumn}>
                <Text style={styles.note}>{t("adjustment_note")}</Text>
              </View>
            </View>
          </>
        )}

        {/*Holiday*/}
        {renderHolidayPicker()}

        {/* Reason for Absence */}
        <View style={styles.detailItem}>
          <Text style={styles.label}>{t("reason_for_absence")}</Text>
          <CustomTextInput
            value={localRemark}
            placeholder={""}
            onChangeText={handleRemarkChange}
            containerStyle={[styles.inputBorder, styles.inputBorderRadius]}
            editable={!isParentLocked && !absenceAdjustAbsence}
          />
        </View>

        {/* Policy */}
        {localPolicyText && (
          <View style={styles.detailItem}>
            <Text style={styles.label}>{t("policy")}</Text>
            <Text style={[styles.value, styles.value]}>{localPolicyText}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    shadowOpacity: 0.6,
    shadowRadius: 2,
  },
  topRow: {
    flexDirection: "row",
    textAlign: "center",
    fontWeight: "bold",
    marginTop: "2%",
    paddingVertical: "1%",
    backgroundColor: "#fff",
  },
  horizontalScrollContent: {
    flexGrow: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  kpiContainer: {
    padding: "2%",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: "2%",
  },
  titleBox: {
    width: "48%",
    alignItems: "center",
  },
  title: {
    fontWeight: "bold",
  },
  tileRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tileGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "47%", // Slightly less than half for each group
  },
  groupSeparator: {
    width: "4%",
  },
  tile: {
    width: "48%",
    aspectRatio: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
    borderRadius: 8,
    borderColor: "lightgray",
  },
  tileLabel: {
    color: "gray",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  tileValue: {
    color: "green",
    fontSize: 18,
    fontWeight: "bold",
  },
  detailContainer: {
    padding: "2%",
    marginTop: "2%",
    backgroundColor: "#fff",
  },
  detailItem: {
    marginBottom: "2%",
  },
  label: {
    color: "#333",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  value: {
    color: "#333",
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    columnGap: 16,
  },
  firstColumn: { flex: 6 },
  secondColumn: { flex: 4 },
  hoursContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0.5,
    borderRadius: 8,
    borderColor: "lightgray",
  },
  durationInput: {
    flex: 1,
    borderWidth: 0,
    padding: "2%",
  },
  unitPickerContainer: {
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
  inputBorder: {
    borderWidth: 0.5,
    borderColor: "lightgray",
  },
  inputBorderRadius: {
    borderRadius: 8,
  },
  pickerContainer: {
    borderWidth: 0.5,
    padding: "2%",
    borderColor: "lightgray",
  },
  note: {
    margin: "10 0 0 0",
    color: "#333",
    fontSize: 14,
  },
  switchContainer: {
    alignItems: "flex-start",
  },
});

export default AbsenceDetailGeneral;
