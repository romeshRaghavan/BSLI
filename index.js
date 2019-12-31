var j = jQuery.noConflict();
var defaultPagePath = 'app/pages/';
var headerMsg = "Expenzing";
//var urlPath = 'http://1.255.255.36:13130/TnEV1_0AWeb/WebService/Login/'
var WebServicePath ='http://1.255.255.113:8081/NexstepWebService/mobileLinkResolver.service';
//var WebServicePath ='https://appservices.expenzing.com/NexstepWebService/mobileLinkResolver.service';
//var WebServicePath ='https://appservices.expenzing.com/NexstepWebService/emailApprovalService.service';
//var WebServicePath = 'http://live.nexstepapps.com:8284/NexstepWebService/emailApprovalService.service';
//var WebServicePath ='http://10.155.10.105/bslitneuat/mobileLinkResolver.service';
//var WebServicePath = 'http://live.nexstepapps.com:8284/NexstepWebService/mobileLinkResolver.service';
//var WebServicePath ='http://1.255.255.95:8080/NexstepWebService/mobileLinkResolver.service';
//var WebServicePath = 'http://1.255.255.98:8083/NexstepWebService/mobileLinkResolver.service';
var clickedFlagCar = false;
var clickedFlagTicket = false;
var clickedFlagHotel = false;
var clickedCarRound = false;
var clickedTicketRound = false;
var clickedHotelRound = false;
var perUnitDetailsJSON = new Object();
var ismodeCategoryJSON = new Object();
var exceptionStatus = 'N';
var exceptionMessage = '';
var expenseClaimDates = new Object();
var successMessage;
var pictureSource, destinationType;
var camerastatus;
var voucherType;
var fileTempCameraBE = "";
var fileTempCameraTS = "";
var fileTempGalleryBE = "";
var fileTempGalleryTS = "";
var mapToCalcERAmt = new Map();
var requestRunning = false;
var flagForUnitEnable = false;
var smsList = [];
var smsBodyString = "";
var smsToExpenseStr = "";
var smsWatchFlagStatus = false;
var expensePageFlag = ''; //S for smsExpenses And N for normal expenses
var filtersStr = "";
var fromLocationWayPoint = "";
var toLocationWayPoint = "";
var profileImg = "";
var enableDiv = "";  // Temporary for demo purpose
var updateAttachment = ""; // For BE Edit

j(document).ready(function() {
    document.addEventListener("deviceready", loaded, false);
});

function login() {
    if (document.getElementById("userName") != null) {
        var userName = document.getElementById("userName");
    } else if (document.getElementById("userName") != null) {
        var userName = document.getElementById("userNameId");
    }
    var password = document.getElementById("pass");

    var jsonToBeSend = new Object();
    jsonToBeSend["user"] = userName.value;
    jsonToBeSend["pass"] = password.value;
    //setUrlPathLocalStorage(urlPath);
    urlPath = window.localStorage.getItem("urlPath");
    j('#loading').show();
    j.ajax({
        url: urlPath + "LoginWebService",
        type: 'POST',
        dataType: 'json',
        crossDomain: true,
        data: JSON.stringify(jsonToBeSend),
        success: function(data) {
            if (data.Status == 'Success') {
                if (data.hasOwnProperty('multiLangInMobile') && data.multiLangInMobile != null &&
                    data.multiLangInMobile) {
                    var headerBackBtn = defaultPagePath + 'withoutBckBtn.html';
                    var pageRef = defaultPagePath + 'language.html';
                    j('#mainHeader').load(headerBackBtn);
                    j('#mainContainer').load(pageRef);
                    appPageHistory.push(pageRef);
                    setUserStatusInLocalStorage("Valid");
                    setUserSessionDetails(data, jsonToBeSend);
                    j('#loading').hide();
                } else {
                    var headerBackBtn = defaultPagePath + 'categoryMsgPage.html';
                    var pageRef = defaultPagePath + 'category.html';
                    j('#mainHeader').load(headerBackBtn);
                    j('#mainContainer').load(pageRef);
                    appPageHistory.push(pageRef);
                    //addEmployeeDetails(data);

                    setUserStatusInLocalStorage("Valid");
                    setUserSessionDetails(data, jsonToBeSend);

                    if (data.hasOwnProperty('EaInMobile') &&
                        data.EaInMobile != null) {
                        if (data.EaInMobile) {
                            synchronizeEAMasterData();
                        }
                    }

                    if (data.TrRole) {
                        synchronizeTRMasterData();
                        synchronizeTRForTS();
                    }
                    synchronizeBEMasterData();

                    if (data.hasOwnProperty('smartClaimsViaSMSOnMobile') &&
                        data.smartClaimsViaSMSOnMobile != null) {
                        if (data.EaInMobile) {
                            synchronizeWhiteListMasterData();
                            startWatch();
                        }
                    }

                }

            } else if (data.Status == 'Failure') {
                successMessage = data.Message;
                if (successMessage.length == 0) {
                    successMessage = "Wrong UserName or Password";
                }
                document.getElementById("loginErrorMsg").innerHTML = successMessage;
                j('#loginErrorMsg').hide().fadeIn('slow').delay(2000).fadeOut('slow');
                j('#loading').hide();
            } else {
                j('#loading').hide();
                alert(window.lang.translate('Please enter correct username or password'));
            }

        },
        error: function(data) {
            j('#loading').hide();
        }
    });

}

function commanLogin() {
    var userName = document.getElementById("userName");
    var userNameValue = userName.value;
    var domainName = userNameValue.split('@')[1];
    var jsonToDomainNameSend = new Object();
    jsonToDomainNameSend["userName"] = domainName;
    //jsonToDomainNameSend["mobilePlatform"] = device.platform;
    jsonToDomainNameSend["mobilePlatform"] = "Android";
    jsonToDomainNameSend["appType"] = "NEXGEN_EXPENZING_TNE_APP";
    //var res=JSON.stringify(jsonToDomainNameSend);
    var requestPath = WebServicePath;
    j.ajax({
        url: requestPath,
        type: 'POST',
        contentType: "application/json",
        dataType: 'json',
        crossDomain: true,
        data: JSON.stringify(jsonToDomainNameSend),
        success: function(data) {
            if (data.status == 'Success') {
                urlPath = data.message;
                setUrlPathLocalStorage(urlPath);
                login();
            } else if (data.status == 'Failure') {
                successMessage = data.message;
                document.getElementById("loginErrorMsg").innerHTML = successMessage;
                j('#loginErrorMsg').hide().fadeIn('slow').delay(2000).fadeOut('slow');
            } else {
                successMessage = data.message;
                if (successMessage == "" || successMessage == null) {
                    alert(window.lang.translate('Please enter correct username or password'));
                } else {
                    alert(window.lang.translate(successMessage));
                }
            }
        },
        error: function(data) {

        }
    });
}

function createBusinessExp() {
    resetImageData();
    var headerBackBtn = defaultPagePath + 'backbtnPage.html';
    var pageRef = defaultPagePath + 'addAnExpense.html';
    j(document).ready(function() {
        j('#mainHeader').load(headerBackBtn);
        j('#mainContainer').load(pageRef);
    });
    appPageHistory.push(pageRef);
}

function displayBusinessExp() {

    var headerBackBtn = defaultPagePath + 'headerPageForBEOperation.html';
    var pageRef = defaultPagePath + 'fairClaimTable.html';
    j(document).ready(function() {
        j('#mainHeader').load(headerBackBtn);
        j('#mainContainer').load(pageRef);
    });
    appPageHistory.push(pageRef);
}

function displayTSExp() {

    var headerBackBtn = defaultPagePath + 'headerPageForTSOperation.html';
    var pageRef = defaultPagePath + 'travelSettlementTable.html';
    j(document).ready(function() {
        j('#mainHeader').load(headerBackBtn);
        j('#mainContainer').load(pageRef);
    });
    appPageHistory.push(pageRef);
}

function cerateTravelReq() {

    var pageRef = defaultPagePath + 'addToTravelRequest.html';
    var headerBackBtn = defaultPagePath + 'backbtnPage.html';
    j(document).ready(function() {
        j('#mainHeader').load(headerBackBtn);
        j('#mainContainer').load(pageRef);
    });
    appPageHistory.push(pageRef);
}

function createWallet() {

    var headerBackBtn = defaultPagePath + 'headerPageForWalletOperation.html';
    var pageRef = defaultPagePath + 'addToWallet.html';
    j(document).ready(function() {
        j('#mainHeader').load(headerBackBtn);
        j('#mainContainer').load(pageRef);
    });
    appPageHistory.push(pageRef);
}

function init() {
    var pgRef;
    var headerBackBtn;
    if (window.localStorage.getItem("EmployeeId") != null) {
        if (window.localStorage.getItem("UserStatus") == 'ResetPswd') {
            headerBackBtn = defaultPagePath + 'expenzingImagePage.html';
            pgRef = defaultPagePath + 'loginPageResetPswd.html';
        } else if (window.localStorage.getItem("UserStatus") == 'Valid') {
            pgRef = defaultPagePath + 'category.html';
            headerBackBtn = defaultPagePath + 'categoryMsgPage.html';
        } else {
            headerBackBtn = defaultPagePath + 'expenzingImagePage.html';
            pgRef = defaultPagePath + 'loginPage.html';
        }
    } else {
        headerBackBtn = defaultPagePath + 'expenzingImagePage.html';
        pgRef = defaultPagePath + 'loginPage.html';
    }

    j(document).ready(function() {
        j('#mainHeader').load(headerBackBtn);
        j('#mainContainer').load(pgRef);
        j('#mainContainer').load(pgRef, function() {
            if (window.localStorage.getItem("UserStatus") != null && window.localStorage.getItem("UserStatus") == 'ResetPswd') {
                document.getElementById("userName").value = window.localStorage.getItem("UserName");
            }

        });
        j('#mainContainer').swipe({
            swipe: function(event, direction, distance, duration, fingercount) {
                switch (direction) {
                    case "right":
                        goBack();
                        break;
                    default:

                }
            },
            threshold: 200,
            allowPageScroll: "auto"
        });
    });
    appPageHistory.push(pgRef);
}

function loaddate() {
    j(function() {
        window.prettyPrint && prettyPrint();
        j('.dp1').datepicker({
            format: 'dd-mm-yyyy'
        });
    });

    j('.dp1').on('changeDate', function(ev) {
        j(this).datepicker('hide');
    });

}

function isJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function viewBusinessExp() {

    var pageRef = defaultPagePath + 'fairClaimTable.html';
    //var headerBackBtn=defaultPagePath+'headerPageForBEOperation.html';
    j(document).ready(function() {
        //j('#mainHeader').load(headerBackBtn);
        j('#mainContainer').load(pageRef);
    });
    appPageHistory.push(pageRef);
    j('#loading_Cat').hide();
}

function viewTravelSettlementExp() {
    resetImageData();
    var pageRef = defaultPagePath + 'travelSettlementTable.html';
    var headerBackBtn = defaultPagePath + 'headerPageForTSOperation.html';
    j(document).ready(function() {

        j('#loading_Cat').hide();
        j('#mainHeader').load(headerBackBtn);
        j('#mainContainer').load(pageRef);
    });
    appPageHistory.push(pageRef);
}

function saveBusinessExpDetails(jsonBEArr, busExpDetailsArr) {
    var jsonToSaveBE = new Object();
    var headerBackBtn = defaultPagePath + 'backbtnPage.html';
    jsonToSaveBE["employeeId"] = window.localStorage.getItem("EmployeeId");;
    jsonToSaveBE["ProcessStatus"] = "0";
    jsonToSaveBE["expenseDetails"] = jsonBEArr;
    requestRunning = true;
    var pageRefSuccess = defaultPagePath + 'success.html';
    var pageRefFailure = defaultPagePath + 'failure.html';
    j('#loading_Cat').show();
    j.ajax({
        url: window.localStorage.getItem("urlPath") + "BusExpService",
        type: 'POST',
        dataType: 'json',
        crossDomain: true,
        data: JSON.stringify(jsonToSaveBE),
        success: function(data) {
            if (data.Status == "Success") {
                successMessage = "Record(s) has been synchronized successfully.";
                for (var i = 0; i < busExpDetailsArr.length; i++) {
                    var businessExpDetailId = busExpDetailsArr[i];
                    deleteSelectedExpDetails(businessExpDetailId);
                }
                requestRunning = false;
                j('#mainHeader').load(headerBackBtn);
                j('#mainContainer').load(pageRefSuccess);
                //appPageHistory.push(pageRef);
            } else if (data.Status == "Error") {
                requestRunning = false;
                successMessage = "Oops!! Something went wrong. Please contact system administrator";
                j('#mainHeader').load(headerBackBtn);
                j('#mainContainer').load(pageRefFailure);
            } else {
                requestRunning = false;
                successMessage = "Error in synching expenses. Please contact system administrator";
                j('#mainHeader').load(headerBackBtn);
                j('#mainContainer').load(pageRefFailure);
            }
        },
        error: function(data) {
            j('#loading_Cat').hide();
            requestRunning = false;
            alert(window.lang.translate('Error: Oops something is wrong, Please Contact System Administer'));

        }
    });
}

function saveTravelSettleExpDetails(jsonTSArr, tsExpDetailsArr) {
    var headerBackBtn = defaultPagePath + 'backbtnPage.html';
    var jsonToSaveTS = new Object();
    jsonToSaveTS["employeeId"] = window.localStorage.getItem("EmployeeId");
    jsonToSaveTS["expenseDetails"] = jsonTSArr;
    requestRunning = true;
    var pageRefSuccess = defaultPagePath + 'success.html';
    var pageRefFailure = defaultPagePath + 'failure.html';
    j.ajax({
        url: window.localStorage.getItem("urlPath") + "SyncSettlementExpensesWebService",
        type: 'POST',
        dataType: 'json',
        crossDomain: true,
        data: JSON.stringify(jsonToSaveTS),
        success: function(data) {
            if (data.Status == "Success") {
                successMessage = "Record(s) has been synchronized successfully.";
                for (var i = 0; i < tsExpDetailsArr.length; i++) {
                    var travelSettleExpDetailId = tsExpDetailsArr[i];
                    deleteSelectedTSExpDetails(travelSettleExpDetailId);
                }
                requestRunning = false;
                j('#mainHeader').load(headerBackBtn);
                j('#mainContainer').load(pageRefSuccess);
            } else if (data.Status == "Error") {
                requestRunning = false;
                successMessage = "Oops!! Something went wrong. Please contact system administrator.";
                j('#mainHeader').load(headerBackBtn);
                j('#mainContainer').load(pageRefFailure);
            } else {
                requestRunning = false;
                successMessage = "Error in synching expenses. Please contact system administrator.";
                j('#mainHeader').load(headerBackBtn);
                j('#mainContainer').load(pageRefFailure);
            }
        },
        error: function(data) {
            requestRunning = false;
            alert(window.lang.translate('Error: Oops something is wrong, Please Contact System Administer'));
        }
    });
}

function sendForApprovalBusinessDetails(jsonBEArr, busExpDetailsArr, accountHeadID, month, year) {
    var jsonToSaveBE = new Object();
    jsonToSaveBE["employeeId"] = window.localStorage.getItem("EmployeeId");
    jsonToSaveBE["gradeId"] = window.localStorage.getItem("GradeID");
    jsonToSaveBE["expenseDetails"] = jsonBEArr;
    jsonToSaveBE["startDate"] = expenseClaimDates.minInStringFormat;
    jsonToSaveBE["endDate"] = expenseClaimDates.maxInStringFormat;
    jsonToSaveBE["DelayAllowCheck"] = false;
    jsonToSaveBE["BudgetingStatus"] = window.localStorage.getItem("BudgetingStatus");
    jsonToSaveBE["accountHeadId"] = accountHeadID;
    jsonToSaveBE["ProcessStatus"] = "1";
    jsonToSaveBE["month"] = month;
    jsonToSaveBE["year"] = year;
    jsonToSaveBE["title"] = window.localStorage.getItem("FirstName") + "/" + jsonToSaveBE["startDate"] + " to " + jsonToSaveBE["endDate"];

    var pageRefSuccess = defaultPagePath + 'success.html';
    var pageRefFailure = defaultPagePath + 'failure.html';
    callSendForApprovalServiceForBE(jsonToSaveBE, busExpDetailsArr, pageRefSuccess, pageRefFailure);

}

function callSendForApprovalServiceForBE(jsonToSaveBE, busExpDetailsArr, pageRefSuccess, pageRefFailure) {

    j('#loading_Cat').show();
    var headerBackBtn = defaultPagePath + 'backbtnPage.html';

    var status = validateExpenseAmtForVoucher(jsonToSaveBE);

    if (status == true) {

        validateMontlyAmtForVoucherForBE(jsonToSaveBE, busExpDetailsArr, pageRefSuccess, pageRefFailure);

    } else {
        j('#loading_Cat').hide();
        requestRunning = false;
    }
}

function createAccHeadDropDown(jsonAccHeadArr) {
    var jsonArr = [];
    if (jsonAccHeadArr != null && jsonAccHeadArr.length > 0) {
        for (var i = 0; i < jsonAccHeadArr.length; i++) {
            var stateArr = new Array();
            stateArr = jsonAccHeadArr[i];
            jsonArr.push({
                id: stateArr.Label,
                name: stateArr.Value
            });
        }
    }
    jsonArr.sort(function(a, b) { // sort object by Account Head Name
        var nameA = a.name.toLowerCase(),
            nameB = b.name.toLowerCase()
        if (nameA < nameB) //sort string ascending
            return -1
        if (nameA > nameB)
            return 1
        return 0 //default return value (no sorting)
    })
    j("#accountHead").select2({
        data: {
            results: jsonArr,
            text: 'name'
        },
        minimumResultsForSearch: -1,
        initSelection: function(element, callback) {
            callback(jsonArr[4]);
            getExpenseNamesBasedOnAccountHead();
        },
        formatResult: function(result) {
            if (!isJsonString(result.id))
                result.id = JSON.stringify(result.id);
            return result.name;
        }
    }).select2("val", "");

}

function createTRAccHeadDropDown(jsonAccHeadArr) {
    var jsonArr = [];
    if (jsonAccHeadArr != null && jsonAccHeadArr.length > 0) {
        for (var i = 0; i < jsonAccHeadArr.length; i++) {
            var stateArr = new Array();
            stateArr = jsonAccHeadArr[i];
            jsonArr.push({
                id: stateArr.Label,
                name: stateArr.Value
            });
        }
    }
    j("#trAccountHead").select2({
        data: {
            results: jsonArr,
            text: 'name'
        },
        minimumResultsForSearch: -1,
        formatResult: function(result) {
            if (!isJsonString(result.id))
                result.id = JSON.stringify(result.id);
            return result.name;
        }
    });
}

function createTSAccHeadDropDown(jsonAccHeadArr) {
    var jsonArr = [];
    if (jsonAccHeadArr != null && jsonAccHeadArr.length > 0) {
        for (var i = 0; i < jsonAccHeadArr.length; i++) {
            var stateArr = new Array();
            stateArr = jsonAccHeadArr[i];
            jsonArr.push({
                id: stateArr.Label,
                name: stateArr.Value
            });
        }
    }
    j("#tsAccountHead").select2({
        data: {
            results: jsonArr,
            text: 'name'
        },
        minimumResultsForSearch: -1,
        formatResult: function(result) {
            if (!isJsonString(result.id))
                result.id = JSON.stringify(result.id);
            return result.name;
        }
    });
}

