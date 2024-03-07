import { APP, APP_ACTIVITY_ID } from "../constants";
import { updateFields } from "./APIUtils";

const updateBusObjCat = (linkBackToBusObjcat, binaryResource) => {
  try {
    let formData = {};
    let customQueryStringParams = {};
    if (linkBackToBusObjcat === "Resource") {
      formData = {
        data: {
          "Resource-photoID": binaryResource.photoId,
          "Resource-thumbnailID": binaryResource.thumbId,
          "Resource-type": "employee",
          "Resource-id": APP.LOGIN_USER_EMPLOYEE_ID,
        },
      };
      customQueryStringParams = {
        component: "platform",
        doNotReplaceAnyList: true,
        appName: APP_ACTIVITY_ID.EMPLOYEE,
      };
    }
    updateFields(formData, customQueryStringParams);
  } catch (error) {
    console.error("Error in updateBusObjCat:", error);
  }
};

export { updateBusObjCat };
