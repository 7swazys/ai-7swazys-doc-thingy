chrome.action.onClicked.addListener(() => {
  chrome.windows.create({
    url: "dashboard.html",
    type: "popup",
    width: 500,
    height: 650,
    focused: true
  });
});