function createExpNameDropDown(jsonExpNameArr) {
    var jsonExpArr = [];
    if (jsonExpNameArr != null && jsonExpNameArr.length > 0) {
        for (var i = 0; i < jsonExpNameArr.length; i++) {
            var stateArr = new Array();
            stateArr = jsonExpNameArr[i];
            jsonExpArr.push({
                id: stateArr.ExpenseID,
                name: stateArr.ExpenseName
            });
        }
    }

    $(".dropdown-content").hide();
    document.getElementById("expFromLoc").value = "";
    document.getElementById("expToLoc").value = "";
    document.getElementById("expNarration").value = "";
    document.getElementById("expUnit").value = "";
    document.getElementById("expAmt").value = "";
    fromLocationWayPoint = "";
    toLocationWayPoint = "";

    $("a").click(function() {
        $("#mapLink").fadeTo("fast").removeAttr("href");
    });

    j("#expenseName").select2({
        data: {
            results: jsonExpArr,
            text: 'name'
        },
        minimumResultsForSearch: -1,
        initSelection: function(element, callback) {
            callback(jsonExpArr[5]);
        },
        formatResult: function(result) {
            if (!isJsonString(result.id))
                result.id = JSON.stringify(result.id);
            return result.name;
        }
    }).select2("val", "");
}

function createCurrencyDropDown(jsonCurrencyArr) {
    var jsonArr = [];
    if (jsonCurrencyArr != null && jsonCurrencyArr.length > 0) {
        for (var i = 0; i < jsonCurrencyArr.length; i++) {
            var stateArr = new Array();
            stateArr = jsonCurrencyArr[i];

            jsonArr.push({
                id: stateArr.Value,
                name: stateArr.Label
            });
        }
    }

    j("#currency").select2({
        data: {
            results: jsonArr,
            text: 'name'
        },
        placeholder: "Currency",
        minimumResultsForSearch: -1,
        initSelection: function(element, callback) {
            callback(jsonArr[0]);
        },
        formatResult: function(result) {
            if (!isJsonString(result.id))
                result.id = JSON.stringify(result.id);
            return result.name;
        }
    }).select2("val", jsonArr[0]);
}

function createCurrencyDropDownForTS(jsonCurrencyArr) {
    var jsonArr = [];
    if (jsonCurrencyArr != null && jsonCurrencyArr.length > 0) {
        for (var i = 0; i < jsonCurrencyArr.length; i++) {
            var stateArr = new Array();
            stateArr = jsonCurrencyArr[i];

            jsonArr.push({
                id: stateArr.Value,
                name: stateArr.Label
            });
        }
    }

    j("#currency").select2({
        data: {
            results: jsonArr,
            text: 'name'
        },
        placeholder: "Currency",
        minimumResultsForSearch: -1,
        initSelection: function(element, callback) {
            callback(jsonArr[0]);
        },
        formatResult: function(result) {
            if (!isJsonString(result.id))
                result.id = JSON.stringify(result.id);
            return result.name;
        }
    }).select2("val", jsonArr[0]);

    j('#currency').select2('disable');
}

function createTravelModeDown(jsonTrvlModeArr) {
    var jsonArr = [];
    if (jsonTrvlModeArr != null && jsonTrvlModeArr.length > 0) {
        for (var i = 0; i < jsonTrvlModeArr.length; i++) {
            var stateArr = new Array();
            stateArr = jsonTrvlModeArr[i];

            jsonArr.push({
                id: stateArr.Value,
                name: stateArr.Label
            });
        }
    }

    j("#travelMode").select2({
        data: {
            results: jsonArr,
            text: 'name'
        },
        minimumResultsForSearch: -1,
        formatResult: function(result) {
            if (!isJsonString(result.id))
                result.id = JSON.stringify(result.id);
            return result.name;
        }
    });

    j("#roundTripMode").select2({
        data: {
            results: jsonArr,
            text: 'name'
        },
        minimumResultsForSearch: -1,
        formatResult: function(result) {
            if (!isJsonString(result.id))
                result.id = JSON.stringify(result.id);
            return result.name;
        }
    });

    j("#travelModeForTS").select2({
        data: {
            results: jsonArr,
            text: 'name'
        },
        minimumResultsForSearch: -1,
        formatResult: function(result) {
            if (!isJsonString(result.id))
                result.id = JSON.stringify(result.id);
            return result.name;
        }
    });
}

function createCategoryDropDown(jsonCategoryArr) {
    var jsonArr = [];
    if (jsonCategoryArr != null && jsonCategoryArr.length > 0) {
        for (var i = 0; i < jsonCategoryArr.length; i++) {
            var stateArr = new Array();
            stateArr = jsonCategoryArr[i];
            jsonArr.push({
                id: stateArr.Value,
                name: stateArr.Label
            });
        }
    }

    j("#travelCategory").select2({
        data: {
            results: jsonArr,
            text: 'name'
        },
        minimumResultsForSearch: -1,
        formatResult: function(result) {
            if (!isJsonString(result.id))
                result.id = JSON.stringify(result.id);
            return result.name;
        }
    });

    j("#roundTripCategory").select2({
        data: {
            results: jsonArr,
            text: 'name'
        },
        minimumResultsForSearch: -1,
        formatResult: function(result) {
            if (!isJsonString(result.id))
                result.id = JSON.stringify(result.id);
            return result.name;
        }
    });

    j("#travelCategoryForTS").select2({
        data: {
            results: jsonArr,
            text: 'name'
        },
        minimumResultsForSearch: -1,
        formatResult: function(result) {
            if (!isJsonString(result.id))
                result.id = JSON.stringify(result.id);
            return result.name;
        }
    });
}

function createCitytownDropDown(jsonCityTownArr) {
    var jsonArr = [];
    if (jsonCityTownArr != null && jsonCityTownArr.length > 0) {
        for (var i = 0; i < jsonCityTownArr.length; i++) {
            var stateArr = new Array();
            stateArr = jsonCityTownArr[i];
            jsonArr.push({
                id: stateArr.Value,
                name: stateArr.Label
            });
        }
    }

    j("#fromCitytown").select2({
        data: {
            results: jsonArr,
            text: 'name'
        },
        minimumResultsForSearch: 2,
        formatResult: function(result) {
            if (!isJsonString(result.id))
                result.id = JSON.stringify(result.id);
            return result.name;
        }
    });

    j("#toCitytown").select2({
        data: {
            results: jsonArr,
            text: 'name'
        },
        minimumResultsForSearch: 2,
        formatResult: function(result) {
            if (!isJsonString(result.id))
                result.id = JSON.stringify(result.id);
            return result.name;
        }
    });

    j("#Citytown").select2({
        data: {
            results: jsonArr,
            text: 'name'
        },
        minimumResultsForSearch: 2,
        formatResult: function(result) {
            if (!isJsonString(result.id))
                result.id = JSON.stringify(result.id);
            return result.name;
        }
    });
}

function createTravelTypeDropDown(jsonTravelTypeArr) {
    var jsonArr = [];
    if (jsonTravelTypeArr != null && jsonTravelTypeArr.length > 0) {
        for (var i = 0; i < jsonTravelTypeArr.length; i++) {
            var stateArr = new Array();
            stateArr = jsonTravelTypeArr[i];
            jsonArr.push({
                id: stateArr.Value,
                name: stateArr.Label
            });
        }
    }

    j("#travelType").select2({
        data: {
            results: jsonArr,
            text: 'name'
        },
        minimumResultsForSearch: -1,
        formatResult: function(result) {
            if (!isJsonString(result.id))
                result.id = JSON.stringify(result.id);
            return result.name;
        }
    });
}

function getFormattedDate(input) {
    var inputDate = input.split('-');
    var month = inputDate[1];
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return inputDate[0] + "-" + months[(month - 1)] + "-" + inputDate[2];

}

function validateExpenseDetails(exp_date, exp_from_loc, exp_to_loc, exp_narration, exp_unit, exp_amt, acc_head_id, exp_name_id, currency_id, file, paid_by, vendor_name, invoice_no) {
    if (exp_date == "") {
        alert(window.lang.translate('Expense Date is invalid'));
        return false;
    }
    if (acc_head_id == "-1") {
        alert(window.lang.translate('Account Head is invalid'));
        return false;
    }
    if (exp_name_id == "-1") {
        alert(window.lang.translate('Expense Name is invalid'));
        return false;
    }
    if (flagForUnitEnable == true) {
        if (isZero(exp_unit, "Unit") == false) {
            document.getElementById("expUnit").value = "";
            return false;
        }
    }
    if (isZero(exp_amt, "Amount") == false) {
        document.getElementById("expAmt").value = "";
        return false;
    }
    if (perUnitDetailsJSON.expenseIsfromAndToReqd != 'N') {
        if (exp_from_loc == "") {
            alert(window.lang.translate('From Location is invalid'));
            return false;
        }
        if (exp_to_loc == "") {
            alert(window.lang.translate('To Location is invalid'));
            return false;
        }
    }

    if (exp_narration == "") {
        alert(window.lang.translate('Narration is invalid'));
        return false;
    }

    if (perUnitDetailsJSON.expIsUnitReq == 'Y') {

        if (exp_unit != "") {
            if (isOnlyNumeric(exp_unit, "Unit") == false) {
                return false;
            }

        } else {
            alert(window.lang.translate('Unit is invalid'));
            return false;
        }
    }

    if (exp_amt != "") {
        if (isNumber_optionalDot(exp_amt, "Amount") == false) {
            return false;
        }

    } else {
        alert(window.lang.translate('Amount is invalid'));
        return false;
    }

    if (currency_id == "-1") {
        alert(window.lang.translate('Currency Name is invalid'));
        return false;
    }

    if (perUnitDetailsJSON.isAttachmentReq == 'Y') {

        if (file == "" || file == undefined) {
            alert(window.lang.translate('Attachment is mandatory.'));
            return false;
        }
    }
    if (paid_by == "") {
        alert(window.lang.translate('Paid By is invalid'));
        return false;
    }
    if (vendor_name == "") {
        alert(window.lang.translate('Vendor Name is invalid'));
        return false;
    }
    if (invoice_no == "") {
        alert(window.lang.translate('Invoice Number is invalid'));
        return false;
    }

    return true;
}

function syncSubmitTravelDetails() {

    var tvl_hotel = document.getElementById('travelHotel').value;
    var tvl_plane = document.getElementById('travelPlane').value;
    var tvl_car = document.getElementById('travelCar').value;
    var tvl_rnd_hotel = document.getElementById('roundTravelHotel').value;
    var tvl_rnd_plane = document.getElementById('roundTravelPlane').value;
    var tvl_rnd_car = document.getElementById('roundTravelCar').value;
    var tvl_date = document.getElementById('selectDate_One').value;
    var tvl__rod_dateOne = document.getElementById('selectDate_Two').value;
    var tvl__rod_dateTwo = document.getElementById('selectDate_Three').value;
    var tvl_time = document.getElementById('selectTime_One');
    var tv2_time = document.getElementById('selectTime_Two');
    var tv3_time = document.getElementById('selectTime_Three');
    var travel_title = document.getElementById('travelTitle').value;
    var travel_purpose_id;
    var from_id;
    var from_val;
    var to_id;
    var to_val;
    var account_head_id;
    var travel_mode_id;
    var travel_category_id;
    var tvl_mode_rnd_id;
    var tvl_category_rnd_id;
    var advance_req = $("input[name='type']:checked").val();
    var advance_amount = document.getElementById('advanceReq').value;

    if (j("#travelType").select2('data') != null) {
        travel_purpose_id = j("#travelType").select2('data').id;
    } else {
        travel_purpose_id = '-1';
    }

    if (j("#fromCitytown").select2('data') != null) {
        from_id = j("#fromCitytown").select2('data').id;
        from_val = j("#fromCitytown").select2('data').name;
    } else {
        from_id = '-1';
    }

    if (j("#trAccountHead").select2('data') != null) {
        account_head_id = j("#trAccountHead").select2('data').id;
    } else {
        account_head_id = '-1';
    }

    if (j("#toCitytown").select2('data') != null) {
        to_id = j("#toCitytown").select2('data').id;
        to_val = j("#toCitytown").select2('data').name;
    } else {
        to_id = '-1';
    }

    if (j("#travelMode").select2('data') != null) {
        travel_mode_id = j("#travelMode").select2('data').id;
    } else {
        travel_mode_id = '-1';
    }
    if (j("#travelCategory").select2('data') != null) {
        travel_category_id = j("#travelCategory").select2('data').id;
    } else {
        travel_category_id = '-1';
    }

    if (j("#roundTripMode").select2('data') != null) {
        tvl_mode_rnd_id = j("#roundTripMode").select2('data').id;
    } else {
        tvl_mode_rnd_id = '-1';
    }
    if (j("#roundTripCategory").select2('data') != null) {
        tvl_category_rnd_id = j("#roundTripCategory").select2('data').id;
    } else {
        tvl_category_rnd_id = '-1';
    }

    if (validatetravelDetails(travel_purpose_id, account_head_id, from_id, to_id, travel_mode_id, travel_category_id, tvl_mode_rnd_id, tvl_category_rnd_id, tvl_date, travel_title, advance_req, advance_amount)) {

        var jsonToSaveTR = new Object();
        j('#loading_Cat').show();
        jsonToSaveTR["EmployeeId"] = window.localStorage.getItem("EmployeeId");;
        jsonToSaveTR["BudgetingStatus"] = window.localStorage.getItem("BudgetingStatus");;
        jsonToSaveTR["TravelPurpose"] = travel_purpose_id;
        jsonToSaveTR["AccountHeadId"] = account_head_id;
        jsonToSaveTR["FromLocation"] = from_id;
        jsonToSaveTR["FromLocationName"] = from_val;
        jsonToSaveTR["ToLocaton"] = to_id;
        jsonToSaveTR["ToLocatonName"] = to_val;
        jsonToSaveTR["TravelTitle"] = travel_title;
        jsonToSaveTR["EntitlementAllowCheck"] = false;
        jsonToSaveTR["AdvanceRequested"] = advance_req;
        jsonToSaveTR["AdvanceAmount"] = advance_amount;

        var listItineraryTab = document.getElementById('myTab');
        if (hasClass(listItineraryTab.children[0], "active")) {
            jsonToSaveTR["ItenaryType"] = 'O';
            jsonToSaveTR["TravelModeId"] = travel_mode_id;
            jsonToSaveTR["TravelCategoryId"] = travel_category_id;
            jsonToSaveTR["Hotel"] = tvl_hotel;
            jsonToSaveTR["TravelTicket"] = tvl_plane;
            jsonToSaveTR["CarRent"] = tvl_car;

            if (clickedFlagCar == true) {
                jsonToSaveTR["IsCarRent"] = 'true';
            } else {
                jsonToSaveTR["IsCarRent"] = 'false';
            }
            if (clickedFlagTicket == true) {
                jsonToSaveTR["IsTravelTicket"] = 'true';
            } else {
                jsonToSaveTR["IsTravelTicket"] = 'false';
            }
            if (clickedFlagHotel == true) {
                jsonToSaveTR["IsHotel"] = 'true';
            } else {
                jsonToSaveTR["IsHotel"] = 'false';
            }
            jsonToSaveTR["DepartDate"] = tvl_date;
            jsonToSaveTR["ArriveDate"] = tvl_date;
            if (tvl_time.value != null) {
                jsonToSaveTR["DepartTime"] = tvl_time.value;
                jsonToSaveTR["ArriveTime"] = '12:00 AM';
            } else {
                jsonToSaveTR["DepartTime"] = '12:00 AM';
                jsonToSaveTR["ArriveTime"] = '12:00 AM';
            }

        } else {
            jsonToSaveTR["ItenaryType"] = 'R';
            jsonToSaveTR["TravelModeId"] = tvl_mode_rnd_id;
            jsonToSaveTR["TravelCategoryId"] = tvl_category_rnd_id;
            jsonToSaveTR["Hotel"] = tvl_rnd_hotel;
            jsonToSaveTR["TravelTicket"] = tvl_rnd_plane;
            jsonToSaveTR["CarRent"] = tvl_rnd_car;

            if (clickedCarRound == true) {
                jsonToSaveTR["IsCarRent"] = 'true';
            } else {
                jsonToSaveTR["IsCarRent"] = 'false';
            }
            if (clickedTicketRound == true) {
                jsonToSaveTR["IsTravelTicket"] = 'true';
            } else {
                jsonToSaveTR["IsTravelTicket"] = 'false';
            }
            if (clickedHotelRound == true) {
                jsonToSaveTR["IsHotel"] = 'true';
            } else {
                jsonToSaveTR["IsHotel"] = 'false';
            }
            if (tv2_time.value != null && tv3_time.value != null) {
                jsonToSaveTR["DepartTime"] = tv3_time.value;
                jsonToSaveTR["ArriveTime"] = tv2_time.value;
            } else {
                jsonToSaveTR["DepartTime"] = '12:00 AM';
                jsonToSaveTR["ArriveTime"] = '12:00 AM';
            }
            jsonToSaveTR["DepartDate"] = tvl__rod_dateTwo;
            jsonToSaveTR["ArriveDate"] = tvl__rod_dateOne;

        }

        saveTravelRequestAjax(jsonToSaveTR);
    } else {
        return false;
    }
}

function saveTravelRequestAjax(jsonToSaveTR) {
   
    var pageRefSuccess = defaultPagePath + 'success.html';
    var pageRefFailure = defaultPagePath + 'failure.html';
    j('#loading_Cat').show();
    j.ajax({
        url: window.localStorage.getItem("urlPath") + "SyncTravelRequestDetail",
        type: 'POST',
        dataType: 'json',
        crossDomain: true,
        data: JSON.stringify(jsonToSaveTR),
        success: function(data) {
            if (data.Status == "Failure") {
                j('#loading_Cat').hide();
                if (data.hasOwnProperty('IsEntitlementExceed')) {
                    setTREntitlementExceedMessage(data, jsonToSaveTR);
                } else {
                    j('#loading_Cat').hide();
                    alert(data.Message);
                }

            } else if (data.Status == "Success") {
                successMessage = data.Message;
                j('#loading_Cat').hide();
                j('#mainContainer').load(pageRefSuccess);
                appPageHistory.push(pageRefSuccess);
            } else {
                successMessage = "Error: Oops something is wrong, Please Contact System Administer";
                j('#loading_Cat').hide();
                j('#mainContainer').load(pageRefFailure);
                appPageHistory.push(pageRefFailure);
            }
        },
        error: function(data) {
            successMessage = "Error: Oops something is wrong, Please Contact System Administer";
            j('#loading_Cat').hide();
            j('#mainContainer').load(pageRefFailure);
            appPageHistory.push(pageRefFailure);
        }
    });
}

function hasClass(ele, cls) {
    return !!ele.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
}

function setBooleanValueCar() {
    if (clickedFlagCar == false) {
        document.getElementById('carActive').style.display = "";
        document.getElementById('carDisabled').style.display = "none";
        document.getElementById('travelCar').focus();
        clickedFlagCar = true;
    } else {
        document.getElementById('carActive').style.display = "none";
        document.getElementById('carDisabled').style.display = "";
        document.getElementById('travelCar').value = "";
        clickedFlagCar = false;
    }
}

