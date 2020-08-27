/*global location*/
sap.ui.define([
	"SFS/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"SFS/model/formatter",
	"SFS/model/input"
], function(BaseController, JSONModel, History, formatter, input) {
	"use strict";
	return BaseController.extend("SFS.controller.Object", {
		formatter: formatter,
		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */
		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function() {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var iOriginalBusyDelay, oViewModel = new JSONModel({
				busy: true,
				delay: 0
			});
			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
			// Store original busy indicator delay, so it can be restored later on
			iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
			this.setModel(oViewModel, "objectView");
			this.getOwnerComponent().getModel().metadataLoaded().then(function() {
				// Restore original busy indicator delay for the object view
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			}); // this.getView().byId("idTestBtn").addStyleClass("circleButton");
			// this.getView().byId("idTestBtn").setHeight("200px");
		},
		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function() {
			var oViewModel = this.getModel("objectView"),
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
		/**
		 * Event handler  for navigating back.
		 * It checks if there is a history entry. If yes, history.go(-1) will happen.
		 * If not, it will replace the current entry of the browser history with the worklist route.
		 * @public
		 */
		onNavBack: function() {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();
			if (sPreviousHash !== undefined) {
				// The history contains a previous entry
				history.go(-1);
			} else {
				// Otherwise we go backwards with a forward history
				var bReplace = true;
				this.getRouter().navTo("worklist", {}, bReplace);
			}
		},
		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */
		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function(oEvent) {
			var sPlant = oEvent.getParameter("arguments").plant;
			var sProductionOrder = oEvent.getParameter("arguments").productionOrder;
			var sOperationStep = oEvent.getParameter("arguments").operationStep;
			var sObjectPath = this.getModel().createKey("OperationSet", {
				Plant: sPlant,
				ProductionOrder: sProductionOrder,
				OperationStep: sOperationStep
			});
			this._bindView("/" + sObjectPath);
		},
		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound
		 * @private
		 */
		_bindView: function(sObjectPath) {
			var oViewModel = this.getModel("objectView"),
				oDataModel = this.getModel();
			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function() {
						oDataModel.metadataLoaded().then(function() {
							// Busy indicator on view should only be set if metadata is loaded,
							// otherwise there may be two busy indications next to each other on the
							// screen. This happens because route matched handler already calls '_bindView'
							// while metadata is loaded.
							oViewModel.setProperty("/busy", true);
						});
					},
					dataReceived: function() {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},
		onPressProductionStartStop: function(oEvent) {
			//			var oSource = oEvent.getSource();
			// Check the opartion should be started or should be stopped
			// Get current production status
			var oView = this.getView();
			var oObject = oView.getBindingContext().getObject();
			if (oObject.ProductionStarted === true) {
				var method = "StopProduction";
			} else {
				method = "StartProduction";
			}
			//				this.getModel().setUseBatch(true);
			var oDataModel = this.getModel();
			var fnOnError = function(oResponse) {
					//					oView.getModel("appProperties").setProperty("/busy", false);
					//messages.showErrorMessage(oResponse, oResourceBundle.getText("xtit.errorTitle"));
					alert("Niet geluktt");
				},
				fnOk = function(oData, oResponse) {
					//alert("Hiep Hiep");
					//oDataModel.setData(oData.results);
					oDataModel.refresh();
					this.onNavBack(); // oView.getModel("appProperties").setProperty("/busy", false);
					// if (fnSuccess) {
					// 	fnSuccess();
					// }
					// var sSuccessMessage = "";
					// if (aPOIds.length === 1) {
					// 	var sSupplier = oModel.getProperty("/PurchaseOrders('" + aPOIds[0] + "')").SupplierName;
					// 	sSuccessMessage = oResourceBundle.getText(bApprove ? "ymsg.approvalMessageToast" : "ymsg.rejectionMessageToast", [sSupplier]);
					// } else {
					// 	sSuccessMessage = oResourceBundle.getText(bApprove ? "ymsg.massApprovalMessageToast" : "ymsg.massRejectionMessageToast");
					// }
					// MessageToast.show(sSuccessMessage);
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
		onPressProductionInterrupt: function(oEvent) {
			var oView = this.getView();
			var oObject = oView.getBindingContext().getObject();
			if (oObject.InterruptStarted === true) {
				var method = "StopInterrupt";
			} else {
				method = "StartInterrupt";
			}
			//			
			var oDataModel = this.getModel();
			var fnOnError = function(oResponse) {
					//					oView.getModel("appProperties").setProperty("/busy", false);
					//messages.showErrorMessage(oResponse, oResourceBundle.getText("xtit.errorTitle"));
					alert("Niet gelukt");
				},
				fnOk = function() {
					//alert("Hiep Hiep");
					oDataModel.refresh();
					this.onNavBack();
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
		onPressOperationFinish: function(oEvent) {
			var oView = this.getView();
			var oObject = oView.getBindingContext().getObject();
			var oDataModel = this.getModel();
			var fnOnError = function(oResponse) {
					alert("Niet gelukt");
				},
				fnOk = function() {
					oDataModel.refresh();
					this.onNavBack();
				}.bind(this);
			oDataModel.callFunction("/Finish", {
				method: "GET",
				urlParameters: {
					OperationStep: oObject.OperationStep,
					ProductionOrder: oObject.ProductionOrder
				},
				success: fnOk,
				error: fnOnError
			});
		},
		onShowInputPopover: function(oEvent) {
			var oPopover = this._getPopover();
			var oSource = oEvent.getSource();
			// connect dialog to view (models, lifecycle)
			this.getView().addDependent(oPopover);
			var oInputModel = new sap.ui.model.json.JSONModel();
			oPopover.setModel(oInputModel, "input");
			// open dialog
			oPopover.openBy(oSource);
		},
		handleInputCancelButton: function(oEvent) {
			// Close the dialog	
			var oPopover = this._getPopover();
			if (oPopover) {
				oPopover.close();
				this.oPopver = null;
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
			var oView = this.getView();
			var oObject = oView.getBindingContext().getObject();
			// this.onPressProductionStartStop();
			// return;
			input.inputQty(oObject.ProductionOrder, oObject.OperationStep, qty, oDataModel, oPopover); // var fnOnError = function() {
			if (oPopover) {
				oPopover.close();
				this.oPopver = null;
			}
		},
		_getPopover: function() {
			// create dialog lazily

			if (!this._oPopover) {
				// create popover via fragment factory
				this._oPopover = sap.ui.xmlfragment("SFS.view.ResponsivePopoverInput", this);
			}
			return this._oPopover;
		},
		_onBindingChange: function(oEvent) {
			var oView = this.getView(),
				oViewModel = this.getModel("objectView"),
				oElementBinding = oView.getElementBinding();
			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("objectNotFound");
				return;
			}
			var oResourceBundle = this.getResourceBundle(),
				oObject = oView.getBindingContext().getObject(),
				sObjectId = oObject.ProductionOrder,
				sObjectName = oObject.ProductionOrder;
			// Everything went fine.
			oViewModel.setProperty("/busy", false);
			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("saveAsTileTitle", [sObjectName]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject", oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage", oResourceBundle.getText("shareSendEmailObjectMessage", [
				sObjectName,
				sObjectId,
				location.href
			]));
		},
		/**
		 *@memberOf SFS.controller.Object
		 */
		onComponentsLoaded: function() {
			//This code was generated by the layout editor.
			var itemCount = this.getView().byId("tableComponents").getItems().length;
			this.byId("idTabComponents").setCount(itemCount);

		}
	});
});