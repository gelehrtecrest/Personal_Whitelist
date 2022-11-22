whitelist.manager = {};

whitelist.manager.handleDeleteWhitelistResponse = function (response) {
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      type: 'refresh'
    });
  })
};

whitelist.manager.handleAddWhitelistResponse = function (response) {
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      type: 'refresh'
    });
  })
};

whitelist.manager.createWhitelistPattern = function (pattern) {
  let patRow = $(
    '<div style="max-width:350px;white-space: nowrap;display:flex;font-size:16px;margin:10px 0;padding:5px 0;border-bottom:1px solid #f2f2f2;"></div>');
  let patRowDeleteButton = $('<div class="isBlocked" style="margin-right: 15px;"></div>');
  let span = $('<span style="color:#1a0dab;margin:0;text-decoration:underline;cursor: pointer;">' +
    chrome.i18n.getMessage('removeUrlFromWhitelist') +
    '</span>');

  patRowDeleteButton.append(span);
  patRowDeleteButton.appendTo(patRow);

  let patRowHostName = $(
    '<div class="pattern-block">' + pattern + '</div>');
  patRowHostName.appendTo(patRow);

  patRowDeleteButton.on("click", function () {
    let btn = $(this);

    if (btn.hasClass("isBlocked")) {
      chrome.runtime.sendMessage({
        type: whitelist.common.DELETE_FROM_BLOCKLIST,
        pattern: pattern
      },
        whitelist.manager.handleDeleteWhitelistResponse);

      btn.removeClass("isBlocked");
      span.html(
        '<span style="color:#1a0dab;margin:0;text-decoration:underline;cursor: pointer;">' +
        chrome.i18n.getMessage('blockThisUrl') +
        '</span>');

    } else {
      chrome.runtime.sendMessage({
        type: whitelist.common.ADD_TO_BLOCKLIST,
        pattern: pattern
      },
        whitelist.manager.handleAddWhitelistResponse);

      btn.addClass("isBlocked");
      span.html(
        '<span style="color:#1a0dab;margin:0;text-decoration:underline;cursor: pointer;">' +
        chrome.i18n.getMessage('removeUrlFromWhitelist') +
        '</span>');

    }
  });
  return patRow;
}

whitelist.manager.handleAddWhitelistResponse = function (response) {
  chrome.runtime.sendMessage({
    type: whitelist.common.GET_BLOCKLIST
  },
    whitelist.manager.handleRefreshResponse);
}

whitelist.manager.hideCurrentHost = function (pattern) {
  chrome.runtime.sendMessage({
    'type': whitelist.common.ADD_TO_BLOCKLIST,
    'pattern': pattern
  },
    whitelist.manager.handleAddWhitelistResponse);
  $("#current-blocklink").html(
    '<p style="background:#dff0d8;color:#3c763d;padding:10px;">' +
    chrome.i18n.getMessage('alreadlyBlocked', pattern) +
    '</p>');
}

whitelist.manager.addBlockCurrentHostLink = function (whitelistPatterns) {
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, function (tabs) {
    let pattern = whitelist.common.getHostNameFromUrl(tabs[0].url);

    if (whitelistPatterns.indexOf(pattern) == -1) {
      $('#current-blocklink').html(
        '<a href="#"> ' +
        chrome.i18n.getMessage("addWhitelist", pattern) +
        '</a>');
      $('#current-blocklink').click(function () {
        whitelist.manager.hideCurrentHost(pattern);
      });
    } else {
      $("#current-blocklink").html(
        '<p style="background:#dff0d8;color:#3c763d;padding:10px;">' +
        chrome.i18n.getMessage('completeBlocked', pattern) +
        '</p>');
    };
  });
}

whitelist.manager.handleRefreshResponse = function (response) {
  $("#manager-pattern-list").show('fast');

  if(response == undefined || response.whitelist == undefined){
    return;
  }

  let length = response.whitelist.length,
    listDiv = $('#manager-pattern-list');
  listDiv.empty();

  if (response.whitelist != undefined && length > 0) {
    whitelist.manager.addBlockCurrentHostLink(response.whitelist);

    for (let i = 0; i < length; i++) {
      var patRow = whitelist.manager.createWhitelistPattern(response.whitelist[i]);
      patRow.appendTo(listDiv);
    }
  } else {
    whitelist.manager.addBlockCurrentHostLink([]);
  }


}

whitelist.manager.refresh = function () {
  chrome.runtime.sendMessage({
    type: whitelist.common.GET_BLOCKLIST
  },
    whitelist.manager.handleRefreshResponse);
};

