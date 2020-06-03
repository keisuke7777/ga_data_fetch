{
  function sleep(time) {
    var d1 = new Date().getTime();
    var d2 = new Date().getTime();
    while (d2 < d1 + time) {
      d2 = new Date().getTime();
    }
    return;
  }

  function getPage(userId, i) {
    if (userList.length < i) return;
    sleep(2000);
    window.location.href = `https://analytics.google.com/analytics/web/?authuser=5#/report/visitors-user-activity/a62914155w99339460p103300385/_r.userId=${userId}&_r.userListReportStates=%3Fexplorer-table-dataTable.sortColumnName=analytics.visits%2526explorer-table-dataTable.sortDescending=true%2526explorer-table.plotKeys=%5B%5D&_r.userListReportId=visitors-legacy-user-id`;
    const elem = document.getElementById("galaxyIframe");

    let id = setInterval(() => {
      const baseInfo = [
        ...elem.contentWindow.document.getElementsByClassName(
          "C_USER_ACTIVITY_PROFILE_SCORECARD_CONTENT_TEXT"
        ),
      ].map((e) => e.children[0].innerHTML);
      if (baseInfo.length > 0) {
        const customerId = [
          ...elem.contentWindow.document.getElementsByClassName("_GAZeb"),
        ].map((e) => e.innerHTML);
        if (customerId[0] === userId) {
          clearInterval(id);
          const res = parseUserInfo(baseInfo, userId);
          const SessionPerDate = getSessionPerDate(elem);
          res.history = getDetail(SessionPerDate);
          chrome.runtime.sendMessage({
            method: "setItem",
            key: "res",
            value: JSON.stringify(res),
          });
          console.log(res);
          getPage(userList[i], i + 1);
        }
      }
    }, 2000);
  }
  getPage(userList[0], 1);

  const parseUserInfo = (baseInfo, userId) => {
    const res = {};
    res.clientId = userId;
    res.BigQueryClientId = baseInfo[0];
    res.lastVisit = baseInfo[1];
    res.device = baseInfo[2];
    res.platform = baseInfo[3];
    res.firstVisit = baseInfo[4];
    res.channel = baseInfo[5];
    res.ref = baseInfo[6];
    return res;
  };

  // スクレイピング
  const getSessionPerDate = (elem) => {
    // 日別のセッションを取得する。
    const SessionPerDate = [
      ...elem.contentWindow.document.getElementsByClassName("_GAvi"),
    ];
    return SessionPerDate;
  };

  const getDetail = (SessionPerDate) => {
    const detail = SessionPerDate.map((elem) => {
      return {
        date: elem.getElementsByClassName("_GAOyb")[0].innerHTML,
        session: [
          ...elem.getElementsByClassName(
            "C_USER_ACTIVITY_TABLE_ACTIVITY_SECTION_HEADER_TEXT_CONTAINER"
          ),
        ].map((elem) => {
          return {
            time: elem.getElementsByClassName("_GAj3b")[0].innerHTML,
            activity: elem
              .getElementsByClassName(
                "C_USER_ACTIVITY_TABLE_ACTIVITY_SECTION_HEADER_DESC"
              )[0]
              .childNodes[0].innerHTML.replace(
                /<("[^"]*"|'[^']*'|[^'">])*>/g,
                ""
              ),
          };
        }),
      };
    });
    return detail;
  };
}
