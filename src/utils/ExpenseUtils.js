import { API_ENDPOINTS, APP, INTSTATUS, TEST_MODE } from "../constants";
import { fetchBusObjCatData, fetchData } from "./APIUtils";
import { changeDateToAPIFormat } from "./FormatUtils";
import { showToast } from "./MessageUtils";

/**
 * API for calculating distance.
 * @param from_Lat - The latitude of from_location.
 * @param from_Long - The longitude of from_location.
 * @param to_lat - The latitude of to_location.
 * @param to_long - The longitude of to_location.
 * @returns {Promise<Object>} - The response object containing the result.
 */
const callDistanceCalAPI = async (from_Lat, from_Long, to_lat, to_long) => {
  try {
    const requestBody = {
      interfaceName: "GeoCordinatesDistanceApi",
      methodName: "getDistance",
      paramsMap: {
        from_Lat,
        from_Long,
        to_lat,
        to_long,
      },
    };

    const response = await fetchData(
      API_ENDPOINTS.INVOKE,
      "POST",
      {
        "Content-Type": "application/json",
      },
      JSON.stringify(requestBody)
    );

    if (response) {
      return response;
    }
  } catch (error) {
    console.error("Error calling GeoCordinatesDistanceApi:", error);
    throw error;
  }
};

/**
 * API for converting currency.
 * @param amount - The amount to be converted.
 * @param sourceCurrency - The original currency of the amount.
 * @param targetCurrency - The currency which the amount is to be converted to.
 * @param date - The expense incurred on date.
 * @param busUnitID - The company id.
 * @param exchangeRateType - The exchangeRateType.
 * @returns {Promise<Object>} - The response object containing the result.
 */
const callExchangeRateAPI = async (
  amount,
  sourceCurrency,
  targetCurrency,
  date,
  busUnitID,
  exchangeRateType
) => {
  if (!date) {
    date = new Date();
  }

  try {
    const paramObject = {};

    paramObject.paramsMap = {};
    paramObject.paramsMap.amount = amount;
    paramObject.paramsMap.sourceCurrency = sourceCurrency;
    paramObject.paramsMap.exchangeRateType = exchangeRateType
      ? exchangeRateType
      : "";
    paramObject.paramsMap.targetCurrency = targetCurrency;
    paramObject.paramsMap.busUnitID = busUnitID ? busUnitID : "";
    (paramObject.paramsMap.date = changeDateToAPIFormat(date)),
      (paramObject.paramsMap.userParam = {});
    paramObject.paramsMap.userParam.client = parseInt(APP.LOGIN_USER_CLIENT);
    paramObject.paramsMap.userParam.userID = APP.LOGIN_USER_ID;
    paramObject.paramsMap.userParam.language = APP.LOGIN_USER_LANGUAGE;

    const requestBody = {
      interfaceName: "CurrencyConvertApi",
      methodName: "getCurrencyConverted",
      paramsMap: paramObject.paramsMap,
    };

    const response = await fetchData(
      API_ENDPOINTS.INVOKE,
      "POST",
      {
        "Content-Type": "application/json",
      },
      JSON.stringify(requestBody)
    );

    if (response) {
      return response;
    }
  } catch (error) {
    console.error("Error calling CurrencyConvertApi:", error);
    throw error;
  }
};

/**
 * Function for calculating amtReimburse.
 * @param givenItem - The item whose amtReimburse is to be calculated.
 * @param companyId - The company id.
 * @returns {Object} - The updated amtReimburse object.
 */
const setAmtReimburse = async (givenItem, companyId) => {
  try {
    let newAmtReimburse = { amount: 0, currency: "" };
    const expenseCompanyId = companyId ?? "";

    if (givenItem && givenItem.reimbursible && givenItem.amtBU) {
      if (givenItem.amtReimburse?.currency !== givenItem.amtBU.currency) {
        const response = await callExchangeRateAPI(
          givenItem.amtBU.amount,
          givenItem.amtBU.currency,
          givenItem.amtReimburse.currency,
          null,
          expenseCompanyId,
          null
        );

        let convertedAmt = parseFloat(response.retVal.value);
        convertedAmt = Math.round(convertedAmt * 100) / 100;

        newAmtReimburse = {
          amount: parseFloat(convertedAmt.toFixed(2)),
          currency: givenItem.amtReimburse.currency,
        };
      } else {
        newAmtReimburse = {
          amount: givenItem.amtBU.amount || 0,
          currency: givenItem.amtBU.currency,
        };
      }
      return newAmtReimburse;
    }
    return null;
  } catch (error) {
    console.error("Error in setAmtReimburse: ", error);
  }
};

