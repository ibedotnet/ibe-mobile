import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View, Text, Alert } from "react-native";

import { useTranslation } from "react-i18next";
import { format, set } from "date-fns";

import CustomStatus from "../components/CustomStatus";
import CustomPicker from "../components/CustomPicker";
import CustomDateTimePicker from "../components/CustomDateTimePicker";
import CustomTextInput from "../components/CustomTextInput";

import { APP, BUSOBJCATMAP, PREFERRED_LANGUAGES } from "../constants";
import {
  handleAbsenceTypeUpdate,
  validateDuration,
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
    absenceEmployeeName,
    absenceExtStatus,
    absenceRemark,
  } = absenceDetails;

  const {
    absenceTypePolicyText,
    absenceTypeHourlyLeave,
    absenceTypeDisplayInHours,
    absenceTypeIsFixedCalendar,
  } = absenceTypeDetails;

  const { absenceTypeOptions = {}, dayFractionOptions = {} } = pickerOptions;

  const [localAbsenceType, setLocalAbsenceType] = useState(absenceType);
  const [localAbsenceTypeHourlyLeave, setLocalAbsenceTypeHourlyLeave] =
    useState(absenceTypeHourlyLeave);
  const [localAbsenceTypeIsFixedCalendar, setLocalAbsenceTypeIsFixedCalendar] =
    useState(absenceTypeIsFixedCalendar);
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
  const [localDuration, setLocalDuration] = useState(
    absencePlannedDays.toString()
  );
  const [durationMinValue, setDurationMinValue] = useState(1);
  const [durationAllowDecimals, setDurationAllowDecimals] = useState(false);

  const balances = useMemo(
    () => [
      { label: t("before"), value: "-NA-" },
      { label: t("after"), value: "-NA-" },
      { label: t("balance"), value: "-NA-" },
      { label: t("carry_forward"), value: "-NA-" },
    ],
    []
  );

  const currentDate = new Date();
  const endOfYear = new Date(currentDate.getFullYear(), 11, 31); // End of the current year (December 31st)
  const formatDate = useCallback((date) => {
    return format(
      new Date(date),
      convertToDateFNSFormat(APP.LOGIN_USER_DATE_FORMAT)
    );
  }, []);

  /**
   * Handles changes to individual fields within the absence detail form.
   *
   * @param {string} field - The name of the field being updated (e.g., "absenceType", "duration").
   * @param {*} value - The new value for the specified field.
   */
  const handleFieldChange = (field, value) => {
    // Create an object with the updated field and its new value
    const updatedValues = {
      [field]: value,
    };

    // Propagate the changes to the parent callback function
    onAbsenceDetailChange(updatedValues);
  };

  /**
   * Handles the change in the absence type, triggering the relevant state updates.
   *
   * @param {string} value - The ID or identifier of the absence type selected by the user.
   *
   * This function updates the local state with the new absence type information,
   * including policy text, and other related fields.
   * It also notifies the parent component of the change and shows a toast message indicating reset.
   */
  const handleAbsenceTypeChange = (value) => {
    showToast(t("absence_fields_default_values_message"), "warning");

    setLocalAbsenceType(value);

    // Get the updated fields based on the selected absence type
    const { updatedFields } = handleAbsenceTypeUpdate({
      absenceType: value,
      allAbsenceTypes,
    });

    console.log(
      "Absence Type Change: Updated fields after selection of type:",
      {
        absenceType: value,
        updatedFields,
      }
    );

    // Reset fields like start, end, fractions, and duration to default values
    // while updating other fields such as policy text and hourly leave based on the updated absence type
    setLocalAbsenceStart(updatedFields.localAbsenceStart);
    setLocalAbsenceEnd(updatedFields.localAbsenceEnd);
    setLocalAbsenceStartDayFraction(updatedFields.localAbsenceStartHalfDay);
    setLocalAbsenceEndDayFraction(updatedFields.localAbsenceEndHalfDay);
    setLocalDuration(updatedFields.localDuration);
    setLocalPolicyText(updatedFields.absenceTypePolicyText);
    setLocalAbsenceTypeHourlyLeave(updatedFields.absenceTypeHourlyLeave);
    setLocalAbsenceTypeIsFixedCalendar(
      updatedFields.absenceTypeIsFixedCalendar
    );
    setLocalAbsenceTypeDisplayInHours(updatedFields.absenceTypeDisplayInHours);

    // Notify the parent component of the absence type change
    handleFieldChange("absenceType", value);
    START FROM HERE
    handleFieldChange("absenceStartDate", updatedFields.localAbsenceStart);
    handleFieldChange("absenceEndDate", updatedFields.localAbsenceEnd);
    handleFieldChange(
      "absenceStartDayFraction",
      updatedFields.localAbsenceStartHalfDay
    );
    handleFieldChange(
      "absenceEndDayFraction",
      updatedFields.localAbsenceEndHalfDay
    );
    handleFieldChange("absenceDuration", updatedFields.localDuration);
    handleFieldChange("absenceRemark", updatedFields.absenceTypePolicyText);
  };

  const handleAbsenceStartDayFractionChange = (value) => {
    handleFieldChange("absenceStartDayFraction", value);
  };

  const handleAbsenceEndDayFractionChange = (value) => {
    handleFieldChange("absenceEndDayFraction", value);
  };

  const handleDurationChange = (value) => {
    if (
      validateDuration(
        value,
        durationMinValue,
        durationAllowDecimals,
        localAbsenceTypeHourlyLeave,
        localAbsenceTypeDisplayInHours,
        t
      )
    ) {
      setLocalDuration(value);
      handleFieldChange("absenceDuration", value);
    }
  };

  const handleRemarkChange = (value) => {
    setLocalRemark(value);
    const updatedAbsenceRemark = setRemarkText(absenceRemark, lang, value);
    handleFieldChange("absenceRemark", updatedAbsenceRemark);
  };

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
      {!absenceAdjustAbsence && (
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
          <View style={styles.firstColumn}>
            <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
              {t("absence_type")}
            </Text>
            {absenceTypeOptions && absenceTypeOptions.length > 0 && (
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
          <View style={styles.secondColumn}>
            <Text style={styles.label}>{t("duration")}</Text>
            <View style={styles.hoursContainer}>
              <CustomTextInput
                value={localDuration}
                placeholder={"0"}
                onChangeText={handleDurationChange} // Update local state and parent
                showClearButton={false}
                keyboardType="numeric"
                containerStyle={[styles.durationInput, styles.zeroPadding]}
                editable={
                  !isParentLocked &&
                  !absenceAdjustAbsence &&
                  Boolean(localAbsenceType)
                }
              />
              <View style={styles.unitPickerContainer}>
                <Text style={styles.unitText}>
                  {`${t(localAbsenceTypeHourlyLeave ? "hour" : "day")}(s)`}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Start Date and Start Day Fraction (Same Row) */}
        <View style={styles.row}>
          <View style={styles.firstColumn}>
            <Text style={styles.label}>{t("start")}</Text>
            <CustomDateTimePicker
              placeholder={""}
              initialValue={localAbsenceStart}
              isTimePickerVisible={false}
              showClearButton={false}
              isDisabled={
                isParentLocked || absenceAdjustAbsence || !localAbsenceType
              }
              onFilter={(value) => handleFieldChange("absenceStartDate", value)}
              style={{ pickerContainer: styles.pickerContainer }}
            />
          </View>
          <View style={styles.secondColumn}>
            <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
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
                  isParentLocked || absenceAdjustAbsence || !localAbsenceType
                }
                accessibilityLabel="Start Day Fraction picker"
                accessibilityRole="dropdownlist"
                testID="start-day-fraction-picker"
              />
            )}
          </View>
        </View>

        {/* End Date and End Day Fraction (Same Row) */}
        <View style={styles.row}>
          <View style={styles.firstColumn}>
            <Text style={styles.label}>{t("end")}</Text>
            <CustomDateTimePicker
              placeholder={""}
              initialValue={localAbsenceEnd}
              isTimePickerVisible={false}
              showClearButton={false}
              isDisabled={
                isParentLocked || absenceAdjustAbsence || !localAbsenceType
              }
              onFilter={(value) => handleFieldChange("absenceEndDate", value)}
              style={{ pickerContainer: styles.pickerContainer }}
            />
          </View>
          <View style={styles.secondColumn}>
            <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
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
                  isParentLocked || absenceAdjustAbsence || !localAbsenceType
                }
                accessibilityLabel="End Day Fraction picker"
                accessibilityRole="dropdownlist"
                testID="end-day-fraction-picker"
              />
            )}
          </View>
        </View>

        {/* Adjustment */}
        {absenceAdjustAbsence && (
          <View style={styles.detailItem}>
            <Text style={styles.label}>{t("adjustment")}</Text>
            <Text style={styles.value}>{t("yes")}</Text>
          </View>
        )}

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
  firstColumn: {
    flex: 6,
  },
  secondColumn: {
    flex: 4,
  },
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
  zeroPadding: {
    padding: 0,
  },
  pickerContainer: {
    borderWidth: 0.5,
    padding: "2%",
    borderColor: "lightgray",
  },
});

export default AbsenceDetailGeneral;
