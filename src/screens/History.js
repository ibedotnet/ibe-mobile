import React, { useState, useEffect, useRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useTranslation } from "react-i18next";

import { RichEditor } from "react-native-pell-rich-editor";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import {
  API_ENDPOINTS,
  APP,
  BUSOBJCATMAP,
  INTSTATUS,
  TEST_MODE,
} from "../constants";

import { format } from "date-fns";
import { fetchData } from "../utils/APIUtils";
import {
  convertToDateFNSFormat,
  makeFirstLetterLowercase,
  stripHTMLTags,
} from "../utils/FormatUtils";
import { showToast } from "../utils/MessageUtils";

import CollapsiblePanel from "../components/CollapsiblePanel";
import CustomButton from "../components/CustomButton";
import CustomPicker from "../components/CustomPicker";

import { common, disableOpacity } from "../styles/common";

/**
 * History Component
 *
 * This component displays a timeline of events related to a specific business object.
 * It allows filtering of timeline events based on type and user.
 *
 * @component
 * @param {string} busObjCat - The category of the business object.
 * @param {string} busObjID - The ID of the business object.
 * @returns {JSX.Element} A React component rendering the history timeline.
 */

const History = ({ busObjCat, busObjID }) => {
  const { t } = useTranslation();

  const scrollViewRef = useRef(null); // Ref for ScrollView

  const [timelineData, setTimelineData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [from, setFrom] = useState(0);
  const [timeLineSize, setTimeLineSize] = useState(10);
  const [pageParam, setPageParam] = useState(1);
  const [dateEvent, setDateEvent] = useState("");
  const [typeFilterValue, setTypeFilterValue] = useState("");
  const [userFilterValue, setUserFilterValue] = useState("");
  const [typePickerData, setTypePickerData] = useState([]);
  const [userPickerData, setUserPickerData] = useState([]);
  const [fetchingFilterData, setFetchingFilterData] = useState(true);

  /**
   * Function to get the icon component based on the event type.
   * @param {string} evtType - The event type.
   * @returns {JSX.Element} The icon component.
   */
  const getIconForEventType = (evtType) => {
    switch (evtType) {
      case "comment":
        return <MaterialCommunityIcons name="comment-processing" size={20} />;
      case "file":
        return <MaterialCommunityIcons name="file-sync" size={20} />;
      case "link":
        return <MaterialCommunityIcons name="link" size={20} />;
      case "watch":
        return <MaterialCommunityIcons name="bullseye" size={20} />;
      case "tag":
        return <MaterialCommunityIcons name="tag" size={20} />;
      case "update":
        return <MaterialCommunityIcons name="database-sync" size={20} />;
      case "status":
        return <MaterialCommunityIcons name="state-machine" size={20} />;
      default:
        return <MaterialCommunityIcons name="help-circle" size={20} />; // Default icon
    }
  };

  /**
   * Creates a payload for fetching timeline data from the API.
   * @param {number} nextPageParam - The value to be used for the 'pageParam' parameter in the payload. Defaults to the current 'pageParam'.
   * @returns {Object} The payload object for fetching timeline data.
   */
  const createTimelinePayload = (nextPageParam = pageParam) => ({
    interfaceName: "TimelineApi",
    methodName: "getTimelineData",
    paramsMap: {
      busObjID: busObjID,
      from: from,
      userId: APP.LOGIN_USER_ID,
      languageId: APP.LOGIN_USER_LANGUAGE,
      clientID: parseInt(APP.LOGIN_USER_CLIENT),
      timeLineSize: timeLineSize,
      pageParam: nextPageParam,
      type: typeFilterValue ? typeFilterValue : "",
      dateEvent: dateEvent,
      personEvent: userFilterValue ? userFilterValue : "",
      busObjCat: BUSOBJCATMAP[busObjCat],
    },
  });

  /**
   * Fetches timeline data from the API.
   * Sets the fetched data to the 'timelineData' state.
   * @param {number} [page=pageParam] - The page number to fetch (defaults to pageParam).
   * @returns {void}
   */
  const fetchTimelineData = async (page = pageParam) => {
    if (!busObjID) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const endpoint = API_ENDPOINTS.INVOKE;
      const payload = createTimelinePayload(page); // Pass page to the payload

      const response = await fetchData(
        endpoint,
        "POST",
        { "Content-Type": "application/json" },
        JSON.stringify(payload)
      );

      if (response.success !== true) {
        showToast(t("unexpected_error"), "error");
      } else {
        setTimelineData(response.retVal);
      }
    } catch (error) {
      console.error("Error in fetch timeline data:", error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetches more timeline data from the API for pagination.
   * Appends the fetched data to the existing timeline events.
   * @returns {void}
   */
  const fetchMoreTimelineData = async () => {
    if (!timelineData) {
      setLoading(false);
      return;
    }

    const { timelineEvents } = timelineData;

    // Check if there are no more events to load
    if (
      !timelineEvents ||
      !Array.isArray(timelineEvents) ||
      timelineEvents.length === 0
    ) {
      showToast(t("no_more_data"), "warning");
      return;
    }

    if (!loading && !error) {
      try {
        setLoading(true);

        const nextPageParam = pageParam + 1; // Increment pageParam to fetch next page of data

        const endpoint = API_ENDPOINTS.INVOKE;
        const payload = createTimelinePayload(nextPageParam);

        const response = await fetchData(
          endpoint,
          "POST",
          { "Content-Type": "application/json" },
          JSON.stringify(payload)
        );

        if (
          response.success !== true ||
          !response.retVal ||
          !Array.isArray(response.retVal.timelineEvents)
        ) {
          showToast(t("unexpected_error"), "error");
        } else {
          const newEvents = response.retVal.timelineEvents;

          // Check if new events were returned from the API
          if (newEvents.length === 0) {
            showToast(t("no_more_data"), "warning");
          } else {
            // Use a functional update to preserve previous timeline data and append new events
            setTimelineData((prevData) => {
              const updatedEvents = [
                ...(prevData.timelineEvents || []),
                ...newEvents,
              ];

              return {
                ...prevData,
                timelineEvents: updatedEvents,
              };
            });

            setPageParam(nextPageParam); // Update pageParam
          }
        }
      } catch (error) {
        console.error("Error in fetch more timeline data:", error);
        setError(error);
      } finally {
        setLoading(false);
      }
    }
  };

  /**
   * Renders the timeline events.
   * If timeline data is available, it maps through each event to display them in a ScrollView.
   * Depending on the event type, it renders a RichEditor or a Text component.
   * @returns {JSX.Element|null} JSX elements representing the timeline events, or null if timeline data is not available.
   */
  const renderTimelineEvents = () => {
    // If timeline data is not available, return null
    if (!timelineData) return null;

    const { createdOn, createdBy, timelineEvents } = timelineData;

    // Format created date and time
    const formattedCreatedOn = createdOn
      ? format(
          new Date(createdOn),
          convertToDateFNSFormat(APP.LOGIN_USER_DATE_FORMAT)
        )
      : "";
    const formattedCreatedBy = createdBy ? createdBy : "";
    const numTimelineEvents = timelineEvents.length;

    return (
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollViewContent}
      >
        {/* Display header with creation information */}
        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.header}>
          {t("created_on")} {formattedCreatedOn} {t("by")} {formattedCreatedBy}
          {numTimelineEvents > 0 &&
            ` (${numTimelineEvents} ${t("timeline_events")})`}{" "}
        </Text>
        {/* Map through each timeline event and render */}
        {timelineEvents.map((event, index) => (
          <View
            // By combining with changedOn and changedBy, we ensure that each event has a unique key across all pages.
            key={`${event.changedOn}-${event.changedBy}-${index}`}
            style={styles.cardContainer}
          >
            <View style={styles.cardHeader}>
              {/* Display information about the event */}
              <View style={styles.changedInfo}>
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={styles.changedOn}
                >
                  {t("changed_on")}{" "}
                  {format(
                    new Date(event.changedOn),
                    convertToDateFNSFormat(APP.LOGIN_USER_DATE_FORMAT, true)
                  )}
                </Text>
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={styles.changedBy}
                >
                  {event.changedBy}
                </Text>
              </View>
              {/* Render icon based on event type */}
              {getIconForEventType(event.evtType)}
            </View>
            {/* Display separator */}
            <View style={styles.separator} />
            {/* Render event text or RichEditor */}
            {event.evtType && event.evtType === "comment" ? (
              <RichEditor
                initialContentHTML={stripHTMLTags(
                  event.evtText,
                  "<p>&nbsp;</p>"
                )}
                disabled={true}
              />
            ) : (
              <Text style={styles.evtText}>{event.evtText}</Text>
            )}
          </View>
        ))}
        {timelineEvents.length > 0 && (
          <CustomButton
            // Event handler for button press; triggers fetching more timeline data
            onPress={fetchMoreTimelineData}
            // Label for the button, translated using the 't' function
            label={t("show_more")}
            icon={{}}
            labelStyle={{
              color: loading ? `#b0c4de${disableOpacity}` : "#005eb8",
            }}
            backgroundColor={false}
            // Disables the button if loading is true
            disabled={loading}
          />
        )}
      </ScrollView>
    );
  };

  /**
   * Fetches filter data from the API for type and user pickers.
   * Sets the fetched data to the corresponding state variables.
   * @returns {void}
   */
  const fetchFilterData = async () => {
    try {
      const endpoint = API_ENDPOINTS.QUERY;
      const method = "POST";
      const headers = {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      };
      // Common query parameters for API requests
      const commonQueryParams = {
        testMode: TEST_MODE,
        client: parseInt(APP.LOGIN_USER_CLIENT),
        user: APP.LOGIN_USER_ID,
        userID: APP.LOGIN_USER_ID,
        language: APP.LOGIN_USER_LANGUAGE,
        intStatus: JSON.stringify([INTSTATUS.ACTIVE]),
      };

      // Query for fetching type picker data
      const typeQuery = {
        fields: [
          "Lists-id",
          "Lists-extID",
          "Lists-listEntries",
          "Lists-listName",
        ],
        where: [
          {
            fieldName: "Lists-extID",
            operator: "=",
            value: "TimelineDocEvent",
          },
        ],
      };

      const typeFormData = {
        query: JSON.stringify(typeQuery),
        ...commonQueryParams,
      };

      const encodedTypeFormData = new URLSearchParams(typeFormData);

      // Fetch type picker data
      const typeResponse = await fetchData(
        endpoint,
        method,
        headers,
        encodedTypeFormData.toString()
      );

      if (
        typeResponse?.success === true &&
        typeResponse.data &&
        typeResponse.data instanceof Array &&
        typeResponse.data.length > 0
      ) {
        // Transform list entries into label-value pairs for type picker and sort by label
        const typePickerData = typeResponse.data[0]["Lists-listEntries"]
          .map((entry) => ({
            label: entry.entryName,
            value: entry.entryID,
          }))
          .sort((a, b) => {
            const nameA = a.label.toUpperCase(); // Convert label to uppercase for case-insensitive sorting
            const nameB = b.label.toUpperCase(); // Convert label to uppercase for case-insensitive sorting
            if (nameA < nameB) {
              return -1;
            }
            if (nameA > nameB) {
              return 1;
            }
            // names must be equal
            return 0;
          });

        setTypePickerData(typePickerData);
      }

      // Query for fetching user picker data
      const userQuery = {
        fields: [
          "User-id",
          "User-extID",
          "User-employeeID:Resource-core-name-knownAs",
        ],
      };

      const userFormData = {
        query: JSON.stringify(userQuery),
        ...commonQueryParams,
      };

      const encodedUserFormData = new URLSearchParams(userFormData);

      // Fetch user picker data
      const userResponse = await fetchData(
        endpoint,
        method,
        headers,
        encodedUserFormData.toString()
      );

      if (
        userResponse?.success === true &&
        userResponse.data &&
        userResponse.data instanceof Array &&
        userResponse.data.length > 0
      ) {
        // Extract and sort user picker data
        const userPickerData = userResponse.data
          .reduce((acc, user) => {
            const knownAs = user["User-employeeID:Resource-core-name-knownAs"];
            if (knownAs) {
              acc.push({
                label: knownAs,
                value: user["User-id"],
              });
            }
            return acc;
          }, [])
          .sort((a, b) => a.label.localeCompare(b.label));

        setUserPickerData(userPickerData);

        setFetchingFilterData(false);
      }
    } catch (error) {
      console.error("Error fetching filter data in history component:", error);
    }
  };

  /**
   * Renders the filter components for filtering history events by type and changed by user.
   * It consists of two CustomPicker components: one for selecting event type and the other for selecting the user who made the change.
   * @returns {JSX.Element} JSX elements representing the filter components.
   */
  const historyFilters = (
    <>
      {/* CustomPicker for selecting event type */}
      <CustomPicker
        placeholder={t("select") + " " + makeFirstLetterLowercase(t("type"))}
        items={typePickerData} // Array of items for the picker
        initialValue={typeFilterValue} // Initial selected value
        onFilter={(value) => setTypeFilterValue(value)} // Callback function to handle selection change
        disabled={loading || fetchingFilterData} // Disable the picker if loading or fetching filter data
      />
      {/* CustomPicker for selecting changed by user */}
      <CustomPicker
        placeholder={
          t("select") + " " + makeFirstLetterLowercase(t("changed_by"))
        }
        items={userPickerData} // Array of items for the picker
        initialValue={userFilterValue} // Initial selected value
        onFilter={(value) => setUserFilterValue(value)} // Callback function to handle selection change
        disabled={loading || fetchingFilterData} // Disable the picker if loading or fetching filter data
      />
    </>
  );

  // Dynamically update filter count
  const appliedFiltersCount = [typeFilterValue, userFilterValue].filter(
    Boolean
  ).length;

  useEffect(() => {
    fetchFilterData();
  }, []);

  useEffect(() => {
    // Reset pageParam when filters change
    setPageParam(1);
    fetchTimelineData(1);
  }, [typeFilterValue, userFilterValue]);

  return (
    <View style={styles.container}>
      <CollapsiblePanel
        title={t("filters") + " (" + appliedFiltersCount + ")"}
        children={historyFilters}
        disabled={fetchingFilterData}
      ></CollapsiblePanel>
      {(loading || error) && (
        <View style={styles.loaderErrorContainer}>
          {loading && <Text style={common.loadingText}>{t("loading")}...</Text>}
          {error && <Text>Error: {error.message}</Text>}
        </View>
      )}
      {renderTimelineEvents()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    backgroundColor: "#e5eef7",
  },
  loaderErrorContainer: {
    paddingVertical: "2%",
    alignItems: "center",
  },
  scrollViewContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: "2%",
  },
  header: {
    textAlign: "center",
    marginVertical: "2%",
    color: "#666",
    fontWeight: "bold",
  },
  cardContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 0.5,
    borderRadius: 8,
    padding: "5%",
    marginVertical: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: "4%",
    alignItems: "center",
  },
  changedInfo: {
    flexDirection: "column",
    flex: 4,
  },
  changedOn: {
    fontWeight: "bold",
  },
  changedBy: {
    fontSize: 12,
  },
  separator: {
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
    marginBottom: "4%",
  },
  evtText: {
    fontSize: 16,
  },
});

export default History;