/**
 * Function for calculating splitAmount.
 * @param itemsMap - The map of items whose splitAmt is to be calculated.
 * @param sortSeq - The sortSeq of the item(s).
 * @returns {map} - The updated itemsMap.
 */
const updateSplitAmounts = async (itemsMap, sortSeq) => {
  // Get all items with the same sortSeq
  const splitItems = [...itemsMap.entries()].filter(
    ([, item]) => item.sortSeq === sortSeq
  );

  if (splitItems.length === 0) return itemsMap; // No items found

  // Get total amount
  const totalAmount = splitItems[0][1]?.totalAcrossSplits?.amount || 0;

  // Initializing an array to store splitPercent values at the correct indices
  let splitPercArray = new Array(splitItems.length).fill(0);
  let providedCount = 0;

  // Store existing splitPercent values
  splitItems.forEach(([key, item], index) => {
    if (item.splitPercent && item.splitPercent > 0) {
      splitPercArray[index] = item.splitPercent;
      providedCount++;
    }
  });

  // Calculate total sum of provided percentages
  const totalProvidedPercent = splitPercArray.reduce((sum, p) => sum + p, 0);

  if (totalProvidedPercent === 0) {
    // If nothing is provided, do an equal split
    let remainingPercent = 100;
    for (let i = 0; i < splitItems.length; i++) {
      if (i === splitItems.length - 1) {
        splitPercArray[i] = remainingPercent; // Ensures total is exactly 100%
      } else {
        splitPercArray[i] = parseFloat((100 / splitItems.length).toFixed(2));
        remainingPercent -= splitPercArray[i];
      }
    }
  } else {
    // Calculate the remaining percentage
    let remainingPercent = 100 - totalProvidedPercent;
    let emptySlots = splitPercArray.filter((p) => p === 0).length;

    if (emptySlots > 0) {
      for (let i = 0; i < splitPercArray.length; i++) {
        if (splitPercArray[i] === 0) {
          if (emptySlots === 1) {
            splitPercArray[i] = remainingPercent;
          } else {
            let equalSplit = parseFloat(
              (remainingPercent / emptySlots).toFixed(2)
            );
            splitPercArray[i] = equalSplit;
            remainingPercent -= equalSplit;
          }
          emptySlots--;
        }
      }
    }
  }

  // Now updating items with the calculated amounts
  let assignedAmount = 0;

  await Promise.all(
    splitItems.map(async ([key, item], index) => {
      if (index === splitItems.length - 1) {
        // Last item gets the remaining amount
        let remainingAmount = parseFloat(
          (totalAmount - assignedAmount).toFixed(2)
        );
        const amountFields = [
          "splitAmt",
          "expAmt",
          "amtBU",
          "unitAmt",
          "amountBU",
        ];
        amountFields.forEach((field) => {
          if (item.itemTypeIsRate && field === "unitAmt") return;
          item[field] = {
            amount: remainingAmount,
            currency: item.totalAcrossSplits?.currency || "USD",
          };
        });
      } else {
        let calcAmount = parseFloat(
          ((totalAmount * splitPercArray[index]) / 100).toFixed(2)
        );
        assignedAmount += calcAmount;

        const amountFields = [
          "splitAmt",
          "expAmt",
          "amtBU",
          "unitAmt",
          "amountBU",
        ];
        amountFields.forEach((field) => {
          if (item.itemTypeIsRate && field === "unitAmt") return;
          item[field] = {
            amount: calcAmount,
            currency: item.totalAcrossSplits?.currency || "USD",
          };
        });
      }

      item.splitPercent = splitPercArray[index];
      item.isSplit = true;

      const reimburseAmt = await setAmtReimburse(item);
      if (reimburseAmt) {
        item.amtReimburse = reimburseAmt;
      } // Also update amtReimburse

      itemsMap.set(key, item); // Update itemsMap
    })
  );

  return itemsMap;
};

const loadTaxCodeStore = async (taxTypes, busUnitID, vatRegistered) => {
  if (taxTypes && taxTypes.length > 0) {
    let valueAddedTaxTypes = [];
    let taxTypesStore = await fetchTaxTypes();
    valueAddedTaxTypes = taxTypesStore
      .filter(
        (tax) => tax.extID && tax.valueAdded && taxTypes.includes(tax.extID) // Ensures tax is in finalTaxTypes
      )
      .map((tax) => tax.extID);

    if (valueAddedTaxTypes.length === 0) {
      valueAddedTaxTypes.push("VAT");
    }
  }
};

