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


chrome.action.onClicked.addListener(() => {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options.html'));
  }
});