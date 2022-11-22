let whitelist = {};

whitelist.common = {};

whitelist.common.pws_option_val = "off";

whitelist.common.GET_BLOCKLIST = 'getWhitelist';
whitelist.common.ADD_TO_BLOCKLIST = 'addToWhitelist';
whitelist.common.ADD_LIST_TO_BLOCKLIST = 'addListToWhitelist';
whitelist.common.DELETE_FROM_BLOCKLIST = 'deleteFromWhitelist';
whitelist.common.GET_PWS_OPTION_VAL = "getPwsOptionVal";
whitelist.common.CHANGE_PWS_OPTION_VAL = "changePwsOptionVal";

whitelist.common.HOST_REGEX = new RegExp(
  '^https?://(www[.])?([0-9a-zA-Z.-]+).*$');

whitelist.common.startBackgroundListeners = function () {
  chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
      if (request.type == whitelist.common.GET_BLOCKLIST) {
        //console.log(localStorage['whitelist_pws_option']);
        let localWhitelist = undefined;
        chrome.storage.local.get(["localWhitelist"], function(items) {
          localWhitelist = items.localWhitelist;
        });
        let whitelistPatterns = [];
        if (!localWhitelist) {
          localWhitelist = JSON.stringify(whitelistPatterns);
        } else {
          whitelistPatterns = JSON.parse(localWhitelist);
        }
        sendResponse({
          whitelist: whitelistPatterns
        });
      } else if (request.type == whitelist.common.ADD_TO_BLOCKLIST) {
        let localWhitelist = undefined;
        chrome.storage.local.get(["localWhitelist"], function(items) {
          localWhitelist = items.localWhitelist;
        });
        let whitelists;
        if(!localWhitelist){
          whitelists = []
        } else {
          whitelists = JSON.parse(localWhitelist);
        }
        if (whitelists.indexOf(request.pattern) == -1) {
          whitelists.push(request.pattern);
          whitelists.sort();
          //localStorage['whitelist'] = JSON.stringify(whitelists);
          chrome.storage.local.set(
            {
              "localWhitelist": JSON.stringify(whitelists)
            }
          );
        }
        sendResponse({
          success: 1,
          pattern: request.pattern
        });

      } else if (request.type == whitelist.common.ADD_LIST_TO_BLOCKLIST) {
        let regex = /(https?:\/\/)?(www[.])?([0-9a-zA-Z.-]+).*(\r\n|\n)?/g;
        let arr = [];
        while ((m = regex.exec(request.pattern)) !== null) {
          arr.push(m[3]);
        }
        var localWhitelist = undefined;
        chrome.storage.local.get(["localWhitelist"], function(items) {
          localWhitelist = items.localWhitelist;
        });
        let whitelists;
        if(!localWhitelist){
          whitelists = []
        } else {
          whitelists = JSON.parse(localWhitelist);
        } 
        //let whitelists = JSON.parse(localStorage['whitelist']);
        for (let i = 0, length = arr.length; i < length; i++) {
          if (whitelists.indexOf(arr[i]) == -1) {
            whitelists.push(arr[i]);
          }
        }

        whitelists.sort();
        //localStorage['whitelist'] = JSON.stringify(whitelists);
        chrome.storage.local.set(
          {
            "localWhitelist": JSON.stringify(whitelists)
          }
        );

        sendResponse({
          success: 1,
          pattern: request.pattern
        });


      } else if (request.type == whitelist.common.DELETE_FROM_BLOCKLIST) {
        let localWhitelist = undefined;
        chrome.storage.local.get(["localWhitelist"], function(items) {
          localWhitelist = items.localWhitelist;
        });
        let whitelists;
        if(!localWhitelist){
          whitelists = []
        } else {
          whitelists = JSON.parse(localWhitelist);
        }
        //let whitelists = JSON.parse(localStorage['whitelist']);
        let index = whitelists.indexOf(request.pattern);
        if (index != -1) {
          whitelists.splice(index, 1);
          //localStorage['whitelist'] = JSON.stringify(whitelists);
          chrome.storage.local.set(
            {
              "localWhitelist": JSON.stringify(whitelists)
            }
          );
          sendResponse({
            pattern: request.pattern
          });
        }
      } else if (request.type == whitelist.common.GET_PWS_OPTION_VAL) {
        let whitelist_pws_option = undefined;
        chrome.storage.local.get(["whitelist_pws_option"], function(items) {
          whitelist_pws_option = items.whitelist_pws_option;
        });
        //if (!localStorage.whitelist_pws_option)
        //  localStorage['whitelist_pws_option'] = "off";
        if (!whitelist_pws_option){
          whitelist_pws_option = "off"
          chrome.storage.local.set(
            {
              "whitelist_pws_option": whitelist_pws_option
            }
          );
        }

        sendResponse({
          pws_option: whitelist_pws_option
        });
      } else if (request.type == whitelist.common.CHANGE_PWS_OPTION_VAL) {
        //localStorage['whitelist_pws_option'] = request.val;
        chrome.storage.local.set(
          {
            "whitelist_pws_option": request.val
          }
        );
        sendResponse({
          pws_option: request.val
        });
      }
    }
  )
};

/*
 * get hostname from url
 *
 * ex) https://example.com/foo.html      → example.com
 *     http://example.com/               → example.com
 *     https://example.com/bar/foo.html  → example.com
 */
whitelist.common.getHostNameFromUrl = function (pattern) {
  return pattern.replace(whitelist.common.HOST_REGEX, '$2');
}


whitelist.common.startBackgroundListeners();

