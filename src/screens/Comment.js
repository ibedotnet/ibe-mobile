import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useTranslation } from "react-i18next";

import { format, isValid } from "date-fns";

import { RichEditor } from "react-native-pell-rich-editor";

import { fetchData } from "../utils/APIUtils";
import { convertToDateFNSFormat, stripHTMLTags } from "../utils/FormatUtils";

import ConfirmationDialog from "../components/dialogs/ConfimationDialog";
import CustomButton from "../components/CustomButton";
import EditDialog from "../components/dialogs/EditDialog";

import { API_ENDPOINTS, APP, INTSTATUS, TEST_MODE } from "../constants";

import { common, disableOpacity } from "../styles/common";
import { screenDimension } from "../utils/ScreenUtils";

const Comment = ({
  busObjCat,
  busObjId,
  initialComments = [],
  isParentLocked = false,
}) => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");

  const [selectedComment, setSelectedComment] = useState(null);
  const [isDeleteConfirmationVisible, setIsDeleteConfirmationVisible] =
    useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const handleAddPress = () => {
    setNewComment("");
    setSelectedComment(null);
    setIsEditModalVisible(true);
  };

  const handleEditPress = (comment) => {
    setNewComment(comment.content);
    setSelectedComment(comment);
    setIsEditModalVisible(true);
  };

  const confirmEditChanges = (value) => {
    setComments((prevComments) => {
      if (selectedComment) {
        return prevComments.map((comment) =>
          comment.id === selectedComment.id
            ? { ...comment, content: value, isUpdated: true }
            : comment
        );
      } else {
        const newCommentObj = {
          id: new Date().getTime().toString(),
          content: value,
          isNewlyAdded: true,
        };
        return [newCommentObj, ...prevComments];
      }
    });

    console.debug("Comment list after update: " + JSON.stringify(comments));

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
    const updatedComments = comments
      .map((comment) =>
        comment.id === selectedComment.id
          ? { ...comment, isDeleted: true }
          : comment
      )
      .filter((comment) => comment.id !== selectedComment.id);

    // Update the 'comments' state with the updated comments array
    setComments(updatedComments);

    console.debug("Comment list after deletion: " + JSON.stringify(comments));

    setSelectedComment(null);
    setIsDeleteConfirmationVisible(false);
  };

  /**
   * Fetches initial comments based on the provided list of comment IDs.
   * Retrieves comments from the server and updates the state accordingly.
   * @returns {void}
   */
  const fetchInitialComments = async () => {
    try {
      setLoading(true);

      // Iterate over each comment ID in the initialComments
      for (const commentId of initialComments) {
        // Define query fields to fetch comment (Message Log)
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
              operator: "=",
              value: commentId, // Use the current comment ID from the list
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
          // Map fetched comments to desired format
          const fetchedComments = response.data.map((comment) => {
            const id = comment["MessageLog-id"];
            // This paragraph ("<p>&nbsp;</p>") is added in the web application,
            // so we have to strip it; otherwise, it adds unwanted space.
            const content = stripHTMLTags(
              comment["MessageLog-text:text"],
              "<p>&nbsp;</p>"
            );
            const publishedBy =
              comment[
                "MessageLog-publishedBy:User-personID:Person-name-knownAs"
              ];
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

          setComments((prevComments) => [...prevComments, ...fetchedComments]);
        }
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
        initialValue={newComment}
        isRichText={true}
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
        <View style={styles.loaderErrorContainer}>
          <Text style={common.loadingText}>{t("loading")}...</Text>
          {error && <Text>Error: {error.message}</Text>}
        </View>
      )}
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
  },
  countText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
  },
  loaderErrorContainer: {
    paddingVertical: "4%",
    alignItems: "center",
  },
  addCommentContainer: {
    justifyContent: "flex-end",
  },
  scrollView: {
    paddingBottom: screenDimension.height / 2,
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
});

export default Comment;
