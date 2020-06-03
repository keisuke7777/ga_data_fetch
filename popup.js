{
  ("use strict");

  chrome.storage.sync.get({ userList: 0 }, (item) => {
    document.getElementById("all_data").innerHTML = JSON.parse(
      item.userList
    ).length;
  });

  document.getElementById("getUserList").addEventListener("click", function () {
    chrome.tabs.executeScript(
      {
        file: "getUserList.js",
      },
      (res) => {
        const userList = res[0];
        document.getElementById("all_data").innerHTML = userList.length;
        chrome.storage.sync.set({ userList: JSON.stringify(userList) });
      }
    );
  });

  document.getElementById("start").addEventListener("click", function () {
    chrome.storage.sync.get({ userList: "hoge" }, (item) => {
      console.log(item);
    });
    // chrome.tabs.executeScript(
    //   {
    //     file: "getUserList.js",
    //   },
    //   (res) => {
    //     const userList = res[0];
    //     document.getElementById("all_data").innerHTML = userList.length;
    //     chrome.storage.sync.set({ userList: userList }, () => {});
    //     localStorage["data"] = kore;
    //   }
    // );
  });
}
