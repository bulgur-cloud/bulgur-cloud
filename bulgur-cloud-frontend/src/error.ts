import { Platform } from "react-native";

export const ERR_NOT_IMPLEMENTED = {
  code: "not_implemented",
  title: "Not implemented",
  description: `This functionality has not been implemented yet for ${Platform.OS}.`
};

export const ERR_DATA_AND_FORM_DATA = {
  code: "data_and_form_data",
  title: "Internal Implementation Error",
  description: "Both the data and the form data fields have been provided for the request."
};
