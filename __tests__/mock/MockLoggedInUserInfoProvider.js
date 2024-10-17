import React from "react";
import { LoggedInUserInfoContext } from "../../context/LoggedInUserInfoContext";

/**
 * MockedLoggedInUserInfoProvider component provides a mocked context value
 * for testing purposes.
 *
 * @param {Object} props - React props
 * @param {React.ReactNode} props.children - Child components that will have access to the mocked context
 * @param {Object} [props.mockValue] - Optional mocked value for the context
 *
 * @returns {JSX.Element} The mocked provider component with children wrapped in context
 */
export const MockLoggedInUserInfoProvider = ({ children, mockValue }) => {
  const defaultMockValue = {
    loggedInUserInfo: {
      timeConfirmationType: "",
      hireDate: null,
      termDate: null,
      personId: null,
      companyId: null,
      workScheduleExtId: "",
      workScheduleName: null,
      calendarExtId: null,
      nonWorkingDates: null,
      nonWorkingDays: null,
      startOfWeek: null,
      dailyStdHours: null,
      stdWorkHours: null,
      minWorkHours: null,
      maxWorkHours: null,
      workHoursInterval: null,
      patterns: null,
    },
    setLoggedInUserInfo: jest.fn(), // Mock function
  };

  // Use the provided mockValue or fallback to the default mock value
  const value = mockValue || defaultMockValue;

  return (
    <LoggedInUserInfoContext.Provider value={value}>
      {children}
    </LoggedInUserInfoContext.Provider>
  );
};