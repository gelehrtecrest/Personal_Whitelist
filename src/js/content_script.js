
whitelist.searchpage = {};

whitelist.searchpage.whitelist = [];

whitelist.searchpage.mutationObserver = null;

whitelist.searchpage.pws_option = "off";

whitelist.searchpage.SEARCH_RESULT_DIV_BOX = "div.g";

whitelist.searchpage.LINK_TAG = "div.yuRUbf > a";

whitelist.searchpage.handleGetWhitelistResponse = function (response) {
  if (response.whitelist != undefined) {
    whitelist.searchpage.whitelist = response.whitelist;
  }
};

whitelist.searchpage.isHostLinkInWhitelist = function (hostlink) {
  if (whitelist.searchpage.whitelist.indexOf(hostlink) != -1) {
    return true;
  } else {
    return false;
  }
};

whitelist.searchpage.handleAddWhitelistFromSerachResult = function (response) {
  if (response.whitelist != undefined) {
    whitelist.searchpage.whitelist = response.whitelist;
  }
};

whitelist.searchpage.showAddWhitelistMessage = function (pattern, section) {
  let showMessage = document.createElement('div');
  showMessage.style.cssText = 'font-size:15px;background:#d8f7eb;padding:30px;margin:20px 0;box-sizing:border-box;';
  showMessage.innerHTML = chrome.i18n.getMessage("completeBlocked", pattern);

  let cancelMessage = document.createElement('div');
  cancelMessage.classList.add("cancleBlock");
  cancelMessage.style.cssText = "cursor: pointer;margin-top:20px;font-size:16px;font-weight: 700; color: #0066c0;";
  cancelMessage.innerHTML = chrome.i18n.getMessage("cancleBlocked", pattern);
  cancelMessage.addEventListener("click", function (e) {
    whitelist.searchpage.removePatternFromWhitelists(pattern);
    whitelist.searchpage.removeBlockMessage(e.target.parentNode);
  }, false);
  showMessage.appendChild(cancelMessage);
  let parent = section.parentNode;
  parent.insertBefore(showMessage, section);

}

whitelist.searchpage.removeBlockMessage = function (elm) {
  elm.parentNode.removeChild(elm);
}

whitelist.searchpage.removePatternFromWhitelists = function (pattern) {
  chrome.runtime.sendMessage({
    type: whitelist.common.DELETE_FROM_BLOCKLIST,
    pattern: pattern
  }, whitelist.searchpage.handleRemoveWhitelistFromSerachResult);

  whitelist.searchpage.displaySectionsFromSearchResult(pattern);
}

whitelist.searchpage.handleRemoveWhitelistFromSerachResult = function (response) {
  if (response.whitelist != undefined) {
    whitelist.searchpage.whitelist = response.whitelist;
  }
}

whitelist.searchpage.displaySectionsFromSearchResult = function (pattern) {
  whitelist.searchpage.toggleSections(pattern, "block");
}


whitelist.searchpage.deleteSectionsFromSearchResult = function (pattern) {
  whitelist.searchpage.toggleSections(pattern, "none");
};

whitelist.searchpage.toggleSections = function (pattern, display) {
  var searchResultPatterns = document.querySelectorAll(whitelist.searchpage.SEARCH_RESULT_DIV_BOX);

  for (let i = 0, length = searchResultPatterns.length; i < length; i++) {
    var searchResultPattern = searchResultPatterns[i];
    var searchResultHostLink = searchResultPattern.querySelector(whitelist.searchpage.LINK_TAG);
    if (searchResultHostLink) {
      var HostLinkHref = searchResultHostLink.getAttribute("href");
      var sectionLink = HostLinkHref.replace(whitelist.common.HOST_REGEX, '$2');
      if (pattern === sectionLink) {
        searchResultPattern.style.display = display;
      }
    }
  }
}

whitelist.searchpage.addWhitelistFromSearchResult = function (hostlink, searchresult) {
  var pattern = hostlink;
  chrome.runtime.sendMessage({
    type: whitelist.common.ADD_TO_BLOCKLIST,
    pattern: pattern
  },
    whitelist.searchpage.handleAddWhitelistFromSerachResult);
  whitelist.searchpage.deleteSectionsFromSearchResult(pattern);
  whitelist.searchpage.showAddWhitelistMessage(pattern, searchresult);
};

