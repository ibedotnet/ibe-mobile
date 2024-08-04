import React, { createContext, useState, useContext } from "react";

// Create separate context for Timesheet module
const TimesheetSaveContext = createContext();

// Create separate context for Expense module
const ExpenseSaveContext = createContext();

// Create separate context for Absence module
const AbsenceSaveContext = createContext();

/**
 * Provider component for managing the save state related to the Timesheet module.
 * It provides a context for components within the Timesheet module to access and update the save state.
 */
export const TimesheetSaveProvider = ({ children }) => {
  const [isSaveClicked, setIsSaveClicked] = useState(false);

  const notifySave = () => {
    setIsSaveClicked(true);
  };

  const resetSave = () => {
    setIsSaveClicked(false);
  };

  return (
    <TimesheetSaveContext.Provider value={{ isSaveClicked, notifySave, resetSave }}>
      {children}
    </TimesheetSaveContext.Provider>
  );
};

/**
 * Provider component for managing the save state related to the Expense module.
 * It provides a context for components within the Expense module to access and update the save state.
 */
export const ExpenseSaveProvider = ({ children }) => {
  const [isSaveClicked, setIsSaveClicked] = useState(false);

  const notifySave = () => {
    setIsSaveClicked(true);
  };

  const resetSave = () => {
    setIsSaveClicked(false);
  };

  return (
    <ExpenseSaveContext.Provider value={{ isSaveClicked, notifySave, resetSave }}>
      {children}
    </ExpenseSaveContext.Provider>
  );
};

/**
 * Provider component for managing the save state related to the Absence module.
 * It provides a context for components within the Absence module to access and update the save state.
 */
export const AbsenceSaveProvider = ({ children }) => {
  const [isSaveClicked, setIsSaveClicked] = useState(false);

  const notifySave = () => {
    setIsSaveClicked(true);
  };

  const resetSave = () => {
    setIsSaveClicked(false);
  };

  return (
    <AbsenceSaveContext.Provider value={{ isSaveClicked, notifySave, resetSave }}>
      {children}
    </AbsenceSaveContext.Provider>
  );
};

// Custom hook to access Timesheet save context
export const useTimesheetSave = () => useContext(TimesheetSaveContext);

// Custom hook to access Expense save context
export const useExpenseSave = () => useContext(ExpenseSaveContext);

// Custom hook to access Absence save context
export const useAbsenceSave = () => useContext(AbsenceSaveContext);