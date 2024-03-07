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
import { fetchBusObjCatData, loadMoreData } from "../utils/APIUtils";
import {
  convertMillisecondsToUnit,
  convertToDateFNSFormat,
  timeUnitLabels,
} from "../utils/FormatUtils";
import { convertToFilterScreenFormat, filtersMap } from "../utils/FilterUtils";

/**
 * Timesheet component displays a list of timesheets with the ability to refresh
 * and load more data using pagination.
 *
 * @param {Object} route - The route object provided by React Navigation.
 * @param {Object} navigation - The navigation object provided by React Navigation.
 * @returns {JSX.Element} - Rendered component.
 */
const Timesheet = ({ route, navigation }) => {
  // State variables
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [timesheets, setTimesheets] = useState([]);
  const [expandedItems, setExpandedItems] = useState({});
  const [additionalData, setAdditionalData] = useState({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [whereConditions, setWhereConditions] = useState([]);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [appliedFiltersCount, setAppliedFiltersCount] = useState(0);

  /**
   * Toggle the expansion state of an item and fetch additional data if expanding.
   *
   * This function toggles the expansion state of an item identified by its unique itemId.
   * If the item is being expanded (i.e., it was previously collapsed), this function
   * fetches additional data related to the item asynchronously.
   *
   * @param {string} itemId - The unique identifier of the item.
   * @returns {void}
   */
  const toggleItemExpansion = async (itemId) => {
    setExpandedItems((prevExpandedItems) => {
      // Toggle the item expansion state
      const newExpandedItems = {
        ...prevExpandedItems,
        [itemId]: !prevExpandedItems[itemId],
      };

      // Fetch additional data when expanding
      if (!prevExpandedItems[itemId]) {
        // Move the try-catch block inside the async callback function
        (async () => {
          try {
            // Call the function to fetch additional data
            const response = await fetchAdditionalData(itemId);

            // Update additional data state if the fetch is successful
            if (!response.error) {
              setAdditionalData((prevData) => ({
                ...prevData,
                [itemId]: response.data,
              }));
            } else {
              console.error("Error fetching additional data:", response.error);
            }
          } catch (error) {
            console.error("Error fetching additional data:", error);
          }
        })();
      }

      return newExpandedItems;
    });
  };

  const fetchAdditionalData = async (itemId) => {
    // Implement the logic to fetch additional data based on itemId
    // For example: const response = await api.fetchAdditionalData(itemId);
    // Return the response object with data and error properties
    // Replace this with your actual implementation
    return { data: { XYZ: "ABC" }, error: null };
  };

  /*
   * Function to handle data refreshing.
   */
  const onRefresh = useCallback(async () => {
    console.debug(`Before refreshing ${BUSOBJCAT.TIMESHEET}, the value of `);
    setRefreshing(true);

    try {
      // Fetch timesheet data
      const response = await fetchBusObjCatData(
        BUSOBJCAT.TIMESHEET,
        page,
        limit,
        whereConditions
      );
      if (!response.error) {
        // Update timesheets state with new data
        setTimesheets(response.data);
      } else {
        console.error("Error refreshing data:", response.error);
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [setTimesheets, whereConditions]);

  useEffect(() => {
    // Update whereConditions when route params change
    setWhereConditions(route?.params?.whereConditions ?? []);
  }, [route?.params?.whereConditions]);

  useEffect(() => {
    // Update applied filters when route params change
    const newAppliedFilters = route?.params?.convertedAppliedFilters ?? {};
    setAppliedFilters(newAppliedFilters);
    // Update applied filters count when route params change
    setAppliedFiltersCount(Object.keys(newAppliedFilters).length);
  }, [route?.params?.convertedAppliedFilters]);

  useEffect(() => {
    setPage(1);
    // Trigger refresh when the component mounts
    onRefresh();
  }, [whereConditions]);

  /**
   * Function to handle loading more data.
   */
  const handleLoadMoreData = useCallback(() => {
    if (!error && !isLoadingMore) {
      // Set the flag to indicate that the load more operation is in progress
      setIsLoadingMore(true);

      // Call utility function to load more data
      loadMoreData(
        BUSOBJCAT.TIMESHEET,
        page + 1, // Increment page for the next set of data
        limit,
        whereConditions,
        setTimesheets,
        setIsLoading,
        setError
      ).finally(() => {
        // Reset the flag when the load more operation is complete (successful or not)
        setIsLoadingMore(false);
        // Update page for the next load
        setPage(page + 1);
      });
    }
  }, [page, limit, setTimesheets, setError, error, isLoadingMore]);

  /**
   * Navigate to the filters screen with initial filter settings.
   *
   * The function prepares initial filter settings based on the applied filters and navigates
   * to the "Filters" screen, passing necessary parameters such as filter options, business object category,
   * and initial filter settings.
   *
   * @returns {void}
   */
  const navigateToFilters = () => {
    const initialFilters = convertToFilterScreenFormat(
      appliedFilters,
      filtersMap[BUSOBJCAT.TIMESHEET],
      BUSOBJCAT.TIMESHEET
    );

    console.debug(
      `Before navigating from ${
        BUSOBJCAT.TIMESHEET
      } screen to filters screen, the list of applied filters is ${JSON.stringify(
        appliedFilters
      )} and corresponding list of where conditions is ${JSON.stringify(
        whereConditions
      )}. Also, the list of initial filters (or formatted filters) is ${JSON.stringify(
        initialFilters
      )}`
    );

    navigation.navigate("Filters", {
      busObjCatFilters: filtersMap[BUSOBJCAT.TIMESHEET],
      busObjCat: BUSOBJCAT.TIMESHEET,
      initialFilters: initialFilters,
    });
  };

  /**
   * Rendered component for the left side of the header.
   *
   * This component displays the count of timesheets on the left side of the header.
   * If there are timesheets available, it shows the count; otherwise, it displays "No records".
   *
   * @returns {JSX.Element} - Rendered component for the left side of the header.
   */
  const headerLeft = () => {
    let timesheetCount = timesheets.length;
    return (
      <View>
        <Text style={styles.recordCountText}>
          {`Timesheet${timesheetCount !== 1 ? "s" : ""}: ${
            timesheetCount > 0 ? timesheetCount : "No records"
          }`}
        </Text>
      </View>
    );
  };

  /**
   * Rendered component for the right side of the header.
   *
   * This component displays a filter icon on the right side of the header,
   * allowing users to navigate to the filters screen.
   * If there are applied filters, it also shows the count of applied filters.
   *
   * @returns {JSX.Element} - Rendered component for the right side of the header.
   */
  const headerRight = () => {
    return (
      <View style={styles.filterIconContainer}>
        <TouchableOpacity onPress={navigateToFilters}>
          <Ionicons name="filter" size={30} color="white" />
        </TouchableOpacity>
        {appliedFiltersCount > 0 && (
          <View style={styles.filterCountContainer}>
            <Text style={styles.filterCountText}>{appliedFiltersCount}</Text>
          </View>
        )}
      </View>
    );
  };

  // Set header options with custom components
  useEffect(() => {
    navigation.setOptions({
      headerTitle: headerLeft,
      headerRight: headerRight,
    });
  }, [timesheets]);

  return (
    <View style={styles.container}>
      <FlatList
        data={timesheets}
        keyExtractor={(item) => item["TimeConfirmation-id"]}
        // Render each timesheet item
        renderItem={({ item, index }) => {
          try {
            // Extracting and formatting data for each timesheet item
            const timesheetId = item?.["TimeConfirmation-id"];

            const startDate = new Date(item["TimeConfirmation-start"]);
            const formattedStartDate = isValid(startDate)
              ? format(
                  startDate,
                  convertToDateFNSFormat(APP.LOGIN_USER_DATE_FORMAT)
                )
              : "Invalid start date";

            const endDate = new Date(item["TimeConfirmation-end"]);
            const formattedEndDate = isValid(endDate)
              ? format(
                  endDate,
                  convertToDateFNSFormat(APP.LOGIN_USER_DATE_FORMAT)
                )
              : "Invalid end date";

            const statusLabel =
              item?.[
                "TimeConfirmation-extStatus-statusID:ProcessTemplate-steps-statusLabel"
              ] || "Invalid status";

            let remark = item?.["TimeConfirmation-remark:text"] || "";

            const totalTime = item?.["TimeConfirmation-totalTime"] || 0;
            const convertedTime =
              convertMillisecondsToUnit(
                totalTime,
                totalTime >= 3600000 ? "hours" : "minutes"
              )?.displayTime || "";

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
                  <Text
                    style={styles.secondColumnSecondRowText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {remark}
                  </Text>
                  {item && (
                    <TouchableOpacity
                      onPress={() => toggleItemExpansion(timesheetId)}
                    >
                      <Text style={styles.showMoreButtonText}>
                        {expandedItems[timesheetId] ? "Show Less" : "Show More"}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {expandedItems[timesheetId] && (
                    <>
                      {additionalData[timesheetId] ? (
                        <>
                          {/* Render additional data components here */}
                          <Text>{additionalData[timesheetId]["XYZ"]}</Text>
                        </>
                      ) : (
                        // Loading indicator while fetching additional data
                        <ActivityIndicator size="small" color="#0000ff" />
                      )}
                    </>
                  )}
                </View>
                <View style={styles.thirdColumn}>
                  <Text
                    style={[
                      styles.thirdColumnText,
                      {
                        color: totalTime === 0 ? "red" : "green",
                      },
                    ]}
                  >
                    {convertedTime}
                  </Text>
                </View>
              </View>
            );
          } catch (error) {
            console.error("Error rendering item:", error);
            return (
              <Text style={{ color: "red" }}>
                {item?.["TimeConfirmation-id"]}
              </Text>
            );
          }
        }}
        //onEndReached={handleLoadMoreData}
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
  showMoreButtonText: {
    color: "blue",
  },
  filterIconContainer: {
    position: "relative",
  },
  filterCountContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#ffd33d",
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    pointerEvents: "none",
  },
  filterCountText: {
    color: "black",
    fontSize: 12,
    fontWeight: "bold",
  },
});

export default Timesheet;
