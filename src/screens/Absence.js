import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { format, isValid } from "date-fns";

import { Ionicons } from "@expo/vector-icons";

import { APP, BUSOBJCAT, PAGE_SIZE } from "../constants";

import {
  convertToDateFNSFormat,
  formatLeaveDuration,
} from "../utils/FormatUtils";
import { fetchBusObjCatData, loadMoreData } from "../utils/APIUtils";

/**
 * Absence component displays a list of absences with the ability to refresh
 * and load more data using pagination.
 *
 * @param {Object} route - The route object provided by React Navigation.
 * @param {Object} navigation - The navigation object provided by React Navigation.
 * @returns {JSX.Element} - Rendered component.
 */

const Absence = ({ navigation }) => {
  // State variables
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [absences, setAbsences] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(PAGE_SIZE);

  /**
   * Function to handle data refreshing.
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      // Fetch absence data
      const response = await fetchBusObjCatData(BUSOBJCAT.ABSENCE, page, limit);
      if (!response.error) {
        // Update absence state with new data
        setAbsences(response.data);
      } else {
        console.error("Error refreshing data:", response.error);
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [setAbsences]);

  /**
   * Function to handle loading more data.
   */
  const handleLoadMoreData = useCallback(() => {
    if (!error && !isLoadingMore) {
      // Set the flag to indicate that the load more operation is in progress
      setIsLoadingMore(true);

      // Call utility function to load more data
      loadMoreData(
        BUSOBJCAT.ABSENCE,
        page + 1, // Increment page for the next set of data
        limit,
        setAbsences,
        setIsLoading,
        setError
      ).finally(() => {
        // Reset the flag when the load more operation is complete (successful or not)
        setIsLoadingMore(false);
      });
      setPage(page + 1); // Update page for the next load
    }
  }, [page, limit, setAbsences, setError, error, isLoadingMore]);

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
    let recordCount = absences.length;
    return (
      <View>
        <Text style={styles.recordCountText}>
          {`Absence${recordCount > 0 ? "s" : ""}: ${
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
  }, [absences]);

  return (
    <View style={styles.container}>
      <FlatList
        data={absences}
        keyExtractor={(item) => item["Absence-id"]}
        // Render each absence item
        renderItem={({ item }) => {
          try {
            // Extracting and formatting data for each absence item
            const startDate = new Date(item["Absence-start"]);
            const formattedStartDate = isValid(startDate)
              ? format(
                  startDate,
                  convertToDateFNSFormat(APP.LOGIN_USER_DATE_FORMAT)
                )
              : "Invalid start date";

            const endDate = new Date(item["Absence-end"]);
            const formattedEndDate = isValid(endDate)
              ? format(
                  endDate,
                  convertToDateFNSFormat(APP.LOGIN_USER_DATE_FORMAT)
                )
              : "Invalid end date";

            const statusLabel =
              item?.[
                "Absence-extStatus-statusID:ProcessTemplate-steps-statusLabel"
              ] || "Invalid status";

            const absenceType = item?.["Absence-type:AbsenceType-name"] || "";
            const remark = item?.["Absence-remark:text"] || "";

            const plannedDays = item["Absence-plannedDays"];
            const adjustAbsence = item["Absence-adjustAbsence"];
            const leaveDuration = formatLeaveDuration(
              plannedDays,
              item["Absence-type:AbsenceType-hourlyLeave"],
              item["Absence-type:AbsenceType-displayInHours"],
              adjustAbsence
            );

            const itemStyle = {
              backgroundColor:
                formattedStartDate.includes("Invalid") ||
                formattedEndDate.includes("Invalid") ||
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
                    {formattedStartDate}
                    {" - "}
                    {formattedEndDate}
                  </Text>
                  <Text style={styles.secondColumnSecondRowText}>
                    {absenceType}
                  </Text>
                  {remark && (
                    <Text
                      style={styles.secondColumnThirdRowText}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {remark}
                    </Text>
                  )}
                </View>
                <View style={styles.thirdColumn}>
                  <Text
                    style={[
                      styles.thirdColumnText,
                      {
                        color: adjustAbsence ? "darkorange" : "green",
                      },
                    ]}
                  >
                    {leaveDuration}
                  </Text>
                </View>
              </View>
            );
          } catch (error) {
            console.error("Error rendering item:", error);
            return <Text style={{ color: "red" }}>{item?.["Absence-id"]}</Text>;
          }
        }}
        onEndReached={handleLoadMoreData}
        onEndReachedThreshold={0.1}
        refreshing={isLoading}
        ListFooterComponent={() => {
          return isLoading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : null;
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
    flex: 2,
  },
  firstColumnText: {},
  secondColumn: {
    flex: 4,
    color: "#34495e",
  },
  secondColumnFirstRowText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  secondColumnSecondRowText: {
    paddingRight: 8,
    color: "#6e2c00",
  },
  secondColumnThirdRowText: {},
  thirdColumn: {
    flex: 1,
    alignItems: "flex-end",
  },
  thirdColumnText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Absence;