function setBooleanValueCarTextField() {
    if (clickedFlagCar == false) {
        document.getElementById('carActive').style.display = "";
        document.getElementById('carDisabled').style.display = "none";
        document.getElementById('travelCar').focus();
        clickedFlagCar = true;
    }
}

function setBooleanValueTicket() {
    if (clickedFlagTicket == false) {
        document.getElementById('ticketActive').style.display = "";
        document.getElementById('ticketDisabled').style.display = "none";
        document.getElementById('travelPlane').focus();
        clickedFlagTicket = true;
    } else {
        document.getElementById('ticketActive').style.display = "none";
        document.getElementById('ticketDisabled').style.display = "";
        document.getElementById('travelPlane').value = "";
        clickedFlagTicket = false;
    }
}

function setBooleanValueTicketTextField() {
    if (clickedFlagTicket == false) {
        document.getElementById('ticketActive').style.display = "";
        document.getElementById('ticketDisabled').style.display = "none";
        document.getElementById('travelPlane').focus();
        clickedFlagTicket = true;
    }
}

function setBooleanValueHotel() {
    if (clickedFlagHotel == false) {
        document.getElementById('hotelActive').style.display = "";
        document.getElementById('hotelDisabled').style.display = "none";
        document.getElementById('travelHotel').focus();
        clickedFlagHotel = true;
    } else {
        document.getElementById('hotelActive').style.display = "none";
        document.getElementById('hotelDisabled').style.display = "";
        document.getElementById('travelHotel').value = "";
        clickedFlagHotel = false;
    }
}

function setBooleanValueHotelTextField() {
    if (clickedFlagHotel == false) {
        document.getElementById('hotelActive').style.display = "";
        document.getElementById('hotelDisabled').style.display = "none";
        document.getElementById('travelHotel').focus();
        clickedFlagHotel = true;
    }
}

function setBooleanValueCarRound() {
    if (clickedCarRound == false) {
        document.getElementById('carRoundActive').style.display = "";
        document.getElementById('carRoundDisabled').style.display = "none";
        document.getElementById('roundTravelCar').focus();
        clickedCarRound = true;
    } else {
        document.getElementById('carRoundActive').style.display = "none";
        document.getElementById('carRoundDisabled').style.display = "";
        document.getElementById('roundTravelCar').value = "";
        clickedCarRound = false;
    }
}

function setBooleanValueCarRoundTextField() {
    if (clickedCarRound == false) {
        document.getElementById('carRoundActive').style.display = "";
        document.getElementById('carRoundDisabled').style.display = "none";
        document.getElementById('roundTravelCar').focus();
        clickedCarRound = true;
    }
}

function setBooleanValueTicketRound() {
    if (clickedTicketRound == false) {
        document.getElementById('ticketRoundActive').style.display = "";
        document.getElementById('ticketRoundDisabled').style.display = "none";
        document.getElementById('roundTravelPlane').focus();
        clickedTicketRound = true;
    } else {
        document.getElementById('ticketRoundActive').style.display = "none";
        document.getElementById('ticketRoundDisabled').style.display = "";
        document.getElementById('roundTravelPlane').value = "";
        clickedTicketRound = false;
    }
}

function setBooleanValueTicketRoundTextField() {
    if (clickedTicketRound == false) {
        document.getElementById('ticketRoundActive').style.display = "";
        document.getElementById('ticketRoundDisabled').style.display = "none";
        document.getElementById('roundTravelPlane').focus();
        clickedTicketRound = true;
    }
}

function setBooleanValueHotelRound() {
    if (clickedHotelRound == false) {
        document.getElementById('hotelRoundActive').style.display = "";
        document.getElementById('hotelRoundDisabled').style.display = "none";
        document.getElementById('roundTravelHotel').focus();
        clickedHotelRound = true;
    } else {
        document.getElementById('hotelRoundActive').style.display = "none";
        document.getElementById('hotelRoundDisabled').style.display = "";
        document.getElementById('roundTravelHotel').value = "";
        clickedHotelRound = false;
    }
}

function setBooleanValueHotelRoundTextField() {
    if (clickedHotelRound == false) {
        document.getElementById('hotelRoundActive').style.display = "";
        document.getElementById('hotelRoundDisabled').style.display = "none";
        document.getElementById('roundTravelHotel').focus();
        clickedHotelRound = true;
    }
}

function validatetravelDetails(travel_purpose_id, account_head_id, from_id, to_id, travel_mode_id, travel_category_id, tvl_mode_rnd_id, tvl_category_rnd_id, tvl_date, travel_title, advance_req, advance_amount) {
    if (travel_title == "") {
        alert(window.lang.translate('Travel Title is required'));
        return false;
    }
    if (travel_purpose_id == "-1") {
        alert(window.lang.translate('Purpose Of Travel is invalid'));
        return false;
    }
    if (account_head_id == "-1") {
        alert(window.lang.translate('Account Head is invalid'));
        return false;
    }
    if (from_id == "-1") {
        alert(window.lang.translate('From Location is invalid'));
        return false;
    }
    if (to_id == "-1") {
        alert(window.lang.translate('To Location is invalid'));
        return false;
    }
    var listItineraryTab = document.getElementById('myTab');
    if (hasClass(listItineraryTab.children[0], "active")) {
        if (travel_mode_id == "-1") {
            alert(window.lang.translate('Mode is invalid'));
            return false;
        }
        if (travel_category_id == "-1") {
            alert(window.lang.translate('Category is invalid'));
            return false;
        }
        if (document.getElementById('selectDate_One').value == "Select Date") {
            alert(window.lang.translate('Travel Date is invalid'));
            return false;
        }
    } else {
        if (tvl_mode_rnd_id == "-1") {
            alert(window.lang.translate('Mode is invalid'));
            return false;
        }
        if (tvl_category_rnd_id == "-1") {
            alert(window.lang.translate('Category is invalid'));
            return false;
        }
        if (document.getElementById('selectDate_Three').value == "Select Date") {
            alert(window.lang.translate('Travel Date is invalid'));
            return false;
        }
        if (document.getElementById('selectDate_Two').value == "Select Date") {
            alert(window.lang.translate('Travel Date is invalid'));
            return false;
        }
    }
    // ************************************   Advance Check - Start ****************************************************//
    if (advance_req == 'Y') {
        if (advance_amount == "") {
            alert(window.lang.translate('Advance Amount is required'));
            return false;
        }

    }
    // ************************************   Advance Check - Start ****************************************************//

    return true;
}

function resetOneTrip() {
    j('#travelMode').select2('data', '');
    j('#travelCategory').select2('data', '');
    document.getElementById('travelCar').value = "";
    document.getElementById('travelHotel').value = "";
    document.getElementById('travelPlane').value = "";
    j('#delayDaysMsgArea').children('span').text("");
    document.getElementById('selectDate_One').value = "";
    document.getElementById('selectTime_One').value = "";
    j('#overlapMsgArea').children('span').text("");
    j('#overlapMsgRoundTripArea').children('span').text("");
    j('#delayDaysMsgRoundArea').children('span').text("");
    j('#validationMsgBox').hide();
    j('#validationMsgBoxRoundTrip').hide();
    document.getElementById("selectDate_One").style.borderColor = "#cccccc";
    document.getElementById("selectDate_Two").style.borderColor = "#cccccc";
    document.getElementById("selectDate_Three").style.borderColor = "#cccccc";
    if (window.localStorage.getItem("TdRole") == "true") {
        document.getElementById('categoryTdRoleIDRoundTrip').style.display = "block";
    } else {
        document.getElementById('categoryTdRoleIDRoundTrip').style.display = "none";
    }
}

function resetRoundTrip() {
    j('#roundTripMode').select2('data', '');
    j('#roundTripCategory').select2('data', '');
    document.getElementById('roundTravelCar').value = "";
    document.getElementById('roundTravelHotel').value = "";
    document.getElementById('roundTravelPlane').value = "";
    j('#delayDaysMsgArea').children('span').text("");
    document.getElementById('selectDate_Three').value = "";
    document.getElementById('selectDate_Two').value = "";
    document.getElementById('selectTime_Two').value = "";
    document.getElementById('selectTime_Three').value = "";
    j('#overlapMsgArea').children('span').text("");
    j('#overlapMsgRoundTripArea').children('span').text("");
    j('#delayDaysMsgRoundArea').children('span').text("");
    j('#validationMsgBox').hide();
    j('#validationMsgBoxRoundTrip').hide();
    document.getElementById("selectDate_One").style.borderColor = "#cccccc";
    document.getElementById("selectDate_Two").style.borderColor = "#cccccc";
    document.getElementById("selectDate_Three").style.borderColor = "#cccccc";
    if (window.localStorage.getItem("TdRole") == "true") {
        document.getElementById('categoryTdRoleIDOneWay').style.display = "block";
    } else {
        document.getElementById('categoryTdRoleIDOneWay').style.display = "none";
    }
}

function onloadTimePicker() {
    if (top.location != location) {
        top.location.href = document.location.href;
    }

    j('.timepicker1').timepicki();
}

function getExpenseNamesOnRequestNoChange() {

    var travelRequestId = j("#travelRequestName").select2('data').id;
    getExpenseNamesfromDBTravel(travelRequestId);
}

function getStartandEndOnRequestNoChange() {

    var travelRequestId = j("#travelRequestName").select2('data').id;
    getStartEndDatefromDBTravel(travelRequestId);
}

function getCurrencyOnRequestNoChange() {

    var travelRequestId = j("#travelRequestName").select2('data').id;
    getCurrencyDBTravel(travelRequestId);
}

function getExpenseNamesBasedOnAccountHead() {
    var accountHeadID = j("#accountHead").select2('data').id;
    showHideMonthlyRestrictedDropDown(accountHeadID);
    getExpenseNamesfromDB(accountHeadID);
}

function getPerUnitBasedOnExpense() {
    var expenseNameID = j("#expenseName").select2('data').id;
    getPerUnitFromDB(expenseNameID);
}

function getModeCatergoryBasedOnExpenseName() {

    var expenseNameID = j("#travelExpenseName").select2('data').id;
    getModecategoryFromDB(expenseNameID);
}

function getCatergoryBasedOnMode() {

    var modeID = j("#travelMode").select2('data').id;
    getCategoryFromDB(modeID);
}

function getCatergoryBasedOnModeForTS() {

    var modeID = j("#travelModeForTS").select2('data').id;
    getCategoryFromDB(modeID);
}

function getRoundCatergoryBasedOnMode() {

    var modeID = j("#roundTripMode").select2('data').id;
    getCategoryFromDB(modeID);
}

function setPerUnitDetails(transaction, results) {

    if (results != null) {
        var row = results.rows.item(0);
        perUnitDetailsJSON["expenseIsfromAndToReqd"] = row.expIsFromToReq;
        perUnitDetailsJSON["isUnitReqd"] = row.expIsUnitReq;
        perUnitDetailsJSON["expRatePerUnit"] = row.expRatePerUnit;
        perUnitDetailsJSON["expFixedOrVariable"] = row.expFixedOrVariable;
        perUnitDetailsJSON["expFixedLimitAmt"] = row.expFixedLimitAmt;
        perUnitDetailsJSON["expenseName"] = row.expName;
        perUnitDetailsJSON["expPerUnitActiveInative"] = row.expPerUnitActiveInative;
        perUnitDetailsJSON["isErReqd"] = row.isErReqd;
        perUnitDetailsJSON["limitAmountForER"] = row.limitAmountForER;
        perUnitDetailsJSON["isAttachmentReq"] = row.isAttachmentReq;
        showAttachmentmessage();

        document.getElementById("ratePerUnit").value = row.expRatePerUnit;
        document.getElementById("expAmt").value = "";
        document.getElementById("expUnit").value = "";
        document.getElementById("expFromLoc").value = "";
        document.getElementById("expToLoc").value = "";
        document.getElementById("expNarration").value = "";
        document.getElementById("expUnit").value = "";
        document.getElementById("expAmt").value = "";
        $(".dropdown-content").hide();
        fromLocationWayPoint = "";
        toLocationWayPoint = "";
        if (perUnitDetailsJSON.expenseIsfromAndToReqd == 'N') {
            document.getElementById("expFromLoc").value = "";
            document.getElementById("expToLoc").value = "";
            document.getElementById("expFromLoc").disabled = true;
            document.getElementById("expToLoc").disabled = true;
            document.getElementById("expFromLoc").style.backgroundColor = '#d1d1d1';
            document.getElementById("expToLoc").style.backgroundColor = '#d1d1d1';
            document.getElementById("expNarration").disabled = false;
            document.getElementById("expNarration").style.backgroundColor = '#FFFFFF';
            document.getElementById("mapImage").style.display = "none";
            $(".dropdown-content").hide();
            fromLocationWayPoint = "";
            toLocationWayPoint = "";
        } else {
            document.getElementById("expFromLoc").disabled = false;
            document.getElementById("expToLoc").disabled = false;
            document.getElementById("expFromLoc").value = "";
            document.getElementById("expToLoc").value = "";
            document.getElementById("expNarration").value = "";
            document.getElementById("expFromLoc").style.backgroundColor = '#FFFFFF';
            document.getElementById("expToLoc").style.backgroundColor = '#FFFFFF';
            $(".dropdown-content").hide();
            fromLocationWayPoint = "";
            toLocationWayPoint = "";
            if (window.localStorage.getItem("MobileMapRole") == 'true') {
                if (window.localStorage.getItem("MapProvider") == "GOOGLEMAP") {
                    attachGoogleSearchBox(document.getElementById("expFromLoc"));
                    attachGoogleSearchBox(document.getElementById("expToLoc"));
                }
                document.getElementById("mapImage").style.display = "";
                document.getElementById("expNarration").disabled = true;
                document.getElementById("expNarration").style.backgroundColor = '#d1d1d1';
            }
        }
        if (perUnitDetailsJSON.isUnitReqd == 'Y') {
            document.getElementById("expAmt").value = "";
            if (perUnitDetailsJSON.expFixedOrVariable == 'V') {
                flagForUnitEnable = true;
                if (perUnitDetailsJSON.expenseIsfromAndToReqd == 'Y' && window.localStorage.getItem("MobileMapRole") == 'true') {
                    document.getElementById("expUnit").disabled = true;
                    document.getElementById("expUnit").style.backgroundColor = '#d1d1d1';
                } else {
                    document.getElementById("expUnit").disabled = false;
                    document.getElementById("expUnit").style.backgroundColor = '#FFFFFF';
                }
                document.getElementById("expAmt").disabled = false;
                document.getElementById("expAmt").style.backgroundColor = '#FFFFFF';
            } else {
                flagForUnitEnable = true;
                if (perUnitDetailsJSON.expenseIsfromAndToReqd == 'Y' && window.localStorage.getItem("MobileMapRole") == 'true') {
                    document.getElementById("expUnit").disabled = true;
                    document.getElementById("expUnit").style.backgroundColor = '#d1d1d1';
                } else {
                    document.getElementById("expUnit").disabled = false;
                    document.getElementById("expUnit").style.backgroundColor = '#FFFFFF';
                }
                document.getElementById("expAmt").disabled = true;
                document.getElementById("expAmt").style.backgroundColor = '#d1d1d1';
            }
        } else {
            flagForUnitEnable = false;
            document.getElementById("expUnit").disabled = true;
            document.getElementById("expUnit").style.backgroundColor = '#d1d1d1';
            document.getElementById("expAmt").disabled = false;
            document.getElementById("expAmt").style.backgroundColor = '#FFFFFF';
        }
        if (perUnitDetailsJSON.expPerUnitActiveInative == '1') {
            flagForUnitEnable = false;
            document.getElementById("expUnit").disabled = true;
            document.getElementById("expAmt").disabled = false;
            document.getElementById("expAmt").style.backgroundColor = '#FFFFFF';
            document.getElementById("expUnit").style.backgroundColor = '#d1d1d1';
        }
    } else {

        alert("Please Synch your expense Names to claim expense.");
    }

}

function setModeCategroyDetails(transaction, results) {

    if (results != null) {
        var row = results.rows.item(0);
        ismodeCategoryJSON = new Object();
        ismodeCategoryJSON["expenseNameId"] = row.expenseNameId;
        ismodeCategoryJSON["isModeCategory"] = row.isModeCategory;
        if (ismodeCategoryJSON.isModeCategory == 'N') {
            j('#travelModeForTS').select2('data', '');
            j('#travelCategoryForTS').select2('data', '');
            j('#travelModeForTS').select2('disable');
            j('#travelCategoryForTS').select2('disable');
        } else {
            j('#travelModeForTS').select2('enable');
            j('#travelCategoryForTS').select2('enable');
        }
    } else {

        alert("Please synch your expense names to settle your travel request.");
    }

}

function checkPerUnitExceptionStatusForBEAtLineLevel() {
    exceptionStatus = "N";
    exceptionMessage = '';
    //String acExpNameReqStatus = findByIdAccountCodeExpenseNameRequiredStatus(accountCodeId);

    //CASE 1 : IF THE EXP NAME REQUIRED STATUS IS 'Y' FURTHER COMPUTE TO GET THE EXCEPTION STATUS
    //CASE 2 : IF 'N' THEN SET THE EXCEPTION STATUS AS 'N' AS THIS AC CODE IS NA FOR BE ENTITLEMENTS

    var perUnitStatus = perUnitDetailsJSON.isUnitReqd;
    var fixedOrVariable = perUnitDetailsJSON.expFixedOrVariable;
    var ratePerUnit = perUnitDetailsJSON.expRatePerUnit;
    var limitAmt = perUnitDetailsJSON.expFixedLimitAmt;
    var expName = perUnitDetailsJSON.expenseName;
    var expActiveInactive = perUnitDetailsJSON.expPerUnitActiveInative;
    var amount = document.getElementById("expAmt").value;
    var unitValue = document.getElementById("expUnit").value;

    if (expActiveInactive == '1') {
        exceptionStatus = "N";
        j('#errorMsgArea').children('span').text("");
    }
    if (perUnitStatus != "" && limitAmt != "" && amount != "" && perUnitStatus == 'N' && expActiveInactive != '1') {
        if (parseFloat(limitAmt) < parseFloat(amount)) {
            exceptionStatus = "Y";
            exceptionMessage = "(Exceeding per unit amount defined: " + limitAmt + " for expense name " + expName + ")";
            j('#errorMsgArea').children('span').text(exceptionMessage);
        } else {
            exceptionStatus = "N";
            j('#errorMsgArea').children('span').text("");
        }
    } else if (perUnitStatus != "" && ratePerUnit != "" && amount != "" && fixedOrVariable != "" && unitValue != "" && perUnitStatus == 'Y' && fixedOrVariable == 'V' && expActiveInactive != '1') {

        if (parseFloat(ratePerUnit) < amount / unitValue) {
            exceptionStatus = "Y";
            exceptionMessage = "(Exceeding per unit amount defined: " + ratePerUnit + " for expense name " + expName + ")";
            j('#errorMsgArea').children('span').text(exceptionMessage);
        } else {
            exceptionStatus = "N";
            j('#errorMsgArea').children('span').text("");
        }
    }

}

