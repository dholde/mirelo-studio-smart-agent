const script = document.createElement("script");
script.src = chrome.runtime.getURL("content.js");
script.onload = () => script.remove();
document.documentElement.append(script);
