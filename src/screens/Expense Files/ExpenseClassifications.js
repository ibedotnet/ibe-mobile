import React, {
  useContext,
  useEffect,
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";

import { Alert, StyleSheet, TouchableOpacity, Text, View } from "react-native";

import { useTranslation } from "react-i18next";

import { screenDimension } from "../../utils/ScreenUtils";
import CustomButton from "../../components/CustomButton";

import { convertAmountToDisplayFormat, isEqual } from "../../utils/FormatUtils";
import { LoggedInUserInfoContext } from "../../../context/LoggedInUserInfoContext";

import AddOrEditClassificationForm from "./AddOrEditClassificationForm";

import { showToast } from "../../utils/MessageUtils";
import { setAmtReimburse, updateSplitAmounts } from "../../utils/ExpenseUtils";

const ExpenseClassifications = forwardRef(
  (
    { item, setTempItem, isItemEditMode, isParentLocked, expenseDetail },
    ref
  ) => {
    const { t, i18n } = useTranslation();
    const lang = i18n.language;
    const { loggedInUserInfo } = useContext(LoggedInUserInfoContext);

    const {
      expenseCompanyId,
      defaultAsHomeDefault,
      expenseTypeSingleProject,
      expenseTypeSingleCustomer,
    } = expenseDetail;

    const [currentItem, setCurrentItem] = useState({});
    const [mainItem, setMainItem] = useState({ ...item });

    const [isEditingItem, setIsEditingItem] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedRadioOption, setSelectedRadioOption] = useState("project");
    const [isProjectDisabled, setIsProjectDisabled] = useState(null);
    const [isDepartmentDisabled, setIsDepartmentDisabled] = useState(null);

    const addClassificationFormRef = useRef(null);

    const generateUniqueKey = (item) =>
      `${item.departmentId || ""}${item.taskId || ""}`;

    useImperativeHandle(ref, () => ({
      saveChanges: () => {
        if (addClassificationFormRef.current) {
          addClassificationFormRef.current.saveChanges(); // Call saveChanges in AddClassificationForm
        }
      },
    }));

    const hasValidItem = Object.values(mainItem).some(
      (item) => item.taskId?.trim() || item.departmentId?.trim()
    );

    const handleCreateClassificationClick = () => {
      let itemCount = Object.keys(mainItem).length;
      if (mainItem["0"]?.itemTypeIsQty) {
        Alert.alert(
          t("validation_error"),
          "Quantity based expense items cannot be split",
          [{ text: t("ok"), style: "cancel" }],
          { cancelable: false }
        );
        return;
      } else {
        setIsFormOpen(true);
        let isItemSplit;

        if (!mainItem["0"]?.taskId && !mainItem["0"]?.departmentId) {
          itemCount = 0;
          isItemSplit = false;
        } else {
          isItemSplit = true;
          const updatedMainItem = { ...mainItem };

          Object.keys(updatedMainItem).forEach((key) => {
            updatedMainItem[key].isSplit = true;
          });

          setMainItem(updatedMainItem);
          setTempItem(updatedMainItem);
        }

        setCurrentItem({
          ...item[0],
          itemCount: itemCount,
          projectId: "",
          projectExtId: "",
          projectText: "",
          taskId: "",
          taskExtId: "",
          taskText: "",
          departmentId: "",
          departmentExtId: "",
          departmentText: "",
          billable: "",
          isSplit: isItemSplit,
          splitAmt: { amount: 0, currency: "" },
          splitPercent: parseFloat((100 / (itemCount + 1)).toFixed(2)),
        });
      }
    };

    const handleEditClassificationClick = (item, index) => {
      setIsFormOpen(true);
      setIsEditingItem(true);

      const openItem = { ...item, itemCount: index };
      setCurrentItem(openItem);
    };

    const handleCloseClassificationClick = () => {
      if (addClassificationFormRef.current) {
        addClassificationFormRef.current.saveChanges();
      }

      setIsFormOpen(false);
      setIsEditingItem(false);
      setCurrentItem({});
    };

    const handleDeleteClassificationClick = (item) => {
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

    const onDeleteItem = async (itemToDelete) => {
      let updatedMainItem = { ...mainItem };
      const keys = Object.keys(updatedMainItem);

      if (keys.length === 1) {
        // Case 1: Only one item remains, reset its values
        const singleKey = keys[0];

        updatedMainItem[singleKey] = {
          ...updatedMainItem[singleKey],
          projectId: "",
          projectExtId: "",
          projectText: "",
          taskId: "",
          taskExtId: "",
          taskText: "",
          departmentId: "",
          departmentExtId: "",
          departmentText: "",
          billable: "",
          isSplit: false,
          splitAmt: { amount: 0, currency: "" },
          splitPercent: 0,
        };
      } else {
        // Case 2 & 3: Find and remove the itemToDelete
        const itemToDeleteKey = Object.entries(updatedMainItem).find(
          ([, item]) =>
            generateUniqueKey(item) === generateUniqueKey(itemToDelete)
        )?.[0];

        if (!itemToDeleteKey) {
          console.warn("Item to delete not found.");
          return;
        }

        delete updatedMainItem[itemToDeleteKey];

        const remainingKeys = Object.keys(updatedMainItem);

        if (remainingKeys.length === 1) {
          // Case 2: Only one item left, reset its values
          const singleKey = remainingKeys[0];

          updatedMainItem[singleKey] = {
            ...updatedMainItem[singleKey],
            isDirty: true,
            isSplit: false,
            splitPercent: 0,
            splitAmt: { amount: 0, currency: "" },
            expAmt: updatedMainItem[singleKey].totalAcrossSplits,
            amountBU: updatedMainItem[singleKey].totalAcrossSplits,
            amtBU: updatedMainItem[singleKey].totalAcrossSplits,
            ...(updatedMainItem[singleKey].itemTypeIsRate ||
            updatedMainItem[singleKey].itemTypeIsQty
              ? {}
              : { unitAmt: updatedMainItem[singleKey].totalAcrossSplits }),
          };

          const newAmtReimburse = await setAmtReimburse(
            updatedMainItem[singleKey],
            expenseCompanyId
          );
          if (newAmtReimburse != null) {
            updatedMainItem[singleKey].amtReimburse = newAmtReimburse;
          }
        } else {
          // Case 3: More than one item left, use updateSplitAmounts
          let itemsMap = new Map(
            Object.entries(updatedMainItem).map(([key, item]) => [
              generateUniqueKey(item),
              item,
            ])
          );

          const returnedItemsMap = await updateSplitAmounts(
            itemsMap,
            updatedMainItem[remainingKeys[0]].sortSeq
          );

          // Convert Map back to Object
          updatedMainItem = Object.fromEntries(
            Array.from(returnedItemsMap.values()).map((item, index) => [
              index,
              { ...item, isDirty: true },
            ])
          );

        }
      }

      setMainItem(updatedMainItem);
      setTempItem(updatedMainItem);
    };

    const handleEqualSplitClick = () => {
      if (mainItem && Object.keys(mainItem).length > 1) {
        const splitRec = Object.keys(mainItem).length;
        let splitPerc = parseFloat((100 / splitRec).toFixed(2));

        let splitPercArray = [];
        let updatedItems = { ...mainItem };
        let keys = Object.keys(updatedItems);
        let accumulatedAmt = 0;

        keys.forEach((key, index) => {
          let splitPercent, splitAmount;

          let totalAmount = updatedItems[key]?.totalAcrossSplits?.amount || 0;
          let currency = updatedItems[key]?.totalAcrossSplits?.currency || "";

          if (index < splitRec - 1) {
            splitPercent = splitPerc;
            splitAmount = parseFloat(
              ((totalAmount * splitPercent) / 100).toFixed(2)
            );

            accumulatedAmt += splitAmount;
            splitPercArray.push(splitPercent);
          } else {
            // Adjust last item's percentage to ensure sum is exactly 100
            const sum = splitPercArray.reduce((acc, value) => acc + value, 0);
            splitPercent = 100 - sum;
            splitAmount = totalAmount - accumulatedAmt;
          }

          updatedItems[key] = {
            ...updatedItems[key],
            splitPercent,
            splitAmt: {
              amount: splitAmount,
              currency,
            },
            isSplit: true,
            isDirty: true,
          };
        });

        setMainItem(updatedItems);
        setTempItem(updatedItems);
      }
    };

    const setRadioGroup = () => {
      if (defaultAsHomeDefault === "*") {
        setIsProjectDisabled(true);
        setIsDepartmentDisabled(false);
        setSelectedRadioOption("department");
      } else if (defaultAsHomeDefault === "-") {
        setIsDepartmentDisabled(true);
        setIsProjectDisabled(false);
        setSelectedRadioOption("project");
      } else if (defaultAsHomeDefault === ".") {
        setIsDepartmentDisabled(false);
        setIsProjectDisabled(false);
        setSelectedRadioOption("project");
      }

      if (expenseTypeSingleProject || expenseTypeSingleCustomer) {
        setIsDepartmentDisabled(true);
      }
    };

    const handleChangeOfRadioButton = (changeTo) => {
      if (
        mainItem &&
        Object.keys(mainItem).length > 0 &&
        generateUniqueKey(mainItem["0"] ?? {})
      ) {
        Alert.alert(
          t("delete_item"),
          "Existing classification will be removed. Do you want to continue?",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            { text: "OK", onPress: () => onChangeOfRadioButton(changeTo) },
          ],
          { cancelable: false }
        );
      } else {
        onChangeOfRadioButton(changeTo);
      }
    };

    const onChangeOfRadioButton = (value) => {
      if (mainItem && Object.keys(mainItem).length > 0) {
        const updatedItem = { ...mainItem };

        Object.keys(updatedItem).forEach((key) => {
          if (key !== "0") {
            delete updatedItem[key];
          }
        });

        if (updatedItem["0"]) {
          updatedItem["0"] = {
            ...updatedItem["0"],
            projectId: "",
            projectExtId: "",
            projectText: "",
            taskId: "",
            taskExtId: "",
            taskText: "",
            departmentId: "",
            departmentExtId: "",
            departmentText: "",
            billable: "",
            isSplit: false,
            splitAmt: { amount: 0, currency: "" },
            splitPercent: 0,
          };
        }

        setMainItem(updatedItem);
        setTempItem(updatedItem);
      }

      setSelectedRadioOption(value);
    };

    useEffect(() => {
      setRadioGroup();
    }, []);

    useEffect(() => {
      setMainItem(item);
    }, [item]);

    return (
      <View style={styles.container}>
        <View style={styles.classificationButton}>
          <CustomButton
            onPress={() => handleCreateClassificationClick()}
            label="Add Classification"
            icon={{
              name: "plus",
              library: "MaterialCommunityIcons",
              size: 24,
              color: "#38a630",
            }}
            backgroundColor={false}
            style={{ paddingHorizontal: 0, paddingVertical: 0 }}
            disabled={isParentLocked || isFormOpen}
          />
          <CustomButton
            onPress={() => handleEqualSplitClick()}
            label="Equal Split"
            icon={{
              name: "scale-balance",
              library: "MaterialCommunityIcons",
              size: 24,
              color: "#005eb8",
            }}
            backgroundColor={false}
            style={{ paddingHorizontal: 0, paddingVertical: 0 }}
            disabled={isParentLocked}
          />
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amountHeaderText}>{t("total_value")} : </Text>
          <Text style={styles.amountText}>
            {mainItem["0"]?.totalAcrossSplits.amount
              ? `${mainItem["0"].totalAcrossSplits.currency} ${mainItem[
                  "0"
                ].totalAcrossSplits?.amount?.toFixed(2)}`
              : "USD 00.00"}
          </Text>
        </View>
        <View style={styles.radiogroup}>
          <TouchableOpacity
            style={[
              styles.radioButtonContainer,
              isProjectDisabled && styles.disabledButton,
            ]}
            disabled={isParentLocked || isProjectDisabled}
            onPress={() => handleChangeOfRadioButton("project")}
          >
            <View
              style={[
                styles.radioButton,
                selectedRadioOption === "project" && styles.radioButtonSelected,
              ]}
            >
              {selectedRadioOption === "project" && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
            <Text style={styles.radioText}>Classify to a project</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.radioButtonContainer,
              isDepartmentDisabled && styles.disabledButton,
            ]}
            disabled={isParentLocked || isDepartmentDisabled}
            onPress={() => handleChangeOfRadioButton("department")}
          >
            <View
              style={[
                styles.radioButton,
                selectedRadioOption === "department" &&
                  styles.radioButtonSelected,
              ]}
            >
              {selectedRadioOption === "department" && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
            <Text style={styles.radioText}>Classify to a department</Text>
          </TouchableOpacity>
        </View>
        {hasValidItem &&
          Object.entries(mainItem)
            .filter(([key, item]) => key !== "isDirty")
            .map(([index, item]) => (
              <View key={index} style={styles.itemsCardContainer}>
                <View
                  style={[styles.itemsCard, item.isDirty && styles.dirtyItem]}
                >
                  <View style={styles.itemsCardHeader}>
                    <View style={styles.descContainer}>
                      <Text></Text>
                    </View>
                    <View style={styles.itemButtonContainer}>
                      <View style={styles.editButtonContainer}>
                        <CustomButton
                          onPress={() =>
                            handleEditClassificationClick(item, index)
                          }
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
                            onPress={() =>
                              handleDeleteClassificationClick(item)
                            }
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
                  <>
                    {item.projectText && (
                      <View style={styles.itemsCardRow}>
                        <Text style={styles.itemsCardRowLabel}>
                          {t("project")}:
                        </Text>
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
                        <Text style={styles.itemsCardRowLabel}>
                          {t("task")}:
                        </Text>
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
                      <Text style={styles.itemsCardRowLabel}>
                        {t("billable")}:
                      </Text>
                      <Text numberOfLines={1}>
                        {item.billable ? t("yes") : "No"}
                      </Text>
                    </View>
                    <View style={styles.itemsCardRow}>
                      <Text style={styles.itemsCardRowLabel}>
                        {t("amount")}:
                      </Text>
                      <Text numberOfLines={1}>
                        {item.isSplit && item.splitAmt
                          ? convertAmountToDisplayFormat(item.splitAmt)
                          : item.amtBU
                          ? convertAmountToDisplayFormat(item.amtBU)
                          : "-"}
                      </Text>
                    </View>
                    {item.isSplit && (
                      <View style={styles.itemsCardRow}>
                        <Text style={styles.itemsCardRowLabel}>
                          {t("split")}:
                        </Text>
                        <Text>{`${item.splitPercent}%`}</Text>
                      </View>
                    )}
                  </>
                </View>
                {isEditingItem && currentItem?.taskId === item.taskId && (
                  <AddOrEditClassificationForm
                    ref={addClassificationFormRef}
                    item={currentItem}
                    setTempItem={setTempItem}
                    isParentLocked={isParentLocked}
                    isEditingItem={isEditingItem}
                    selectedRadioOption={selectedRadioOption}
                    handleCloseClassificationClick={
                      handleCloseClassificationClick
                    }
                  />
                )}
              </View>
            ))}
        {isFormOpen && currentItem?.taskId == "" && (
          <AddOrEditClassificationForm
            ref={addClassificationFormRef}
            item={currentItem}
            setTempItem={setTempItem}
            isParentLocked={isParentLocked}
            isEditingItem={isEditingItem}
            selectedRadioOption={selectedRadioOption}
            handleCloseClassificationClick={handleCloseClassificationClick}
          />
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    paddingHorizontal: "2%",
    paddingBottom: screenDimension.height / 2,
  },
  amountContainer: {
    // backgroundColor: "#e3e1e1",
    flexDirection: "row",
    alignItems: "center",
    marginTop: "4%",
  },
  amountHeaderText: {
    textTransform: "uppercase",
    fontSize: 15,
    fontWeight: "600",
  },
  amountText: {
    fontSize: 16,
    color: "#1d3e8c",
    fontWeight: "700",
  },
  radiogroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "4%",
  },
  radioButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    marginRight: 6,
  },
  disabledButton: {
    opacity: 0.5,
  },
  radioButton: {
    height: 16,
    width: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "black",
    marginRight: 5,
  },
  radioButtonSelected: {
    borderColor: "black",
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 5,
    margin: 2,
    backgroundColor: "black",
  },
  radioText: {
    fontSize: 15,
    color: "black",
  },
  noRecords: {
    justifyContent: "center",
    height: "80%",
    margin: "2%",
    padding: "4%",
  },
  itemsScrollViewContent: {
    flexGrow: 1,
    alignItems: "center",
  },
  itemsCardContainer: {
    width: "100%",
    backgroundColor: "#fff",
    paddingVertical: "2%",
  },
  itemsCard: {
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
    shadowOpacity: 0.6,
    shadowRadius: 2,
  },
  itemsCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  descContainer: {
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
    flexShrink: 0,
    marginRight: 5,
  },
  itemsCardRowValue: {
    fontSize: 14,
    flexShrink: 1,
    flexWrap: "wrap",
  },
  itemsCardMultiInRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: "2%",
  },
  itemsCardMultiInRowLabel: {
    fontWeight: "bold",
  },
  firstColumn: {
    flex: 3.5,
  },
  secondColumn: {
    flex: 3,
  },
  thirdColumn: {
    flex: 2,
  },
  dirtyItem: {
    borderColor: "#f00",
    borderWidth: 2,
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
  classificationButton: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
});

export default ExpenseClassifications;
