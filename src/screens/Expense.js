import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { format, isValid } from "date-fns";

import { Ionicons } from "@expo/vector-icons";

import { fetchBusObjCatData, loadMoreData } from "../utils/APIUtils";
import {
  convertAmountToDisplayFormat,
  convertToDateFNSFormat,
} from "../utils/FormatUtils";

import { APP, BUSOBJCAT, PAGE_SIZE } from "../constants";

import Loader from "../components/Loader";

/**
 * Expense component displays a list of expenses with the ability to refresh
 * and load more data using pagination.
 *
 * @param {Object} route - The route object provided by React Navigation.
 * @param {Object} navigation - The navigation object provided by React Navigation.
 * @returns {JSX.Element} - Rendered component.
 */
const Expense = ({ navigation }) => {
  // State variables
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(PAGE_SIZE);

  /**
   * Function to handle data refreshing.
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      // Fetch Expense data
      const response = await fetchBusObjCatData(BUSOBJCAT.EXPENSE, page, limit);
      if (!response.error) {
        // Update expenses state with new data
        setExpenses(response.data);
      } else {
        console.error("Error refreshing data:", response.error);
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [setExpenses]);

  /**
   * Function to handle loading more data.
   */
  const handleLoadMoreData = useCallback(() => {
    if (!error && !isLoadingMore) {
      // Set the flag to indicate that the load more operation is in progress
      setIsLoadingMore(true);

      // Call utility function to load more data
      loadMoreData(
        BUSOBJCAT.EXPENSE,
        page + 1, // Increment page for the next set of data
        limit,
        setExpenses,
        setIsLoading,
        setError
      ).finally(() => {
        // Reset the flag when the load more operation is complete (successful or not)
        setIsLoadingMore(false);
      });
      setPage(page + 1); // Update page for the next load
    }
  }, [page, limit, setExpenses, setError, error, isLoadingMore]);

  useEffect(() => {
    // Trigger refresh when the component mounts
    onRefresh();
  }, []);

  const navigateToFilters = () => {
    navigation.navigate("Filters");
  };

  /**
   * Rendered component for the left side of the header.
   */
  const headerLeft = () => {
    let recordCount = expenses.length;
    return (
      <View>
        <Text style={styles.recordCountText}>
          {`Expense${recordCount > 0 ? "s" : ""}: ${
            recordCount > 0 ? recordCount : "No records"
          }`}
        </Text>
      </View>
    );
  };

  /**
   * Rendered component for the right side of the header.
   */
  const headerRight = () => {
    return (
      <View>
        <TouchableOpacity onPress={navigateToFilters}>
          <Ionicons name="filter" size={30} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  // Set header options with custom components
  useEffect(() => {
    navigation.setOptions({
      headerTitle: headerLeft,
      headerRight: headerRight,
    });
  }, [expenses]);

  return (
    <View style={styles.container}>
      <FlatList
        data={expenses}
        keyExtractor={(item) => item["ExpenseClaim-id"]}
        renderItem={({ item }) => {
          try {
            // Extracting and formatting data for each expense item
            const expenseDate = new Date(item["ExpenseClaim-date"]);
            const formattedExpenseDate = isValid(expenseDate)
              ? format(
                  expenseDate,
                  convertToDateFNSFormat(APP.LOGIN_USER_DATE_FORMAT)
                )
              : "Invalid claim date";

            const statusLabel =
              item?.[
                "ExpenseClaim-extStatus-statusID:ProcessTemplate-steps-statusLabel"
              ] || "Invalid status";

            const remark = item?.["ExpenseClaim-remark:text"] || "";

            const extID = item?.["ExpenseClaim-extID"] || "";

            const amountBUObj = item?.["ExpenseClaim-amountBU"] ?? {
              amount: 0,
              currency: null,
            };
            const convertedAmount =
              convertAmountToDisplayFormat(amountBUObj) || 0;

            const itemStyle = {
              backgroundColor:
                formattedExpenseDate.includes("Invalid") ||
                statusLabel.includes("Invalid")
                  ? "lightcoral"
                  : "white",
            };

            return (
              <View style={[styles.row, itemStyle]}>
                <View style={styles.firstColumn}>
                  <Text
                    style={styles.firstColumnText}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {statusLabel}
                  </Text>
                </View>
                <View style={styles.secondColumn}>
                  <Text style={styles.secondColumnFirstRowText}>
                    {formattedExpenseDate}
                  </Text>
                  <Text style={styles.secondColumnFirstRowText}>{extID}</Text>
                  <Text
                    style={styles.secondColumnSecondRowText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {remark}
                  </Text>
                </View>
                <View style={styles.thirdColumn}>
                  <Text
                    style={[
                      styles.thirdColumnText,
                      {
                        color: amountBUObj.amount === 0 ? "red" : "green",
                      },
                    ]}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {convertedAmount}
                  </Text>
                </View>
              </View>
            );
          } catch (error) {
            console.error("Error rendering item:", error);
            return (
              <Text style={{ color: "red" }}>{item?.["ExpenseClaim-id"]}</Text>
            );
          }
        }}
        onEndReached={handleLoadMoreData}
        onEndReachedThreshold={0.1}
        refreshing={isLoading}
        ListFooterComponent={() => {
          return isLoading ? <Loader /> : null;
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  recordCountText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  container: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#85929e",
    padding: 12,
  },
  firstColumn: {
    flex: 1,
  },
  firstColumnText: {},
  secondColumn: {
    flex: 2,
    color: "#34495e",
  },
  secondColumnFirstRowText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  secondColumnSecondRowText: {
    paddingRight: 8,
  },
  thirdColumn: {
    flex: 1,
    alignItems: "flex-end",
  },
  thirdColumnText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Expense;
