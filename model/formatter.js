sap.ui.define([], function() {
	"use strict";

	return {

		/**
		 * Rounds the number unit value to 2 digits
		 * @public
		 * @param {string} sValue the number string to be rounded
		 * @returns {string} sValue with 2 digits rounded
		 */
		numberUnit: function(sValue) {
			if (!sValue) {
				return "";
			}
			return parseFloat(sValue).toFixed(2);
		},

		operationStatusTextFormatter: function(bIsSstarted, bIsInterrupted) {
			if (!bIsSstarted && !bIsInterrupted) {
				return "Stopped";
			}
			if (bIsSstarted === true) {
				return "Started";
			} else if (bIsInterrupted === true) {
				return "Interrupted";
			} else {
				return "Stopped";
			}
		},
		operationStatusStateFormatter: function(bIsSstarted, bIsInterrupted) {
			if (!bIsSstarted && !bIsInterrupted) {
				return "Warning";
			}
			if (bIsSstarted === true) {
				return "Success";
			} else if (bIsInterrupted === true) {
				return "Error";
			} else {
				return "Warning";
			}
		},
		operationStatusIconFormatter: function(bIsInterrupted) {
			if (!bIsInterrupted) {
				return null;
			}
			if (bIsInterrupted === true) {
				// return "sap-icon://error";
				return "sap-icon://alert";
			} else {
				return null;
			}
		},
		ommitLeadingZero: function(sValue) {
			if (!sValue) {
				return null;
			}

			return sValue.replace(/^0+/, '');
		},
		progressQtyFormatter: function(quantity) {
			// Calculate the absolute difference beteen target and norm in hours	
			if (quantity) {
				return parseFloat(quantity);
			}

			// 			if (actual && planned) {
			// //				alert(actual);
			// 				var actualFloat = parseFloat(actual, 2);
			// 				var plannedFloat = parseFloat(planned, 2);
			// 				var result = ( actualFloat / plannedFloat ) * 100;
			// 				//result = parseFloat(result,2);
			// 				//result = result.toFixed(2) ;

			// 			result = Number((result).toFixed(2));
			// //				result = Math.abs(result);
			// alert(result);
			// 				return Math.abs(result);
			// //				return result.toFixed(1);
			// 			} else {
			// 				return null;
			// 			}
		},
		progressValueColorFormatter: function(actual, target) {
			// Determine the progress value color
			if (actual && target) {
				//				alert(actual);
				var actualFloat = parseFloat(actual, 2);
				var targetFloat = parseFloat(target, 2);
				var percentage = (actualFloat / targetFloat) * 100;
				//result = parseFloat(result,2);
				//result = result.toFixed(2) ;
				percentage = Math.abs(Number((percentage).toFixed(2)));
				if (percentage > 75) {
					return "Good";
				} else {
					return "Error";
				}
			}
		}
	};
});