function calculatePerUnit() {

    var unit = document.getElementById("expUnit").value;
    if (isOnlyNumeric(unit, "Unit") == false) {
        document.getElementById("expUnit").value = "";
        return false;
    }
    var perUnitStatus = perUnitDetailsJSON.expIsUnitReq;
    var fixedOrVariable = perUnitDetailsJSON.expFixedOrVariable;
    var ratePerUnit = perUnitDetailsJSON.expRatePerUnit;
    var limitAmt = perUnitDetailsJSON.expFixedLimitAmt;
    var expName = perUnitDetailsJSON.expenseName;
    var result = '';
    var unitValue = document.getElementById("expUnit").value;
    if (unitValue != null && unitValue != '' && ratePerUnit != '' && ratePerUnit != null) {
        result = parseFloat(unitValue) * parseFloat(ratePerUnit);
    }
    document.getElementById("expAmt").value = result;

}

function checkAmount() {

    var amount = document.getElementById("expAmt").value;
    if (isNumber_optionalDot(amount, "Amount") == false) {
        document.getElementById("expAmt").value = "";
        return false;
    }
}

function checkEnterAmount() {

    var amount = document.getElementById("empAdvAmount").value;
    if (isOnlyNumeric(amount, "Amount") == false) {
        document.getElementById("empAdvAmount").value = "";
        return false;
    }
}

function validateNumericField(obj) {

    if (document.getElementById("expAmt").value)
        if (obj == 'expAmt') {
            var amt = document.getElementById("expAmt").value;
            if (isOnlyNumeric(amt, "Amount") == false) {
                document.getElementById("expAmt").value = "";
                return false;
            }
        } else if (obj == 'expUnit') {
        var unit = document.getElementById("expUnit").value;
        if (isOnlyNumeric(amt, "Unit") == false) {
            document.getElementById("expUnit").value = "";
            return false;
        }
    }
}

function setDelayMessage(returnJsonData, jsonToBeSend, busExpDetailsArr) {
    var pageRefSuccess = defaultPagePath + 'success.html';
    var pageRefFailure = defaultPagePath + 'failure.html';
    if (returnJsonData.DelayStatus == 'Y') {
        exceptionMessage = "This voucher has exceeded Time Limit.";

        j('#displayError').children('span').text(exceptionMessage);
        j('#displayError').hide().fadeIn('slow').delay(2000).fadeOut('slow');

    } else {

        if (confirm(window.lang.translate("This voucher has exceeded Time Limit. Do you want to proceed?")) == false) {
            return false;
        }
        jsonToBeSend["DelayAllowCheck"] = true;
        callSendForApprovalServiceForBE(jsonToBeSend, busExpDetailsArr, pageRefSuccess, pageRefFailure);
    }
}

function setTREntitlementExceedMessage(returnJsonData, jsonToBeSend) {
    var msg = returnJsonData.Message + ".\nThis voucher has exceeded Entitlements. Do you want to proceed?";
    var IsEntitlementExceed = confirm(msg);
    if (IsEntitlementExceed == true) {
        onConfirm(IsEntitlementExceed, msg, jsonToBeSend);
    } else {
        return false;
    }
}

function onConfirm(IsEntitlementExceed, errormsg, jsonToBeSend) {
    if (IsEntitlementExceed == true) {
        jsonToBeSend["EntitlementAllowCheck"] = true;
        j('#loading_Cat').show();
        saveTravelRequestAjax(jsonToBeSend);
    } else {
        j('#loading_Cat').hide();
        return false;
    }

}

function cerateTravelSettlement() {

    var pageRef = defaultPagePath + 'addTravelSettlement.html';
    var headerBackBtn = defaultPagePath + 'backbtnPage.html';
    j(document).ready(function() {
        j('#mainHeader').load(headerBackBtn);
        j('#mainContainer').load(pageRef);
    });
    appPageHistory.push(pageRef);
}

function createTravelExpenseNameDropDown(jsonExpenseNameArr) {
    var jsonExpArr = [];
    if (jsonExpenseNameArr != null && jsonExpenseNameArr.length > 0) {
        for (var i = 0; i < jsonExpenseNameArr.length; i++) {
            var stateArr = new Array();
            stateArr = jsonExpenseNameArr[i];
            jsonExpArr.push({
                id: stateArr.ExpenseNameId,
                name: stateArr.ExpenseName
            });
        }
    }

    j("#travelExpenseName").select2({
        data: {
            results: jsonExpArr,
            text: 'name'
        },
        minimumResultsForSearch: -1,
        formatResult: function(result) {
            if (!isJsonString(result.id))
                result.id = JSON.stringify(result.id);
            return result.name;
        }
    });
}

function validateTSDetails(exp_date, exp_narration, exp_unit, exp_amt, travelRequestNo, exp_name_id, currency_id, travelMode_id, travelCategory_id, cityTown_id, paid_by, vendor_name, invoice_no,accHead_id) {

    /*if (travelRequestId == "-1") {
        alert(window.lang.translate('Travel Request Number is invalid.'));
        return false;
    }*/
    if (travelRequestNo == "") {
        alert(window.lang.translate('Travel Request Number is invalid.'));
        return false;
    }
    if (accHead_id == "-1") {
        alert(window.lang.translate('Account Head is invalid.'));
        return false;
    }
    if (exp_date == "") {
        alert(window.lang.translate('Expense Date is invalid.'));
        return false;
    }
    if (exp_name_id == "-1") {
        alert(window.lang.translate('Expense Name is invalid.'));
        return false;
    }
    if (ismodeCategoryJSON.isModeCategory == "Y") {
        if (travelMode_id == "-1") {
            alert(window.lang.translate('Mode is invalid.'));
            return false;
        }
        if (travelCategory_id == "-1") {
            alert(window.lang.translate('Category is invalid.'));
            return false;
        }
    }
    if (cityTown_id == "-1") {
        alert(window.lang.translate('City town details is invalid.'));
        return false;
    }
    if (exp_narration == "") {
        alert(window.lang.translate('Narration is invalid.'));
        return false;
    }
    if (exp_unit != "") {
        if (isOnlyNumeric(exp_unit, "Unit") == false) {
            return false;
        }
        if (isZero(exp_unit, "Unit") == false) {
            document.getElementById("expUnit").value = "";
            return false;
        }
    } else {
        alert(window.lang.translate('Unit is invalid.'));
        return false;
    }
    if (exp_amt != "") {
        if (isNumber_optionalDot(exp_amt, "Amount") == false) {
            return false;
        }

    } else {
        alert(window.lang.translate('Amount is invalid'));
        return false;
    }

    if (currency_id == "-1") {
        alert(window.lang.translate('Currency Name is invalid.'));
        return false;
    }
    if (paid_by == "") {
        alert(window.lang.translate('Paid By is invalid'));
        return false;
    }
    if (vendor_name == "") {
        alert(window.lang.translate('Vendor Name is invalid'));
        return false;
    }
    if (invoice_no == "") {
        alert(window.lang.translate('Invoice Number is invalid'));
        return false;
    }
    return true;
}

function createTravelRequestNoDropDown(jsonTravelRequestNoArr) {
    var jsonRequestArr = [];
    if (jsonTravelRequestNoArr != null && jsonTravelRequestNoArr.length > 0) {
        for (var i = 0; i < jsonTravelRequestNoArr.length; i++) {
            var stateArr = new Array();
            stateArr = jsonTravelRequestNoArr[i];
            var requestNo = stateArr.TravelRequestNumber;
            var title = requestNo.substr(requestNo.length - 3) + "/" + stateArr.Title;

            jsonRequestArr.push({
                id: stateArr.TravelRequestId,
                name: title
            });
        }
    }

    j("#travelRequestName").select2({
        data: {
            results: jsonRequestArr,
            text: 'name'
        },
        minimumResultsForSearch: -1,
        formatResult: function(result) {
            if (!isJsonString(result.id))
                result.id = JSON.stringify(result.id);
            return result.name;
        }
    });
}

function oprationOnExpenseClaim() {
    j(document).ready(function() {
        if (window.localStorage.getItem("EaInMobile") == "true") {
            j('#send').on('click', function(e) {
                expenseClaimDates = new Object;
                if (requestRunning) {
                    return;
                }
                var accountHeadIdToBeSent = ''
                if (j("#source tr.selected").hasClass("selected")) {
                    j("#source tr.selected").each(function(index, row) {
                        displayEmpAdv();

                    });
                } else {
                    alert(window.lang.translate('Tap and select Expenses to send for Approval with server.'));
                }
            });
        } else {
            j('#send').on('click', function(e) {
                var jsonExpenseDetailsArr = [];
                var busExpDetailsArr = [];
                expenseClaimDates = new Object;
                if (requestRunning) {
                    return;
                }
                var accountHeadIdToBeSent = ''
                exceptionMessage = '';
                if (j("#source tr.selected").hasClass("selected")) {
                    j("#source tr.selected").each(function(index, row) {
                        var busExpDetailId = j(this).find('td.busExpId').text();
                        var jsonFindBE = new Object();
                        var expDate = j(this).find('td.expDate1').text();
                        var expenseDate = expDate;
                        var currentDate = new Date(expenseDate);
                        //get Start Date
                        if (!expenseClaimDates.hasOwnProperty('minInDateFormat')) {
                            expenseClaimDates["minInDateFormat"] = currentDate;
                            expenseClaimDates["minInStringFormat"] = expenseDate;
                        } else {
                            if (expenseClaimDates.minInDateFormat > currentDate) {
                                expenseClaimDates["minInDateFormat"] = currentDate;
                                expenseClaimDates["minInStringFormat"] = expenseDate;
                            }
                        }
                        //get End Date
                        if (!expenseClaimDates.hasOwnProperty('maxInDateFormat')) {
                            expenseClaimDates["maxInDateFormat"] = currentDate;
                            expenseClaimDates["maxInStringFormat"] = expenseDate;
                        } else {
                            if (expenseClaimDates.maxInDateFormat < currentDate) {
                                expenseClaimDates["maxInDateFormat"] = currentDate;
                                expenseClaimDates["maxInStringFormat"] = expenseDate;
                            }
                        }

                        jsonFindBE["expenseDate"] = expenseDate;
                        //get Account Head
                        var currentAccountHeadID = j(this).find('td.accHeadId').text();

                        if (validateAccountHead() == true) {
                            accountHeadIdToBeSent = currentAccountHeadID

                            jsonFindBE["accountCodeId"] = j(this).find('td.accountCodeId').text();
                            jsonFindBE["ExpenseId"] = j(this).find('td.expNameId').text();
                            jsonFindBE["ExpenseName"] = j(this).find('td.expName').text();
                            jsonFindBE["fromLocation"] = j(this).find('td.expFromLoc1').text();
                            jsonFindBE["toLocation"] = j(this).find('td.expToLoc1').text();
                            jsonFindBE["narration"] = j(this).find('td.expNarration1').text();

                            jsonFindBE["isErReqd"] = j(this).find('td.isErReqd').text();
                            jsonFindBE["ERLimitAmt"] = j(this).find('td.ERLimitAmt').text();

                            jsonFindBE["perUnitException"] = j(this).find('td.isEntitlementExceeded').text();

                            if (j(this).find('td.expUnit').text() != "") {
                                jsonFindBE["units"] = j(this).find('td.expUnit').text();
                            }

                            jsonFindBE["wayPoint"] = j(this).find('td.wayPoint').text();

                            jsonFindBE["amount"] = j(this).find('td.expAmt1').text();
                            jsonFindBE["currencyId"] = j(this).find('td.currencyId').text();
                            month = j(this).find('td.month').text();
                            year = j(this).find('td.year').text();
                            jsonFindBE["paidBy"] = j(this).find('td.paidBy').text();
                            jsonFindBE["vendorName"] = j(this).find('td.vendorName').text();
                            jsonFindBE["invoiceNo"] = j(this).find('td.invoiceNo').text();

                            var dataURL = j(this).find('td.busAttachment').text();

                            //For IOS image save
                            var data = dataURL.replace(/data:image\/(png|jpg|jpeg);base64,/, '');

                            //For Android image save
                            //var data = dataURL.replace(/data:base64,/, '');

                            jsonFindBE["imageAttach"] = data;

                            jsonFindBE["isEntiLineOrVoucherLevel"] = j(this).find('td.isEntiLineOrVoucherLevel').text();
                            jsonFindBE["expFixedLimitAmt"] = j(this).find('td.expFixedLimitAmt').text();

                            jsonExpenseDetailsArr.push(jsonFindBE);

                            busExpDetailsArr.push(busExpDetailId);
                            requestRunning = true;

                        } else {
                            if (exceptionMessage == '') {
                                exceptionMessage = "Selected expenses should be mapped under Single Expense Type/Account Head."
                                    // j('#displayError').children('span').text(exceptionMessage);
                                    // j('#displayError').hide().fadeIn('slow').delay(3000).fadeOut('slow');
                                requestRunning = false;
                                accountHeadIdToBeSent = "";
                                alert(exceptionMessage);

                            }
                        }
                    });

                    if (accountHeadIdToBeSent != "" && busExpDetailsArr.length > 0) {
                        sendForApprovalBusinessDetails(jsonExpenseDetailsArr, busExpDetailsArr, accountHeadIdToBeSent, month, year);
                    }
                } else {
                    alert(window.lang.translate('Tap and select Expenses to send for Approval with server.'));
                }
            });
        }

        j('#delete').on('click', function(e) {
            var busExpDetailsArr = [];
            var jsonExpenseDetailsArr = [];
            expenseClaimDates = new Object;

            var pageRef = defaultPagePath + 'fairClaimTable.html';
            if (j("#source tr.selected").hasClass("selected")) {
                j("#source tr.selected").each(function(index, row) {
                    var busExpDetailId = j(this).find('td.busExpId').text();
                    busExpDetailsArr.push(busExpDetailId);
                });

                if (busExpDetailsArr.length > 0) {
                    for (var i = 0; i < busExpDetailsArr.length; i++) {
                        var businessExpDetailId = busExpDetailsArr[i];
                        deleteSelectedExpDetails(businessExpDetailId);
                    }
                }
                j('#mainContainer').load(pageRef);
            } else {
                alert(window.lang.translate('Tap and select Expenses to delete.'));
            }
        });

        j('#synch').on('click', function(e) {
            var busExpDetailsArr = [];
            var jsonExpenseDetailsArr = [];
            expenseClaimDates = new Object;
            if (j("#source tr.selected").hasClass("selected")) {
                j("#source tr.selected").each(function(index, row) {
                    if (requestRunning) {
                        return;
                    }
                    var busExpDetailId = j(this).find('td.busExpId').text();
                    var jsonFindBE = new Object();
                    var expDate = j(this).find('td.expDate1').text();
                    var expenseDate = expDate;
                    jsonFindBE["expenseDate"] = expenseDate;
                    jsonFindBE["accountHeadId"] = j(this).find('td.accHeadId').text();
                    jsonFindBE["accountCodeId"] = j(this).find('td.accountCodeId').text();
                    jsonFindBE["expenseId"] = j(this).find('td.expNameId').text();
                    jsonFindBE["ExpenseName"] = j(this).find('td.expName').text();
                    jsonFindBE["fromLocation"] = j(this).find('td.expFromLoc1').text();
                    jsonFindBE["toLocation"] = j(this).find('td.expToLoc1').text();
                    jsonFindBE["narration"] = j(this).find('td.expNarration1').text();
                    jsonFindBE["paidBy"] = j(this).find('td.paidBy').text();
                    jsonFindBE["vendorName"] = j(this).find('td.vendorName').text();
                    jsonFindBE["invoiceNo"] = j(this).find('td.invoiceNo').text();
                    if (j(this).find('td.expUnit').text() != "") {
                        jsonFindBE["units"] = j(this).find('td.expUnit').text();
                    }
                    jsonFindBE["wayPoint"] = j(this).find('td.wayPoint').text();
                    jsonFindBE["amount"] = j(this).find('td.expAmt1').text();
                    jsonFindBE["currencyId"] = j(this).find('td.currencyId').text();
                    jsonFindBE["perUnitException"] = j(this).find('td.isEntitlementExceeded').text();

                    var dataURL = j(this).find('td.busAttachment').text();

                    //For IOS image save
                    var data = dataURL.replace(/data:image\/(png|jpg|jpeg);base64,/, '');

                    //For Android image save
                    //var data = dataURL.replace(/data:base64,/, '');

                    jsonFindBE["imageAttach"] = data;

                    jsonExpenseDetailsArr.push(jsonFindBE);

                    busExpDetailsArr.push(busExpDetailId);

                });
                if (busExpDetailsArr.length > 0) {
                    saveBusinessExpDetails(jsonExpenseDetailsArr, busExpDetailsArr);
                }
            } else {
                alert(window.lang.translate('Tap and select Expenses to synch with server.'));
            }
        });

        j('#editBE').on('click', function(e) {
            expPrimaryId();
        });

    });
}

