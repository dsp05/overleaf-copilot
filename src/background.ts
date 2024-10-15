'use strict';

chrome.runtime.onMessage.addListener(function (request) {
  if (request.type === 'load-more') {
    chrome.tabs.create({
      url:
        chrome.runtime.getURL('search.html') +
        '?selection=' +
        encodeURIComponent(request.payload.selection),
    });
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "chat") {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs && tabs[0] && tabs[0].id) {
        return chrome.tabs.sendMessage(tabs[0].id, { type: "chat:open" });
      }
    });
  }
});
