import React, { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useTranslation } from "react-i18next";
import CustomStatus from "../components/CustomStatus";
import CustomTextInput from "../components/CustomTextInput";
import CustomDateTimePicker from "../components/CustomDateTimePicker";

import {
  changeDateToAPIFormat,
  convertToDateObject,
  getRemarkText,
  setRemarkText,
} from "../utils/FormatUtils";

import {
  BUSOBJCATMAP,
  PREFERRED_LANGUAGES,
} from "../constants";

const ExpenseDetailKeyInfo = ({
  navigation,
  busObjCat,
  busObjId,
  isParentLocked,
  isEditMode,
  currentStatus,
  listOfNextStatus,
  handleReload,
  loading,
  setLoading,
  onExpenseDetailChange,
  expenseDetail,
}) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const {
    expenseExtID,
    expenseType,
    expenseExtStatus,
    expenseCompanyName,
    expenseDueDate,
    expenseDate,
    expenseRemark,
    expenseAmountBU,
    expensePaidAmt,
    expenseAmtDue,
  } = expenseDetail;

  const [keyboardShown, setKeyboardShown] = useState(false);
  const [extID, setExtID] = useState(
    expenseExtID ? expenseExtID : "-system generated-"
  );
  const [date, setDate] = useState(
    expenseDate ? convertToDateObject(expenseDate) : ""
  );
  const [dueDate, setDueDate] = useState(
    expenseDueDate ? convertToDateObject(expenseDueDate) : ""
  );
  const [description, setDescription] = useState(
    getRemarkText(expenseRemark, lang, PREFERRED_LANGUAGES)
  );

  const [amountBU, setAmountBU] = useState(
    expenseAmountBU ? expenseAmountBU : "-Nil-"
  );
  const [amountPaid, setAmountPaid] = useState(
    expensePaidAmt ? expensePaidAmt : "-Nil-"
  );
  const [amountDue, setAmountDue] = useState(
    expenseAmtDue ? expenseAmtDue : "-Nil-"
  );

  const prevValuesRef = useRef(JSON.stringify({ description, date, dueDate }));

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

  const handleDescriptionChange = (text) => {
    // Update local state for the header remark text
    setDescription(text);
  };

  const handleDateChange = (givenDate) => {
    // Update local state for the date
    const newDate = convertToDateObject(givenDate);
    setDate(newDate);
  };

  const handleDueDateChange = (givenDate) => {
    // Update local state for the due date
    const newDueDate = convertToDateObject(givenDate);
    setDate(newDueDate);
  };

  useEffect(() => {
    const currentValuesStr = JSON.stringify({ description, date, dueDate });

    if (prevValuesRef.current === currentValuesStr) {
      return;
    }
    prevValuesRef.current = currentValuesStr;

    const updatedExpenseDescription = setRemarkText(
      expenseRemark,
      lang,
      description
    );
    const updatedDate = changeDateToAPIFormat(date);
    const updatedDueDate = changeDateToAPIFormat(dueDate);

    // Call the callback function to propagate the changes
    onExpenseDetailChange({
      expenseRemark: updatedExpenseDescription,
      expenseDate: updatedDate,
      expenseDueDate: updatedDueDate,
    });
  }, [description, date, dueDate]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ScrollView
          horizontal
          contentContainerStyle={styles.horizontalScrollContent}
        >
          <View style={styles.statusContainer}>
            <CustomStatus
              busObjCat={BUSOBJCATMAP[busObjCat]}
              busObjId={busObjId}
              busObjType={expenseType}
              busObjExtStatus={expenseExtStatus}
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
      <ScrollView style={styles.mainScrollViewContent}>
        <View style={styles.KPIDataMainContainer}>
          <View style={styles.KPIData}>
            <View style={styles.KPIDataLabelContainer}>
              <Text
                style={styles.KPIDataLabel}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t("expense_total_amount")}
              </Text>
            </View>
            <View style={styles.KPIDataContainer}>
              <Text style={styles.KPIDataValue}>{amountBU}</Text>
            </View>
          </View>
          <View style={styles.KPIData}>
            <View style={styles.KPIDataLabelContainer}>
              <Text
                style={styles.KPIDataLabel}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t("expense_amount_paid")}
              </Text>
            </View>
            <View style={styles.KPIDataContainer}>
              <Text style={styles.KPIDataValue}>{amountPaid}</Text>
            </View>
          </View>
          <View style={styles.KPIData}>
            <View style={styles.KPIDataLabelContainer}>
              <Text
                style={styles.KPIDataLabel}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t("expense_amount_due")}
              </Text>
            </View>
            <View style={styles.KPIDataContainer}>
              <Text style={styles.KPIDataValue}>{amountDue}</Text>
            </View>
          </View>
        </View>
        <View style={styles.separator} />
        <View style={styles.containerFirstRow}>
          <View style={styles.containerFirstRowChild}>
            <Text style={styles.containerChildLabel}>{t("claim_id")}</Text>
            <Text style={styles.normalText}>{extID}</Text>
          </View>
          <View style={styles.containerFirstRowChild}>
            <Text style={styles.containerChildLabel}>{t("company")}</Text>
            <Text style={styles.normalText}>{expenseCompanyName}</Text>
          </View>
        </View>
        <View style={styles.containerChild}>
          <View style={styles.containerChildLabelContainer}>
            <Text style={styles.containerChildLabel}>{t("date")}</Text>
          </View>
          <CustomDateTimePicker
            placeholder={t("selected")}
            initialValue={date}
            onFilter={handleDateChange}
            isTimePickerVisible={false}
            isDisabled={isParentLocked}
            showClearButton={false}
          />
        </View>
        <View style={styles.containerChild}>
          <View style={styles.containerChildLabelContainer}>
            <Text style={styles.containerChildLabel}>{t("description")}</Text>
          </View>
          <CustomTextInput
            containerStyle={{
              borderColor: isParentLocked && "rgba(0, 0, 0, 0.5)",
            }}
            value={description}
            placeholder={`${t("placeholder_desc")}...`}
            onChangeText={handleDescriptionChange}
            editable={!isParentLocked}
            multiline={true}
          />
        </View>
        <View style={styles.containerChild}>
          <View style={styles.containerChildLabelContainer}>
            <Text style={styles.containerChildLabel}>{t("due_date")}</Text>
          </View>
          <CustomDateTimePicker
            placeholder={t("selected")}
            initialValue={dueDate}
            onFilter={handleDueDateChange}
            isTimePickerVisible={false}
            isDisabled={isParentLocked}
            showClearButton={false}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    // backgroundColor: "#e5eef7",
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
    marginBottom: 10,
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
    marginLeft: 20,
    marginRight: 15,
  },
  mainScrollViewContent: {
    marginTop: 10,
  },
  separator: {
    borderBottomColor: "#ccc",
    borderBottomWidth: 2,
    borderStyle: "dashed",
    marginVertical: 10,
    marginBottom: "5%",
  },
  KPIDataMainContainer: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "2%",
    // marginLeft: "15",
    // marginRight: "15",
  },
  KPIDataContainer: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "2%",
    marginLeft: "15",
  },
  KPIData: {
    width: "26%",
    height: "50%",
    justifyContent: "center",
    alignItems: "center",
  },
  KPIDataLabelContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  KPIDataLabel: {
    fontWeight: "bold",
  },
  KPIDataValue: {
    fontSize: 16,
    color: "green",
    fontWeight: "bold",
  },
  containerFirstRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: "2%",
  },
  containerFirstRowChild: {
    marginBottom: "2%",
    marginRight: 10,
    marginLeft: 10,
  },
  containerChild: {
    marginBottom: "2%",
    marginRight: 10,
    marginLeft: 10,
  },
  containerChildLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  containerChildLabel: {
    marginBottom: "1%",
    fontSize: 14,
    fontWeight: "bold",
  },
  normalText: {
    fontWeight: "normal",
    fontSize: 15,
  },
});

export default ExpenseDetailKeyInfo;
