import React, { createContext, useState, useContext } from "react";

// Create separate context for Timesheet module
const TimesheetForceRefreshContext = createContext();

// Create separate context for Expense module
const ExpenseForceRefreshContext = createContext();

// Create separate context for Absence module
const AbsenceForceRefreshContext = createContext();

/**
 * Provider component for managing the force refresh state related to the Timesheet module.
 * It provides a context for components within the Timesheet module to access and update the force refresh state.
 */
export const TimesheetForceRefreshProvider = ({ children }) => {
  const [forceRefresh, setForceRefresh] = useState(false);

  const updateForceRefresh = (value) => {
    setForceRefresh(value);
  };

  return (
    <TimesheetForceRefreshContext.Provider
      value={{ forceRefresh, updateForceRefresh }}
    >
      {children}
    </TimesheetForceRefreshContext.Provider>
  );
};

/**
 * Provider component for managing the force refresh state related to the Expense module.
 * It provides a context for components within the Expense module to access and update the force refresh state.
 */
export const ExpenseForceRefreshProvider = ({ children }) => {
  const [forceRefresh, setForceRefresh] = useState(false);

  const updateForceRefresh = (value) => {
    setForceRefresh(value);
  };

  return (
    <ExpenseForceRefreshContext.Provider
      value={{ forceRefresh, updateForceRefresh }}
    >
      {children}
    </ExpenseForceRefreshContext.Provider>
  );
};

/**
 * Provider component for managing the force refresh state related to the Absence module.
 * It provides a context for components within the Absence module to access and update the force refresh state.
 */
export const AbsenceForceRefreshProvider = ({ children }) => {
  const [forceRefresh, setForceRefresh] = useState(false);

  const updateForceRefresh = (value) => {
    setForceRefresh(value);
  };

  return (
    <AbsenceForceRefreshContext.Provider
      value={{ forceRefresh, updateForceRefresh }}
    >
      {children}
    </AbsenceForceRefreshContext.Provider>
  );
};

// Custom hook to access Timesheet force refresh context
export const useTimesheetForceRefresh = () =>
  useContext(TimesheetForceRefreshContext);

// Custom hook to access Expense force refresh context
export const useExpenseForceRefresh = () =>
  useContext(ExpenseForceRefreshContext);

// Custom hook to access Absence force refresh context
export const useAbsenceForceRefresh = () =>
  useContext(AbsenceForceRefreshContext);
