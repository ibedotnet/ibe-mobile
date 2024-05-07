import React, { createRef, useEffect, useRef, useState } from "react";
import {
  Animated,
  Button,
  Modal,
  View,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PinchGestureHandler,
  State,
} from "react-native-gesture-handler";

import Pdf from "react-native-pdf";

import { useTranslation } from "react-i18next";

import { screenDimension } from "../../utils/ScreenUtils";

/**
 * A modal component for previewing images or PDF files.
 * @param {Object} props - Component props.
 * @param {boolean} props.isVisible - Flag indicating whether the modal is visible.
 * @param {string} props.fileUri - The URI of the file to preview.
 * @param {string} props.fileType - The type of the file ("image" or "pdf").
 * @param {string} props.fileTitle - Title to display at the top.
 * @param {Function} props.onClose - Callback function to close the modal.
 * @returns {JSX.Element} - The preview dialog component.
 */
const PreviewDialog = ({
  isVisible,
  fileUri,
  fileType,
  fileTitle,
  onClose,
}) => {
  // Initialize useTranslation hook
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [panEnabled, setPanEnabled] = useState(false);

  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const pinchRef = createRef();
  const panRef = createRef();

  const scale = useRef(new Animated.Value(1)).current; // Initialize scale as an Animated Value

  const onPinchGestureEvent = Animated.event([{ nativeEvent: { scale } }], {
    useNativeDriver: true,
  });

  const onPanGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationX: translateX,
          translationY: translateY,
        },
      },
    ],
    {
      useNativeDriver: true,
    }
  );

  const handlePinchStateChange = ({ nativeEvent }) => {
    // Enabled pan only after pinch-zoom
    if (nativeEvent.state === State.ACTIVE) {
      setPanEnabled(true);
    }

    // When scale < 1, reset scale back to original (1)
    const nScale = nativeEvent.scale;
    if (nativeEvent.state === State.END) {
      if (nScale < 1) {
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();

        setPanEnabled(false);
      }
    }
  };

  useEffect(() => {
    // If fileUri exists, set loading to false (resource is loaded)
    if (fileUri) {
      setIsLoading(false);
    }
  }, [fileUri]);

  useEffect(() => {
    if (!isVisible) {
      // Reset scale when the modal is closed
      scale.setValue(1);
      // Reset translateX and translateY values when modal is closed
      translateX.setValue(0);
      translateY.setValue(0);
    }
  }, [isVisible]);

  let content;

  let contentStyle = {
    width: screenDimension.width - 20,
    height: "100%",
  };

  if (isLoading) {
    // Display loader until resource is loaded
    content = <Text style={styles.loadingText}>{t("loading")}...</Text>;
  } else if (fileType === "image") {
    content = (
      <View>
        <PanGestureHandler
          ref={panRef}
          onGestureEvent={onPanGestureEvent}
          simultaneousHandlers={[pinchRef]}
          enabled={panEnabled}
          shouldCancelWhenOutside
        >
          <Animated.View>
            <PinchGestureHandler
              ref={pinchRef}
              onGestureEvent={onPinchGestureEvent}
              simultaneousHandlers={[panRef]}
              onHandlerStateChange={handlePinchStateChange}
            >
              <Animated.Image
                source={{ uri: fileUri }}
                style={[
                  contentStyle,
                  {
                    transform: [{ scale }, { translateX }, { translateY }],
                  },
                ]}
                resizeMode="contain"
              />
            </PinchGestureHandler>
          </Animated.View>
        </PanGestureHandler>
      </View>
    );
  } else if (fileType === "pdf") {
    content = (
      <Pdf
        source={{ uri: fileUri }}
        onLoadComplete={(numberOfPages, filePath) => {
          console.debug(`Number of pages: ${numberOfPages}`);
        }}
        onPageChanged={(page, numberOfPages) => {
          console.debug(`Current page: ${page}`);
        }}
        onError={(error) => {
          console.error("PDF viewer error:", error);
        }}
        style={styles.pdf}
      />
    );
  } else {
    content = (
      <Text style={styles.errorText}>{t("unsupported_file_type")}</Text>
    );
  }

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.previewDialogContainer}>
        <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
          {fileTitle}
        </Text>
        <ScrollView contentContainerStyle={styles.scrollView} centerContent>
          <GestureHandlerRootView>{content}</GestureHandlerRootView>
        </ScrollView>
        <Button title={t("close")} onPress={onClose} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  loadingText: {
    color: "white",
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    fontWeight: "bold",
  },
  previewDialogContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    padding: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  scrollView: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  pdf: {
    flex: 1,
    width: "100%",
  },
});

export default PreviewDialog;
