// chrome.runtime.sendMessage(
//   { method: "getItem", key: "clientIds" },
//   (response) => {
//     console.log(response);

//     if (response.data) {
//       console.log("response.data", response.data);
//       if (false) {
//         chrome.runtime.sendMessage({
//           method: "setItem",
//           key: "saveData",
//           value: JSON.stringify(response.data),
//         });
//       }
//       if (false) {
//         chrome.runtime.sendMessage({
//           method: "setItem",
//           key: "saveData_2",
//           value: JSON.stringify(response.data),
//         });
//       }
//     }
//   }
// );

let res = [];

chrome.runtime.sendMessage(
  { method: "getItem", key: "clientIds_3" },
  (response_1) => {
    Array.prototype.push.apply(res, response_1.data);
    chrome.runtime.sendMessage(
      { method: "getItem", key: "clientIds_4" },
      (response_2) => {
        Array.prototype.push.apply(res, response_2.data);
        const set = new Set(res);
        chrome.runtime.sendMessage({
          method: "setItem",
          key: "res",
          value: JSON.stringify([...set]),
        });
      }
    );
  }
);
