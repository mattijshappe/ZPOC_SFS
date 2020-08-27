sap.ui.define([],
	function() {
		"use strict";

		return {
			inputQty: function(sOrderId, sOperationId, fQty, oDataModel, oPopover) {
				var fnOnError = function() {
						alert("Niet gelukt");
						//close the popover		
						oPopover.close();
					},
					fnOk = function() {
						oDataModel.refresh();
						//close the popover		
						oPopover.close();
						//this.onNavBack();
					};

				oDataModel.callFunction("/Input", {
					method: "GET",
					urlParameters: {
						OperationStep: sOperationId,
						ProductionOrder: sOrderId,
						Quantity: fQty,
						UnitOfMeasure: "PCE"
					},
					success: fnOk,
					error: fnOnError
				});
			}
		};
	});