function oprationONTravelSettlementExp() {

    var headerBackBtn = defaultPagePath + 'backbtnPage.html';
    j('#synchTS').on('click', function(e) {
        var jsonTravelSettlementDetailsArr = [];
        var travelSettleExpDetailsArr = [];
        minExpenseClaimDate = new Object;
        if (j("#source tr.selected").hasClass("selected")) {
            j("#source tr.selected").each(function(index, row) {
                if (requestRunning) {
                    return;
                }
                var travelSettleDetailId = j(this).find('td.tsExpId').text();
                var jsonFindTS = new Object();
                var expDate = j(this).find('td.expDate1').text();

                var expenseDate = expDate;

                jsonFindTS["expenseDate"] = expenseDate;
                jsonFindTS["travelRequestId"] = j(this).find('td.travelRequestId').text();
                jsonFindTS["accountCodeId"] = j(this).find('td.accountCodeId').text();
                jsonFindTS["expenseId"] = j(this).find('td.expNameId').text();
                jsonFindTS["ExpenseName"] = j(this).find('td.expName').text();
                jsonFindTS["travelModeId"] = j(this).find('td.modeId').text();
                jsonFindTS["travelCategoryId"] = j(this).find('td.categoryId').text();
                jsonFindTS["cityTownId"] = j(this).find('td.fromcityTownId').text();
                jsonFindTS["isModeCategory"] = j(this).find('td.isModeCategory').text();
                jsonFindTS["narration"] = j(this).find('td.expNarration1').text();
                jsonFindTS["units"] = j(this).find('td.expUnit').text();
                jsonFindTS["amount"] = j(this).find('td.expAmt1').text();
                jsonFindTS["currencyId"] = j(this).find('td.currencyId').text();
                jsonFindTS["paidBy"] = j(this).find('td.paidBy').text();
                jsonFindTS["vendorName"] = j(this).find('td.vendorName').text();
                jsonFindTS["invoiceNo"] = j(this).find('td.invoiceNo').text();

                var dataURL = j(this).find('td.tsExpAttachment').text();
                //For IOS image save
                var data = dataURL.replace(/data:image\/(png|jpg|jpeg);base64,/, '');

                //For Android image save
                //var data = dataURL.replace(/data:base64,/, '');

                jsonFindTS["imageAttach"] = data;

                jsonTravelSettlementDetailsArr.push(jsonFindTS);

                travelSettleExpDetailsArr.push(travelSettleDetailId);
            });
            if (travelSettleExpDetailsArr.length > 0) {
                saveTravelSettleExpDetails(jsonTravelSettlementDetailsArr, travelSettleExpDetailsArr);
            }
        } else {
            requestRunning = false;
            alert(window.lang.translate('Tap and select Expenses to synch with server.'));
        }
    });

    j('#deleteTS').on('click', function(e) {
        var travelSettleExpDetailsArr = [];

        var pageRef = defaultPagePath + 'travelSettlementTable.html';
        if (j("#source tr.selected").hasClass("selected")) {
            j("#source tr.selected").each(function(index, row) {
                var travelSettleDetailId = j(this).find('td.tsExpId').text();
                travelSettleExpDetailsArr.push(travelSettleDetailId);
            });
            if (travelSettleExpDetailsArr.length > 0) {
                for (var i = 0; i < travelSettleExpDetailsArr.length; i++) {
                    var travelSettleExpDetailId = travelSettleExpDetailsArr[i];
                    deleteSelectedTSExpDetails(travelSettleExpDetailId);
                }
            }
            j('#mainContainer').load(pageRef);
            j('#mainHeader').load(headerBackBtn);
        } else {
            alert(window.lang.translate('Tap and select Expenses to delete.'));
        }
    });

    j('#sendTS').on('click', function(e) {
        exceptionMessage = '';
        var jsonTravelSettlementDetailsArr = [];
        var travelSettleExpDetailsArr = [];
       // minExpenseClaimDate = new Object;
        travelSettlementDates = new Object;
        if (j("#source tr.selected").hasClass("selected")) {
            j("#source tr.selected").each(function(index, row) {

                var travelSettleDetailId = j(this).find('td.tsExpId').text();
                var jsonFindTS = new Object();
                var expDate = j(this).find('td.expDate1').text();
                var expenseDate = expDate;
                var currentDate = new Date(expenseDate);
            //get Start Date
            if (!travelSettlementDates.hasOwnProperty('minInDateFormat')) {
                travelSettlementDates["minInDateFormat"] = currentDate;
                travelSettlementDates["minInStringFormat"] = expenseDate;
            } else {
                if (travelSettlementDates.minInDateFormat > currentDate) {
                    travelSettlementDates["minInDateFormat"] = currentDate;
                    travelSettlementDates["minInStringFormat"] = expenseDate;
                }
            }
            //get End Date
            if (!travelSettlementDates.hasOwnProperty('maxInDateFormat')) {
                travelSettlementDates["maxInDateFormat"] = currentDate;
                travelSettlementDates["maxInStringFormat"] = expenseDate;
            } else {
                if (travelSettlementDates.maxInDateFormat < currentDate) {
                    travelSettlementDates["maxInDateFormat"] = currentDate;
                    travelSettlementDates["maxInStringFormat"] = expenseDate;
                }
            }
            jsonFindTS["expenseDate"] = expenseDate;//get Account Head
            var currenttravelRequestID = j(this).find('td.travelRequestId').text();
        if (validateAccountHeadForTS() == true) {
            if (validateTravelRequest() == true) {
                currenttravelRequestIDToBeSent = currenttravelRequestID

                var travelSettleDetailId = j(this).find('td.tsExpId').text();
                var jsonFindTS = new Object();
                var expDate = j(this).find('td.expDate1').text();

                var expenseDate = expDate;

                jsonFindTS["expenseDate"] = expenseDate;
                jsonFindTS["travelRequestId"] = j(this).find('td.travelRequestId').text();
                jsonFindTS["accountCodeId"] = j(this).find('td.accountCodeId').text();
                jsonFindTS["expenseId"] = j(this).find('td.expNameId').text();
                jsonFindTS["ExpenseName"] = j(this).find('td.expName').text();
                jsonFindTS["travelModeId"] = j(this).find('td.modeId').text();
                jsonFindTS["travelCategoryId"] = j(this).find('td.categoryId').text();
                jsonFindTS["cityTownId"] = j(this).find('td.fromcityTownId').text();
                jsonFindTS["isModeCategory"] = j(this).find('td.isModeCategory').text();
                jsonFindTS["narration"] = j(this).find('td.expNarration1').text();
                jsonFindTS["units"] = j(this).find('td.expUnit').text();
                jsonFindTS["amount"] = j(this).find('td.expAmt1').text();
                jsonFindTS["currencyId"] = j(this).find('td.currencyId').text();
                jsonFindTS["paidBy"] = j(this).find('td.paidBy').text();
                jsonFindTS["vendorName"] = j(this).find('td.vendorName').text();
                jsonFindTS["invoiceNo"] = j(this).find('td.invoiceNo').text();

                var dataURL = j(this).find('td.tsExpAttachment').text();
                //For IOS image save
                var data = dataURL.replace(/data:image\/(png|jpg|jpeg);base64,/, '');

                //For Android image save
                //var data = dataURL.replace(/data:base64,/, '');

                jsonFindTS["imageAttach"] = data;

                jsonTravelSettlementDetailsArr.push(jsonFindTS);

                travelSettleExpDetailsArr.push(travelSettleDetailId);
                requestRunning = true;
            }else{

             if (exceptionMessage == '') {
                exceptionMessage = "Selected expenses should be mapped under Single Travel Request."
                requestRunning = false;
                currenttravelRequestIDToBeSent = "";
                alert(exceptionMessage);
            }

        }
    }else{
             
             if (exceptionMessage == '') {
                exceptionMessage = "Selected expenses should be mapped under Single Expense Type/Account Head."
                requestRunning = false;
                currenttravelRequestIDToBeSent = "";
                alert(exceptionMessage);
            }

        }
    });
            if (travelSettleExpDetailsArr.length > 0 && currenttravelRequestIDToBeSent!= "") {
                var trdetails = findTravelRequestDetails(currenttravelRequestIDToBeSent,jsonTravelSettlementDetailsArr, travelSettleExpDetailsArr);
                //sendForApprovalTravelSettleExp(jsonTravelSettlementDetailsArr, travelSettleExpDetailsArr, currenttravelRequestIDToBeSent);
            }
        }else {
            requestRunning = false;
            alert(window.lang.translate('Tap and select Expenses to send for Approval with server.'));
        }
    });
}

function loaded() {
    pictureSource = navigator.camera.PictureSourceType;
    destinationType = navigator.camera.DestinationType;
}

function onPhotoDataSuccess(imageData) {
    resetImageData();
    if (voucherType == 'wallet') {
        smallImageWallet.style.display = 'block';
        //document.getElementById('imageWallet').files[0] = "data:image/jpeg;base64," + imageData;
        document.getElementById('imageWallet').setAttribute('src', "data:image/jpeg;base64," + imageData);
        smallImageWallet.src = "data:image/jpeg;base64," + imageData;

        if (camerastatus == '1') {
            saveWalletAttachment(0);
        }
    } else if (voucherType == 'BE') {
        smallImageBE.style.display = 'block';
        fileTempCameraBE = "data:image/jpeg;base64," + imageData;
        smallImageBE.src = "data:image/jpeg;base64," + imageData;
        fileTempGalleryBE = "";
    } else if (voucherType == 'TS') {
        smallImageTS.style.display = 'block';
        fileTempCameraTS = "data:image/jpeg;base64," + imageData;
        smallImageTS.src = "data:image/jpeg;base64," + imageData;
        fileTempGalleryTS = "";
    }
}

function resetImageData() {
    fileTempCameraBE = "";
    fileTempCameraTS = "";
    fileTempGalleryBE = "";
    fileTempGalleryTS = "";
}

function resetUpdateImage(){
    updateAttachment = "";
}

function capturePhoto(status, voucher_type) {

    voucherType = voucher_type;
    navigator.camera.getPicture(onPhotoDataSuccess, onFail, {
        quality: 10,
        destinationType: 0
    });
    camerastatus = status;

}

function onFail(message) {

}

function onPhotoURISuccess(imageURI) {
    // Uncomment to view the image file URI 
    // console.log(imageURI);
    // Get image handle
    //
    resetImageData();
    resetUpdateImage();
    if (voucherType == 'wallet') {
        smallImageWallet.style.display = 'block';

        document.getElementById('imageWallet').files[0] = "data:image/jpeg;base64," + imageURI;
        smallImageWallet.src = "data:image/jpeg;base64," + imageURI;

        if (camerastatus == '1') {
            saveWalletAttachment(0);
        }
    } else if (voucherType == 'BE') {
        smallImageBE.style.display = 'block';
        fileTempGalleryBE = "data:image/jpeg;base64," + imageURI;

        smallImageBE.src = "data:image/jpeg;base64," + imageURI;
        fileTempCameraBE = "";
    } else if (voucherType == 'TS') {
        smallImageTS.style.display = 'block';

        fileTempGalleryTS = "data:image/jpeg;base64," + imageURI;

        smallImageTS.src = "data:image/jpeg;base64," + imageURI;
        fileTempCameraTS = "";
    }

}

function getPhoto(source, status, voucher_type) {
    voucherType = voucher_type;
    // Retrieve image file location from specified source
    navigator.camera.getPicture(onPhotoURISuccess, onFail, {
        quality: 10,
        destinationType: 0,
        sourceType: source
    });
    camerastatus = status;

}

function saveWalletDetails(jsonWalletArr, jsonWalletIDArr) {
    var walletID;
    var i = 0;
    var headerBackBtn = defaultPagePath + 'headerPageForWalletOperation.html';
    var pageRef = defaultPagePath + 'addToWallet.html';
    j('#loading_Cat').show();
    for (i; i < jsonWalletArr.length; i++) {
        j.ajax({
            url: window.localStorage.getItem("urlPath") + "WalletReceiptsService",
            type: 'POST',
            dataType: 'json',
            crossDomain: true,
            data: JSON.stringify(jsonWalletArr[i]),
            success: function(data) {
                if (data.SyncStatus == "Success") {
                    for (var i = 0; i < jsonWalletIDArr.length; i++) {
                        walletID = jsonWalletIDArr[i];
                        deleteSelectedWallets(walletID);
                    }
                    document.getElementById("wallet_msg").innerHTML = "Selected File synch successfully.";
                    j('#mainHeader').load(headerBackBtn);
                    j("#walletSource td.selected").hide();
                    j('#wallet_msg').hide().fadeIn('slow').delay(3000).fadeOut('slow');
                    j('#loading_Cat').hide();
                } else if (data.SyncStatus == "Error") {
                    document.getElementById("wallet_msg").innerHTML = "Error: Oops something is wrong, Please Contact System Administer";
                    j('#mainHeader').load(headerBackBtn);
                    j('#wallet_msg').hide().fadeIn('slow').delay(3000).fadeOut('slow');
                    j('#loading_Cat').hide();
                } else if (data.SyncStatus == "Failure") {
                    document.getElementById("wallet_msg").innerHTML = "File " + data.FileName + " synch fail.";
                    j('#mainHeader').load(headerBackBtn);
                    j('#wallet_msg').hide().fadeIn('slow').delay(3000).fadeOut('slow');
                    j('#loading_Cat').hide();
                }
            },
            error: function(data) {
                j('#loading_Cat').hide();
            }
        });
    }
}

function oprationOnWallet() {
    var headerBackBtn = defaultPagePath + 'backbtnPage.html';
    j('#synchWallet').on('click', function(e) {
        var jsonWalletArr = [];
        var jsonWalletIDArr = [];
        if (j("#walletSource td.selected").hasClass("selected")) {
            j("#walletSource td.selected").each(function(index, row) {
                var jsonFindWalletData = new Object();
                var jsonFindWalletId = new Object();
                var walletData = j(this).text();
                jsonFindWalletId = j(this).find('#para').text();
                //var dataURL =  j(this).find('td.walletattach').text();

                //For IOS image save
                var data = walletData.replace(/data:image\/(png|jpg|jpeg);base64,/, '');
                //For Android image save
                //var data = data.replace(/data:base64,/, '');
                jsonFindWalletData["fileName"] = "walletFile_" + window.localStorage.getItem("EmployeeId") + "_" + j(this).find('#para').text() + ".jpeg";
                jsonFindWalletData["fileData"] = data;
                jsonFindWalletData["employeeId"] = window.localStorage.getItem("EmployeeId");
                jsonWalletArr.push(jsonFindWalletData);
                jsonWalletIDArr.push(jsonFindWalletId);

            });
            if (jsonWalletArr.length > 0) {
                saveWalletDetails(jsonWalletArr, jsonWalletIDArr);
            }
        } else {
            alert(window.lang.translate('Tap and select My Receipts Wallet to synch with server.'));
        }
    });
}

function hideTRIcons() {
    if (window.localStorage.getItem("TrRole") == "true") {
        document.getElementById('CategoryTrRoleID').style.display = "block";
    } else {
        document.getElementById('CategoryTrRoleID').style.display = "none";
    }
}

function hideBusinessExpense() {
       if (document.getElementById('businessExpenseTab') != null) {
        if (window.localStorage.getItem("mobileEC") == "true") {
            document.getElementById('businessExpenseTab').style.display = "block";
        } else {
            document.getElementById('businessExpenseTab').style.display = "none";
        }
    }
}

function hideTRMenus() {
    if (window.localStorage.getItem("TrRole") == "true") {
        document.getElementById('TrRoleID').style.display = "block";
        document.getElementById('TsRoleID').style.display = "block";
    } else {
        document.getElementById('TrRoleID').style.display = "none";
        document.getElementById('TsRoleID').style.display = "none";
    }
}

function validateValidMobileUser() {
    var pgRef;
    var headerBackBtn;
    var jsonToBeSend = new Object();
    if (window.localStorage.getItem("EmployeeId") != null && (window.localStorage.getItem("UserStatus") == null || window.localStorage.getItem("UserStatus") == 'Valid')) {
        jsonToBeSend["user"] = window.localStorage.getItem("UserName");
        jsonToBeSend["pass"] = window.localStorage.getItem("Password");
        j.ajax({
            url: window.localStorage.getItem("urlPath") + "ValidateUserWebservice",
            type: 'POST',
            dataType: 'json',
            crossDomain: true,
            data: JSON.stringify(jsonToBeSend),
            success: function(data) {

                if (data.Status == 'Success') {
                    window.lang.change(window.localStorage.getItem("localLanguage"));
                    setUserStatusInLocalStorage("Valid");
                    /*if(!data.MobileMapRole){
                    		window.localStorage.removeItem("MobileMapRole");
                    	}else{
                    		window.localStorage.setItem("MobileMapRole",data.MobileMapRole);
                    	} */
                } else if (data.Status == 'NoAndroidRole') {
                    successMessage = data.Message;
                    headerBackBtn = defaultPagePath + 'expenzingImagePage.html';
                    pgRef = defaultPagePath + 'loginPage.html';
                    setUserStatusInLocalStorage("Invalid");
                    j('#mainHeader').load(headerBackBtn);
                    j('#mainContainer').load(pgRef, function() {
                        document.getElementById("loginErrorMsg").innerHTML = successMessage;
                        j('#loginErrorMsg').hide().fadeIn('slow').delay(4000).fadeOut('slow');
                        j('#loading').hide();
                    });

                } else if (data.Status == 'InactiveUser') {
                    successMessage = data.Message;
                    headerBackBtn = defaultPagePath + 'expenzingImagePage.html';
                    pgRef = defaultPagePath + 'loginPage.html';
                    j('#mainHeader').load(headerBackBtn);
                    setUserStatusInLocalStorage("Inactive");
                    resetUserSessionDetails();
                    j('#mainContainer').load(pgRef, function() {
                        document.getElementById("loginErrorMsg").innerHTML = successMessage;
                        j('#loginErrorMsg').hide().fadeIn('slow').delay(4000).fadeOut('slow');
                        j('#loading').hide();
                    });
                } else if (data.Status == 'ChangedUserCredentials') {
                    successMessage = data.Message;
                    headerBackBtn = defaultPagePath + 'expenzingImagePage.html';
                    pgRef = defaultPagePath + 'loginPageResetPswd.html';
                    setUserStatusInLocalStorage("ResetPswd");
                    j('#mainHeader').load(headerBackBtn);
                    j('#mainContainer').load(pgRef, function() {
                        document.getElementById("loginErrorMsg").innerHTML = successMessage;
                        j('#loginErrorMsg').hide().fadeIn('slow').delay(4000).fadeOut('slow');
                        j('#loading').hide();
                    });
                }

            },
            error: function(data) {

            }
        });
    }
}

function attachGoogleSearchBox(component) {
    if (window.localStorage.getItem("MapProvider") == "GOOGLEMAP") {
        var searchBox = new google.maps.places.SearchBox(component);
        searchBox.addListener("places_changed", function() {
            //alert("here")
            fromLoc = document.getElementById("expFromLoc").value;
            toLoc = document.getElementById("expToLoc").value;
            if (fromLoc.value != '' && toLoc.value != '') {
                wayPoint = document.getElementById("wayPointunitValue");
                wayPoint.value = '';
                calculateAndDisplayRoute();
                $("a").click(function() {
                    $(this).fadeIn("fast").attr("href", "#openModal");
                });
            }
        });
    }
}
//************************************** MAPMYINDIA - START **********************************************//

function attachQueryValues(val) {

    if (window.localStorage.getItem("MobileMapRole") == 'true' && window.localStorage.getItem("MapProvider") == "MAPMYINDIA") {
        var expFromLoc = document.getElementById("expFromLoc").value;
        var expToLoc = document.getElementById("expToLoc").value;
        var locationQuery = "";
        var queryValue = "";

        if (val == 1) {
            locationQuery = document.getElementById("expFromLoc").value;
            queryValue = locationQuery;
            attachMapMyIndiaSearchBox(queryValue, val);
        } else if (val == 2) {
            locationQuery = document.getElementById("expToLoc").value;
            queryValue = locationQuery;
            attachMapMyIndiaSearchBox(queryValue, val);
        }

    }
}

function attachMapMyIndiaSearchBox(query, val) {

    if (query.length >= 5) {

        j.ajax({
            url: "https://outpost.mapmyindia.com/api/security/oauth/token?grant_type=client_credentials",
            type: 'POST',
            contentType: 'application/x-www-form-urlencoded',
            crossDomain: true,
            data: jQuery.param({
                client_id: "gHvaOPpCYTs20dVHSCo9i_zO5UNPDMDAro9HxE01tgY=",
                client_secret: "c6M8QBqRa6daTwllDT86UmhOM4jFu5t6Nz6rLf8XLTU="

            }),
            success: function(response) {

                //alert("in success");
                //alert(response.token_type);
                tokenType = response.token_type;
                accessToken = response.access_token;
                getPlaceData(tokenType, accessToken, query, val);

            },
            error: function() {
                alert("Connection not Established.");
            }
        });
    }

}

function getPlaceData(tokenType, accessToken, queryValue, val) {
    //alert("tokenType,accessToken : "+tokenType + " " + accessToken);
    var authorization = tokenType + " " + accessToken;
    var tempurl = "https://cors-escape.herokuapp.com/https://atlas.mapmyindia.com/api/places/search/json?query=" + queryValue + "&location=28.6321438802915%2C77.2173553802915";
    console.log("url :  " + tempurl);
    console.log("authorization : " + authorization);

    var settings = {
        "async": true,
        "crossDomain": true,
        "url": "https://cors-anywhere.herokuapp.com/https://atlas.mapmyindia.com/api/places/search/json?query=" + queryValue + "&location=28.6321438802915%2C77.2173553802915",
        "method": "GET",
        "headers": {
            "authorization": authorization,
            "cache-control": "no-cache"
        }
    }

    $.ajax(settings).done(function(response) {
        setJSONDataLocationField(response, val);
    });

}

