sap.ui.define([
	"SFS/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"SFS/model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"SFS/model/input"
], function(BaseController, JSONModel, formatter, Filter, FilterOperator, input) {
	"use strict";

	return BaseController.extend("SFS.controller.Worklist", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function() {
			var oViewModel,
				iOriginalBusyDelay,
				oTable = this.byId("table");

			// Put down worklist table's original value for busy indicator delay,
			// so it can be restored later on. Busy handling on the table is
			// taken care of by the table itself.
			iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
			this._oTable = oTable;
			// keeps the search state
			this._oTableSearchState = [];

			// Model used to manipulate control states
			oViewModel = new JSONModel({
				worklistTableTitle: this.getResourceBundle().getText("worklistTableTitle"),
				saveAsTileTitle: this.getResourceBundle().getText("worklistViewTitle"),
				shareOnJamTitle: this.getResourceBundle().getText("worklistViewTitle"),
				shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
				shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
				tableNoDataText: this.getResourceBundle().getText("tableNoDataText"),
				tableBusyDelay: 0
			});
			this.setModel(oViewModel, "worklistView");

			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oTable.attachEventOnce("updateFinished", function() {
				// Restore original busy indicator delay for worklist's table
				oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			});
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
		/**
		 * Triggered by the table's 'updateFinished' event: after new table
		 * data is available, this handler method updates the table counter.
		 * This should only happen if the update was successful, which is
		 * why this handler is attached to 'updateFinished' and not to the
		 * table's list binding's 'dataReceived' method.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public s
		 */
		onUpdateFinished: function(oEvent) {
			// update the worklist's object counter after the table update
			var sTitle,
				oTable = oEvent.getSource(),
				iTotalItems = oEvent.getParameter("total");
			// only update the counter if the length is final and
			// the table is not empty
			if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
			} else {
				sTitle = this.getResourceBundle().getText("worklistTableTitle");
			}
			this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
		},

		/**
		 * Event handler when a table item gets pressed
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
		onPress: function(oEvent) {
			// The source is the list item that got pressed
			this._showObject(oEvent.getSource());
		},

		/**
		 * Navigates back in the browser history, if the entry was created by this app.
		 * If not, it navigates to the Fiori Launchpad home page.
		 * @public
		 */
		onNavBack: function() {
			var oHistory = sap.ui.core.routing.History.getInstance(),
				sPreviousHash = oHistory.getPreviousHash(),
				oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

			if (sPreviousHash !== undefined) {
				// The history contains a previous entry
				history.go(-1);
			} else {
				// Navigate back to FLP home
				oCrossAppNavigator.toExternal({
					target: {
						shellHash: "#"
					}
				});
			}
		},

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function() {
			var oViewModel = this.getModel("worklistView"),
				oShareDialog = sap.ui.getCore().createComponent({
					name: "sap.collaboration.components.fiori.sharing.dialog",
					settings: {
						object: {
							id: location.href,
							share: oViewModel.getProperty("/shareOnJamTitle")
						}
					}
				});
			oShareDialog.open();
		},

		onSearch: function(oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRefresh();
			} else {
				var oTableSearchState = [];
				var sQuery = oEvent.getParameter("query");

				if (sQuery && sQuery.length > 0) {
					var filter = new Filter("SearchField", sap.ui.model.FilterOperator.Contains, sQuery);
					oTableSearchState.push(filter);
					// oTableSearchState = [new Filter("SearchField", FilterOperator.Contains, sQuery)];
				}
				this._applySearch(oTableSearchState);
			}

		},

		onShowInputPopover: function(oEvent) {
			var oPopover = this._getPopover();
			var oSource = oEvent.getSource();
			// connect dialog to view (models, lifecycle)
			this.getView().addDependent(oPopover);
			var oInputModel = new sap.ui.model.json.JSONModel();
			oPopover.setModel(oInputModel, "input");
			oPopover.bindElement(oSource.getBindingContext().getPath());

			// open dialog
			oPopover.openBy(oSource);
		},

		handleInputCancelButton: function(oEvent) {
			// Close the dialog	

			var oPopover = this._getPopover();
			if (oPopover) {
				oPopover.close();
			}
		},

		handleSubmitInput: function() {
			this.handleInputOkButton();
		},

		handleInputOkButton: function(oEvent) {
			// process input and close the popup
			var oPopover = this._getPopover();
			if (!oPopover) {
				return;
			}

			var oInputModel = oPopover.getModel("input");
			var qty = oInputModel.getProperty("/quantity");

			// Process the input data
			var oDataModel = this.getModel();
			oPopover = this._getPopover();
			//					var oObject = oEvent.getSource().getBindingContext().getObject();
			var oObject = oPopover.getBindingContext().getObject();
			input.inputQty(oObject.ProductionOrder, oObject.OperationStep, qty, oDataModel, oPopover);
		},

		onPressProductionStartStop: function(oEvent) {
			// Get current production status
			var oSource = oEvent.getSource();
			var oObject = oSource.getBindingContext().getObject();
			if (oObject.ProductionStarted === true) {
				var method = "StopProduction";
			} else {
				method = "StartProduction";
			}
			//				this.getModel().setUseBatch(true);
			var oDataModel = this.getModel();

			var fnOnError = function(oResponse) {
					alert("Niet geluktt");
				},
				fnOk = function(oData, oResponse) {
					oDataModel.refresh();
				}.bind(this);

			oDataModel.callFunction("/" + method, {
				method: "GET",
				urlParameters: {
					OperationStep: oObject.OperationStep,
					ProductionOrder: oObject.ProductionOrder
				},
				success: fnOk,
				error: fnOnError
			});
		},

		_getPopover: function() {
			// create dialog lazily
			if (!this._oPopover) {
				// create popover via fragment factory
				this._oPopover = sap.ui.xmlfragment(
					"SFS.view.ResponsivePopoverInput", this);
			}
			return this._oPopover;
		},

		onWorkcenterChanged: function(oEvent) {
			// Bind the selceted month to vizframe
			var workCenterId = oEvent.getParameter("selectedItem").getProperty("key");
			var oFilter = new sap.ui.model.Filter("WorkcenterId", "EQ", workCenterId);
			var oTable = this.byId("table"),
				oBinding = oTable.getBinding("items");
			if (oFilter) {
				oBinding.filter(oFilter);
			} else {
				oBinding.filter([]);
			}

			//			var sPath = oEvent.getParameter("selectedItem").getBindingContext().getPath();
			// var oVizFrame = this.getView().byId("idVizFrameMonth");
			// oVizFrame.bindElement(sPath);
		},

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh: function() {
			this._oTable.getBinding("items").refresh();
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Shows the selected item on the object page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showObject: function(oItem) {
			this.getRouter().navTo("object", {
				plant: oItem.getBindingContext().getProperty("Plant"),
				productionOrder: oItem.getBindingContext().getProperty("ProductionOrder"),
				operationStep: oItem.getBindingContext().getProperty("OperationStep")

			});
		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @private
		 */
		_applySearch: function(oTableSearchState) {
			var oViewModel = this.getModel("worklistView");
			this._oTable.getBinding("items").filter(oTableSearchState, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (oTableSearchState.length !== 0) {
				oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
			}
		}

	});
});