const fetchTaxTypes = async () => {
  try {
    const queryFields = {
      fields: ["TaxType-id", "TaxType-extID", "TaxType-valueAdded"],
    };

    const whereConditions = [];
    const orConditions = [];
    const sortConditions = [];

    const response = await fetchBusObjCatData(
      "TaxType",
      null,
      null,
      queryFields,
      whereConditions,
      orConditions,
      sortConditions
    );

    if (!response.error && response.data) {
      const data = response.data;

      return data;
    } else {
      console.error("Error fetching tax types data:", response.error);
    }
  } catch (error) {
    console.error("Error fetching tax types data:", error);
  }
};

const fetchCurrency = async () => {
  try {
    const queryFields = {
      fields: ["Currency-id", "Currency-extID", "Currency-symbol"],
    };

    const whereConditions = [];
    const orConditions = [];
    const sortConditions = [];

    sortConditions.push({ property: "Currency-extID", direction: "ASC" });

    const response = await fetchBusObjCatData(
      "Currency",
      null,
      null,
      queryFields,
      whereConditions,
      orConditions,
      sortConditions
    );

    if (!response.error && response.data) {
      const data = response.data;

      const formattedCurrencies = data.map((currency) => ({
        label: `${
          currency["Currency-symbol"] ? `(${currency["Currency-symbol"]}) ` : ""
        }${currency["Currency-extID"]}`,
        value: currency["Currency-extID"],
      }));

      return formattedCurrencies;
    } else {
      console.error("Error fetching currency data:", response.error);
    }
  } catch (error) {
    console.error("Error fetching currency data:", error);
  }
};

const fetchEmployeeDetails = async (employeeId) => {
  try {
    const queryFields = {
      fields: [`Resource-financeData-reimbursementCurrency`],
      where: [
        {
          fieldName: "Resource-id",
          operator: "=",
          value: employeeId,
        },
      ],
    };

    const commonQueryParams = {
      testMode: TEST_MODE,
      client: parseInt(APP.LOGIN_USER_CLIENT),
      user: APP.LOGIN_USER_ID,
      userID: APP.LOGIN_USER_ID,
      language: APP.LOGIN_USER_LANGUAGE,
      intStatus: JSON.stringify([INTSTATUS.ACTIVE]),
    };

    const formData = {
      query: JSON.stringify(queryFields),
      ...commonQueryParams,
    };

    const response = await fetchData(
      API_ENDPOINTS.QUERY,
      "POST",
      {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      new URLSearchParams(formData).toString()
    );

    if (
      response.success === true &&
      Array.isArray(response.data) &&
      response.data.length > 0
    ) {
      if (response.data) {
        const data = response.data[0];
        return data;
      }
    } else {
      console.error("Unexpected response format or empty data array.");
      showToast(t("error_fetching_data"), "error");
    }
  } catch (error) {
    console.error("Error in fetchEmployeeDetails:", error);
  }
};

const fetchExpenseTaxCode = async (taxCode) => {
  try {
    const queryFields = {
      fields: [
        `TaxCode-tax`,
        `TaxCode-text`,
        `TaxCode-changeable`,
        `TaxCode-extID`,
      ],
      where: [
        {
          fieldName: "TaxCode-extID",
          operator: "=",
          value: taxCode,
        },
      ],
    };

    const commonQueryParams = {
      testMode: TEST_MODE,
      client: parseInt(APP.LOGIN_USER_CLIENT),
      user: APP.LOGIN_USER_ID,
      userID: APP.LOGIN_USER_ID,
      language: APP.LOGIN_USER_LANGUAGE,
      intStatus: JSON.stringify([INTSTATUS.ACTIVE]),
    };

    const formData = {
      query: JSON.stringify(queryFields),
      ...commonQueryParams,
    };

    const response = await fetchData(
      API_ENDPOINTS.QUERY,
      "POST",
      {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      new URLSearchParams(formData).toString()
    );

    if (
      response.success === true &&
      Array.isArray(response.data) &&
      response.data.length > 0
    ) {
      const data = response.data[0];

      if (data) {
        return data;
      }
    } else {
      console.error("Unexpected response format or empty data array.");
      showToast(t("error_fetching_data"), "error");
    }
  } catch (error) {
    console.error("Error in fetchExpenseTaxCode:", error);
  }
};

export {
  callDistanceCalAPI,
  fetchCurrency,
  fetchEmployeeDetails,
  callExchangeRateAPI,
  setAmtReimburse,
  updateSplitAmounts,
  fetchExpenseTaxCode,
};
