import React, { createContext, useState } from "react";

// Creating the context to provide approval user information throughout the app
export const ApprovalUserInfoContext = createContext();

/**
 * ApprovalUserInfoProvider component wraps the children components to provide
 * the approval user's information context.
 *
 * @param {Object} props - React props
 * @param {React.ReactNode} props.children - Child components that will have access to the context
 *
 * @returns {JSX.Element} The provider component with children wrapped in context
 */
export const ApprovalUserInfoProvider = ({ children }) => {
  // State to hold approval user information
  const [approvalUserInfo, setApprovalUserInfo] = useState({
    userType: null,
    timeConfirmationType: "",
    hireDate: null,
    termDate: null,
    confirmationDate: null,
    noticePeriod: null,
    personId: null,
    companyId: null,
    workScheduleExtId: null,
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
    // Add more fields as needed for approval users
  });

  return (
    <ApprovalUserInfoContext.Provider
      value={{ approvalUserInfo, setApprovalUserInfo }}
    >
      {children}
    </ApprovalUserInfoContext.Provider>
  );
};