whitelist.searchpage.insertAddBlockLinkInSearchResult = function (searchResult, hostlink) {
  var insertLink = document.createElement('p');
  insertLink.innerHTML = chrome.i18n.getMessage("addWhitelist", hostlink);
  insertLink.style.cssText =
    "color:#1a0dab;margin:0;text-decoration:underline;cursor: pointer;";
  searchResult.appendChild(insertLink);

  insertLink.addEventListener("click", function () {
    whitelist.searchpage.addWhitelistFromSearchResult(hostlink, searchResult);
  }, false);
};

whitelist.searchpage.isPwsFeatureUsed = function () {
  if (whitelist.searchpage.pws_option == "off") return false;

  const PWS_REGEX = /(&|[?])pws=0/;
  return PWS_REGEX.test(location.href);
};

whitelist.searchpage.modifySearchResults = function (parent_dom) {

  if (whitelist.searchpage.isPwsFeatureUsed()) return;

  var searchResultPatterns = parent_dom.querySelectorAll(whitelist.searchpage.SEARCH_RESULT_DIV_BOX);

  for (let i = 0, length = searchResultPatterns.length; i < length; i++) {
    var searchResultPattern = searchResultPatterns[i];
    var searchResultHostLink = searchResultPattern.querySelector(whitelist.searchpage.LINK_TAG);
    if (searchResultHostLink) {
      var HostLinkHref = searchResultHostLink.getAttribute("href");
      var HostLinkPattern = whitelist.common.getHostNameFromUrl(HostLinkHref);

      if (whitelist.searchpage.isHostLinkInWhitelist(HostLinkPattern)) {
        searchResultPattern.style.display = "none";
      } else {
        whitelist.searchpage.insertAddBlockLinkInSearchResult(
          searchResultPattern, HostLinkPattern);
      }
    }
  }
};

whitelist.searchpage.refreshWhitelist = function () {
  chrome.runtime.sendMessage({
    type: whitelist.common.GET_BLOCKLIST
  },
    whitelist.searchpage.handleGetWhitelistResponse);
};

whitelist.searchpage.getPwsOption = function () {
  chrome.runtime.sendMessage({
    type: whitelist.common.GET_PWS_OPTION_VAL
  },
    whitelist.searchpage.handleGetPwsOptionResponse);
}

whitelist.searchpage.handleGetPwsOptionResponse = function (response) {
  whitelist.searchpage.pws_option = response.pws_option;
}

whitelist.searchpage.initMutationObserver = function () {
  if (whitelist.searchpage.mutationObserver != null) return;

  whitelist.searchpage.mutationObserver = new MutationObserver(function (mutations) {
    whitelist.searchpage.modifySearchResultsAdded(mutations);
  });

  const SEARCH_RESULTS_WRAP = "div#center_col";
  let target = document.querySelector(SEARCH_RESULTS_WRAP);
  let config = { childList: true, subtree: true };
  console.log(target);
  if(!target){
    return;
  }
  whitelist.searchpage.mutationObserver.observe(target, config);
}

whitelist.searchpage.modifySearchResultsAdded = function (mutations) {
  for (let i = 0; i < mutations.length; i++) {
    let mutation = mutations[i];
    let nodes = mutation.addedNodes;

    if (nodes.length !== 3) continue;

    let div_tag = nodes[1];
    if (div_tag.tagName !== "DIV") continue;

    let new_srp_div = div_tag.parentNode;
    if (!(/arc-srp_([0-9]+)/).test(new_srp_div.id)) continue;

    whitelist.searchpage.modifySearchResults(new_srp_div);
  };
}

whitelist.searchpage.refreshWhitelist();
whitelist.searchpage.getPwsOption();

document.addEventListener("DOMContentLoaded", function () {
  whitelist.searchpage.initMutationObserver();
  whitelist.searchpage.modifySearchResults(document);
}, false);
