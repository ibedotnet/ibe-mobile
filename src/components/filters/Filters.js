import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  SafeAreaView,
  ScrollView,
  View,
  KeyboardAvoidingView,
  Platform,
  Text,
} from "react-native";
import { useTranslation } from "react-i18next";
import { BUSOBJCATMAP } from "../../constants";
import DateFilter from "./DateFilter";
import DurationFilter from "./DurationFilter";
import StatusFilter from "./StatusFilter";
import TextFilter from "./TextFilter";

import {
  convertFiltersToOrConditions,
  convertFiltersToWhereConditions,
  convertToBusObjCatFormat,
  filtersMap,
  handleDateFilter,
  handleDurationFilter,
  handleStatusFilter,
  handleTextFilter,
  validateAppliedFilters,
} from "../../utils/FilterUtils";
import { showToast } from "../../utils/MessageUtils";

import SaveCancelBar from "../SaveCancelBar";
import CustomBackButton from "../CustomBackButton";

const Filters = ({ route, navigation }) => {
  const { busObjCatFilters, busObjCat, initialFilters } = route.params;

  // Initialize useTranslation hook
  const { t } = useTranslation();

  const [appliedFilters, setAppliedFilters] = useState(initialFilters || {});
  const [appliedFiltersCount, setAppliedFiltersCount] = useState(0);
  const [clearFilterValue, setClearFilterValue] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState({});

  const applyFilters = () => {
    setUnsavedChanges({});

    const validationResult = validateAppliedFilters(
      appliedFilters,
      filtersMap[busObjCat],
      t
    );

    if (validationResult?.isValid === false) {
      showToast(validationResult.message, "error");
      return;
    }

    const convertedAppliedFilters = convertToBusObjCatFormat(
      appliedFilters,
      filtersMap[busObjCat],
      busObjCat
    );

    const whereConditions = convertFiltersToWhereConditions(
      convertedAppliedFilters,
      filtersMap[busObjCat],
      busObjCat
    );

    const orConditions = convertFiltersToOrConditions(
      convertedAppliedFilters,
      filtersMap[busObjCat],
      busObjCat
    );

    console.log(
      `On click of "Apply" in filters screen the list of filters going to be applied in ${busObjCat} is ${JSON.stringify(
        convertedAppliedFilters,
        null,
        2
      )}. The applied filters is ${JSON.stringify(appliedFilters)}.
      The converted applied filters is ${JSON.stringify(
        convertedAppliedFilters,
        null,
        2
      )}. The list of where conditions is ${JSON.stringify(
        whereConditions,
        null,
        2
      )}. The list of or conditions is ${JSON.stringify(
        orConditions,
        null,
        2
      )}. Also, the object maintaining unsaved changes (if any) is ${JSON.stringify(
        unsavedChanges,
        null,
        2
      )}`
    );

    // Delaying the navigation slightly ensures that the state update occurs before navigating to the next screen.
    // This prevents the beforeRemove event from being invoked with non-empty unsaved changes,
    // which would otherwise trigger the discard dialog incorrectly when the user clicks on apply or reset.
    setTimeout(() => {
      navigation.navigate(busObjCat, {
        whereConditions,
        orConditions,
        convertedAppliedFilters,
        appliedFiltersCount,
      });
    }, 100);
  };

  const resetFilters = () => {
    setAppliedFilters({});
    setUnsavedChanges({});
    setClearFilterValue(true);

    console.log(
      `On click of "Reset" in filters screen the list of filters going to be applied in ${busObjCat} is ${JSON.stringify(
        appliedFilters
      )} and the object maintaining unsaved changes (if any) is ${JSON.stringify(
        unsavedChanges
      )}`
    );

    // By adding this delay, we ensure that any pending state updates are processed before initiating
    // the navigation, ensuring a smooth user experience without unnecessary discard dialogs.
    setTimeout(() => {
      navigation.navigate(busObjCat, []);
    }, 500);
  };

  const renderFilter = (filter) => {
    // Translate the filter label using t()
    const translatedLabel = t(filter.label);

    switch (filter.type) {
      case "text":
        return (
          <TextFilter
            key={filter.id}
            label={translatedLabel}
            initialValue={appliedFilters[filter.id]} // Pass initial value to pre-populate the filter
            onFilter={(value) =>
              handleTextFilter(
                filter.id,
                value,
                initialFilters,
                appliedFilters,
                setAppliedFilters,
                setUnsavedChanges
              )
            }
            clearValue={clearFilterValue}
          />
        );
      case "duration":
        return (
          <DurationFilter
            key={filter.id}
            label={translatedLabel}
            initialValue={appliedFilters[filter.id]} // Pass initial value to pre-populate the filter
            onFilter={({ greaterThanValue, lessThanValue, unit }) =>
              handleDurationFilter(
                filter.id,
                { greaterThanValue, lessThanValue, unit },
                initialFilters,
                appliedFilters,
                setAppliedFilters,
                setUnsavedChanges
              )
            }
            clearValue={clearFilterValue}
            units={filter.units}
            convertToMillisecondsEnabled={filter.convertToMillisecondsEnabled}
          />
        );
      case "date":
        return (
          <DateFilter
            key={filter.id}
            label={translatedLabel}
            initialValue={appliedFilters[filter.id]} // Pass initial value to pre-populate the filter
            onFilter={({ greaterThanDate, lessThanDate }) =>
              handleDateFilter(
                filter.id,
                { greaterThanDate, lessThanDate },
                initialFilters,
                appliedFilters,
                setAppliedFilters,
                setUnsavedChanges
              )
            }
            clearValue={clearFilterValue}
            initlalMode={filter.initialMode}
            isTimePickerVisible={filter.isTimePickerVisible}
          />
        );
      case "status":
        return (
          <StatusFilter
            key={filter.id}
            label={translatedLabel}
            initialValue={appliedFilters[filter.id]} // Pass initial value to pre-populate the filter
            onFilter={(value) =>
              handleStatusFilter(
                filter.id,
                value,
                initialFilters,
                appliedFilters,
                setAppliedFilters,
                setUnsavedChanges
              )
            }
            clearValue={clearFilterValue}
            busObjCat={BUSOBJCATMAP[busObjCat]}
          />
        );
      default:
        return null;
    }
  };

  /**
   * Determines if there are any unsaved changes by checking if any value in the `unsavedChanges` object is `true`.
   *
   * @param {Object} unsavedChanges - An object representing the unsaved changes for various fields. Each key corresponds to a field, and the value is a boolean indicating if the change is unsaved.
   *
   * The useMemo hook memoizes the result to prevent recalculating unless `unsavedChanges` changes, optimizing performance by avoiding unnecessary checks.
   *
   * @returns {boolean} - Returns `true` if any field has unsaved changes, otherwise `false`.
   */
  const hasUnsavedChanges = useMemo(() => {
    console.log(
      `Before navigating from filters screen to ${busObjCat} screen, object maintaining unsaved changes (if any)
       is ${JSON.stringify(unsavedChanges)}`
    );

    return Object.values(unsavedChanges).some((change) => change === true);
  }, [unsavedChanges]);

  /**
   * Renders the left section of the header with a custom back button and a text label showing the applied filters count.
   *
   * @param {Object} navigation - React Navigation object for navigation handling.
   * @param {Function} t - Localization function for translating text.
   * @param {number} appliedFiltersCount - Number of applied filters to display.
   *
   * @returns {JSX.Element} A View with the CustomBackButton and a Text displaying applied filters count.
   */
  const headerLeft = useCallback(() => {
    return (
      <View style={styles.headerLeftContainer}>
        <CustomBackButton
          navigation={navigation}
          hasUnsavedChanges={hasUnsavedChanges}
          t={t}
        />
        <Text
          style={styles.headerLeftText}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {`${t("filters")} (${appliedFiltersCount})`}
        </Text>
      </View>
    );
  }, [hasUnsavedChanges, appliedFiltersCount]);

  /**
   * Update the count of applied filters whenever the appliedFilters state changes.
   * This effect updates the count of applied filters based on the changes in the appliedFilters state.
   * It sets the appliedFiltersCount state to the length of the applied filters array.
   *
   * Update the header title to reflect the count of applied filters.
   * This effect also updates the header title of the screen to include the count of applied filters.
   * It sets the header title to "Filters (count)" where count represents the number of applied filters.
   *
   * Dependencies:
   * - appliedFilters: The state containing the applied filters.
   */
  useEffect(() => {
    // Update the count of applied filters
    const appliedFiltersCount = Object.keys(appliedFilters).length;
    setAppliedFiltersCount(appliedFiltersCount);

    // Update the header title
    navigation.setOptions({
      headerTitle: "",
      gestureEnabled: false,
      headerLeft: headerLeft,
    });
  }, [appliedFilters]);

  /**
   * Reset the clear filter values after clearing filters.
   *
   * This effect resets the clear filter values after the filters have been cleared.
   * It sets the clearFilterValue state to false when clearFilterValue is true, indicating that the filters have been cleared.
   */
  useEffect(() => {
    if (clearFilterValue) {
      setClearFilterValue(false);
    }
  }, [clearFilterValue]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={20}
      >
        <ScrollView>
          <View style={styles.filterContainer}>
            {busObjCatFilters.map((filter) => renderFilter(filter))}
          </View>
        </ScrollView>
        <SaveCancelBar
          onSave={applyFilters}
          onCancel={resetFilters}
          saveLabel={t("apply")}
          cancelLabel={t("reset")}
          saveIcon="check"
          cancelIcon="times"
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    flex: 1,
    justifyContent: "center",
    alignContent: "space-around",
    padding: "5%",
  },
  headerLeftContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  headerLeftText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
});

export default Filters;
