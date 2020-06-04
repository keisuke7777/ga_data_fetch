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
    console.log(i);
    if (userList.length < i) {
      // 処理終了
      console.log("end");

      try {
        lastUser = sessions.slice(-1)[0]["clientId"];
      } catch (e) {
        console.log("保存済みです");
        return;
      }
      localStorage.setItem("lastUser", lastUser);
      // console.log("lastUser", lastUser);
      const link = document.createElement("a");
      link.href =
        "data:text/plain," + encodeURIComponent(JSON.stringify(sessions));
      link.download = "sessions.json";
      link.click();
      return;
    }
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
          const sessionInfo = getSessionInfo(elem);
          const res = parseUserInfo(baseInfo, sessionInfo, userId);
          const SessionPerDate = getSessionPerDay(elem);

          res.history = getDetail(SessionPerDate);
          sessions.push(res);

          // ローカルストレージに保存
          // 失敗したら処理を中断し、途中経過をダウンロードする。
          try {
            localStorage.setItem("sessions", JSON.stringify(sessions));
          } catch (e) {
            console.error(
              "localStorageが一杯になりました。もう一度スタートしてください。途中から始まります。"
            );
            const link = document.createElement("a");
            link.href =
              "data:text/plain," + encodeURIComponent(JSON.stringify(sessions));
            link.download = "sessions.json";
            link.click();
            localStorage.setItem("lastUser", userId);
            localStorage.removeItem("sessions");
            localStorage.setItem(
              "sessions",
              JSON.stringify(sessions.slice(-1))
            );
            return;
          }
          getPage(userList[i], i + 1);
        }
      }
    }, 2000);
  }

  const parseUserInfo = (baseInfo, sessionInfo, userId) => {
    const res = {};
    res.clientId = userId;
    res.BigQueryClientId = baseInfo[0];
    res.lastVisit = baseInfo[1];
    res.device = baseInfo[2];
    res.platform = baseInfo[3];
    res.firstVisit = baseInfo[4];
    res.channel = baseInfo[5];
    res.ref = baseInfo[6];
    res.ltv = sessionInfo[0];
    res.sessionTime = sessionInfo[1];
    res.revenue = sessionInfo[2];
    res.transaction = sessionInfo[3];
    return res;
  };

  const getSessionInfo = (elem) => {
    const info = [
      ...elem.contentWindow.document.getElementsByClassName("_GAFI"),
    ].map((e) => e.innerHTML);
    return info;
  };

  // スクレイピング
  const getSessionPerDay = (elem) => {
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

  // 初期化 --------------
  // 途中から開始する場合は "isInitial = false" に設定する。
  let isInitial = true;
  let sessions = localStorage.getItem("sessions");
  let lastUser = localStorage.getItem("lastUser");
  // console.log("sessions", sessions);
  // console.log("userList", userList);
  if (isInitial) {
    // 最初から始める。
    console.log("initial");
    sessions = [];
    localStorage.removeItem("lastUser");
  } else if (lastUser) {
    // ラストユーザーの後から始める。
    console.log("continue");
    sessions = [];
    const idx = userList.indexOf(lastUser);
    userList = userList.slice(idx + 1);
  } else {
    sessions = JSON.parse(sessions);
    console.log("through");
  }
  // console.log("lastUser", lastUser);
  console.log("userList", userList);
  // 実行部 --------------
  if (sessions.length > 0) {
    const start = sessions.length - 1;
    getPage(userList[start], start + 1);
  } else {
    userList = userList.slice(0, 2);
    getPage(userList[0], 1);
  }
}
