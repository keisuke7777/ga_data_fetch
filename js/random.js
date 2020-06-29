// ボタンの挿入  -----------
const randomButton = document.createElement("div");
randomButton.setAttribute("id", "randomButton");
randomButton.textContent = "🤐";
randomButton.classList.add("float");
randomButton.classList.add("random");
document.body.insertBefore(randomButton, document.body.firstChild);

const startButton = document.createElement("div");
startButton.setAttribute("id", "startButton");
startButton.textContent = "😇";
startButton.classList.add("float");
startButton.classList.add("start");
document.body.insertBefore(startButton, document.body.firstChild);

// global
const clientIds = [];
let interval_id;

// function -----------
const intRandom = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomPages = (min, max, iter) => {
  let randoms = [];
  for (i = 0; i < iter; i++) {
    while (true) {
      var tmp = intRandom(min, max);
      if (!randoms.includes(tmp)) {
        randoms.push(tmp);
        break;
      }
    }
  }
  return randoms;
};

function sleep(time) {
  return new Promise(function (resolve, reject) {
    window.setTimeout(resolve, time);
  });
}

const getCustomerId = async (i = 0, pages) => {
  if (pages.length === i) {
    console.log("end");
    console.log("clientIds", clientIds);
    randomButton.classList.remove("disable");
    chrome.runtime.sendMessage({
      method: "setItem",
      key: "clientIds",
      value: JSON.stringify(clientIds),
    });

    return;
  }

  await sleep(2000);
  // ページ遷移  --------------
  const url = `https://analytics.google.com/analytics/web/?authuser=1#/report/visitors-legacy-user-id/a62914155w99339460p103300385/_u.date00=20191224&_u.date01=20200624&explorer-table.plotKeys=%5B%5D&explorer-table.rowCount=10&explorer-table.rowStart=${
    pages[i] - 1
  }&explorer-table-dataTable.sortColumnName=analytics.transactions&explorer-table-dataTable.sortDescending=true/`;
  console.log("url", url);
  window.location.href = url;

  const elem = document.getElementById("galaxyIframe");

  interval_id = setInterval(() => {
    const id = [
      ...elem.contentWindow.document.getElementsByClassName("_GAbf"),
    ].map((e) => e.firstChild.innerHTML.slice(0, -1));

    // ページの表示が完了したか判断----
    if (Number(id[0]) === pages[i]) {
      console.log("now at: ", i + 1, "/", pages.length);
      const customerIds = [
        ...elem.contentWindow.document.getElementsByClassName(
          "C_USER_LIST_TEXT_DIV _GASu ACTION-nav TARGET-visitors-user-activity"
        ),
      ].map((e) => e.innerHTML);
      // InterValの停止 -----------
      clearInterval(interval_id);

      // 結果を追加 ----------------
      clientIds.push(customerIds[0]);
      chrome.runtime.sendMessage({
        method: "setItem",
        key: "clientIds_4",
        value: JSON.stringify(clientIds),
      });
      // 次のページに遷移 -----------
      getCustomerId(i + 1, pages);
      return;
    }
  }, 2000);
};

// eventListener -------
randomButton.addEventListener("click", () => {
  randomButton.classList.add("disable");
  const min = 0;
  const max = 460000;
  const iter = 300;
  const pages = getRandomPages(min, max, iter);
  // chrome.runtime.sendMessage({
  //   method: "setItem",
  //   key: "tmp",
  //   value: 1,
  // });
  getCustomerId(0, pages);
});
