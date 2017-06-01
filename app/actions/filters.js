var C = require("../constants").default;

module.exports = {
   toggleExpandSingleResponse: function (rkey) {
      return {type:C.TOGGLE_EXPAND_SINGLE_RESPONSE, rkey}
   },
   collapseAllResponses: function () {
      return {type:C.COLLAPSE_ALL_RESPONSES}
   },
   expandAllResponses: function (expandedResponses) {
      return {type:C.EXPAND_ALL_RESPONSES, expandedResponses}
   },
   toggleStatusField: function (status) {
      return {type:C.TOGGLE_STATUS_FIELD, status}
   },
   toggleResponseSort: function (field) {
      return {type:C.TOGGLE_RESPONSE_SORT, field}
   },
   resetAllFields: function () {
     return {type: C.RESET_ALL_FIELDS}
   },
   getFormattedFilterData: function () {
     return {type: C.GET_FORMATTED_FILTER_DATA}
   }
};