function setJSONDataLocationField(jsondata, val) {
    //alert(JSON.stringify(jsondata));
    var div_data = '';
    $.each(jsondata.suggestedLocations, function(i, obj) {

        div_data = div_data + "<a herf = '' id=" + obj.latitude + "$" + obj.longitude + " value='" + obj.placeName + '-' + obj.placeAddress + "'>" + obj.placeName + '-' + obj.placeAddress + "</a>"

    });

    if (val == 1) {
        var my_list = document.getElementById("json-datalist");
        my_list.innerHTML = div_data;
        //alert("div_data : "+div_data);
        document.getElementById('json-datalist').style.display = "";
    } else if (val == 2) {
        var my_list = document.getElementById("json-datalist1");
        my_list.innerHTML = div_data;
        document.getElementById('json-datalist1').style.display = "";
    }

    if (val == 1) {
        j("#json-datalist a").click(function() {
            var value = j(this).text();
            var id = j(this).attr('id');

            fromLocationWayPoint = id;
            document.getElementById("expFromLoc").value = value;
            document.getElementById('json-datalist').style.display = "none";
            calulateUnitFromLoction();
        });

        hideDropDownContents();

    } else if (val == 2) {
        j("#json-datalist1 a").click(function() {

            var value = j(this).text();
            var id = j(this).attr('id');

            toLocationWayPoint = id;
            document.getElementById("expToLoc").value = value;
            document.getElementById('json-datalist1').style.display = "none";
            calulateUnitFromLoction();

        });
        hideDropDownContents();

    }

}

function hideDropDownContents() {

    j("#expDate").click(function() {
        j(".dropdown-content").hide();
    });

    j("#expToLoc").click(function() {
        j(".dropdown-content").hide();
    });

    j("#expFromLoc").click(function() {
        j(".dropdown-content").hide();
    });
}

function calulateUnitFromLoction() {

    if (fromLocationWayPoint != '' && toLocationWayPoint != '') {
        if (fromLocationWayPoint.includes("$") && toLocationWayPoint.includes("$")) {
            var fromLongLat = fromLocationWayPoint.split('$');
            var fromLat = fromLongLat[0];
            var fromLong = fromLongLat[1];

            var toLongLat = toLocationWayPoint.split('$');
            var toLat = toLongLat[0];
            var toLong = toLongLat[1];

            var settings = {
                "async": true,
                "crossDomain": true,
                "url": "https://apis.mapmyindia.com/advancedmaps/v1/bemzvgf9d3at3j7rt85bpvmwuhaumd59/distance?center=" + fromLat + "," + fromLong + "&pts=" + toLat + "," + toLong + "",
                "method": "GET",
                "headers": {
                    "cache-control": "no-cache"
                }
            }

            $.ajax(settings).done(function(response) {
                wayPoint = document.getElementById("wayPointunitValue");
                var data = {};
                data.start = {
                    'lat': fromLat + '$' + fromLong
                }
                data.end = {
                    'lat': toLat + '$' + toLong
                }
                var str = JSON.stringify(data);
                wayPoint.value = str;

                setUnitBasedOnResponse(response)
            });

        } else {
            unitValue = document.getElementById("expUnit");
            unitValue.value = '';
        }
    } else {
        unitValue = document.getElementById("expUnit");
        unitValue.value = '';
    }
}

function setUnitBasedOnResponse(response) {
    console.log(JSON.stringify(response));

    $.each(response.results, function(i, obj) {
        var units = obj.length;
        var unitKM = parseInt(units) / 1000;
        unitValue = document.getElementById("expUnit");
        unitValue.value = unitKM;
    });
    returnUnitResult();
}

//************************************** MAPMYINDIA - END **********************************************//

function viewMap() {
    if (window.localStorage.getItem("MapProvider") == "GOOGLEMAP") {
        document.getElementById("openModal").style.display = "block";
        fromLoc = document.getElementById("expFromLoc");
        toLoc = document.getElementById("expToLoc");
        unitValue = document.getElementById("expUnit");
        wavepoint = document.getElementById("wayPointunitValue");
        if (fromLoc.value != '' && toLoc.value != '') {
            calculateAndDisplayRoute();
            document.getElementById("mapImage").setAttribute('disabled', false);
        }
    }
}

function calculateAndDisplayRoute() {
    //alert("calculateAndDisplayRoute")
    var map;
    var directionsDisplay;
    var directionsService;

    map = new google.maps.Map(document.getElementById("map"), {
        center: {
            lat: 19.122272,
            lng: 72.863623
        },
        zoom: 13
    });
    directionsService = new google.maps.DirectionsService;
    // Create a renderer for directions and bind it to the map.
    directionsDisplay = new google.maps.DirectionsRenderer({
        draggable: true,
        map: map
    });

    fromLoc = document.getElementById("expFromLoc");
    //alert("fromLoc   "+fromLoc.value)
    toLoc = document.getElementById("expToLoc");
    //alert("toLoc   "+toLoc.value)
    unitValue = document.getElementById("expUnit");
    //alert("unitValue   "+unitValue.value)
    wayPoint = document.getElementById("wayPointunitValue");
    //alert("wayPoint   "+wayPoint.value)
    directionsDisplay.addListener('directions_changed', function() {
        computeTotalDistance(directionsDisplay.getDirections());
    });
    var points = [];

    if (fromLoc != null && toLoc != null) {
        if (wayPoint != null && wayPoint.value != "") {
            var os = j.parseJSON(wayPoint.value);
            for (var i = 0; i < os.waypoints.length; i++)
                points[i] = {
                    'location': new google.maps.LatLng(os.waypoints[i][0], os.waypoints[i][1]),
                    'stopover': false
                }
        }

        directionsService.route({
            origin: fromLoc.value,
            destination: toLoc.value,
            travelMode: google.maps.TravelMode.DRIVING,
            waypoints: points
        }, function(response, status) {
            // Route the directions and pass the response to a function
            // to create
            // markers for each step.
            if (status === google.maps.DirectionsStatus.OK) {
                directionsDisplay.setDirections(response);

            } else {
                unitValue.value = 'NA';
                wayPoint.value = '';
            }
        });
    }

}

function computeTotalDistance(result) {
    unitValue = document.getElementById("expUnit");
    busExpNameIdObj = document.getElementById("expenseName");
    wayPoint = document.getElementById("wayPointunitValue");

    var total = 0;
    var myroute = result.routes[0];
    for (var i = 0; i < myroute.legs.length; i++) {
        total += myroute.legs[i].distance.value;
    }
    total = total / 1000;
    unitValue.value = Math.round(total);
    var w = [],
        wp;
    var data = {};
    var rleg = myroute.legs[0];
    data.start = {
        'lat': rleg.start_location.lat(),
        'lng': rleg.start_location.lng()
    }
    data.end = {
        'lat': rleg.end_location.lat(),
        'lng': rleg.end_location.lng()
    }
    var wp = rleg.via_waypoints
    for (var i = 0; i < wp.length; i++) {
        w[i] = [wp[i].lat(), wp[i].lng()]
    }
    data.waypoints = w;
    var str = JSON.stringify(data);
    wayPoint.value = str;

    //var grId = document.forms[0]["gradeId"].value;
    returnUnitResult();
}

function closeMap() {
    document.getElementById('openModal').style.display = "none";
}

function fetchCountForMyApproval(statusOfVoucher) {
     var jsonSentToSync = new Object();
     jsonSentToSync["employeeId"] = window.localStorage.getItem("EmployeeId");
     var ab = window.localStorage.getItem("EmployeeId")

     jsonSentToSync["processId"] = "1";
     jsonSentToSync["vocherStatus"] = statusOfVoucher;

     j.ajax({
         url: window.localStorage.getItem("urlPath") + "FetchCount",
         type: 'POST',
         dataType: 'json',
         crossDomain: true,
         data: JSON.stringify(jsonSentToSync),
         success: function(data) {

             if (data.Status == "Success") {

                 var countForVouchers = data.VoucherCount.toString();
                 
                if(statusOfVoucher == 'A' && document.getElementById('count') != null){
                 document.getElementById("count").innerHTML = countForVouchers.match(/\d+/);
                }else{
                     var arrayOfCount = countForVouchers.split(",");

                     for(var i = 0 ; i < arrayOfCount.length ; i++){

                        if(arrayOfCount[i].includes("D") && document.getElementById('draftCount') != null){
                            document.getElementById("draftCount").innerHTML = arrayOfCount[i].match(/\d+/);
                        }
                        if(arrayOfCount[i].includes("P") && document.getElementById('pendingCount') != null){
                            document.getElementById("pendingCount").innerHTML = arrayOfCount[i].match(/\d+/);
                        }
                        if(arrayOfCount[i].includes("U") && document.getElementById('approvedUnpaidCount') != null){
                            document.getElementById("approvedUnpaidCount").innerHTML = arrayOfCount[i].match(/\d+/);
                        }
                         if(arrayOfCount[i].includes("F") && document.getElementById('approvedPaidCount') != null){
                            document.getElementById("approvedPaidCount").innerHTML = arrayOfCount[i].match(/\d+/);
                        }
                         if(arrayOfCount[i].includes("R") && document.getElementById('sendBackCount') != null){
                            document.getElementById("sendBackCount").innerHTML = arrayOfCount[i].match(/\d+/);
                        }

                     }

                }

                 requestRunning = false;
             } else {
                 requestRunning = false;
             }
         },
         error: function(data) {
             requestRunning = false;
         }
     });

 }

function returnUnitResult() {
    var perUnitStatus = perUnitDetailsJSON.expRatePerUnit;
    var fixedOrVariable = perUnitDetailsJSON.expFixedOrVariable;
    var ratePerUnit = document.getElementById("ratePerUnit");
    if (flagForUnitEnable == true) {
        unt = document.getElementById("expUnit");
        amt = document.getElementById("expAmt");
        document.getElementById("expAmt").value = parseFloat(Math.round(parseFloat(unt.value)) * parseFloat(ratePerUnit.value));
        checkPerUnitExceptionStatusForBEAtLineLevel();
    }
}

function loadImage() {
    //alert(window.localStorage.getItem("MobileMapRole"))
    if (window.localStorage.getItem("MobileMapRole") == 'true') {
        document.getElementById("mapImage").style.display = "";
        //document.getElementById("mapLink").style.visibility = "hidden";
        $("a").click(function() {
            $(this).fadeTo("fast").removeAttr("href");
        });
    }
}

function resetUnit() {
    document.getElementById("expUnit").value = "";
    document.getElementById("expAmt").value = "";
}

function setNarration() {
    document.getElementById("expNarration").value = document.getElementById("expDate").value + "--" + document.getElementById("expFromLoc").value + "--" + document.getElementById("expToLoc").value;
    document.getElementById("expNarration").style.textOverflow = "ellipsis";
}

//Index.js   changes by Dinesh
function createReqAdvance() {
    var pageRef = defaultPagePath + 'addToRequestAdvs.html';
    var headerBackBtn = defaultPagePath + 'backbtnPage.html';
    j(document).ready(function() {
        j('#mainHeader').load(headerBackBtn);
        j('#mainContainer').load(pageRef);
    });
    appPageHistory.push(pageRef);
}

//Index.js   changes by Dinesh end

//amit index.js changes start
function createAdvanceTypeDropDown(jsonAdvanceTypeArr) {
    var jsonArr = [];
    if (jsonAdvanceTypeArr != null && jsonAdvanceTypeArr.length > 0) {
        for (var i = 0; i < jsonAdvanceTypeArr.length; i++) {
            var stateArr = new Array();
            stateArr = jsonAdvanceTypeArr[i];
            jsonArr.push({
                id: stateArr.Value,
                name: stateArr.Label
            });
        }
    }

    j("#empAdvType").select2({
        data: {
            results: jsonArr,
            text: 'name'
        },
        minimumResultsForSearch: -1,
        formatResult: function(result) {
            if (!isJsonString(result.id))
                result.id = JSON.stringify(result.id);
            return result.name;
        }
    });
    var DefaultAdvType = window.localStorage.getItem("DefaultAdvType");
    //j("#empAdvType").select2("val",DefaultAdvType);
}

function changeAdavanceType() {

    var advTypeID = j("#empAdvType").select2('data').id;
    //getAdvanceTypeFromDB(advTypeID);
    populateEATitle();
}

function createAccountHeadDropDown(jsonAccountHeadArr) {
    var jsonArr = [];
    if (jsonAccountHeadArr != null && jsonAccountHeadArr.length > 0) {
        for (var i = 0; i < jsonAccountHeadArr.length; i++) {
            var stateArr = new Array();
            stateArr = jsonAccountHeadArr[i];

            jsonArr.push({
                id: stateArr.Value,
                name: stateArr.Label
            });
        }
    }

    j("#empAdvAccHead").select2({
        data: {
            results: jsonArr,
            text: 'name'
        },
        minimumResultsForSearch: -1,
        formatResult: function(result) {
            if (!isJsonString(result.id))
                result.id = JSON.stringify(result.id);
            return result.name;
        }
    });
    var DefaultAccontHead = window.localStorage.getItem("DefaultAccontHead");
    j("#empAdvAccHead").select2("val", DefaultAccontHead);
}

function changeAccountHeadName() {

    var acHeadID = j("#empAdvAccHead").select2('data').id;
    // getAccountHeadFromDB(acHeadID);
}

function syncSubmitEmpAdvance() {

    var empAdvDate = document.getElementById('empAdvDate').value;
    var empAdvTitle = document.getElementById('empAdvTitle').value;
    var empAdvjustification = document.getElementById('empAdvjustification').value;
    var empAdvAmount = document.getElementById('empAdvAmount').value;
    var empAdvType_id;
    var empAdvType_Name;
    var empAccHead_id;
    var empAccHead_Name;

    if (j("#empAdvType").select2('data') != null) {
        empAdvType_id = j("#empAdvType").select2('data').id;
        empAdvType_Name = j("#empAdvType").select2('data').name;
    } else {
        empAdvType_id = '-1';
    }

    if (j("#empAdvAccHead").select2('data') != null) {
        empAccHead_id = j("#empAdvAccHead").select2('data').id;
        empAccHead_Name = j("#empAdvAccHead").select2('data').name;
    } else {
        empAccHead_id = '-1';
    }

    if (validateEmpAdvanceDetails(empAdvDate, empAdvTitle, empAdvjustification, empAdvAmount, empAdvType_id, empAdvType_Name, empAccHead_id, empAccHead_Name)) {

        var jsonToSaveEA = new Object();
        j('#loading_Cat').show();
        jsonToSaveEA["EmployeeId"] = window.localStorage.getItem("EmployeeId");;
        jsonToSaveEA["BudgetingStatus"] = window.localStorage.getItem("BudgetingStatus");;
        jsonToSaveEA["empAdvDate"] = empAdvDate;
        jsonToSaveEA["empAdvTitle"] = empAdvTitle;
        jsonToSaveEA["empAdvjustification"] = empAdvjustification;
        jsonToSaveEA["empAdvAmount"] = empAdvAmount;
        jsonToSaveEA["empAdvType_id"] = empAdvType_id;
        jsonToSaveEA["empAccHead_id"] = empAccHead_id;

        saveEmployeeAdvanceAjax(jsonToSaveEA);
    } else {
        return false;
    }

}

function saveEmployeeAdvanceAjax(jsonToSaveEA) {
    var headerBackBtn = defaultPagePath + 'backbtnPage.html';
    var pageRefSuccess = defaultPagePath + 'success.html';
    var pageRefFailure = defaultPagePath + 'failure.html';
    j.ajax({
        url: window.localStorage.getItem("urlPath") + "SyncSubmitEmployeeAdvanceDetail",
        type: 'POST',
        dataType: 'json',
        crossDomain: true,
        data: JSON.stringify(jsonToSaveEA),
        success: function(data) {
            if (data.Status == "Success") {
                successMessage = data.Message;
                requestRunning = false;
                j('#loading_Cat').hide();
                j('#mainHeader').load(headerBackBtn);
                j('#mainContainer').load(pageRefSuccess);

            } else if (data.Status == "Failure") {
                successMessage = data.Message;
                requestRunning = false;
                j('#loading_Cat').hide();
                j('#mainHeader').load(headerBackBtn);
                j('#mainContainer').load(pageRefFailure);
            } else {
                j('#loading_Cat').hide();
                successMessage = "Oops!! Something went wrong. Please contact system administrator.";
                j('#mainHeader').load(headerBackBtn);
                j('#mainContainer').load(pageRefFailure);
            }
        },
        error: function(data) {
            j('#loading_Cat').hide();
            requestRunning = false;
            alert(window.lang.translate('Error: Oops something is wrong, Please Contact System Administer'));
        }
    });
}

function validateEmpAdvanceDetails(empAdvDate, empAdvTitle, empAdvjustification, empAdvAmount, empAdvType_id, empAdvType_Name, empAccHead_id, empAccHead_Name) {

    if (empAdvDate == "") {
        alert(window.lang.translate('Advance Date is required'));
        return false;
    }
    if (empAdvTitle == "") {
        alert(window.lang.translate('Advance Title is required'));
        return false;
    }
    if (empAdvjustification == "") {
        alert(window.lang.translate('Justification is required'));
        return false;
    }
    if (empAdvAmount == "") {
        alert(window.lang.translate('Amount is required'));
        return false;
    }

    if (empAdvAmount != "") {
        if (isOnlyNumeric(empAdvAmount, "Amount") == false) {
            document.getElementById("empAdvAmount").value = "";
            return false;
        }

    } else {
        alert(window.lang.translate('Amount is invalid'));
        return false;
    }

    if (isZero(empAdvAmount, "Amount") == false) {
        document.getElementById("empAdvAmount").value = "";
        return false;
    }

    if (empAdvType_id == "-1" || empAdvType_id == "") {
        alert(window.lang.translate('Advance Type is invalid'));
        return false;
    }
    if (empAccHead_id == "-1" || empAccHead_id == "") {
        alert(window.lang.translate('Expense Type is invalid'));
        return false;
    }

    return true;
}

function displayEmpAdvanceExp() {
    var headerBackBtn = defaultPagePath + 'headerPageForBEOperation.html';
    var pageRef = defaultPagePath + 'availableEmpAdvance.html';
    j(document).ready(function() {
        j('#mainHeader').load(headerBackBtn);
        j('#mainContainer').load(pageRef);
    });
    appPageHistory.push(pageRef);
}

function hideEAIcons() {
    if (window.localStorage.getItem("EaInMobile") == "true") {
        document.getElementById('CategoryEAId').style.display = "block";
    } else {
        document.getElementById('CategoryEAId').style.display = "none";
    }
}

function hideEAMenus() {
    if (window.localStorage.getItem("EaInMobile") == "true") {
        document.getElementById('EaDisplayID').style.display = "block";
    } else {
        document.getElementById('EaDisplayID').style.display = "none";
    }
}

