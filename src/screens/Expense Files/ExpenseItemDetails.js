import React, { useEffect, useState, useImperativeHandle } from "react";

import { StyleSheet, Switch, Text, View } from "react-native";

import { useTranslation } from "react-i18next";

import { APP, APP_NAME, INTSTATUS, PREFERRED_LANGUAGES } from "../../constants";

import {
  changeDateToAPIFormat,
  convertToDateObject,
  getRemarkText,
  isEqual,
  setRemarkText,
} from "../../utils/FormatUtils";
import CustomRemotePicker from "../../components/CustomRemotePicker";
import CustomTextInput from "../../components/CustomTextInput";
import CustomDateTimePicker from "../../components/CustomDateTimePicker";
import {
  callDistanceCalAPI,
  fetchExpenseTaxCode,
  setAmtReimburse,
} from "../../utils/ExpenseUtils";
import CustomPicker from "../../components/CustomPicker";

const ExpenseItemDetails = React.forwardRef(
  (
    { item, setTempItem, setReceiptRequired, isParentLocked, expenseDetail },
    ref
  ) => {
    const { t, i18n } = useTranslation();
    const lang = i18n.language;

    const {
      expenseCompanyId,
      baseCurrency,
      defaultAsHomeDefault,
      allowedExpenseTypes,
      currencyUnits,
      expenseCompanyIsTaxExempt,
      expenseCompanyIsVatRegistered,
    } = expenseDetail;

    const [allItems, setAllItems] = useState({ ...item });
    const [editedItem, setEditedItem] = useState({ ...item[0] });
    const [initialItem, setInitialItem] = useState({ ...item[0] });

    const [itemTaxAmountValue, setItemTaxAmountValue] = useState("");
    const [itemTaxAmountCurrency, setItemTaxAmountCurrency] = useState(null);
    const [hideTaxFields, setHideTaxFields] = useState(
      !(expenseCompanyIsVatRegistered === "true") ||
        expenseCompanyIsTaxExempt === "true"
    );

    const [itemAmountValue, setItemAmountValue] = useState("");
    const [itemAmountCurrency, setItemAmountCurrency] = useState(null);
    const [itemSplitTotalAmountValue, setItemSplitTotalAmountValue] =
      useState("");
    const [itemSplitTotalAmountCurrency, setItemSplitTotalAmountCurrency] =
      useState(null);
    const [itemRateAmount, setItemRateAmount] = useState("");
    const [itemRateCurrency, setItemRateCurrency] = useState(null);
    const [itemQtyValue, setItemQtyValue] = useState("");
    const [itemQtyUnit, setItemQtyUnit] = useState("ea");
    const [itemQtyUnitName, setItemQtyUnitName] = useState("");
    const [calcDistValue, setCalcDistValue] = useState("");
    const [calcDistUnit, setCalcDistUnit] = useState("ea");
    const [overrideDistValue, setOverrideDistValue] = useState("");
    const [overrideDistUnit, setOverrideDistUnit] = useState("ea");

    const roundToTwo = (num) => Math.round(num * 100) / 100;

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

    const expenseTypeQueryParams = {
      fields: [
        "ExpenseType-id",
        "ExpenseType-extID",
        "ExpenseType-name",
        "ExpenseType-isMileage",
        "ExpenseType-isRateBased",
        "ExpenseType-isQtyBased",
        "ExpenseType-nonReimbursible",
        "ExpenseType-receiptIsRequired",
        "ExpenseType-locationInput",
        "ExpenseType-bUData",
      ],
      where: [
        {
          fieldName: "ExpenseType-busObjCat",
          operator: "=",
          value: "ExpenseType",
        },
        {
          fieldName: "ExpenseType-extID",
          operator: "in",
          value: allowedExpenseTypes,
        },
      ],
      sort: [
        {
          property: "ExpenseType-name",
          direction: "ASC",
        },
      ],
    };

    const locationQueryParams = {
      fields: [
        "Location-id",
        "Location-isPrivate",
        "Location-extID",
        "Location-address",
      ],
      where: [
        {
          fieldName: "Location-isPrivate",
          operator: "=",
          value: false,
        },
      ],
      sort: [
        {
          property: "Location-extID",
          direction: "ASC",
        },
      ],
    };

    const expenseSupplierQueryParams = {
      fields: [
        "ExpenseSupplier-id",
        "ExpenseSupplier-extID",
        "ExpenseSupplier-expenseTypes",
      ],
      sort: [
        {
          property: "ExpenseSupplier-extID",
          direction: "ASC",
        },
      ],
    };

    const taxCodeQueryParams = {
      fields: ["TaxCode-id", "TaxCode-text", "TaxCode-extID"],
      sort: [
        {
          property: "TaxCode-extID",
          direction: "ASC",
        },
      ],
    };

    const saveChanges = () => {
      const updatedItem = { ...editedItem };

      if (!isParentLocked && !isEqual(updatedItem, initialItem)) {
        updatedItem.isDirty = true;

        if (updatedItem.isSplit) {
          // Define the fields(21) that should NOT be copied
          const excludedFields = [
            "projectId",
            "projectExtId",
            "projectText",
            "taskId",
            "taskExtId",
            "taskText",
            "departmentId",
            "departmentExtId",
            "departmentText",
            "billable",
            "amountBU",
            "expAmt",
            "amtBU",
            "unitAmt",
            "splitAmt",
            "taxBase",
            "taxBaseBU",
            "taxAmt",
            "taxAmtBU",
            "amtReimburse",
            "splitPercent",
          ];

          const updatedAllItems = Object.keys(allItems).reduce((acc, key) => {
            acc[key] = {
              ...allItems[key],
              ...Object.fromEntries(
                Object.entries(updatedItem).filter(
                  ([k]) => !excludedFields.includes(k)
                )
              ),
            };
            return acc;
          }, {});

          setAllItems(updatedAllItems);
          setTempItem(updatedAllItems);
        } else {
          setTempItem({ 0: updatedItem });
        }
      }

      console.log(`Leaving tab 1, item: ${JSON.stringify(updatedItem)}`);
    };

    useImperativeHandle(ref, () => ({
      saveChanges,
    }));

    const handleExpenseTypeChange = ({ value, label, additionalData }) => {
      const extID = additionalData.extID ?? "";
      const desc = setRemarkText(undefined, lang, label);

      const defaultDate = changeDateToAPIFormat(new Date());

      setEditedItem((prevItem) => ({
        ...prevItem,
        expenseItemType: extID,
        expenseItemTypeText: label,
        expenseItemTypeId: value,
        itemDate: defaultDate,
        itemTypeIsMileage: additionalData.itemTypeIsMileage,
        itemTypeIsQty: additionalData.itemTypeIsQty,
        itemTypeIsRate: additionalData.itemTypeIsRate,
        nonReimbursible: additionalData.nonReimbursible,
        reimbursible: !additionalData.nonReimbursible,
        remark: desc,
        expenseQuantity: { quantity: 1, unit: "ea" },
      }));

      updateExpenseBasedFields(additionalData);

      setOverrideDistUnit("ea");
      setOverrideDistValue("");
      setCalcDistUnit("ea");
      setCalcDistValue("");
      setItemQtyUnit("ea");
      setItemQtyValue("");
      setItemRateCurrency(null);
      setItemRateAmount("");
    };

    const updateExpenseBasedFields = (additionalData) => {
      const bUData = additionalData.bUData ?? [];

      let buRec = null;
      var unit = "ea";

      for (var i = 0; i < bUData.length; i++) {
        buRec = bUData[i];

        if (buRec.busUnitID && buRec.busUnitID == expenseCompanyId) {
          if (
            buRec.ratePrice &&
            buRec.ratePrice[0] &&
            buRec.ratePrice[0].unitPrice &&
            buRec.ratePrice[0].pricingUnit
          ) {
            unit = buRec.ratePrice[0].pricingUnit;

            if (
              additionalData.itemTypeIsMileage ||
              additionalData.itemTypeIsRate
            ) {
              setEditedItem((prevItem) => ({
                ...prevItem,
                unitAmt: buRec.ratePrice[0].unitPrice,
                expenseQuantity: { quantity: 1, unit: unit },
              }));

              if (additionalData.itemTypeIsRate) {
                setEditedItem((prevItem) => ({
                  ...prevItem,
                  amtBU: buRec.ratePrice[0].unitPrice,
                }));
              }
            }
          }

          if (buRec.locationInput) {
            setEditedItem((prevItem) => ({
              ...prevItem,
              locationRequired: true,
            }));
          }

          if (buRec.commentIsRequired) {
            setEditedItem((prevItem) => ({
              ...prevItem,
              descRequired: true,
            }));
          }

          if (buRec.supplierRequired) {
            setEditedItem((prevItem) => ({
              ...prevItem,
              supplierRequired: true,
            }));
          }

          if (buRec.vATnumberRequired) {
            setEditedItem((prevItem) => ({
              ...prevItem,
              vATRequired: true,
            }));
          }

          if (additionalData.itemTypeIsMileage && buRec.overideCalcDistance) {
            setEditedItem((prevItem) => ({
              ...prevItem,
              overideCalcDistance: true,
            }));
          }

          if (buRec.maxClaimAmount?.amount) {
            setEditedItem((prevItem) => ({
              ...prevItem,
              maxAmount: buRec.maxClaimAmount?.amount,
              validateClaim: buRec.validateClaim || "",
            }));
          }

          if (buRec.receiptIsRequired) {
            setReceiptRequired(true);
          }

          if (buRec.defaultTaxCode) {
            setEditedItem((prevItem) => ({
              ...prevItem,
              taxCode: buRec.defaultTaxCode,
            }));
          }
        }
      }
    };

    const handleDescriptionChange = (text) => {
      const updatedDesc = setRemarkText(editedItem.remark, lang, text);
      setEditedItem((prevItem) => ({
        ...prevItem,
        remark: updatedDesc,
      }));
    };

    const descriptionText = getRemarkText(
      editedItem.remark,
      lang,
      PREFERRED_LANGUAGES
    );

    const handleDateChange = (date) => {
      const newDate = changeDateToAPIFormat(date);

      setEditedItem((prevItem) => ({
        ...prevItem,
        itemDate: newDate,
      }));
    };

    const formattedDate = convertToDateObject(editedItem.itemDate) || {};

    const handleStartLocationChange = ({ value, label, additionalData }) => {
      const startLocationObj = {
        ...additionalData.addressObj,
        locationID: value,
      };

      setEditedItem((prevItem) => ({
        ...prevItem,
        fromLoc: label,
        startLocationObj: startLocationObj,
      }));
    };

    const handleEndLocationChange = ({ value, label, additionalData }) => {
      const endLocationObj = {
        ...additionalData.addressObj,
        locationID: value,
      };

      setEditedItem((prevItem) => ({
        ...prevItem,
        toLoc: label,
        endLocationObj: endLocationObj,
      }));
    };

    const handleLocationChange = ({ value, label, additionalData }) => {
      const itemLocationObj = {
        ...additionalData.addressObj,
        locationID: value,
      };

      setEditedItem((prevItem) => ({
        ...prevItem,
        itemLocation: label,
        itemLocationObj: itemLocationObj,
      }));
    };

    const handleQuantityChange = (text) => {
      const qtyVal = Number(text);
      let newAmount = 0;

      if (editedItem.itemTypeIsMileage || editedItem.itemTypeIsRate) {
        const rate = editedItem.unitAmt?.amount || 0;
        newAmount = rate * qtyVal;

        setEditedItem((prevItem) => ({
          ...prevItem,
          expenseQuantity: {
            quantity: qtyVal,
            unit: prevItem.expenseQuantity?.unit,
          },
          amtBU: {
            amount: newAmount,
            currency: prevItem.amtBU?.currency || "",
          },
        }));
      } else if (editedItem.itemTypeIsQty) {
        setEditedItem((prevItem) => ({
          ...prevItem,
          expenseQuantity: {
            quantity: qtyVal,
            unit: prevItem.expenseQuantity?.unit,
          },
        }));
      }
    };

    const handleAmountChange = (text) => {
      const amtVal = Number(text);

      setEditedItem((prevItem) => ({
        ...prevItem,
        amtBU: { amount: amtVal, currency: baseCurrency ? baseCurrency : null },
      }));
    };

    const handleAmtCurrencyChange = (value) => {
      setEditedItem((prevItem) => ({
        ...prevItem,
        amtBU: { amount: prevItem.amtBU.amount, currency: value },
      }));
    };

    const handleInvoiceChange = (text) => {
      setEditedItem((prevItem) => ({
        ...prevItem,
        invoiceRef: text,
      }));
    };

    const handleExpenseSupplierChange = ({ value, label }) => {
      setEditedItem((prevItem) => ({
        ...prevItem,
        expenseSupplierId: value,
        expenseSupplierText: label,
      }));
    };

    const handleReimbursableChange = (value) => {
      setEditedItem((prevItem) => ({
        ...prevItem,
        reimbursible: value,
      }));
    };

    const handleReturnTripChange = (value) => {
      const factor = value ? 2 : 0.5; // true: doubles, false: halves

      setEditedItem((prevItem) => ({
        ...prevItem,
        returnTrip: value,
        overrideDist: {
          ...prevItem.overrideDist,
          quantity: prevItem.overrideDist.quantity * factor,
        },
        calcDist: {
          ...prevItem.calcDist,
          quantity: prevItem.calcDist.quantity * factor,
        },
        amtBU: {
          ...prevItem.amtBU,
          amount: prevItem.amtBU.amount * factor,
        },
      }));
    };

    const handleTaxRateChange = (value) => {
      setEditedItem((prevItem) => ({
        ...prevItem,
        userTaxRate: value,
      }));
    };

    const handleTaxCodeChange = ({ value, label, additionalData }) => {
      const extID = additionalData.extID ?? "";
      const isChangeable = additionalData.isChangeable ?? false;

      setEditedItem((prevItem) => ({
        ...prevItem,
        taxCode: extID,
        taxCodeText: label,
        taxIsChangeable: isChangeable,
      }));
    };

    const handleVATIdChange = (text) => {
      setEditedItem((prevItem) => ({
        ...prevItem,
        vatID: text,
      }));
    };

    const calculateOverrideDist = async () => {
      if (
        isParentLocked ||
        !editedItem.itemTypeIsMileage ||
        !editedItem.startLocationObj ||
        !editedItem.endLocationObj
      ) {
        return;
      }

      const startGeo = editedItem.startLocationObj.geoLoc;
      const endGeo = editedItem.endLocationObj.geoLoc;

      try {
        const response = await callDistanceCalAPI(
          startGeo[1],
          startGeo[0],
          endGeo[1],
          endGeo[0]
        );

        let parsedRetVal = null;
        if (response && response.retVal) {
          parsedRetVal = JSON.parse(response.retVal);
        } else {
          console.log("Cannot parse retVal.");
        }

        if (
          parsedRetVal &&
          parsedRetVal.rows &&
          parsedRetVal.rows[0] &&
          parsedRetVal.rows[0].elements &&
          parsedRetVal.rows[0].elements[0] &&
          parsedRetVal.rows[0].elements[0].distance &&
          parsedRetVal.rows[0].elements[0].distance.text &&
          parsedRetVal.rows[0].elements[0].distance.text.length > 0
        ) {
          var distanceText =
            parsedRetVal.rows[0].elements[0].distance.text.split(" ");
          if (distanceText && distanceText[0] && distanceText[0].length > 0) {
            var distance = parseFloat(distanceText[0].replace(",", ""));
            var unit = distanceText[1];
            if (editedItem.calcDist && editedItem.calcDist.unit) {
              unit = editedItem.calcDist.unit;
            }

            if (editedItem.calcDist && editedItem.calcDist.unit == "km") {
              distance = parseFloat(
                ((distance * 1.60934 * 100) / 100).toFixed(2)
              );
            }

            if (editedItem.returnTrip) {
              distance = distance * 2;
            }

            if ((unit = "mi")) {
              unit = "Mile";
            }
            setEditedItem((prevItem) => ({
              ...prevItem,
              calcDist: { quantity: distance, unit: unit },
              overrideDist: { quantity: distance, unit: unit },
              expenseQuantity: { quantity: distance, unit: unit },
            }));

            if (editedItem.unitAmt && editedItem.unitAmt.currency) {
              var oldAmt = 0;
              if (editedItem.amtBU) {
                oldAmt = editedItem.amtBU.amount;
              }
              var calculatedAmt = editedItem.unitAmt.amount * distance;
              calculatedAmt = parseFloat(calculatedAmt.toFixed(2));

              setEditedItem((prevItem) => ({
                ...prevItem,
                amtBU: {
                  amount: calculatedAmt,
                  currency: editedItem.unitAmt.currency,
                },
              }));
            }
          }
        }
      } catch (error) {
        console.error("Error in calculateOverrideDist:", error);
      }
    };

    const setItemRate = (item) => {
      const { amount = 0, currency = "USD" } = item.unitAmt || {};
      setItemRateAmount(amount.toString());
      setItemRateCurrency(currency);
    };

    const setItemQty = (item) => {
      const { quantity = 0, unit = "ea" } = item.expenseQuantity || {};
      setItemQtyValue(quantity.toString());
      setItemQtyUnit(unit);
      setItemQtyUnitName(isEqual(unit, "ea") ? "Each" : unit);
    };

    const setItemAmount = (item) => {
      const { amount = 0, currency = "USD" } = item.amtBU || {};
      setItemAmountValue(amount.toString());
      setItemAmountCurrency(currency);
    };

    const setItemSplitTotalAmount = (item) => {
      const { amount = 0, currency = "USD" } = item.totalAcrossSplits || {};
      setItemSplitTotalAmountValue(amount.toString());
      setItemSplitTotalAmountCurrency(currency);
    };

    const setCalcDistValues = (item) => {
      const { quantity = 0, unit = "Mile" } = item.calcDist || {};
      setCalcDistValue(quantity.toString());
      setCalcDistUnit(unit);
    };

    const setOverrideDistValues = (item) => {
      const { quantity = 0, unit = "Mile" } = item.overrideDist || {};
      setOverrideDistValue(quantity.toString());
      setOverrideDistUnit(unit);
    };

    const setItemTaxAmount = (item) => {
      const { amount = 0, currency = "USD" } = item.taxAmtBU || {};
      setItemTaxAmountValue(amount.toString());
      setItemTaxAmountCurrency(currency);
    };

    const updateAmtReimburse = async () => {
      const newAmtReimburse = await setAmtReimburse(editedItem);
      if (newAmtReimburse) {
        setEditedItem((prevItem) => ({
          ...prevItem,
          amtReimburse: newAmtReimburse,
        }));
      }
    };

    const calculateTaxAmount = async () => {
      try {
        const taxCode = editedItem.taxCode || "";
        let taxData = {};

        if (taxCode) {
          taxData = await fetchExpenseTaxCode(taxCode);
        } else return;

        if (taxData && editedItem?.amtBU && editedItem?.expAmt) {
          const finalTaxRate =
            editedItem.userTaxRate ?? taxData["TaxCode-tax"]?.[0]?.rate ?? 0;
          const inclusive = taxData["TaxCode-tax"]?.[0]?.inclusive || false;

          let expAmt = editedItem.expAmt.amount || 0;
          let amtBU = editedItem.amtBU.amount || 0;
          let currency = editedItem.expAmt.currency;
          let buCurrency = editedItem.amtBU.currency;

          let taxAmt = 0,
            taxBase = 0,
            taxAmtBU = 0,
            taxBaseBU = 0;

          if (finalTaxRate > 0) {
            if (inclusive) {
              taxAmt = roundToTwo(
                (expAmt * (finalTaxRate / 100)) / (1 + finalTaxRate / 100)
              );
              taxBase = roundToTwo(expAmt - taxAmt);
              if (amtBU) {
                taxAmtBU = roundToTwo(
                  (amtBU * (finalTaxRate / 100)) / (1 + finalTaxRate / 100)
                );
                taxBaseBU = roundToTwo(amtBU - taxAmtBU);
              }
            } else {
              taxAmt = roundToTwo((expAmt * finalTaxRate) / 100);
              taxBase = roundToTwo(expAmt);
              if (amtBU) {
                taxAmtBU = roundToTwo((amtBU * finalTaxRate) / 100);
                taxBaseBU = roundToTwo(amtBU);
              }
            }
          } else {
            taxAmt = taxAmtBU = taxBase = taxBaseBU = 0;
          }

          setEditedItem((prevItem) => ({
            ...prevItem,
            taxCodeText: taxData[`TaxCode-text`] || "",
            taxRate: finalTaxRate,
            taxIsChangeable: taxData[`TaxCode-changeable`] || false,
            taxAmt: { amount: taxAmt, currency },
            taxBase: { amount: taxBase, currency },
            taxAmtBU: { amount: taxAmtBU, currency: buCurrency },
            taxBaseBU: { amount: taxBaseBU, currency: buCurrency },
          }));
        } else {
          console.log("Tax data does not exist.");
        }
      } catch (error) {
        console.error("Error in calculateTaxAmount: ", error);
      }
    };

    useEffect(() => {
      if (isParentLocked) return;

      if (editedItem.amtBU && !editedItem.isSplit) {
        setEditedItem((prevItem) => ({
          ...prevItem,
          totalAcrossSplits: editedItem.amtBU,
          expAmt: editedItem.amtBU,
          amountBU: editedItem.amtBU,
          ...(editedItem.itemTypeIsRate || editedItem.itemTypeIsQty
            ? {}
            : { unitAmt: editedItem.amtBU }),
        }));
      }

      if (editedItem.itemTypeIsQty) {
        const inputAmt = editedItem.amtBU?.amount || 0;
        const inputQty = editedItem.expenseQuantity?.quantity || 0;
        const calcRate = inputQty !== 0 ? inputAmt / inputQty : 0;

        setEditedItem((prevItem) => ({
          ...prevItem,
          unitAmt: {
            amount: parseFloat(calcRate.toFixed(2)),
            currency: prevItem.amtBU?.currency || "",
          },
        }));
      }

      const fetchAmtReimburse = async () => {
        await updateAmtReimburse();
      };

      fetchAmtReimburse();

      calculateTaxAmount();
    }, [editedItem.amtBU, editedItem.taxCode, editedItem.expenseQuantity]);

    useEffect(() => {
      calculateOverrideDist();
    }, [editedItem.startLocationObj, editedItem.endLocationObj]);

    useEffect(() => {
      setCalcDistValues(editedItem);
      setOverrideDistValues(editedItem);
      setItemRate(editedItem);
      setItemQty(editedItem);
      setItemAmount(editedItem);
      setItemTaxAmount(editedItem);
      setItemSplitTotalAmount(editedItem);
    }, [editedItem]);

    return (
      <>
        <View style={styles.modalInputContainer}>
          <CustomRemotePicker
            queryParams={{
              queryFields: expenseTypeQueryParams,
              commonQueryParams: commonQueryParams,
            }}
            pickerLabel={t("expense_type")}
            initialAdditionalLabel={editedItem.expenseItemType}
            initialItemLabel={editedItem.expenseItemTypeText}
            initialItemValue={editedItem.expenseItemTypeId}
            labelItemField={"ExpenseType-name"}
            valueItemField={"ExpenseType-id"}
            additionalFields={[
              { extID: "ExpenseType-extID" },
              { itemTypeIsMileage: "ExpenseType-isMileage" },
              { itemTypeIsQty: "ExpenseType-isQtyBased" },
              { itemTypeIsRate: "ExpenseType-isRateBased" },
              { nonReimbursible: "ExpenseType-nonReimbursible" },
              { receiptIsRequired: "ExpenseType-receiptIsRequired" },
              { locationInput: "ExpenseType-locationInput" },
              { bUData: "ExpenseType-bUData" },
            ]}
            searchFields={["ExpenseType-name", "ExpenseType-extID"]}
            multiline={true}
            onValueChange={handleExpenseTypeChange}
            disabled={isParentLocked}
          />
        </View>
        <View style={styles.modalInputContainer}>
          <Text style={styles.modalInputLabel}>{t("description")}</Text>
          <CustomTextInput
            value={descriptionText}
            onChangeText={handleDescriptionChange}
            placeholder={`${t("placeholder_desc")}...`}
            multiline={true}
            editable={!isParentLocked}
          />
        </View>
        <View style={styles.modalInputContainer}>
          <Text style={styles.modalInputLabel}>{t("date")}</Text>
          <CustomDateTimePicker
            placeholder={t("selected")}
            initialValue={formattedDate}
            onFilter={handleDateChange}
            isTimePickerVisible={false}
            isDisabled={isParentLocked}
          />
        </View>
        {editedItem.itemTypeIsMileage && (
          <>
            <View style={styles.modalInputContainer}>
              <CustomRemotePicker
                queryParams={{
                  queryFields: locationQueryParams,
                  commonQueryParams: commonQueryParams,
                }}
                pickerLabel={t("from_loc")}
                initialItemLabel={editedItem.fromLoc}
                labelItemField={"Location-extID"}
                valueItemField={"Location-id"}
                searchFields={["Location-extID"]}
                additionalFields={[{ addressObj: "Location-address" }]}
                multiline={true}
                onValueChange={handleStartLocationChange}
                disabled={isParentLocked}
              />
            </View>
            <View style={styles.modalInputContainer}>
              <CustomRemotePicker
                queryParams={{
                  queryFields: locationQueryParams,
                  commonQueryParams: commonQueryParams,
                }}
                pickerLabel={t("to_loc")}
                initialItemLabel={editedItem.toLoc}
                labelItemField={"Location-extID"}
                valueItemField={"Location-id"}
                searchFields={["Location-extID"]}
                additionalFields={[{ addressObj: "Location-address" }]}
                multiline={true}
                onValueChange={handleEndLocationChange}
                disabled={isParentLocked}
              />
            </View>
            <View style={styles.modalInputContainer}>
              <Text style={[styles.modalInputLabel]}>{t("calc_distance")}</Text>
              <View style={styles.quantityContainer}>
                <CustomTextInput
                  value={calcDistValue}
                  showClearButton={false}
                  keyboardType="numeric"
                  containerStyle={styles.valueInput}
                  editable={false}
                />
                <View style={styles.unitContainer}>
                  <Text numberOfLines={1} ellipsizeMode="tail">
                    {calcDistUnit}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.modalInputContainer}>
              <Text style={[styles.modalInputLabel]}>
                {t("override_distance")}
              </Text>
              <View style={styles.quantityContainer}>
                <CustomTextInput
                  value={overrideDistValue}
                  showClearButton={false}
                  keyboardType="numeric"
                  containerStyle={styles.valueInput}
                  editable={
                    !isParentLocked || (editedItem.overideCalcDistance ?? false)
                  }
                />
                <View style={styles.unitContainer}>
                  <Text numberOfLines={1} ellipsizeMode="tail">
                    {overrideDistUnit}
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}
        {(editedItem.itemTypeIsMileage || editedItem.itemTypeIsRate) && (
          <View style={styles.modalInputContainer}>
            <Text style={[styles.modalInputLabel]}>{t("rate")}</Text>
            <View style={styles.quantityContainer}>
              <View style={styles.unitContainer}>
                <Text numberOfLines={1} ellipsizeMode="tail">
                  {itemRateCurrency}
                </Text>
              </View>
              <CustomTextInput
                value={itemRateAmount}
                showClearButton={false}
                keyboardType="numeric"
                containerStyle={styles.valueInput}
                editable={false}
              />
              <View style={styles.unitContainer}>
                <Text numberOfLines={1} ellipsizeMode="tail">
                  /  {itemQtyUnitName}
                </Text>
              </View>
            </View>
          </View>
        )}
        {(editedItem.itemTypeIsRate || editedItem.itemTypeIsQty) &&
          !editedItem.itemTypeIsMileage && (
            <View style={styles.modalInputContainer}>
              <Text style={[styles.modalInputLabel]}>{t("quantity")}</Text>
              <View style={styles.quantityContainer}>
                <CustomTextInput
                  value={itemQtyValue}
                  onChangeText={handleQuantityChange}
                  showClearButton={false}
                  keyboardType="numeric"
                  containerStyle={styles.valueInput}
                  editable={!isParentLocked}
                />
                <View style={styles.unitContainer}>
                  <Text numberOfLines={1} ellipsizeMode="tail">
                    {itemQtyUnitName}
                  </Text>
                </View>
              </View>
            </View>
          )}
        <View style={styles.modalInputContainer}>
          <Text style={[styles.modalInputLabel]}>
            {editedItem.itemTypeIsMileage ? t("calc_amount") : t("amount")}
          </Text>
          <View style={styles.quantityContainer}>
            <CustomPicker
              items={currencyUnits}
              placeholder=""
              initialValue={
                editedItem.isSplit
                  ? itemSplitTotalAmountCurrency
                  : itemAmountCurrency
              }
              onFilter={handleAmtCurrencyChange}
              hideSearchInput={true}
              containerStyle={styles.unitPickerContainer}
              disabled={
                isParentLocked ||
                editedItem.itemTypeIsMileage ||
                editedItem.itemTypeIsRate
              }
            />
            <CustomTextInput
              value={
                editedItem.isSplit ? itemSplitTotalAmountValue : itemAmountValue
              }
              onChangeText={handleAmountChange}
              showClearButton={false}
              keyboardType="numeric"
              containerStyle={styles.valueInput}
              editable={
                isParentLocked ||
                editedItem.itemTypeIsMileage ||
                editedItem.itemTypeIsRate
                  ? false
                  : true
              }
            />
          </View>
        </View>
        {!editedItem.itemTypeIsRate && (
          <View style={styles.modalInputContainer}>
            <Text style={styles.modalInputLabel}>{t("ref_invoice")}</Text>
            <CustomTextInput
              value={editedItem.invoiceRef}
              onChangeText={handleInvoiceChange}
              placeholder={""}
              multiline={true}
              editable={!isParentLocked}
            />
          </View>
        )}
        {!editedItem.itemTypeIsMileage && (
          <View style={styles.modalInputContainer}>
            <CustomRemotePicker
              queryParams={{
                queryFields: locationQueryParams,
                commonQueryParams: commonQueryParams,
              }}
              pickerLabel={t("location")}
              initialItemLabel={editedItem.itemLocation}
              labelItemField={"Location-extID"}
              valueItemField={"Location-id"}
              searchFields={["Location-extID"]}
              additionalFields={[{ addressObj: "Location-address" }]}
              multiline={true}
              onValueChange={handleLocationChange}
              disabled={isParentLocked}
            />
          </View>
        )}
        {(!editedItem.itemTypeIsRate || !editedItem.itemTypeIsMileage) && (
          <View style={styles.modalInputContainer}>
            <CustomRemotePicker
              queryParams={{
                queryFields: expenseSupplierQueryParams,
                commonQueryParams: commonQueryParams,
              }}
              pickerLabel={t("expense_supplier")}
              initialItemLabel={editedItem.expenseSupplierText}
              labelItemField={"ExpenseSupplier-extID"}
              valueItemField={"ExpenseSupplier-id"}
              searchFields={["ExpenseSupplier-extID"]}
              multiline={true}
              onValueChange={handleExpenseSupplierChange}
              disabled={isParentLocked}
            />
          </View>
        )}
        <View style={styles.rowContainer}>
          <View style={styles.modalInputContainer}>
            <Text style={styles.modalInputLabel}>{t("reimbursable")}</Text>
            <Switch
              trackColor={{ false: "#d3d3d3", true: "#81b0ff" }}
              thumbColor={editedItem.reimbursible ? "#b0b0b0" : "#d3d3d3"}
              ios_backgroundColor="#d3d3d3"
              value={editedItem.reimbursible}
              onValueChange={handleReimbursableChange}
              editable={!isParentLocked || editedItem.nonReimbursible}
              disabled={defaultAsHomeDefault === "*"}
            />
          </View>
          {editedItem.itemTypeIsMileage && (
            <View style={styles.modalInputContainer}>
              <Text style={styles.modalInputLabel}>{t("return_trip")}</Text>
              <Switch
                trackColor={{ false: "#d3d3d3", true: "#81b0ff" }}
                thumbColor={editedItem.returnTrip ? "#b0b0b0" : "#d3d3d3"}
                ios_backgroundColor="#d3d3d3"
                value={editedItem.returnTrip}
                onValueChange={handleReturnTripChange}
                disabled={isParentLocked || defaultAsHomeDefault === "*"}
              />
            </View>
          )}
        </View>
        {!hideTaxFields && (
          <>
            <View style={styles.modalInputContainer}>
              <CustomRemotePicker
                queryParams={{
                  queryFields: taxCodeQueryParams,
                  commonQueryParams: commonQueryParams,
                }}
                pickerLabel={t("tax_code")}
                initialAdditionalLabel={editedItem.taxCode}
                initialItemLabel={editedItem.taxCodeText}
                labelItemField={"TaxCode-text"}
                valueItemField={"TaxCode-id"}
                additionalFields={[
                  { extID: "TaxCode-extID" },
                  { isChangeable: "TaxCode-changeable" },
                ]}
                searchFields={["TaxCode-text", "TaxCode-extID"]}
                multiline={true}
                onValueChange={handleTaxCodeChange}
                disabled={isParentLocked}
              />
            </View>
            <View style={styles.modalInputContainer}>
              <Text style={[styles.modalInputLabel]}>{t("tax_amount")}</Text>
              <View style={styles.quantityContainer}>
                <View style={styles.unitContainer}>
                  <Text numberOfLines={1} ellipsizeMode="tail">
                    {itemTaxAmountCurrency}
                  </Text>
                </View>
                <CustomTextInput
                  value={itemTaxAmountValue}
                  showClearButton={false}
                  keyboardType="numeric"
                  containerStyle={styles.valueInput}
                  editable={!isParentLocked || editedItem.taxIsChangeable}
                />
              </View>
            </View>
            <View style={styles.modalInputContainer}>
              <Text style={[styles.modalInputLabel]}>{t("tax_rate")}</Text>
              <View style={styles.quantityContainer}>
                <CustomTextInput
                  value={editedItem.taxRate?.toString()}
                  onChangeText={handleTaxRateChange}
                  showClearButton={false}
                  keyboardType="numeric"
                  containerStyle={styles.valueInput}
                  editable={!isParentLocked || editedItem.taxIsChangeable}
                />
              </View>
            </View>
            <View style={styles.modalInputContainer}>
              <Text style={styles.modalInputLabel}>{t("tax_identifier")}</Text>
              <CustomTextInput
                value={editedItem.vatID}
                onChangeText={handleVATIdChange}
                placeholder={""}
                multiline={true}
                editable={!isParentLocked}
              />
            </View>
          </>
        )}
      </>
    );
  }
);

const styles = StyleSheet.create({
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
    marginBottom: "2%",
    width: "80%",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    width: "80%",
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
});

export default ExpenseItemDetails;
