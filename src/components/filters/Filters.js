import React, { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  View,
} from "react-native";

import DateFilter from "./DateFilter";
import DurationFilter from "./DurationFilter";
import TextFilter from "./TextFilter";

import {
  convertFiltersToWhereCondition,
  convertToBusObjCatFormat,
  filtersMap,
  handleDateFilter,
  handleDurationFilter,
  handleTextFilter,
  validateAppliedFilters,
} from "../../utils/FilterUtils";

import SaveCancelBar from "../SaveCancelBar";
import { showToast } from "../../utils/MessageUtils";

const Filters = ({ route, navigation }) => {
  const { busObjCatFilters, busObjCat, initialFilters } = route.params;

  const [appliedFilters, setAppliedFilters] = useState(initialFilters || {});
  const [appliedFiltersCount, setAppliedFiltersCount] = useState(0);
  const [clearFilterValue, setClearFilterValue] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState({});

  const applyFilters = () => {
    setUnsavedChanges({});

    const validationResult = validateAppliedFilters(
      appliedFilters,
      filtersMap[busObjCat]
    );
    if (validationResult?.isValid === false) {
      showToast(validationResult.message);
      return;
    }

    const convertedAppliedFilters = convertToBusObjCatFormat(
      appliedFilters,
      filtersMap[busObjCat],
      busObjCat
    );

    const whereConditions = convertFiltersToWhereCondition(
      convertedAppliedFilters,
      filtersMap[busObjCat],
      busObjCat
    );

    console.debug(
      `On click of "Apply" in filters screen the list of filters going to be applied in ${busObjCat} is ${JSON.stringify(
        convertedAppliedFilters
      )} and the list of where conditions is ${JSON.stringify(
        whereConditions
      )}. Also, the object maintaining unsaved changes (if any) is ${JSON.stringify(
        unsavedChanges
      )}`
    );

    // Delaying the navigation slightly ensures that the state update occurs before navigating to the next screen.
    // This prevents the beforeRemove event from being invoked with non-empty unsaved changes,
    // which would otherwise trigger the discard dialog incorrectly when the user clicks on apply or reset.
    setTimeout(() => {
      navigation.navigate(busObjCat, {
        whereConditions,
        convertedAppliedFilters,
        appliedFiltersCount,
      });
    }, 100);
  };

  const resetFilters = () => {
    setAppliedFilters({});
    setUnsavedChanges({});
    setClearFilterValue(true);

    console.debug(
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
    }, 200);
  };

  const renderFilter = (filter) => {
    switch (filter.type) {
      case "text":
        return (
          <TextFilter
            key={filter.id}
            label={filter.label}
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
            label={filter.label}
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
            label={filter.label}
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
      default:
        return null;
    }
  };

  /**
   * Update the count of applied filters whenever the appliedFilters state changes.
   *
   * This effect updates the count of applied filters based on the changes in the appliedFilters state.
   * It sets the appliedFiltersCount state to the length of the applied filters array.
   */
  useEffect(() => {
    setAppliedFiltersCount(Object.keys(appliedFilters).length);
  }, [appliedFilters]);

  /**
   * Update the header title to reflect the count of applied filters.
   *
   * This effect updates the header title of the screen to include the count of applied filters.
   * It sets the header title to "Filters (count)" where count represents the number of applied filters.
   */
  useEffect(() => {
    navigation.setOptions({
      headerTitle: `Filters (${Object.keys(appliedFilters).length})`,
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

  useEffect(
    () =>
      navigation.addListener("beforeRemove", (e) => {
        console.debug(
          `Before navigating from filters screen to ${busObjCat} screen, object maintaing unsaved changes (if any) is ${JSON.stringify(
            unsavedChanges
          )}`
        );

        const unsavedChangesExist = Object.values(unsavedChanges).some(
          (change) => change === true
        );

        if (!unsavedChangesExist) {
          // If we don't have unsaved changes, then we don't need to do anything
          return;
        }

        // Prevent default behavior of leaving the screen
        e.preventDefault();

        // Prompt the user before leaving the screen
        Alert.alert(
          "Discard ?",
          "You have unapplied changes. Are you sure to discard them and leave the screen?",
          [
            { text: "Don't leave", style: "cancel", onPress: () => {} },
            {
              text: "Discard",
              style: "destructive",
              // If the user confirmed, then we dispatch the action we blocked earlier
              // This will continue the action that had triggered the removal of the screen
              onPress: () => navigation.dispatch(e.data.action),
            },
          ]
        );
      }),
    [navigation, unsavedChanges]
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.filterContainer}>
          {busObjCatFilters.map((filter) => renderFilter(filter))}
        </View>
      </ScrollView>
      <SaveCancelBar
        onSave={applyFilters}
        onCancel={resetFilters}
        saveLabel="Apply"
        cancelLabel="Reset"
        saveIcon="check"
        cancelIcon="times"
      />
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
});

export default Filters;