function hideEmployeeAdvance() {
    if (window.localStorage.getItem("EaInMobile") == "true") {
        fetchEmployeeAdvance();
        document.getElementById('helpimage').style.display = "";
        //document.getElementById('EA').style.display="";
    } else {
        fetchExpenseClaim();
        document.getElementById('helpimage').style.display = "none";
        document.getElementById('EA').style.display = "none";
    }
}

function populateBEAmount() {
    var BEAmount = 0;
    var convAmount = 0;
    if (j("#source tr.selected").hasClass("selected")) {
        j("#source tr.selected").each(function(index, row) {
            var Amount = j(this).find('td.expAmt1').text();

            var convRate = j(this).find('td.conversionRate').text();
            //get Amount 
            convAmount = parseFloat(Amount) * parseFloat(Math.round(convRate * 100) / 100);
            BEAmount = parseFloat(BEAmount) + parseFloat(Math.round(convAmount * 100) / 100);
        });

        if (BEAmount != "") {
            document.getElementById("totalAmount").value = BEAmount;
        }
    } else {
        document.getElementById("totalAmount").value = "";
    }
}

function populateEAAmount() {
    var EAAmount = 0;
    if (j("#source1 tr.selected").hasClass("selected")) {
        j("#source1 tr.selected").each(function(index, row) {
            var Amount = j(this).find('td.Amount').text();
            //get Amount 
            EAAmount = parseFloat(EAAmount) + parseFloat(Amount);
        });

        if (EAAmount != "") {
            document.getElementById("unsetAdvAmount").value = EAAmount;
        }
    } else {
        document.getElementById("unsetAdvAmount").value = "";
    }
}

function calculateAmount() {
    var beAmount = 0
    var eaAmount = 0
    beAmount = document.getElementById("totalAmount").value;
    eaAmount = document.getElementById("unsetAdvAmount").value;

    if (beAmount != "" && beAmount != 0 && eaAmount != "" && eaAmount != 0) {
        if (parseFloat(beAmount) > parseFloat(eaAmount)) {
            document.getElementById("refundToEmp").value = parseFloat(beAmount) - parseFloat(eaAmount);
            document.getElementById("recoverFromEmp").value = "0";
        } else if (parseFloat(eaAmount) > parseFloat(beAmount)) {
            document.getElementById("recoverFromEmp").value = parseFloat(eaAmount) - parseFloat(beAmount);
            document.getElementById("refundToEmp").value = "0";
        } else {
            document.getElementById("refundToEmp").value = "0";
            document.getElementById("recoverFromEmp").value = "0";
        }
    } else {
        document.getElementById("refundToEmp").value = "0";
        document.getElementById("recoverFromEmp").value = "0";
    }
}

function displayEmpAdv() {
    var headerBackBtn = defaultPagePath + 'backbtnPage.html';
    var pageRef = defaultPagePath + 'fairClaimTable.html';
    j(document).ready(function() {
        j('#mainHeader').load(headerBackBtn);
    });
    document.getElementById('BE').style.display = "none";
    document.getElementById('EA').style.display = "";
    document.getElementById('helpimage').style.display = "none";
    appPageHistory.push(pageRef);
}

function submitBEWithEA() {
    var jsonExpenseDetailsArr = [];
    var busExpDetailsArr = [];
    var jsonEmplAdvanceArr = [];
    var emplAdvanceDetailsArr = [];
    var month;
    var year;
    expenseClaimDates = new Object;
    if (requestRunning) {
        return;
    }
    var accountHeadIdToBeSent = ''
    exceptionMessage = '';
    if (j("#source tr.selected").hasClass("selected")) {
        j("#source tr.selected").each(function(index, row) {
            var busExpDetailId = j(this).find('td.busExpId').text();
            var jsonFindBE = new Object();
            var expDate = j(this).find('td.expDate1').text();
            var expenseDate = expDate;
            var currentDate = new Date(expenseDate);
            //get Start Date
            if (!expenseClaimDates.hasOwnProperty('minInDateFormat')) {
                expenseClaimDates["minInDateFormat"] = currentDate;
                expenseClaimDates["minInStringFormat"] = expenseDate;
            } else {
                if (expenseClaimDates.minInDateFormat > currentDate) {
                    expenseClaimDates["minInDateFormat"] = currentDate;
                    expenseClaimDates["minInStringFormat"] = expenseDate;
                }
            }
            //get End Date
            if (!expenseClaimDates.hasOwnProperty('maxInDateFormat')) {
                expenseClaimDates["maxInDateFormat"] = currentDate;
                expenseClaimDates["maxInStringFormat"] = expenseDate;
            } else {
                if (expenseClaimDates.maxInDateFormat < currentDate) {
                    expenseClaimDates["maxInDateFormat"] = currentDate;
                    expenseClaimDates["maxInStringFormat"] = expenseDate;
                }
            }

            jsonFindBE["expenseDate"] = expenseDate;
            //get Account Head
            var currentAccountHeadID = j(this).find('td.accHeadId').text();

            if (validateAccountHead() == true) {
                accountHeadIdToBeSent = currentAccountHeadID

                jsonFindBE["accountCodeId"] = j(this).find('td.accountCodeId').text();
                jsonFindBE["ExpenseId"] = j(this).find('td.expNameId').text();
                jsonFindBE["ExpenseName"] = j(this).find('td.expName').text();
                jsonFindBE["fromLocation"] = j(this).find('td.expFromLoc1').text();
                jsonFindBE["toLocation"] = j(this).find('td.expToLoc1').text();
                jsonFindBE["narration"] = j(this).find('td.expNarration1').text();
                jsonFindBE["paidBy"] = j(this).find('td.paidBy').text();
                jsonFindBE["vendorName"] = j(this).find('td.vendorName').text();
                jsonFindBE["invoiceNo"] = j(this).find('td.invoiceNo').text();

                jsonFindBE["isErReqd"] = j(this).find('td.isErReqd').text();
                jsonFindBE["ERLimitAmt"] = j(this).find('td.ERLimitAmt').text();

                jsonFindBE["perUnitException"] = j(this).find('td.isEntitlementExceeded').text();

                if (j(this).find('td.expUnit').text() != "") {
                    jsonFindBE["units"] = j(this).find('td.expUnit').text();
                }

                jsonFindBE["wayPoint"] = j(this).find('td.wayPoint').text();

                jsonFindBE["amount"] = j(this).find('td.expAmt1').text();
                jsonFindBE["currencyId"] = j(this).find('td.currencyId').text();

                var dataURL = j(this).find('td.busAttachment').text();

                //For IOS image save
                var data = dataURL.replace(/data:image\/(png|jpg|jpeg);base64,/, '');

                //For Android image save
                //var data = dataURL.replace(/data:base64,/, '');

                jsonFindBE["isEntiLineOrVoucherLevel"] = j(this).find('td.isEntiLineOrVoucherLevel').text();
                jsonFindBE["expFixedLimitAmt"] = j(this).find('td.expFixedLimitAmt').text();
                month = j(this).find('td.month').text();
                year = j(this).find('td.year').text();

                jsonFindBE["imageAttach"] = data;

                jsonExpenseDetailsArr.push(jsonFindBE);

                busExpDetailsArr.push(busExpDetailId);
                requestRunning = true;

            } else {
                if (exceptionMessage == '') {
                    exceptionMessage = "Selected expenses should be mapped under Single Expense Type/Account Head."
                        //j('#displayError').children('span').text(exceptionMessage);
                        //j('#displayError').hide().fadeIn('slow').delay(3000).fadeOut('slow');
                        // j('#displayError').children('span').text("Selected expenses should be mapped under Single Expense Type/Account Head.");
                    requestRunning = false;
                    accountHeadIdToBeSent = "";
                    alert(exceptionMessage);
                }

            }
        });

        if (j("#source1 tr.selected").hasClass("selected")) {
            j("#source1 tr.selected").each(function(index, row) {
                var jsonFindEA = new Object();
                jsonFindEA["empAdvID"] = j(this).find('td.empAdvID').text();
                jsonFindEA["emplAdvVoucherNo"] = j(this).find('td.emplAdvVoucherNo').text();
                jsonFindEA["empAdvTitle"] = j(this).find('td.empAdvTitle').text();
                jsonFindEA["Amount"] = j(this).find('td.Amount').text();
                emplAdvanceDetailsArr.push(j(this).find('td.empAdvID').text());
                jsonEmplAdvanceArr.push(jsonFindEA);
            });

        }

        if (accountHeadIdToBeSent != "" && busExpDetailsArr.length > 0) {
            sendForApprovalBusinessDetailsWithEa(jsonExpenseDetailsArr, jsonEmplAdvanceArr, busExpDetailsArr, emplAdvanceDetailsArr, accountHeadIdToBeSent, month, year);
        }
    } else {
        alert(window.lang.translate('Tap and select Expenses to send for Approval with server.'));
    }

}

function sendForApprovalBusinessDetailsWithEa(jsonBEArr, jsonEAArr, busExpDetailsArr, empAdvArr, accountHeadID, month, year) {
    var jsonToSaveBE = new Object();
    var totalAmount = 0;
    var unsetAdvAmount = 0;
    var refundToEmp = 0;
    var recoverFromEmp = 0;

    totalAmount = document.getElementById("totalAmount").value;
    unsetAdvAmount = document.getElementById("unsetAdvAmount").value;
    refundToEmp = document.getElementById("refundToEmp").value;
    recoverFromEmp = document.getElementById("recoverFromEmp").value;

    jsonToSaveBE["employeeId"] = window.localStorage.getItem("EmployeeId");
    jsonToSaveBE["gradeId"] = window.localStorage.getItem("GradeID");
    jsonToSaveBE["expenseDetails"] = jsonBEArr;
    jsonToSaveBE["totalAmount"] = totalAmount;
    jsonToSaveBE["unsetAdvAmount"] = unsetAdvAmount;
    jsonToSaveBE["refundToEmp"] = refundToEmp;
    jsonToSaveBE["recoverFromEmp"] = recoverFromEmp;
    jsonToSaveBE["employeeAdvDeatils"] = jsonEAArr;
    jsonToSaveBE["startDate"] = expenseClaimDates.minInStringFormat;
    jsonToSaveBE["endDate"] = expenseClaimDates.maxInStringFormat;
    jsonToSaveBE["DelayAllowCheck"] = false;
    jsonToSaveBE["BudgetingStatus"] = window.localStorage.getItem("BudgetingStatus");
    jsonToSaveBE["accountHeadId"] = accountHeadID;
    jsonToSaveBE["ProcessStatus"] = "1";
    jsonToSaveBE["month"] = month;
    jsonToSaveBE["year"] = year;
    jsonToSaveBE["title"] = window.localStorage.getItem("FirstName") + "/" + jsonToSaveBE["startDate"] + " to " + jsonToSaveBE["endDate"];

    var pageRefSuccess = defaultPagePath + 'success.html';
    var pageRefFailure = defaultPagePath + 'failure.html';
    callSendForApprovalServiceForBEwithEA(jsonToSaveBE, busExpDetailsArr, empAdvArr, pageRefSuccess, pageRefFailure);

}

function callSendForApprovalServiceForBEwithEA(jsonToSaveBE, busExpDetailsArr, empAdvArr, pageRefSuccess, pageRefFailure) {
    j('#loading_Cat').show();
    var headerBackBtn = defaultPagePath + 'backbtnPage.html';

    var status = validateExpenseAmtForVoucher(jsonToSaveBE);

    if (status == true) {

        validateMontlyAmtForVoucherForBEWithEA(jsonToSaveBE, busExpDetailsArr, empAdvArr, pageRefSuccess, pageRefFailure);

    } else {
        j('#loading_Cat').hide();
        requestRunning = false;
    }
}

function openNav() {
    document.getElementById("mySidenav").style.width = "230px";
}

function closeNav() {
    //document.getElementById("mySidenav").style.width = "0";
}

function addHeader() {
    var headerBackBtn = defaultPagePath + 'backbtnPage.html';
    j(document).ready(function() {
        j('#mainHeader').load(headerBackBtn);
    });
}

function fetchBusiEmpAdv() {
    if (window.localStorage.getItem("EaInMobile") == "true") {
        fetchBusinessExpNdEmployeeAdv();
        document.getElementById('helpimage').style.display = "";
        //document.getElementById('EA').style.display="";
    } else {
        fetchExpenseClaimFromMain();
        document.getElementById('helpimage').style.display = "none";
        document.getElementById('EA').style.display = "none";
    }
}

function createBusiExpMain() {
    resetImageData();
    var headerBackBtn = defaultPagePath + 'backbtnPage.html';
    var pageRef = defaultPagePath + 'businessExpenseMainPage.html';
    j(document).ready(function() {
        j('#mainHeader').load(headerBackBtn);
        j('#mainContainer').load(pageRef);
    });
    appPageHistory.push(pageRef);
}

function createTravelMain() {
    resetImageData();
    var headerBackBtn = defaultPagePath + 'backbtnPage.html';
    var pageRef = defaultPagePath + 'travelMainPage.html';
    j(document).ready(function() {
        j('#mainHeader').load(headerBackBtn);
        j('#mainContainer').load(pageRef);
    });
    appPageHistory.push(pageRef);
}

function viewVouchers() {
    resetImageData();
    var headerBackBtn = defaultPagePath + 'backbtnPage.html';
    var pageRef = defaultPagePath + 'viewApproverVouchers.html';
    j(document).ready(function() {
        j('#mainHeader').load(headerBackBtn);
        j('#mainContainer').load(pageRef);
    });
    appPageHistory.push(pageRef);
}

function viewPastVouchers() {
    resetImageData();
    var headerBackBtn = defaultPagePath + 'backbtnPage.html';
    var pageRef = defaultPagePath + 'viewApproverPastVouchers.html';
    j(document).ready(function() {
        j('#mainHeader').load(headerBackBtn);
        j('#mainContainer').load(pageRef);
    });
    appPageHistory.push(pageRef);
}



function onloadDefaultValue() {
    clickedFlagCar = false;
    clickedFlagTicket = false;
    clickedFlagHotel = false;
}

// changes for sms app
function createSMS() {

    var headerBackBtn = defaultPagePath + 'headerPageForWalletOperation.html';
    var pageRef = defaultPagePath + 'sms.html';
    j(document).ready(function() {
        j('#mainHeader').load(headerBackBtn);
        j('#mainContainer').load(pageRef);
    });
    appPageHistory.push(pageRef);
}

function initApp() {
    updateStatus('init app called');
    if (!SMS) {
        alert('SMS plugin not ready');
        return;
    }
    updateStatus('SMS count: ' + smsList.length);
    document.addEventListener('onSMSArrive', function(e) {
        saveIncomingSMSOnLocal(e);
    }, false);
    alert('end of init');
}

function createEWallet() {

    var headerBackBtn = defaultPagePath + 'headerPageForSMSOperation.html';
    var pageRef = defaultPagePath + 'eWalletOptions.html';
    j(document).ready(function() {
        j('#mainHeader').load(headerBackBtn);
        j('#mainContainer').load(pageRef);
    });
    appPageHistory.push(pageRef);
}

function viewMessages() {
    /*var e = { "data" : {"address": "paytm", "body":"You have made payment of Rs.135.00 to om rest.", "date_sent":1482401219880}}
     saveIncomingSMSOnLocal(e);
     var e1 = { "data" : {"address": "freecharge", "body":"Recharge of BSNL mobile for Rs.54 was successful. operator refrence number is 0154324", "date_sent":1482601219880}}
     saveIncomingSMSOnLocal(e1);
     var e2 = { "data" : {"address": "uber", "body":"You paid uber Rs.134.65 with your paytm wallet. reference number for the transaction is 93123a24", "date_sent":1482701219880}}
     saveIncomingSMSOnLocal(e2);
     var e3 = { "data" : {"address": "paytm", "body":"Hi,  your order #142592342342 of Rs. 2490 for 2 items is successful. we will let you know once seller ships it.", "date_sent":1482201219880}}
     saveIncomingSMSOnLocal(e3);
     var e4 = { "data" : {"address": "Creditcard", "body":"hi, payment of your electricity bill was successful for Rs.987.", "date_sent":1482101219880}}
     saveIncomingSMSOnLocal(e4);*/

    //console.log("viewMessages  "+filtersStr)
    var headerBackBtn = defaultPagePath + 'headerPageForSMSOperation.html';
    var pageRef = defaultPagePath + 'fairMessageTable.html';
    j(document).ready(function() {
        setTimeout(function() {
            j('#mainHeader').load(headerBackBtn);
            j('#mainContainer').load(pageRef);
        }, 500);
    });
    appPageHistory.push(pageRef);
    j('#loading_Cat').hide();
}

function getFormattedDateFromMillisec(input) {

    var time = new Date(input);
    var theyear = time.getFullYear();
    var themonth = time.getMonth() + 1;
    var thetoday = time.getDate();
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return thetoday + "-" + months[(themonth - 1)] + "-" + theyear;
}

function saveIncomingSMSOnLocal(e) {
    var sms = e.data;
    smsList.push(sms);
    // console.log(sms);
    var senderAddress = "" + sms.address;
    senderAddress = senderAddress.toLowerCase();
    if (senderAddress.includes("paytm") || senderAddress.includes("freecharge") || senderAddress.includes("uber") || senderAddress.includes("Creditcard")) {
        // console.log("inside if condition")
        if (smsFilterBox(sms.body))
            saveSMS(sms);
    }
}

function startWatch() {
    if (SMS) SMS.startWatch(function() {
        window.localStorage.setItem("smsWatchStatus", true);
        //smsWatchFlagStatus = true;
        //alert(updateStrForSMS+'watching started'); 
    }, function() {
        window.localStorage.setItem("smsWatchStatus", false);
        //smsWatchFlagStatus = false ;
        //alert(updateStrForSMS+'failed to start watching');
    });
}

function parseIncomingSMSForAmount(input) {
    var amount = "";
    if (input.includes("Rs.")) {
        var msg = input.split("Rs.")

        var test = msg[1];
        var rsExtractStr = test.trim().split(" ");
        amount = rsExtractStr[0];
    }
    return amount;
}

function operationsOnSMS() {
    j(document).ready(function() {
        j('#discard').on('click', function(e) {
            if (requestRunning) {
                return;
            }
            var pageRef = defaultPagePath + 'fairMessageTable.html';
            if (j("#source tr.selected").hasClass("selected")) {
                j("#source tr.selected").each(function(index, row) {
                    requestRunning = true;
                    var smsID = j(this).find('td.smsId').text();
                    discardMessages(smsID);
                    j('#mainContainer').load(pageRef);
                    var SMSSuccessMsgForDelete = "message/s deleted successfully.";
                    document.getElementById("syncSuccessMsg").innerHTML = SMSSuccessMsgForDelete;
                    j('#syncSuccessMsg').hide().fadeIn('slow').delay(3000).fadeOut('slow');
                    requestRunning = false;
                });
            } else {
                alert("Tap and select messages for save.");
            }
        });

    });

    j('#saveSMS').on('click', function(e) {
        if (requestRunning) {
            return;
        }
        var pageRef = defaultPagePath + 'smsToExpense.html';
        if (j("#source tr.selected").hasClass("selected")) {
            j("#source tr.selected").each(function(index, row) {
                requestRunning = true;
                var smsID = j(this).find('td.smsId').text();
                var smsText = j(this).find('td.smsText').text();
                var smsSentDate = j(this).find('td.smsSentDate').text();
                var smsAmount = j(this).find('td.smsAmount').text();
                smsToExpenseStr = smsID + "_" + smsText + "_" + smsSentDate + "_" + smsAmount;
                discardMessages(smsID);
                j('#mainContainer').load(pageRef);
                //  console.log("inside of save header btn click mthd "+smsToExpenseStr)
                //  var SMSSuccessMsgForDelete="message/s deleted successfully.";
                // document.getElementById("syncSuccessMsg").innerHTML = SMSSuccessMsgForDelete;
                // j('#syncSuccessMsg').hide().fadeIn('slow').delay(3000).fadeOut('slow');
                requestRunning = false;
            });
        } else {
            alert("Tap and select messages for save.");
        }
    });
}

