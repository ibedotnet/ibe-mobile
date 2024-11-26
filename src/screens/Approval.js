import React, { useCallback, useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, Platform } from "react-native";
import {
  GestureHandlerRootView,
  Switch,
  TouchableOpacity,
} from "react-native-gesture-handler";

import { APP, BUSOBJCAT, INTSTATUS } from "../constants";
import { API_ENDPOINTS } from "../constants";
import { fetchData } from "../utils/APIUtils";
import { screenDimension } from "../utils/ScreenUtils";
import { convertToDateFNSFormat } from "../utils/FormatUtils";
import {
  fetchBusObjCatData,
  fetchMessageTypeData,
  getPublishedAge,
  getStartDateForFilter,
  handleStatusChangeMgmt,
  processUpdateFields,
} from "../utils/ApprovalUtils";

import Loader from "../components/Loader";
import CustomBackButton from "../components/CustomBackButton";
import EditDialog from "../components/dialogs/EditDialog";

import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import CustomButton from "../components/CustomButton";
import { convertToFilterScreenFormat, filtersMap } from "../utils/FilterUtils";
import { showToast } from "../utils/MessageUtils";

/**
 * Approval screen component that displays a list of messages for approval,
 * allows filtering by status, and provides options to change message status with comments.
 * @param {object} navigation - Navigation prop for screen navigation
 */

