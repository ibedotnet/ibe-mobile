import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useTranslation } from "react-i18next";

import { format, isValid } from "date-fns";

import { RichEditor } from "react-native-pell-rich-editor";

import {
  fetchData,
  getAppNameByCategory,
  isDoNotReplaceAnyList,
} from "../utils/APIUtils";
import { convertToDateFNSFormat, stripHTMLTags } from "../utils/FormatUtils";
import { showToast } from "../utils/MessageUtils";
import updateFields from "../utils/UpdateUtils";

import ConfirmationDialog from "../components/dialogs/ConfimationDialog";
import CustomButton from "../components/CustomButton";
import EditDialog from "../components/dialogs/EditDialog";

import {
  API_ENDPOINTS,
  APP,
  BUSOBJCATMAP,
  INTSTATUS,
  TEST_MODE,
} from "../constants";

import { common, disableOpacity } from "../styles/common";

const Comment = ({
  busObjCat,
  busObjId,
  initialComments = [],
  isParentLocked = false,
}) => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [selectedComment, setSelectedComment] = useState(null);
  const [isDeleteConfirmationVisible, setIsDeleteConfirmationVisible] =
    useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  /**
   * Handles the creation of a new comment.
   * @param {Object} comment - The comment object to be added.
   * @returns {Object|null} - The updated comment object with an ID, or null if there was an error.
   */
  const handleNewCommentOperation = async (comment) => {
    let updateParams = {
      [`MessageLog-text:text`]: comment.content,
      [`MessageLog-busObjID-busObjCat`]: busObjCat,
      [`MessageLog-busObjID-iD`]: busObjId,
      [`MessageLog-intStatus`]: 0, // Set status to active
      [`MessageLog-publishedOn`]: new Date(),
      [`MessageLog-publishedBy`]: APP.LOGIN_USER_ID,
      [`MessageLog-type`]: "comment",
      [`MessageLog-isPrivate`]: false,
      [`MessageLog-type`]: false,
    };

    const newlyAddedComment = await handleCommentsUpdate(null, updateParams);

    if (!newlyAddedComment || !newlyAddedComment.id) {
      return null; // Return null if the comment was not successfully added
    }

    comment.id = newlyAddedComment.id;
    return comment;
  };

  /**
   * Handles the update of an existing comment.
   * @param {Object} comment - The comment object to be updated.
   * @returns {Object} - The updated comment object.
   */
  const handleUpdateCommentOperation = async (comment) => {
    let updateParams = {
      [`MessageLog-text:text`]: comment.content,
    };

    await handleCommentsUpdate(comment.id, updateParams);
    return comment;
  };

  /**
   * Handles the deletion of a comment.
   * @param {Object} comment - The comment object to be deleted.
   * @returns {Object|null} - The deleted comment object, or null if there was an error.
   */
  const handleDeleteCommentOperation = async (comment) => {
    let updateParams = {
      [`MessageLog-intStatus`]: 3, // Set status to deleted
    };

    const deletedComment = await handleCommentsUpdate(comment.id, updateParams);
    return deletedComment;
  };

  /**
   * Processes a list of comments, applying the appropriate operations based on their status.
   * @param {Array} comments - An array of comment objects to be processed.
   */
  const processComments = async (comments) => {
    // Create a copy of the comments array to avoid mutation issues while iterating
    let commentsToProcess = [...comments];

    for (const comment of commentsToProcess) {
      try {
        setIsUpdating(true);

        if (comment.isNewlyAdded) {
          // Handle newly added comment
          const result = await handleNewCommentOperation(comment);
          if (result) {
            setComments((prevComments) =>
              prevComments.map((c) =>
                c.id === result.id ? { ...c, isNewlyAdded: false } : c
              )
            );
            await updateBusObjCat(); // Update related objects or categories
          } else {
            // Remove comment from the list if addition failed
            setComments((prevComments) =>
              prevComments.filter((c) => c.id !== comment.id)
            );
          }
        } else if (comment.isUpdated) {
          // Handle updated comment
          const result = await handleUpdateCommentOperation(comment);
          setComments((prevComments) =>
            prevComments.map((c) =>
              c.id === result.id ? { ...c, isUpdated: false } : c
            )
          );
        } else if (comment.isDeleted) {
          // Handle deleted comment
          const result = await handleDeleteCommentOperation(comment);
          if (result && result.id) {
            setComments((prevComments) =>
              prevComments.filter((c) => c.id !== result.id)
            );
            await updateBusObjCat(); // Update related objects or categories
          }
        }
      } catch (error) {
        console.error(`Error processing comment (${comment.content}):`, error);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  /**
   * Asynchronous function to handle MessageLog update in database
   * @param {string} commentId - ID of the MessageLog entry to be updated
   * @param {Object} updateParams - Parameters for updating the MessageLog
   * @param {boolean} skipBusObjCatUpdate - Optional flag to skip business object category update (default: false)
   */
  const handleCommentsUpdate = async (commentId, updateParams) => {
    try {
      // Prepare form data for the MessageLog update
      let formData = {
        data: {
          ...(commentId && { "MessageLog-id": commentId }), // Add only if commentId exists
          ...updateParams, // Additional fields to be updated
        },
      };

      // Prepare query string parameters for the update request
      const queryStringParams = {
        userID: APP.LOGIN_USER_ID,
        client: APP.LOGIN_USER_CLIENT,
        language: APP.LOGIN_USER_LANGUAGE,
        testMode: TEST_MODE,
        component: "platform",
        doNotReplaceAnyList: isDoNotReplaceAnyList(busObjCat),
        appName: JSON.stringify(getAppNameByCategory(busObjCat)),
      };

      // Call the updateFields function to perform the MessageLog update
      const updateResponse = await updateFields(formData, queryStringParams);

      // Handle the response based on its structure
      if (updateResponse && updateResponse.success) {
        // Process successful response
        if (
          updateResponse.response &&
          Array.isArray(updateResponse.response.details) &&
          updateResponse.response.details.length > 0
        ) {
          const detail = updateResponse.response.details[0];
          if (
            detail.success &&
            detail.data &&
            Array.isArray(detail.data.ids) &&
            detail.data.ids.length > 0
          ) {
            // Show success message and return the comment ID
            if (Array.isArray(detail.messages) && detail.messages.length > 0) {
              showToast(detail.messages[0].message_text);
            }

            return { id: detail.data.ids[0] }; // Return the first ID from the response
          }
        }
      } else {
        console.error(
          "Update response is either undefined or not successful:",
          updateResponse
        );
      }

      showToast(t("update_failure"), "error");
      return null;
    } catch (error) {
      // Handle unexpected errors
      console.error("Error in handleCommentsUpdate:", error);
      showToast(t("failed_update_comments"), "error");
      return null; // Return null on error
    }
  };

  /**
   * Asynchronous function to update the business object category with comments.
   *
   * @async
   * @function
   * @param {Array} [comments=[]] - List of comments to be included in the update. Each comment should have an `id` property.
   * @throws {Error} Throws an error if the update process fails.
   */
  const updateBusObjCat = async () => {
    try {
      // Collect comment IDs into an array. Defaults to an empty array if no comments are provided.
      const commentIds =
        comments.length > 0 ? comments.map((comment) => comment.id) : [];

      // Prepare form data for the update request.
      let formData = {
        data: {
          [`${BUSOBJCATMAP[busObjCat]}-id`]: busObjId, // Business object ID to be updated
          [`${BUSOBJCATMAP[busObjCat]}-comments`]: commentIds, // Array of comment IDs to be associated with the business object
        },
      };

      // Prepare query string parameters for the update request.
      const queryStringParams = {
        userID: APP.LOGIN_USER_ID,
        client: APP.LOGIN_USER_CLIENT,
        language: APP.LOGIN_USER_LANGUAGE,
        component: "platform",
      };

      // Call the updateFields function to perform the update request.
      const updateResponse = await updateFields(formData, queryStringParams);

      if (!updateResponse.success) {
        showToast(t("update_failure"), "error"); // Show error message if the update fails
      }

      if (updateResponse.message) {
        showToast(updateResponse.message); // Show success or informational message
      }
    } catch (error) {
      // Handle errors that occur during the comment update process.
      console.error("Error in updateBusObjCat(comments):", error);
      showToast(t("failed_update_comments"), "error"); // Show error message for failed comments update
    }
  };

  const handleAddPress = useCallback(() => {
    setNewComment("");
    setSelectedComment(null);
    setIsEditModalVisible(true);
  }, []);

  const handleEditPress = (comment) => {
    setNewComment(comment.content);
    setSelectedComment(comment);
    setIsEditModalVisible(true);
  };

  const confirmEditChanges = (values) => {
    setComments((prevComments) => {
      // Extract the rich text value using the known id
      const richTextValue = values["richText"] || "";

      if (selectedComment) {
        // Update the existing comment
        return prevComments.map((comment) =>
          comment.id === selectedComment.id
            ? { ...comment, content: richTextValue, isUpdated: true }
            : comment
        );
      } else {
        // Add a new comment
        const newCommentObj = {
          id: new Date().getTime().toString(),
          content: richTextValue,
          isNewlyAdded: true,
        };
        return [newCommentObj, ...prevComments];
      }
    });

    console.log("Comment list after update: " + JSON.stringify(comments));

    // Reset the state and close the modal
    setSelectedComment(null);
    setIsEditModalVisible(false);
  };

  const handleDeletePress = (comment) => {
    setSelectedComment(comment);
    setIsDeleteConfirmationVisible(true);
  };

  // Function to confirm comment deletion
  const confirmDelete = () => {
    // Mark the selected comment as 'isDeleted: true' and filter it out
    const updatedComments = comments.map((comment) =>
      comment.id === selectedComment.id
        ? { ...comment, isDeleted: true }
        : comment
    );

    // Update the 'comments' state with the updated comments array
    setComments(updatedComments);

    console.log("Comment list after deletion: " + JSON.stringify(comments));

    setSelectedComment(null);
    setIsDeleteConfirmationVisible(false);
  };

  /**
   * Fetches already existing comments based on the provided list of initial comment IDs.
   * Retrieves comments from the server and updates the state accordingly.
   * @returns {void}
   */
  const fetchInitialComments = async () => {
    try {
      if (initialComments?.length === 0) {
        return;
      }

      setLoading(true);

      // Define query fields to fetch comments (Message Log)
      const queryFields = {
        fields: [
          "MessageLog-id",
          "MessageLog-text:text",
          "MessageLog-publishedBy:User-personID:Person-name-knownAs",
          "MessageLog-publishedOn",
        ],
        where: [
          {
            fieldName: "MessageLog-id",
            operator: "in",
            value: initialComments, // Use the initialComments array as the value
          },
        ],
        sort: [{ property: "MessageLog-publishedOn", direction: "DESC" }],
      };

      // Define common query parameters
      const commonQueryParams = {
        testMode: TEST_MODE,
        client: parseInt(APP.LOGIN_USER_CLIENT),
        user: APP.LOGIN_USER_ID,
        userID: APP.LOGIN_USER_ID,
        language: APP.LOGIN_USER_LANGUAGE,
        intStatus: JSON.stringify([INTSTATUS.ACTIVE]),
      };

      // Construct form data for the request
      const formData = {
        query: JSON.stringify(queryFields),
        ...commonQueryParams,
      };

      // Fetch data from the server
      const response = await fetchData(
        API_ENDPOINTS.QUERY,
        "POST",
        {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        new URLSearchParams(formData).toString()
      );

      // Process the response if successful and data is available
      if (
        response.success === true &&
        response.data &&
        response.data instanceof Array &&
        response.data.length > 0
      ) {
        // Map fetched comments to the desired format
        const fetchedComments = response.data.map((comment) => {
          const id = comment["MessageLog-id"];
          // Strip unwanted HTML tags
          const content = stripHTMLTags(
            comment["MessageLog-text:text"],
            "<p>&nbsp;</p>"
          );
          const publishedBy =
            comment["MessageLog-publishedBy:User-personID:Person-name-knownAs"];
          const unFormattedPublishedOn = new Date(
            comment["MessageLog-publishedOn"]
          );
          const publishedOn = isValid(unFormattedPublishedOn)
            ? format(
                unFormattedPublishedOn,
                convertToDateFNSFormat(APP.LOGIN_USER_DATE_FORMAT)
              )
            : "";

          return {
            id,
            content,
            publishedBy,
            publishedOn,
          };
        });

        // Update the state once with all fetched comments
        setComments(fetchedComments);
      }
    } catch (error) {
      console.error("Error fetching initial comments: ", error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch initial comments when component mounts
    fetchInitialComments();
  }, [initialComments]);

  // Effect to handle comments processing
  useEffect(() => {
    processComments(comments);
  }, [comments]);

  return (
    <View style={styles.tabContainer}>
      <ConfirmationDialog
        isVisible={isDeleteConfirmationVisible}
        onClose={() => setIsDeleteConfirmationVisible(false)}
        onConfirm={confirmDelete}
        message={t("confirm_deletion_message")}
      />
      <EditDialog
        isVisible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        onConfirm={confirmEditChanges}
        title={selectedComment ? t("edit_comment") : t("add_comment")}
        inputsConfigs={[
          { id: "richText", type: "richText", initialValue: newComment },
        ]}
      />
      <View style={styles.header}>
        <Text style={styles.countText}>
          {comments.length > 0 ? `${t("count")}: ${comments.length}` : null}
        </Text>
        <View style={styles.addCommentContainer}>
          <CustomButton
            onPress={handleAddPress}
            label={t("add_comment")}
            icon={{
              name: "comment-plus-outline",
              library: "MaterialCommunityIcons",
              color: "#005eb8",
            }}
            backgroundColor={false}
            labelStyle={{
              color:
                loading || isParentLocked
                  ? `#b0c4de${disableOpacity}`
                  : "#005eb8",
              textDecorationLine:
                loading || isParentLocked ? "none" : "underline",
            }}
            disabled={loading || isParentLocked}
            style={{ icon: { marginRight: 2 } }}
          />
        </View>
      </View>
      {loading && (
        <View style={styles.progressMessageContainer}>
          <Text style={common.loadingText}>{t("loading")}...</Text>
          {error && <Text>Error: {error.message}</Text>}
        </View>
      )}
      {isUpdating && (
        <View style={styles.progressMessageContainer}>
          <Text style={common.loadingText}>{t("update_in_progress")}...</Text>
        </View>
      )}
      {comments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.noCommentsText}>{t("no_comments")}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollView}>
          {comments.map((comment, index) => (
            <View
              key={comment.id}
              style={[
                styles.commentItem,
                comment.hasOwnProperty("isNewlyAdded") &&
                  comment["isNewlyAdded"] === true &&
                  styles.newlyAddedItem,
              ]}
            >
              <View style={styles.commentContentContainer}>
                <View style={[styles.commentContent]}>
                  {comment.content ? (
                    <RichEditor
                      key={`${comment.id}-${comment.content}`} // Force re-render when content changes
                      initialContentHTML={comment.content}
                      disabled={true}
                      useContainer={
                        comment.hasOwnProperty("isNewlyAdded") &&
                        comment["isNewlyAdded"] === true
                          ? false
                          : true
                      }
                      editorStyle={
                        comment.hasOwnProperty("isNewlyAdded") &&
                        comment["isNewlyAdded"] === true &&
                        styles.newlyAddedItem
                      }
                    />
                  ) : null}
                </View>
                <View style={styles.commentActions}>
                  <CustomButton
                    onPress={() => handleEditPress(comment)}
                    icon={{
                      name: "comment-edit",
                      library: "MaterialCommunityIcons",
                      size: 24,
                      color: "green",
                    }}
                    label=""
                    backgroundColor={false}
                    disabled={loading || isParentLocked}
                    style={{ flex: 1 }}
                  />
                  <CustomButton
                    onPress={() => handleDeletePress(comment)}
                    icon={{
                      name: "comment-remove",
                      library: "MaterialCommunityIcons",
                      size: 24,
                      color: "red",
                    }}
                    label=""
                    backgroundColor={false}
                    disabled={loading || isParentLocked}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
              <View style={styles.publishedInfo}>
                {comment.publishedOn && comment.publishedBy ? (
                  <Text style={styles.publishedText}>
                    {t("published_on")} {comment.publishedOn} {t("by")}{" "}
                    {comment.publishedBy}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flex: 1,
    justifyContent: "flex-start",
    backgroundColor: "#e5eef7",
  },
  header: {
    paddingVertical: "2%",
    paddingHorizontal: "4%",
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    backgroundColor: "#fff",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    marginBottom: 10,
  },
  countText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
  },
  progressMessageContainer: {
    paddingVertical: "4%",
    alignItems: "center",
  },
  addCommentContainer: {
    justifyContent: "flex-end",
  },
  commentItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: "2%",
    backgroundColor: "white",
  },
  commentContentContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  commentContent: {
    flex: 1,
    maxWidth: "95%",
  },
  commentActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    flex: 1 / 3,
  },
  publishedInfo: {
    paddingHorizontal: "2%",
  },
  publishedText: {
    fontSize: 12,
    color: "#666",
  },
  newlyAddedItem: {
    backgroundColor: "#fffb6f",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noCommentsText: {
    fontSize: 18,
    color: "#555",
  },
});

export default Comment;
