import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";

import { useTranslation } from "react-i18next";

import { format, isValid } from "date-fns";

import CustomButton from "../components/CustomButton";
import ConfirmationDialog from "../components/dialogs/ConfimationDialog";
import EditDialog from "../components/dialogs/EditDialog";
import PreviewDialog from "../components/dialogs/PreviewDialog";

import { fetchData } from "../utils/APIUtils";
import { handleDownload, handlePreview } from "../utils/FileUtils";
import {
  convertBytesToMegaBytes,
  convertToDateFNSFormat,
} from "../utils/FormatUtils";
import { showToast } from "../utils/MessageUtils";

import {
  API_ENDPOINTS,
  APP,
  INTSTATUS,
  MAX_UPLOAD_FILE_SIZE,
  TEST_MODE,
  VALID_FILE_EXTENSIONS,
} from "../constants";

import { common, disableOpacity } from "../styles/common";

const File = ({
  busObjCat,
  busObjId,
  initialFilesIdList = [],
  isParentLocked = false,
}) => {
  // Initialize useTranslation hook
  const { t } = useTranslation();

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State variables for modal
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // State variables for file deletion
  const [isDeleteConfirmationVisible, setIsDeleteConfirmationVisible] =
    useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);

  // State variable to hold download progress for each file
  const [downloadProgressMap, setDownloadProgressMap] = useState({});

  // State variables to hold preview information for each file
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [previewFileTitle, setPreviewFileTitle] = useState("");
  const [previewFileType, setPreviewFileType] = useState(null);
  const [previewFileUri, setPreviewFileUri] = useState(null);

  const maxUploadFileSizeInBytes = MAX_UPLOAD_FILE_SIZE * 1024 * 1024; // MAX_UPLOAD_FILE_SIZE in bytes

  /**
   * Asynchronous function to handle picking files from the device.
   */
  const pickFile = async () => {
    try {
      // Open the document picker to select multiple files
      const documentPickerResult = await DocumentPicker.getDocumentAsync({
        multiple: true, // Enable selecting multiple files
      });

      // Log the document picker result
      console.debug(
        "Document picker result: " + JSON.stringify(documentPickerResult)
      );

      // Check if the file picking was cancelled by the user
      if (documentPickerResult.canceled === true) {
        console.debug("File picking cancelled");
      } else if (
        documentPickerResult.canceled === false &&
        documentPickerResult.assets &&
        documentPickerResult.assets.length > 0
      ) {
        const skippedLargeFiles = [];
        const skippedExistingFiles = [];

        // Filter out files that already exist and files that exceed the maximum size limit
        const newFiles = documentPickerResult.assets.filter((newFile) => {
          // Check if the file exceeds the maximum size limit
          if (newFile.size > maxUploadFileSizeInBytes) {
            skippedLargeFiles.push({ name: newFile.name, size: newFile.size });
            return false;
          }
          // Check if the file already exists
          if (
            files.some((existingFile) => existingFile.name === newFile.name)
          ) {
            skippedExistingFiles.push(newFile.name);
            return false;
          }
          return true;
        });

        // Map the filtered files to the appropriate format
        const pickedFiles = newFiles.map(({ name, mimeType, size }) => ({
          id: name, // Initially, assigning the name as the id
          name,
          mimeType: mimeType,
          size,
          isNewlyAdded: true,
        }));

        // Log the picked files
        console.debug("Picked files:", pickedFiles);

        // Add the picked files to the top of existing files list
        setFiles([...pickedFiles, ...files]);

        // Show message for skipped files due to existence
        if (skippedExistingFiles.length > 0) {
          showToast(
            `${skippedExistingFiles.length} file${
              skippedExistingFiles.length === 1 ? "" : "s"
            } skipped as ${
              skippedExistingFiles.length === 1 ? "it is" : "they are"
            } already added.`
          );
        }

        // Show message for skipped files due to size limit
        if (skippedLargeFiles.length > 0) {
          const skippedFileNames = skippedLargeFiles.map((file) => file.name);
          showToast(
            `${skippedLargeFiles.length} file${
              skippedLargeFiles.length === 1 ? "" : "s"
            } (${skippedFileNames.join(", ")}) skipped as ${
              skippedLargeFiles.length === 1 ? "it exceeds" : "they exceed"
            } the maximum size limit of ${convertBytesToMegaBytes(
              maxUploadFileSizeInBytes
            )}.`
          );
        }
      } else {
        // File picking failed for some reason
        console.debug("File picking failed");
      }
    } catch (error) {
      // Handle any errors that occur during file picking
      console.error("Error picking file:", error);
    }
  };

  // Function to open modal for editing file name
  const openEditModal = (file) => {
    setSelectedFile(file);
    setIsEditModalVisible(true);
  };

  // Function to close edit modal
  const closeEditModal = () => {
    setIsEditModalVisible(false);
    setSelectedFile(null);
  };

  // Function to confirm changes made in modal
  const confirmEditChanges = (value) => {
    // Update file name in files array and mark as updated
    setFiles((prevFiles) =>
      prevFiles.map((file) =>
        file.id === selectedFile.id
          ? { ...file, name: value, isUpdated: true }
          : file
      )
    );

    closeEditModal();
  };

  const validateFilename = (value) => {
    // Check if the input value is empty
    if (!value.trim()) {
      return "No filename provided.";
    }

    // Get the file extension from the input value
    const fileExtension = value.slice(value.lastIndexOf(".")).toLowerCase();

    // Check if the file extension is empty or same as the input value (only extension provided)
    if (fileExtension === value.toLowerCase()) {
      return "Filename cannot consist only of an extension.";
    }

    // Check if the file extension is valid
    if (!VALID_FILE_EXTENSIONS.includes(fileExtension)) {
      return (
        "Invalid file extension. Supported extensions are: " +
        VALID_FILE_EXTENSIONS.join(", ")
      );
    }

    return null; // Return null if input is valid
  };

  const handleEdit = (item) => {
    openEditModal(item); // Open the modal for editing
  };

  // Function to confirm file deletion
  const confirmDelete = () => {
    // Delete logic...
    const updatedFiles = files.filter((file) => file.id !== fileToDelete.id);
    setFiles(updatedFiles);
    // Set the file as updated
    setFiles((prevFiles) =>
      prevFiles.map((file) =>
        file.id === fileToDelete.id ? { ...file, isDeleted: true } : file
      )
    );
    setIsDeleteConfirmationVisible(false);
  };

  // Function to cancel file deletion
  const cancelDelete = () => {
    setIsDeleteConfirmationVisible(false);
    setFileToDelete(null);
  };

  // Function to open confirmation dialog for deleting file
  const handleDelete = (item) => {
    setFileToDelete(item);
    setIsDeleteConfirmationVisible(true);
  };

  // Function to handle closing the preview modal
  const onClosePreview = () => {
    setPreviewFileTitle("");
    setPreviewFileType(null);
    setPreviewFileUri(null);
    setIsPreviewModalVisible(false);
  };

  const fetchInitialFiles = async () => {
    try {
      setLoading(true);

      // Iterate over each file ID in the initialFilesIdList
      for (const fileId of initialFilesIdList) {
        const queryFields = {
          fields: [
            "Attachment-id",
            "Attachment-type",
            "Attachment-thumbnail",
            "Attachment-original",
            "Attachment-sourceFile",
            "Attachment-mIMEtype",
            "Attachment-createdOn",
            "Attachment-original:BinaryResource-length",
          ],
          where: [
            {
              fieldName: "Attachment-id",
              operator: "=",
              value: fileId, // Use the current file ID from the list
            },
          ],
          sort: [
            { property: "Attachment-createdOn", direction: "DESC" },
            { property: "Attachment-sourceFile", direction: "ASC" },
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
          response.data &&
          response.data instanceof Array &&
          response.data.length > 0
        ) {
          const fetchedFiles = response.data.map((file) => {
            const id = file["Attachment-id"];
            const type = file["Attachment-type"];
            const mimeType =
              file["Attachment-mIMEtype"] &&
              file["Attachment-mIMEtype"].length < 30
                ? file["Attachment-mIMEtype"]
                : type;
            const name = file["Attachment-sourceFile"];
            const original = file["Attachment-original"];
            const thumbnail = file["Attachment-thumbnail"];
            const unFormattedCreatedOn = new Date(file["Attachment-createdOn"]);
            const createdOn = isValid(unFormattedCreatedOn)
              ? format(
                  unFormattedCreatedOn,
                  convertToDateFNSFormat(APP.LOGIN_USER_DATE_FORMAT)
                )
              : "";
            const size = file["Attachment-original:BinaryResource-length"];

            return {
              id,
              type,
              mimeType,
              name,
              original,
              thumbnail,
              createdOn,
              size,
            };
          });

          // Add the fetched files to the files array
          setFiles((prevFiles) => [...prevFiles, ...fetchedFiles]);
        }
      }
    } catch (error) {
      console.error("Error fetching initial files: ", error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Call fetchInitialFiles when initialFilesIdList changes
    fetchInitialFiles();
  }, [initialFilesIdList]);

  const renderItem = ({ item }) => {
    return (
      <View
        style={[
          styles.fileItem,
          item.hasOwnProperty("isNewlyAdded") &&
            item["isNewlyAdded"] === true &&
            styles.newlyAddedItem,
        ]}
      >
        <View style={styles.textContainer}>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[
              styles.fileItemFirstRow,
              {
                color: loading ? `#b0c4de${disableOpacity}` : "#005eb8",
                textDecorationLine: loading ? "none" : "underline",
              },
            ]}
            onPress={() =>
              handlePreview(
                item,
                setIsPreviewModalVisible,
                setPreviewFileType,
                setPreviewFileUri,
                setPreviewFileTitle,
                t
              )
            }
            disabled={loading}
          >
            {item.name}
          </Text>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={styles.fileItemSecondRow}
          >
            {item.mimeType} {item.size && "|"}{" "}
            {item.size && convertBytesToMegaBytes(item.size)}
          </Text>

          {item.createdOn && (
            <Text style={styles.fileItemThirdRow}>
              {t("created_on")} {item.createdOn}
            </Text>
          )}
          {item.createdBy && (
            <Text numberOfLines={1} ellipsizeMode="tail">
              {t("created_by")} {item.createdBy}
            </Text>
          )}
        </View>
        <View style={styles.iconContainer}>
          <CustomButton
            onPress={() => handleDelete(item)}
            icon={{
              name: "file-remove",
              library: "MaterialCommunityIcons",
              size: 24,
              color: "red",
            }}
            label=""
            backgroundColor={false}
            disabled={loading || isParentLocked}
          />
          <CustomButton
            onPress={() => handleEdit(item)}
            icon={{
              name: "file-edit",
              library: "MaterialCommunityIcons",
              size: 24,
              color: "green",
            }}
            label=""
            backgroundColor={false}
            disabled={loading || isParentLocked}
          />
          <CustomButton
            onPress={() =>
              handleDownload(item, t, setFiles, setDownloadProgressMap)
            }
            icon={{
              name: item.isDownloading
                ? "progress-download" // Icon for files currently downloading
                : "file-download", // Default icon for files
              library: "MaterialCommunityIcons",
              size: 24,
              color: "blue",
            }}
            label=""
            backgroundColor={false}
            disabled={loading || item.isDownloading || item.isNewlyAdded} // Disable if downloading or newly added
          />
        </View>
        {/* Progress bar for download */}
        {item.isDownloading && (
          <View style={styles.progressBarContainer}>
            <View
              style={{
                width: `${
                  downloadProgressMap &&
                  downloadProgressMap.hasOwnProperty(item.id)
                    ? downloadProgressMap[item.id]
                    : 0
                }%`,
                height: 5,
                backgroundColor: "blue",
              }}
            />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.tabContainer}>
      {/* Modal for editing file name */}
      <EditDialog
        isVisible={isEditModalVisible}
        onClose={closeEditModal}
        onConfirm={confirmEditChanges}
        validateInput={validateFilename}
        title={t("edit_file_name")}
        initialValue={selectedFile ? selectedFile.name : ""}
      />
      {/* Confirmation dialog for file deletion */}
      <ConfirmationDialog
        isVisible={isDeleteConfirmationVisible}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        message={`${fileToDelete?.name}\n${t("confirm_deletion_message")}`}
      />
      {/* Modal for previewing file*/}
      <PreviewDialog
        isVisible={isPreviewModalVisible}
        fileUri={previewFileUri}
        fileType={previewFileType}
        fileTitle={previewFileTitle}
        onClose={onClosePreview}
      />
      <View style={styles.header}>
        <Text style={styles.countText}>
          {files.length > 0 ? `${t("count")}: ${files.length}` : null}
        </Text>
        <View style={styles.addFileContainer}>
          <CustomButton
            onPress={pickFile}
            label={t("add_file")}
            icon={{
              name: "file-plus-outline",
              library: "MaterialCommunityIcons",
              color: "#005eb8",
            }}
            backgroundColor={false}
            labelStyle={{
              color: loading ? `#b0c4de${disableOpacity}` : "#005eb8",
              textDecorationLine: loading ? "none" : "underline",
            }}
            disabled={loading}
          />
        </View>
      </View>
      {loading && (
        <View style={styles.loaderErrorContainer}>
          <Text style={common.loadingText}>{t("loading")}...</Text>
          {error && <Text>Error: {error.message}</Text>}
        </View>
      )}
      <FlatList
        data={files}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.flatList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flex: 1,
    justifyContent: "flex-start",
  },
  loaderErrorContainer: {
    paddingVertical: "4%",
    alignItems: "center",
  },
  header: {
    paddingVertical: "2%",
    paddingHorizontal: "4%",
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  countText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
  },
  addFileContainer: {
    justifyContent: "flex-end",
  },
  flatList: {
    flex: 1,
    width: "100%",
  },
  fileItem: {
    padding: "2%",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    backgroundColor: "white",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  iconContainer: {
    flex: 1 / 2,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  fileItemFirstRow: {},
  fileItemSecondRow: {},
  fileItemThirdRow: {},
  newlyAddedItem: {
    backgroundColor: "#fffb6f",
  },
  progressBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ccc",
  },
});

export default File;
