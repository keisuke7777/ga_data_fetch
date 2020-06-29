{
  ("use strict");

  chrome.storage.sync.get({ userList: 0 }, (item) => {
    document.getElementById("all_data").innerHTML = JSON.parse(
      item.userList
    ).length;
  });

  document.getElementById("getUserList").addEventListener("click", function () {
    document.getElementById("all_data").innerHTML = localStorage.getItem("foo");
  });

  // chrome.tabs.executeScript(
  //   {
  //     file: "getUserList.js",
  //   },
  //   (res) => {
  //     const userList = res[0];
  //     document.getElementById("all_data").innerHTML = userList.length;
  //     chrome.storage.sync.set({ userList: JSON.stringify(userList) });
  //   }
  // );
  // });

  document.getElementById("start").addEventListener("click", function () {
    chrome.storage.sync.get({ userList: [] }, (item) => {
      let userList = JSON.parse(item.userList);
      chrome.tabs.executeScript(
        {
          code: "userList =" + JSON.stringify(userList),
        },
        () => {
          chrome.tabs.executeScript({
            file: "handleStart.js",
          });
        }
      );
    });
  });

  document.getElementById("reset").addEventListener("click", function () {
    chrome.storage.sync.set({ userList: JSON.stringify([]) }, () => {
      document.getElementById("all_data").innerHTML = 0;
    });
  });
}