function smsFilterBox(smsText) {
    var filtersStr = window.localStorage.getItem("SMSFilterationStr");
    //console.log("filtersStr  "+filtersStr)
    var blockedWordsStr = filtersStr.split("@")[0];
    var allowedWordsStr = filtersStr.split("@")[1];
    var returnFlag = false;
    var blockedFlag = false;
    var blockedWords = blockedWordsStr.split("$");
    smsText = smsText.toLowerCase();

    for (var i = 0; i < blockedWords.length - 1; i++) {
        var word = blockedWords[i].toLowerCase();
        //console.log("blockedWords  "+word)
        if (smsText.includes(word)) {
            // console.log("blockedWord included "+word)
            blockedFlag = true;
            break;
        }
    }
    if (!blockedFlag) {
        var allowedWords = allowedWordsStr.split("$");
        for (var i = 0; i < allowedWords.length - 1; i++) {
            var word = allowedWords[i].toLowerCase();
            //console.log("allowed  "+word)
            if (smsText.includes(word)) {
                // console.log("allowed included "+word)
                returnFlag = true;
                break;
            }
        }
    } else {
        returnFlag = false;
    }
    return returnFlag;
}

function getExpenseDateFromSMS(input) {
    // converts date from dd-MMM-yyyy to mm/dd/yyyy 
    var date = new Date(input);

    return (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear();
}

function hideSmartClaims() {
    /*	if(window.localStorage.getItem("smartClaimsViaSMSOnMobile") == "true"){
    		document.getElementById('smartClaimsID').style.display="";		
    	}else{
    		document.getElementById('smartClaimsID').style.display="none";
    	}*/
}

function hideMultilanguage() {
    if (window.localStorage.getItem("multiLangInMobile") == "true" && document.getElementById('multiLang') != null) {
        document.getElementById('multiLang').style.display = "block";
    } else {
        if (document.getElementById('multiLang') != null) {
            document.getElementById('multiLang').style.display = "none";
        }
    }
}

function populateMainPage() {
    j('#loading').show();
    var headerBackBtn = defaultPagePath + 'categoryMsgPage.html';
    var pageRef = defaultPagePath + 'category.html';

    j('#mainHeader').load(headerBackBtn);
    j('#mainContainer').load(pageRef);
    appPageHistory.push(pageRef);
    //addEmployeeDetails(data);

    if (window.localStorage.getItem("EaInMobile") != null &&
        window.localStorage.getItem("EaInMobile")) {
        synchronizeEAMasterData();
    }

    if (window.localStorage.getItem("TrRole") != null &&
        window.localStorage.getItem("TrRole")) {
        synchronizeTRMasterData();
        synchronizeTRForTS();
    }
    synchronizeBEMasterData();

    if (window.localStorage.getItem("smartClaimsViaSMSOnMobile") != null &&
        window.localStorage.getItem("smartClaimsViaSMSOnMobile")) {
        synchronizeWhiteListMasterData();
        startWatch();
    }

    j('#loading').hide();
}

//  *****************************************  Upcoming Trips -- Start  **************************************//

function addTrip() {
    window.location.href = 'app/pages/trips-info.html';
}

function clearDiv() {

    document.getElementById('firstDiv').style.display = '';
    document.getElementById('tabTrip1').style.display = 'none';
    document.getElementById('tripdet').style.display = 'none';
    document.getElementById('tabFlight1').style.display = 'none';
    document.getElementById('flightdet').style.display = 'none';
    document.getElementById('tabSuccess').style.display = 'none';
}

function clearDivSync() {
    document.getElementById('tabTrip1').style.display = 'none';
    document.getElementById('tripdet').style.display = 'none';
    document.getElementById('tabFlight1').style.display = 'none';
    document.getElementById('flightdet').style.display = 'none';
    document.getElementById('tabSuccess').style.display = 'none';
}

function clearDivExpense() {
    document.getElementById('tabTrip1').style.display = 'none';
    document.getElementById('tripdet').style.display = 'none';
    document.getElementById('tabFlight1').style.display = 'none';
    document.getElementById('flightdet').style.display = 'none';
    document.getElementById('tabSuccess').style.display = 'none';
}

function clearDivRequest() {
    document.getElementById('tabTrip1').style.display = 'none';
    document.getElementById('tripdet').style.display = 'none';
    document.getElementById('tabFlight1').style.display = 'none';
    document.getElementById('flightdet').style.display = 'none';
    document.getElementById('tabSuccess').style.display = 'none';
}

//  *****************************************  Upcoming Trips -- End  **************************************//

//   ****************************************  Business Edit Page -- Start  ******************************** //

function expPrimaryId() {

    if (j("#source tr.selected").hasClass("selected")) {
        j("#source tr.selected").each(function(index, row) {

            getPrimaryExpenseId(j(this).find('td.expNameId').text());

        });

    }
}

function editBusiExpMain(expPrimaryId) {

    var busExpDetailsArr = [];
    var jsonExpenseDetailsArr = [];
    expenseClaimDates = new Object;
    if (j("#source tr.selected").hasClass("selected")) {
        j("#source tr.selected").each(function(index, row) {
            if (requestRunning) {
                return;
            }

            var busExpDetailId = j(this).find('td.busExpId').text();
            var jsonFindBE = new Object();
            var expDate = j(this).find('td.expDate1').text();
            var expenseDate = expDate;
            jsonFindBE["busExpDetailId"] = busExpDetailId;
            jsonFindBE["expenseDate"] = expenseDate;
            jsonFindBE["accountHeadId"] = j(this).find('td.accHeadId').text();
            jsonFindBE["accountCodeId"] = j(this).find('td.accountCodeId').text();
            jsonFindBE["expenseId"] = expPrimaryId;
            jsonFindBE["ExpenseName"] = j(this).find('td.expName').text();
            jsonFindBE["fromLocation"] = j(this).find('td.expFromLoc1').text();
            jsonFindBE["toLocation"] = j(this).find('td.expToLoc1').text();
            jsonFindBE["narration"] = j(this).find('td.expNarration1').text();
            if (j(this).find('td.expUnit').text() != "") {
                jsonFindBE["units"] = j(this).find('td.expUnit').text();
            }
            jsonFindBE["wayPoint"] = j(this).find('td.wayPoint').text();
            jsonFindBE["amount"] = j(this).find('td.expAmt1').text();
            jsonFindBE["currencyId"] = j(this).find('td.currencyId').text();
            jsonFindBE["perUnitException"] = j(this).find('td.isEntitlementExceeded').text();

            var dataURL = j(this).find('td.busAttachment').text();

            //For IOS image save
            //var data = dataURL.replace(/data:image\/(png|jpg|jpeg);base64,/, '');

            //For Android image save
            var data = dataURL.replace(/data:base64,/, '');

            jsonFindBE["imageAttach"] = data;
            
            localStorage.setItem("jsonFindBE", JSON.stringify(jsonFindBE));

            console.log(JSON.stringify(jsonFindBE));

        });

    } else {
        alert(window.lang.translate('Tap and select Expenses to synch with server.'));
    }

    var headerBackBtn = defaultPagePath + 'backbtnPage.html';
    var pageRef = defaultPagePath + 'businessExpenseEditPage.html';
    j(document).ready(function() {
        j('#mainHeader').load(headerBackBtn);
        j('#mainContainer').load(pageRef);
    });
    appPageHistory.push(pageRef);
}

function setPerUnitDetailsForEdit(transaction, results) {

    if (results != null) {
        var row = results.rows.item(0);
        perUnitDetailsJSON["expenseIsfromAndToReqd"] = row.expIsFromToReq;
        perUnitDetailsJSON["isUnitReqd"] = row.expIsUnitReq;
        perUnitDetailsJSON["expRatePerUnit"] = row.expRatePerUnit;
        perUnitDetailsJSON["expFixedOrVariable"] = row.expFixedOrVariable;
        perUnitDetailsJSON["expFixedLimitAmt"] = row.expFixedLimitAmt;
        perUnitDetailsJSON["expenseName"] = row.expName;
        perUnitDetailsJSON["expPerUnitActiveInative"] = row.expPerUnitActiveInative;
        perUnitDetailsJSON["isErReqd"] = row.isErReqd;
        perUnitDetailsJSON["limitAmountForER"] = row.limitAmountForER;
        perUnitDetailsJSON["isAttachmentReq"] = row.isAttachmentReq;
        showAttachmentmessage();

        document.getElementById("ratePerUnit").value = row.expRatePerUnit;
/*        document.getElementById("expAmt").value = "";
        document.getElementById("expUnit").value = "";
        document.getElementById("expFromLoc").value = "";
        document.getElementById("expToLoc").value = "";
        document.getElementById("expNarration").value = "";
        document.getElementById("expUnit").value = "";
        document.getElementById("expAmt").value = "";
        $(".dropdown-content").hide();
        fromLocationWayPoint = "";
        toLocationWayPoint = "";*/
        if (perUnitDetailsJSON.expenseIsfromAndToReqd == 'N') {
           document.getElementById("expFromLoc").value = "";
            document.getElementById("expToLoc").value = "";
            document.getElementById("expFromLoc").disabled = true;
            document.getElementById("expToLoc").disabled = true;
            document.getElementById("expFromLoc").style.backgroundColor = '#d1d1d1';
            document.getElementById("expToLoc").style.backgroundColor = '#d1d1d1';
            document.getElementById("expNarration").disabled = false;
            document.getElementById("expNarration").style.backgroundColor = '#FFFFFF';
            document.getElementById("mapImage").style.display = "none";
            $(".dropdown-content").hide();
            fromLocationWayPoint = "";
            toLocationWayPoint = "";
        } else {
            document.getElementById("expFromLoc").disabled = false;
            document.getElementById("expToLoc").disabled = false;
/*          document.getElementById("expFromLoc").value = "";
            document.getElementById("expToLoc").value = "";
            document.getElementById("expNarration").value = "";*/
            document.getElementById("expFromLoc").style.backgroundColor = '#FFFFFF';
            document.getElementById("expToLoc").style.backgroundColor = '#FFFFFF';
            $(".dropdown-content").hide();
            fromLocationWayPoint = "";
            toLocationWayPoint = "";
            if (window.localStorage.getItem("MobileMapRole") == 'true') {
                if (window.localStorage.getItem("MapProvider") == "GOOGLEMAP") {
                    attachGoogleSearchBox(document.getElementById("expFromLoc"));
                    attachGoogleSearchBox(document.getElementById("expToLoc"));
                }
                document.getElementById("mapImage").style.display = "";
                document.getElementById("expNarration").disabled = true;
                document.getElementById("expNarration").style.backgroundColor = '#d1d1d1';
            }
        }
        if (perUnitDetailsJSON.isUnitReqd == 'Y') {
            document.getElementById("expAmt").value = "";
            if (perUnitDetailsJSON.expFixedOrVariable == 'V') {
                flagForUnitEnable = true;
                if (perUnitDetailsJSON.expenseIsfromAndToReqd == 'Y' && window.localStorage.getItem("MobileMapRole") == 'true') {
                    document.getElementById("expUnit").disabled = true;
                    document.getElementById("expUnit").style.backgroundColor = '#d1d1d1';
                } else {
                    document.getElementById("expUnit").disabled = false;
                    document.getElementById("expUnit").style.backgroundColor = '#FFFFFF';
                }
                document.getElementById("expAmt").disabled = false;
                document.getElementById("expAmt").style.backgroundColor = '#FFFFFF';
            } else {
                flagForUnitEnable = true;
                if (perUnitDetailsJSON.expenseIsfromAndToReqd == 'Y' && window.localStorage.getItem("MobileMapRole") == 'true') {
                    document.getElementById("expUnit").disabled = true;
                    document.getElementById("expUnit").style.backgroundColor = '#d1d1d1';
                } else {
                    document.getElementById("expUnit").disabled = false;
                    document.getElementById("expUnit").style.backgroundColor = '#FFFFFF';
                }
                document.getElementById("expAmt").disabled = true;
                document.getElementById("expAmt").style.backgroundColor = '#d1d1d1';
            }
        } else {
            flagForUnitEnable = false;
            document.getElementById("expUnit").disabled = true;
            document.getElementById("expUnit").style.backgroundColor = '#d1d1d1';
            document.getElementById("expAmt").disabled = false;
            document.getElementById("expAmt").style.backgroundColor = '#FFFFFF';
        }
        if (perUnitDetailsJSON.expPerUnitActiveInative == '1') {
            flagForUnitEnable = false;
            document.getElementById("expUnit").disabled = true;
            document.getElementById("expAmt").disabled = false;
            document.getElementById("expAmt").style.backgroundColor = '#FFFFFF';
            document.getElementById("expUnit").style.backgroundColor = '#d1d1d1';
        }
    } else {

        alert("Please Synch your expense Names to claim expense.");
    }

}


//   ****************************************  Business Edit Page -- End  ******************************** //

// ****************************************** Approval Pages -- Start  *********************************** //


function voucherDetails(loadDiv) {
    enableDiv = loadDiv;
    resetImageData();
    var headerBackBtn = defaultPagePath + 'backbtnPage.html';
    var pageRef = defaultPagePath + 'voucherDetails.html';
    j(document).ready(function() {
        j('#mainHeader').load(headerBackBtn);
        j('#mainContainer').load(pageRef);
    });

    appPageHistory.push(pageRef);
}

// ****************************************** Approval Pages -- End  *********************************** //

// ****************************************** BSLI Changes -- Start  *********************************** //


function showTravelDesk() {
   if (window.localStorage.getItem("TdRole") == "true") {
        document.getElementById('categoryTdRoleIDOneWay').style.display = "block";
    } else {
        document.getElementById('categoryTdRoleIDOneWay').style.display = "none";
    }
}

function sendForApprovalTravelSettleExp(jsonTSArr, tsExpDetailsArr, travelRequestID, trdetails,entitlementAllowCheck) {
   
    var headerBackBtn = defaultPagePath + 'backbtnPage.html';
    var selectedtrdetails = trdetails;
    var trdetail = selectedtrdetails.split("$");
    var title = trdetail[0];
    var accHeadId = trdetail[1];
    var jsonToSaveTS = new Object();
    jsonToSaveTS["employeeId"] = window.localStorage.getItem("EmployeeId");
    jsonToSaveTS["travelSettlementDetails"] = jsonTSArr;
    jsonToSaveTS["startDate"] = travelSettlementDates.minInStringFormat;
    jsonToSaveTS["endDate"] = travelSettlementDates.maxInStringFormat;
    jsonToSaveTS["travelRequestID"] = travelRequestID;
    jsonToSaveTS["ProcessStatus"] = "5";
    jsonToSaveTS["title"] = title;
    jsonToSaveTS["accountHeadId"] = accHeadId;
    jsonToSaveTS["EntitlementAllowCheck"] = entitlementAllowCheck;
   // jsonToSaveTS["title"] = window.localStorage.getItem("FirstName") + "/" + jsonToSaveTS["startDate"] + " to " + jsonToSaveTS["endDate"];

    requestRunning = true;
    var pageRefSuccess = defaultPagePath + 'success.html';
    var pageRefFailure = defaultPagePath + 'failure.html';
    j('#loading_Cat').show();
    j.ajax({
        url: window.localStorage.getItem("urlPath") + "SynchSubmitTravelSettlementExpense",
        type: 'POST',
        dataType: 'json',
        crossDomain: true,
        data: JSON.stringify(jsonToSaveTS),
        success: function(data) {

            if (data.Status == "Failure") {
              j('#loading_Cat').hide();
                if (data.hasOwnProperty('IsEntitlementExceed')) {
                    setTSEntitlementExceedMessage(data, jsonTSArr, tsExpDetailsArr, travelRequestID, trdetails);
                } else {
                    j('#loading_Cat').hide();
                    alert(data.Message);
                }

            } else if (data.Status == "Success") {
                successMessage = data.Message;
                deleteSelectedTravelSettDetails(travelRequestID);
                deleteSelectedTravelRequestFromTravelRequestDetails(travelRequestID);
                requestRunning = false;
                j('#loading_Cat').hide();
                j('#savesyncwrapper').hide();
                j('#mainHeader').load(headerBackBtn);
                j('#mainContainer').load(pageRefSuccess);
                appPageHistory.push(pageRefSuccess);
            } else {
                requestRunning = false;
                successMessage = "Error: Oops something is wrong, Please Contact System Administer";
                j('#loading_Cat').hide();
                j('#mainHeader').load(headerBackBtn);
                j('#mainContainer').load(pageRefFailure);
                appPageHistory.push(pageRefFailure);
            }
        },
        error: function(data) {
            requestRunning = false;
            alert(window.lang.translate('Error: Oops something is wrong, Please Contact System Administer'));
        }
    });
}

function setTSEntitlementExceedMessage(returnJsonData, jsonTSArr, tsExpDetailsArr, travelRequestID, trdetails) {
    var msg = returnJsonData.Message + "This voucher has exceeded Entitlements. Do you want to proceed?";
    var IsEntitlementExceed = confirm(msg);
    if (IsEntitlementExceed == true) {
        onConfirmTS(IsEntitlementExceed, msg, jsonTSArr, tsExpDetailsArr, travelRequestID, trdetails);
    } else {
        return false;
    }
}

function onConfirmTS(IsEntitlementExceed, errormsg, jsonTSArr, tsExpDetailsArr, travelRequestID, trdetails) {
    if (IsEntitlementExceed == true) {
        var entitlementAllowCheck = true;
        j('#loading_Cat').show();
        sendForApprovalTravelSettleExp(jsonTSArr, tsExpDetailsArr, travelRequestID, trdetails, entitlementAllowCheck);
    } else {
        j('#loading_Cat').hide();
        return false;
    }

}

function onloadDatePicker(){
    $('#selectDate_One').datepicker('destroy');
    $('#selectDate_Three').datepicker('destroy');
    $('#selectDate_Two').datepicker('destroy');
    var date = new Date();
    currentMonth = date.getMonth();
    currentDate = date.getDate();
    currentYear = date.getFullYear();
    $('#selectDate_One').datepicker({
       minDate: new Date(currentYear, currentMonth, currentDate)
   });
    $('#selectDate_Three').datepicker({
       minDate: new Date(currentYear, currentMonth, currentDate)
   });
    $('#selectDate_Two').datepicker({
       minDate: new Date(currentYear, currentMonth, currentDate)
   });
}

// ****************************************** BSLI Changes -- End  *********************************** //