const Approval = ({ route, navigation }) => {
  const { t } = useTranslation();

  // Component State
  const [data, setData] = useState([]);
  const [initialData, setInitialData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageTypeMap, setMessageTypeMap] = useState({});
  const [busObjCatMap, setBusObjCatMap] = useState({});
  const [refreshKey, setRefreshKey] = useState(false);
  const [clickedStatusButton, setClickedStatusButton] = useState({});
  const [isCommentDialogVisible, setIsCommentDialogVisible] = useState(false);
  const [isRead, setIsRead] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [appliedFiltersCount, setAppliedFiltersCount] = useState(0);

  // Utility function to update refresh key for component re-rendering
  const updateRefresh = () => setRefreshKey((prevKey) => !prevKey);

  const messageWithinMap = {
    today: "Today",
    yesterday: "Yesterday",
    thisWeek: "This Week",
    lastWeek: "Last Week",
    thisMonth: "This Month",
    lastMonth: "Last Month",
    lastTwoMonths: "Last Two Months",
    lastSixMonths: "Last Six Months",
    thisYear: "This Year",
    lastYear: "Last Year",
  };

  const toggleReadStatus = () => {
    setIsRead((prevState) => !prevState);
  };

  /**
   * Navigate to the filters screen with initial filter settings.
   */
  const navigateToFilters = () => {
    const initialFilters = convertToFilterScreenFormat(
      appliedFilters,
      filtersMap[BUSOBJCAT.MESSAGELOG],
      BUSOBJCAT.MESSAGELOG
    );

    const pickerOptions = {
      messageTypeOptions: Object.entries(messageTypeMap).map(
        ([key, value]) => ({
          label: value,
          value: key,
        })
      ),
      documentCategoryOptions: Object.entries(busObjCatMap).map(
        ([key, value]) => ({
          label: value,
          value: key,
        })
      ),
      messageWithinOptions: Object.entries(messageWithinMap).map(
        ([key, value]) => ({
          label: value,
          value: key,
        })
      ),
    };

    navigation.navigate("Filters", {
      busObjCatFilters: filtersMap[BUSOBJCAT.MESSAGELOG],
      busObjCat: BUSOBJCAT.MESSAGELOG,
      initialFilters: initialFilters,
      pickerOptions: pickerOptions,
    });
  };

  /**
   * Fetches message log data asynchronously from API with a past date filter.
   * @returns {Array} Array of message log data or empty array on failure.
   */
  const fetchMessageLogData = async (isRead, messageWithin = "thisMonth") => {
    try {
      setLoading(true);

      const publishedSinceDate = getStartDateForFilter(messageWithin);

      const requestBody = {
        interfaceName: "MessageLogRead",
        methodName: "getMessageLog",
        userID: APP.LOGIN_USER_ID,
        paramsMap: {
          clientID: APP.LOGIN_USER_CLIENT,
          userID: APP.LOGIN_USER_ID,
          language: APP.LOGIN_USER_LANGUAGE,
          isRead: isRead,
          user: null,
          publishedSinceDate: publishedSinceDate,
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

      // Check if the response contains the necessary message log data
      if (
        response &&
        response.success &&
        response.retVal &&
        response.retVal.uimessageloglist
      ) {
        const formattedPublishedSinceDate = format(
          publishedSinceDate,
          "dd MMMM yyyy"
        );

        showToast(
          t("message_log_fetched_since", {
            publishedSinceDate: formattedPublishedSinceDate,
          }),
          "warning"
        );
        console.log("Message log data fetched successfully.");
        return response.retVal.uimessageloglist;
      }

      console.log("No valid messages found.");
      return []; // Return empty array if no valid messages
    } catch (error) {
      console.error("Failed to fetch message log data:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Utility function to check if a string contains meaningful content (non-empty, non-whitespace).
   *
   * @param {string} text - The text to check.
   * @returns {boolean} - Returns `true` if the text has meaningful content, otherwise `false`.
   */
  const hasContent = (text) =>
    typeof text === "string" && text.trim().length > 0;

  /**
   * Validates the recipient approval input.
   *
   * @param {Object} values - The values to validate.
   * @param {Object} values.recipientApproval - The recipient approval object.
   * @param {string} values.recipientApproval.label - The label of the recipient.
   * @param {string} values.recipientApproval.value - The value of the recipient.
   *
   * @returns {boolean|string|null} - Returns `null` if the recipient is valid, or an error message if invalid.
   */
  const validateRecipient = (values) => {
    const { recipientApproval } = values || {};

    // Check if recipientApproval, label, and value are valid
    if (
      recipientApproval &&
      hasContent(recipientApproval.label) &&
      hasContent(recipientApproval.value)
    ) {
      return null; // Return null if valid
    }

    return t("recipient_required"); // Return error message if invalid
  };

  /**
   * Validates the comment input.
   *
   * @param {string} comment - The comment to validate.
   * @param {object} values - The object containing additional validation values (e.g., commentApproval).
   * @returns {boolean|string|null} - Returns `null` if valid, an error message if invalid.
   */
  const validateComment = (values) => {
    const { commentApproval } = values || {};

    // Check if commentApproval has content and is truthy
    if (commentApproval && hasContent(commentApproval)) {
      return null; // Comment is valid if commentApproval exists and comment has content
    } else {
      return t("comment_required"); // Return error message if comment is missing or commentApproval is not valid
    }
  };

  /**
   * Handle the confirmation of the comment dialog and trigger the status change.
   *
   * @param {Object} values - The values entered in the dialog.
   * @param {string} values.commentApproval - The comment approval input.
   * @param {Object} values.recipientApproval - The recipient approval object.
   * @param {string} values.recipientApproval.label - The label of the recipient.
   * @param {string} values.recipientApproval.value - The value of the recipient.
   */
  const handleCommentDialogConfirm = async (values) => {
    try {
      console.log("Confirming comment dialog...");
      const { commentApproval, recipientApproval } = values || {};

      if (clickedStatusButton) {
        // Ensure immutability when updating the record's state
        if (clickedStatusButton.record) {
          clickedStatusButton.record = {
            ...clickedStatusButton.record, // Preserve existing properties
            commentsEntered: true, // Mark comments as entered
          };
        }

        const recipientValue = recipientApproval?.value || null;
        const commentValue = commentApproval || null;

        // Trigger the status change
        await handleStatusChangeMgmt(
          clickedStatusButton,
          updateRefresh,
          recipientValue,
          commentValue,
          [], // Additional parameters if needed
          null
        );

        console.log("Status change handled successfully.");
      }

      // Close the dialog after status change is completed
      setIsCommentDialogVisible(false);
    } catch (error) {
      // Log error for debugging purposes
      console.error("Error during status change:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // Use Promise.all to fetch both data asynchronously
        const [messageTypes, busObjCats] = await Promise.all([
          fetchMessageTypeData(),
          fetchBusObjCatData(),
        ]);

        setMessageTypeMap(messageTypes);
        setBusObjCatMap(busObjCats);

        setAppliedFilters({});
        setAppliedFiltersCount(0);

        // Fetch message log data based on read/unread state
        const result = await fetchMessageLogData(isRead);
        if (result) {
          setData(result);
          setInitialData(result);
        } else {
          console.error("No messages received or data was invalid");
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();
  }, [refreshKey, isRead]);

  /**
   * Memoized headerLeft component.
   * This component will be used as the left side of the navigation header.
   * It includes a back button and a dynamic title with the count of items in the 'data' array.
   *
   * @returns {JSX.Element} Left side of the header
   */
  const headerLeft = useCallback(() => {
    return (
      <View style={styles.headerLeftContainer}>
        <CustomBackButton navigation={navigation} t={t} />
        <Text style={styles.headerText} numberOfLines={1} ellipsizeMode="tail">
          {t("approval")}s ({data.length}){" "}
          {/* Display "approvals" with count */}
        </Text>
      </View>
    );
  }, [navigation, data.length, t]);
  /**
   * Memoized headerRight component.
   * This component will be used as the right side of the navigation header.
   * It includes a button with a notification icon (bell) that can trigger a function when pressed.
   * Currently, the onPress function is empty for now.
   *
   * @returns {JSX.Element} Right side of the header
   */
  const headerRight = useCallback(() => {
    return (
      <View style={styles.headerRightContainer}>
        <Text style={styles.toggleLabel}>
          {isRead ? t("read") : t("unread")}
        </Text>
        <GestureHandlerRootView>
          <Switch
            value={isRead}
            onValueChange={toggleReadStatus}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={isRead ? "#f5dd4b" : "#f4f3f4"}
            accessibilityLabel={isRead ? t("read") : t("unread")}
            accessibilityRole="switch"
            testID="unread-toggle-switch"
          />
        </GestureHandlerRootView>
        <>
          <CustomButton
            onPress={navigateToFilters}
            label=""
            icon={{
              name: "filter",
              library: "FontAwesome",
              size: 30,
              color: "white",
            }}
            disabled={loading}
          />
          {/* Show filter count if filters are applied */}
          {appliedFiltersCount > 0 && (
            <View style={styles.headerIconsCountContainer}>
              <Text style={styles.headerIconsCountText}>
                {appliedFiltersCount}
              </Text>
            </View>
          )}
        </>
      </View>
    );
  }, [isRead, t, toggleReadStatus, appliedFiltersCount, loading]);

  /**
   * useEffect hook to set the navigation header options whenever the 'data' or
   * any of the header components change. This will update the left and right
   * header components dynamically.
   *
   * @returns {void}
   */
  useEffect(() => {
    navigation.setOptions({
      headerTitle: "",
      headerLeft,
      headerRight,
    });
  }, [navigation, data, headerLeft, headerRight]);

  useEffect(() => {
    // Update applied filters when route params change
    const newAppliedFilters = route?.params?.convertedAppliedFilters ?? {};
    setAppliedFilters(newAppliedFilters);
    // Update applied filters count when route params change
    setAppliedFiltersCount(Object.keys(newAppliedFilters).length);
  }, [route?.params?.convertedAppliedFilters]);

  useEffect(() => {
    const applyFilters = async () => {
      try {
        let messageLogData = data; // Start with existing data for local filtering

        // If `messageWithin` exists, fetch data from server
        if (appliedFilters.messageWithin) {
          messageLogData = await fetchMessageLogData(
            isRead,
            appliedFilters.messageWithin
          );
        } else {
          // If no `messageWithin` filter is applied, reset to the initial full dataset
          messageLogData = initialData;
        }

        // If `messageType` or `documentCategory` filters are applied, filter locally
        const filteredData = messageLogData.filter((item) => {
          const matchCategory = appliedFilters.documentCategory
            ? item.busObjCat === appliedFilters.documentCategory
            : true; // If no filter, match all
          const matchMessageType = appliedFilters.messageType
            ? item.type === appliedFilters.messageType
            : true; // If no filter, match all

          return matchCategory && matchMessageType;
        });

        setData(filteredData);
      } catch (error) {
        console.error("Error applying filters:", error);
      }
    };

    applyFilters();
  }, [appliedFilters]); // Dependencies include filters and read state

  /**
   * Render a single message item for the FlatList.
   */
  const renderItem = useCallback(
    ({ item }) => {
      const isItemRead = item.isRead || !item.readOn || !item.respondedOn;
      const messageStatus = isItemRead ? "Read" : "Unread";

      const actionPerformed = item.fields.find(
        (field) => field.name === "actionPerformed"
      )?.value;

      return (
        <View style={styles.itemContainer}>
          <View style={styles.firstRow}>
            <Text numberOfLines={3} ellipsizeMode="tail">
              {item.text}
            </Text>
          </View>
          <View style={styles.secondRow}>
            <Text numberOfLines={1} ellipsizeMode="tail">
              {messageTypeMap[item.type] || item.type || ""}
            </Text>
            <Text numberOfLines={1} ellipsizeMode="tail">
              {busObjCatMap[item.busObjCat] || item.busObjCat || ""}
            </Text>
            <Text numberOfLines={1} ellipsizeMode="tail">
              {messageStatus}
            </Text>
          </View>
          <View style={styles.thirdRow}>
            <Text numberOfLines={1} ellipsizeMode="tail">
              {item.publishedOn &&
                `${format(
                  item.publishedOn,
                  convertToDateFNSFormat(APP.LOGIN_USER_DATE_FORMAT)
                )} (${getPublishedAge(item.publishedOn)})`}
            </Text>
            <Text numberOfLines={1} ellipsizeMode="tail">
              {item.publishedByFullName || ""}
            </Text>
          </View>
          <View style={styles.lastRow}>
            <View style={styles.statusContainer}>
              <Text
                style={styles.textBold}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {actionPerformed || ""}
              </Text>
            </View>
            <GestureHandlerRootView>
              <View style={styles.buttonContainer}>
                {item.buttons &&
                  !item.respondedOn &&
                  item.buttons.map((button, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleButtonPress(item, button)}
                      style={styles.customButton}
                    >
                      <Text
                        style={styles.buttonText}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {button.clickableTextMsg}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            </GestureHandlerRootView>
          </View>
        </View>
      );
    },
    [messageTypeMap, busObjCatMap]
  );

  /**
   * Handle button press for status change, possibly triggering the comment dialog.
   *
   * @param {Object} item - The data record associated with the button.
   * @param {Object} button - The button details containing updFields.
   */
  const handleButtonPress = async (item, button) => {
    try {
      console.log("Button Pressed:", button.clickableTextMsg);

      // Prepare clicked status button details
      const clickedStatusButtonDetails = {
        record: item,
        updFields: button.updFields,
      };

      setClickedStatusButton(clickedStatusButtonDetails);

      // Process the update fields
      const {
        changeRecipient,
        comment,
        nextStatusCodes,
        openPreviousGateways,
      } = processUpdateFields(clickedStatusButtonDetails.updFields);

      // Check conditions for comment dialog
      const needsCommentDialog =
        !clickedStatusButtonDetails.record.commentsEntered &&
        (changeRecipient || comment);

      if (needsCommentDialog) {
        // Show comment dialog if necessary
        setIsCommentDialogVisible(true);
      } else {
        // Proceed with status change if no comment dialog is needed
        await handleStatusChangeMgmt(
          clickedStatusButtonDetails,
          updateRefresh,
          null, // remarkComment
          null, // recipient
          nextStatusCodes,
          openPreviousGateways
        );
      }
    } catch (error) {
      console.error(`Error handling ${button.clickableTextMsg} button:`, error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Loader when data is being fetched */}
      {loading ? (
        <Loader />
      ) : data.length === 0 ? (
        // Display 'No new messages' if data is empty
        <View style={styles.emptyMessageContainer}>
          <Text style={styles.emptyMessageText}>No new messages</Text>
        </View>
      ) : (
        // FlatList to display the message log data
        <FlatList
          data={data}
          keyExtractor={(item, index) => item.id.toString() ?? index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
      {/* EditDialog for displaying the comment input form */}
      <EditDialog
        isVisible={isCommentDialogVisible}
        onClose={() => setIsCommentDialogVisible(false)}
        onConfirm={handleCommentDialogConfirm}
        title={""}
        inputsConfigs={[
          {
            id: "recipientApproval",
            type: "dropdown",
            allowBlank: true,
            queryFields: {
              fields: ["Person-id", "Person-name-knownAs"],
              sort: [
                {
                  property: "Person-name-knownAs",
                  direction: "ASC",
                },
              ],
            },
            commonQueryParams: {
              filterQueryValue: "",
              userID: APP.LOGIN_USER_ID,
              client: parseInt(APP.LOGIN_USER_CLIENT),
              language: APP.LOGIN_USER_LANGUAGE,
              intStatus: JSON.stringify([INTSTATUS.ACTIVE, 1]),
              page: 1,
              start: 0,
              limit: 20,
            },
            pickerLabel: t("select_recipient"),
            labelItemField: "Person-name-knownAs",
            valueItemField: "Person-id",
            searchFields: ["Person-name-knownAs"],
            validateInput: validateRecipient,
          },
          {
            id: "commentApproval",
            type: "richText",
            initialValue: null,
            validateInput: validateComment,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: "2%",
    paddingVertical: 0,
  },
  headerLeftContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  headerRightContainer: {
    maxWidth: screenDimension.width / 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 5,
  },
  headerText: {
    fontSize: screenDimension.width > 400 ? 18 : 16,
    fontWeight: "bold",
    color: "#fff",
  },
  listContainer: {
    paddingVertical: "2%",
  },
  itemContainer: {
    backgroundColor: "#fff",
    marginBottom: "2%",
    borderRadius: 8,
    borderWidth: 0.5,
  },
  firstRow: {
    fontWeight: "bold",
    padding: "2%",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
  },
  secondRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: "2%",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
  },
  thirdRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: "2%",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
  },
  lastRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "2%",
    backgroundColor: "#e5eef7",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  statusContainer: {
    flex: 1 / 2,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    rowGap: 4,
    columnGap: 4,
  },
  customButton: {
    padding: "2%",
    borderWidth: 1,
    backgroundColor: Platform.OS === "ios" ? "#007AFF" : "#2196F3",
    borderRadius: 4,
  },
  buttonText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  textBold: {
    fontWeight: "bold",
  },
  toggleLabel: {
    color: "#fff",
    fontWeight: "bold",
  },
  emptyMessageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyMessageText: {
    fontSize: 18,
    color: "#555",
  },
  headerIconsCountContainer: {
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
  headerIconsCountText: {
    color: "black",
    fontSize: 12,
    fontWeight: "bold",
  },
});

export default Approval;