whitelist.manager.clickImportButton = function () {

  $("#io-head").text(chrome.i18n.getMessage('import'));

  let submitArea = $("#submit-area");
  submitArea.off('click');
  submitArea.text(chrome.i18n.getMessage("save"));
  $("#io-desc").text(chrome.i18n.getMessage('importDescription'));
  $("#io-text").val('');
  submitArea.on("click", function () {
    let pattern = $("#io-text").val();
    whitelist.manager.handleImportButton(pattern);
  });
  $("#io-area").toggleClass('io-area-open');
};


whitelist.manager.handleImportButton = function (pattern) {
  chrome.runtime.sendMessage({
    type: whitelist.common.ADD_LIST_TO_BLOCKLIST,
    pattern: pattern
  },
    whitelist.manager.handleImportButtonResult);
}

whitelist.manager.handleImportButtonResult = function (response) {
  let showMessage = document.createElement('p');
  showMessage.style.cssText = 'background:#dff0d8;color:#3c763d;padding:10px;';
  showMessage.innerHTML = chrome.i18n.getMessage("completeAllBlocked");

  $('#submit-area').after(showMessage);

  setTimeout(function () {
    showMessage.style.visibility = "hidden";
  }, 1000);

  whitelist.manager.refresh();
}

whitelist.manager.clickExportButton = function () {
  chrome.runtime.sendMessage({
    type: whitelist.common.GET_BLOCKLIST
  },
    whitelist.manager.handleExportButton);
};

whitelist.manager.handleExportButton = function (response) {
  if(response == undefined){
    return;
  }
  $("#io-head").text(chrome.i18n.getMessage('export'));

  $('#io-desc').text(chrome.i18n.getMessage('exportDescription'));
  let ioText = $("#io-text");
  let whitelist = response.whitelist;

  ioText.val('');
  for (let i = 0, length = whitelist.length; i < length; i++) {
    ioText.val(ioText.val() + whitelist[i] + "\n");
  }

  let submitArea = $("#submit-area");
  submitArea.off('click');
  submitArea.text(chrome.i18n.getMessage('copy'));
  submitArea.click(function () {
    ioText.select();
    document.execCommand('copy');
  });

  $("#io-area").toggleClass('io-area-open');
}

whitelist.manager.localizeHeader = function () {
  let blockListHeader = $("#blockListHeader");
  blockListHeader.html(chrome.i18n.getMessage("blockListHeader"));
}

whitelist.manager.createIoButton = function () {

  let export_btn = $("#export");
  export_btn.text(chrome.i18n.getMessage("export"));
  export_btn.on("click", function () {
    whitelist.manager.clickExportButton();
  });

  let import_btn = $("#import");
  import_btn.text(chrome.i18n.getMessage("import"));
  import_btn.on("click", function () {
    whitelist.manager.clickImportButton();
  });


}

whitelist.manager.createBackButton = function () {
  $("#back").text(chrome.i18n.getMessage("back"))
  $("#back").on("click", function () {
    $("#io-area").toggleClass('io-area-open');
  });
}

whitelist.manager.createPwsOptionBox = function () {
  chrome.runtime.sendMessage({
    type: whitelist.common.GET_PWS_OPTION_VAL
  },
    whitelist.manager.handlePwsOptionBox);
}

whitelist.manager.handlePwsOptionBox = function (response) {
  $("#pws_option_mes").text(chrome.i18n.getMessage("pws_option_mes"));

  if(response == undefined){
    return;
  }
  if (response.pws_option == "on")
    $("#pws_option").prop("checked", true);

  $("#pws_option").on("change", function () {
    let val = $("#pws_option").prop("checked") ? "on" : "off";
    whitelist.manager.clickPwsOptionCheckbox(val);
  });
}

whitelist.manager.clickPwsOptionCheckbox = function (val) {
  chrome.runtime.sendMessage({
    type: whitelist.common.CHANGE_PWS_OPTION_VAL,
    val: val
  },
    whitelist.manager.handlePwsOptionCheckboxResult);
};

whitelist.manager.handlePwsOptionCheckboxResult = function (response) {
  if (whitelist.common.pws_option_val)
    whitelist.common.pws_option_val = response.pws_option;
}

document.addEventListener('DOMContentLoaded', function () {
  whitelist.manager.refresh();
  whitelist.manager.localizeHeader();
  whitelist.manager.createIoButton();
  whitelist.manager.createBackButton();
  whitelist.manager.createPwsOptionBox();
});


