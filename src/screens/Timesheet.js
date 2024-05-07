import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { format, isValid } from "date-fns";

import { APP, BUSOBJCAT, DOUBLE_CLICK_DELTA, PAGE_SIZE } from "../constants";

import { fetchBusObjCatData, loadMoreData } from "../utils/APIUtils";
import { convertToFilterScreenFormat, filtersMap } from "../utils/FilterUtils";
import {
  convertMillisecondsToUnit,
  convertToDateFNSFormat,
} from "../utils/FormatUtils";
import { showToast } from "../utils/MessageUtils";
import { screenDimension } from "../utils/ScreenUtils";

import CustomButton from "../components/CustomButton";
import Loader from "../components/Loader";

import { useTimesheetForceRefresh } from "../../context/ForceRefreshContext";

/**
 * Timesheet component displays a list of timesheets with the ability to refresh
 * and load more data using pagination.
 *
 * @param {Object} route - The route object provided by React Navigation.
 * @param {Object} navigation - The navigation object provided by React Navigation.
 * @returns {JSX.Element} - Rendered component.
 */
const Timesheet = ({ route, navigation }) => {
  // Initialize useTranslation hook
  const { t } = useTranslation();

  // Destructure the forceRefresh variable and updateForceRefresh function from the useTimesheetForceRefresh hook,
  // which is accessing the TimesheetForceRefreshContext.
  const { forceRefresh, updateForceRefresh } = useTimesheetForceRefresh();

  // State variables
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timesheets, setTimesheets] = useState([]);
  const [expandedItems, setExpandedItems] = useState({});
  const [additionalData, setAdditionalData] = useState({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [whereConditions, setWhereConditions] = useState([]);
  const [orConditions, setOrConditions] = useState([]);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [appliedFiltersCount, setAppliedFiltersCount] = useState(0);
  const [lastPress, setLastPress] = useState(0);

  /**
   * Toggle the expansion state of an item and display additional data if available.
   *
   * This function toggles the expansion state of an item identified by its unique itemId.
   * If the item is being expanded (i.e., it was previously collapsed), this function
   * retrieves additional data related to the item from the timesheets data and updates
   * the additional data state accordingly.
   *
   * @param {string} itemId - The unique identifier of the item.
   * @returns {void}
   */
  const toggleItemExpansion = (itemId) => {
    setExpandedItems((prevExpandedItems) => {
      // Toggle the item expansion state
      const newExpandedItems = {
        ...prevExpandedItems,
        [itemId]: !prevExpandedItems[itemId],
      };

      // If expanding, update additional data state
      if (!prevExpandedItems[itemId]) {
        // Retrieve additional data for the item from timesheets
        const item = timesheets.find(
          (item) => item["TimeConfirmation-id"] === itemId
        );

        const totalTime = item?.["TimeConfirmation-totalTime"] || 0;
        const convertedTotalTime =
          convertMillisecondsToUnit(
            totalTime,
            totalTime >= 3600000 ? "hours" : "minutes"
          )?.displayTime || "";

        const billableTime = item?.["TimeConfirmation-billableTime"] || 0;
        const convertedBillableTime =
          convertMillisecondsToUnit(
            billableTime,
            billableTime >= 3600000 ? "hours" : "minutes"
          )?.displayTime || "";

        const absenceTime = item?.["TimeConfirmation-absenceTime"] || 0;
        const convertedAbsenceTime =
          convertMillisecondsToUnit(
            absenceTime,
            absenceTime >= 3600000 ? "hours" : "minutes"
          )?.displayTime || "";

        const overTime = item?.["TimeConfirmation-overTime"] || 0;
        const convertedOverTime =
          convertMillisecondsToUnit(
            overTime,
            overTime >= 3600000 ? "hours" : "minutes"
          )?.displayTime || "";

        // Define the additional data for the item
        const additionalData = {
          totalTime: convertedTotalTime,
          billableTime: convertedBillableTime,
          absenceTime: convertedAbsenceTime,
          overTime: convertedOverTime,
        };
        setAdditionalData((prevData) => ({
          ...prevData,
          [itemId]: additionalData,
        }));
      }

      return newExpandedItems;
    });
  };

  /**
   * Function to handle data refreshing.
   * This function is triggered when the user performs a pull-to-refresh action or when
   * the timesheet screen mounts for the first time. It fetches timesheet data from
   * the first page, resets the current page to 1, and updates the timesheets state
   * with the new data.
   *
   * @async
   * @function onRefresh
   * @returns {Promise<void>} A Promise that resolves when data refreshing is complete.
   */
  const onRefresh = useCallback(async () => {
    // Set refreshing state to true to indicate that data refreshing is in progress
    setRefreshing(true);

    // Reset page to 1 for refreshing
    setPage(1);

    try {
      // Fetch timesheet data for the first page
      const response = await fetchBusObjCatData(
        BUSOBJCAT.TIMESHEET,
        1,
        limit,
        null,
        whereConditions,
        orConditions
      );
      if (response?.error) {
        console.error("Error refreshing data:", response.error);
      } else {
        // Update timesheets state with new data if response is not null
        setTimesheets(response?.data ?? []);
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      // Set refreshing state back to false after data refreshing is complete
      setRefreshing(false);
    }
  }, [setTimesheets, whereConditions, orConditions, limit]);

  useEffect(() => {
    // Update whereConditions when route params change
    setWhereConditions(route?.params?.whereConditions ?? []);
    // Update orConditions when route params change
    setOrConditions(route?.params?.orConditions ?? []);
  }, [route?.params?.whereConditions, route?.params?.orConditions]);

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
  }, [whereConditions, orConditions]);

  /**
   * Effect to ensure that the Timesheet component's data is refreshed whenever changes occur in other parts of the application
   * that affect the timesheet list. These changes may include updates to timesheet details, deletions of timesheets, or any other relevant modifications.
   * This effect resets the page to 1 and triggers a refresh when the 'forceRefresh' state is updated.
   */
  useEffect(() => {
    setPage(1);
    if (forceRefresh) {
      onRefresh();
      updateForceRefresh(false); // Resetting forceRefresh to false after triggering the refresh
    }
  }, [forceRefresh]);

  /**
   * Function to handle loading more data when the end of the list is reached.
   * This function is triggered to load additional data when the end of the list is reached during scrolling.
   * It calls a utility function to fetch more data and updates the list state accordingly.
   * @returns {void}
   */
  const handleLoadMoreData = useCallback(() => {
    // Check if the current data already contains all the items for the current page
    if (timesheets.length < page * limit) {
      showToast(t("no_more_data"));
      return;
    }

    // Proceed to load more data only if there are no errors
    if (!error) {
      // Call utility function to load more data
      loadMoreData(
        BUSOBJCAT.TIMESHEET,
        page + 1, // Increment page for the next set of data
        limit,
        null,
        whereConditions,
        orConditions,
        setTimesheets,
        setIsLoading,
        setError
      ).finally(() => {
        // Update page for the next load
        setPage(page + 1);
      });
    }
  }, [
    page,
    limit,
    setTimesheets,
    timesheets.length,
    setError,
    error,
    whereConditions,
    orConditions,
  ]);

  /**
   * Navigate to the filters screen with initial filter settings.
   */
  const navigateToFilters = () => {
    const initialFilters = convertToFilterScreenFormat(
      appliedFilters,
      filtersMap[BUSOBJCAT.TIMESHEET],
      BUSOBJCAT.TIMESHEET
    );

    navigation.navigate("Filters", {
      busObjCatFilters: filtersMap[BUSOBJCAT.TIMESHEET],
      busObjCat: BUSOBJCAT.TIMESHEET,
      initialFilters: initialFilters,
    });
  };

  /**
   * Navigate to the timesheet creation screen.
   */
  const navigateToTimesheetDetail = () => {
    // Navigate to the new screen
    navigation.navigate("TimesheetDetail");
  };

  /**
   * Rendered component for the left side of the header.
   */
  const headerLeft = () => {
    let timesheetCount = timesheets.length;
    return (
      <View>
        <Text style={styles.recordCountText}>
          {`${t("timesheets")}${timesheetCount !== 1 ? t("s") : ""}: ${
            timesheetCount > 0 ? timesheetCount : t("no_records")
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
      <View style={styles.headerRightContainer}>
        <CustomButton
          onPress={navigateToTimesheetDetail}
          label=""
          icon={{
            name: "add-circle-sharp",
            library: "Ionicons",
            size: 30,
            color: "white",
          }}
        />
        <View style={styles.filterIconContainer}>
          <CustomButton
            onPress={navigateToFilters}
            label=""
            icon={{
              name: "filter",
              library: "FontAwesome",
              size: 30,
              color: "white",
            }}
          />
          {appliedFiltersCount > 0 && (
            <View style={styles.filterCountContainer}>
              <Text style={styles.filterCountText}>{appliedFiltersCount}</Text>
            </View>
          )}
        </View>
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
            const convertedTotalTime =
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

            const handlePress = () => {
              const currentTime = new Date().getTime();
              const delta = currentTime - lastPress;

              if (delta < DOUBLE_CLICK_DELTA) {
                // Double click threshold
                // Double click detected, navigate to add timesheet screen
                navigation.navigate("TimesheetDetail", {
                  timesheetId,
                });
              }

              // Update last press timestamp and timesheet ID pressed
              setLastPress(currentTime);
            };

            return (
              <TouchableOpacity onPress={handlePress}>
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
                      <View style={styles.showMoreButtonContainer}>
                        <TouchableOpacity
                          onPress={() => toggleItemExpansion(timesheetId)}
                        >
                          <Text style={styles.showMoreButtonText}>
                            {expandedItems[timesheetId]
                              ? t("timesheets_show_less")
                              : t("timesheets_show_more")}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    {expandedItems[timesheetId] && (
                      <>
                        {additionalData[timesheetId] ? (
                          <>
                            {/* Render additional data components here */}
                            <View style={styles.additionalDataContainer}>
                              <View style={styles.additionalDataItem}>
                                <View
                                  style={styles.additionalDataLabelContainer}
                                >
                                  <Text style={styles.additionalDataLabel}>
                                    {t("timesheet_total_time")}
                                  </Text>
                                </View>
                                <View
                                  style={styles.additionalDataValueContainer}
                                >
                                  <Text style={styles.additionalDataValue}>
                                    {additionalData[timesheetId]["totalTime"]}
                                  </Text>
                                </View>
                              </View>

                              <View style={styles.additionalDataItem}>
                                <View
                                  style={styles.additionalDataLabelContainer}
                                >
                                  <Text style={styles.additionalDataLabel}>
                                    {t("timesheet_billable_time")}
                                  </Text>
                                </View>
                                <View
                                  style={styles.additionalDataValueContainer}
                                >
                                  <Text style={styles.additionalDataValue}>
                                    {
                                      additionalData[timesheetId][
                                        "billableTime"
                                      ]
                                    }
                                  </Text>
                                </View>
                              </View>

                              <View style={styles.additionalDataItem}>
                                <View
                                  style={styles.additionalDataLabelContainer}
                                >
                                  <Text style={styles.additionalDataLabel}>
                                    {t("timesheet_absence_time")}
                                  </Text>
                                </View>
                                <View
                                  style={styles.additionalDataValueContainer}
                                >
                                  <Text style={styles.additionalDataValue}>
                                    {additionalData[timesheetId]["absenceTime"]}
                                  </Text>
                                </View>
                              </View>

                              <View style={styles.additionalDataItem}>
                                <View
                                  style={styles.additionalDataLabelContainer}
                                >
                                  <Text style={styles.additionalDataLabel}>
                                    {t("timesheet_over_time")}
                                  </Text>
                                </View>
                                <View
                                  style={styles.additionalDataValueContainer}
                                >
                                  <Text style={styles.additionalDataValue}>
                                    {additionalData[timesheetId]["overTime"]}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          </>
                        ) : (
                          // Loading indicator while fetching additional data
                          <Loader size={"small"} />
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
                      {convertedTotalTime}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
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
        onEndReached={handleLoadMoreData}
        onEndReachedThreshold={1}
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
  thirdColumn: {
    flex: 1,
    alignItems: "flex-end",
  },
  thirdColumnText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  showMoreButtonContainer: {
    width: "50%",
  },
  showMoreButtonText: {
    color: "blue",
    fontSize: 16,
  },
  headerRightContainer: {
    width: screenDimension.width / 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
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
  additionalDataContainer: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "2%",
  },
  additionalDataItem: {
    width: "50%",
    height: "50%",
    justifyContent: "center",
    alignItems: "center",
  },
  additionalDataLabelContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  additionalDataValueContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  additionalDataLabel: {
    fontWeight: "bold",
  },
  additionalDataValue: {},
});

export default Timesheet;
