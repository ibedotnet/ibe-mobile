import { useContext } from "react";

import { LoggedInUserInfoContext } from "../../context/LoggedInUserInfoContext";
import { ApprovalUserInfoContext } from "../../context/ApprovalUserInfoContext";

const useEmployeeInfo = (openedFromApproval) => {
  const { loggedInUserInfo } = useContext(LoggedInUserInfoContext);
  const { approvalUserInfo } = useContext(ApprovalUserInfoContext);

  // Return the correct user info based on the openedFromApproval flag
  return openedFromApproval ? approvalUserInfo : loggedInUserInfo;
};

export default useEmployeeInfo;
