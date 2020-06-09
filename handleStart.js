{
  function sleep(time) {
    var d1 = new Date().getTime();
    var d2 = new Date().getTime();
    while (d2 < d1 + time) {
      d2 = new Date().getTime();
    }
    return;
  }

  function getPage(userId, i, page = 1, preDates = new Set()) {
    console.log("---");
    console.log("userNum: ", i);
    console.log("page: ", page);
    if (userList.length < i) {
      // 処理終了 ----------------
      console.log("end");

      try {
        lastUser = reports.slice(-1)[0]["clientId"];
      } catch (e) {
        console.log("保存済みです");
        return;
      }
      localStorage.setItem("lastUser", lastUser);
      // console.log("lastUser", lastUser);
      const link = document.createElement("a");
      link.href =
        "data:text/plain," + encodeURIComponent(JSON.stringify(reports));
      link.download = "reports.json";
      link.click();
      return;
    }
    sleep(2000);
    // ページ遷移  --------------
    const rowStart = 500 * (page - 1);
    window.location.href = `https://analytics.google.com/analytics/web/?authuser=1#/report/visitors-user-activity/a62914155w99339460p103300385/_u.date00=20191208&_u.date01=20200608&_r.userId=${userId}&_r.userListReportStates=%3F_u.date00=20191208%2526_u.date01=20200608&_r.userListReportId=visitors-legacy-user-id&activity-userActivityTable.activityTypeFilter=PAGEVIEW,GOAL,ECOMMERCE,EVENT&activity-userActivityTable.sorting=descending&activity-userActivityTable.rowShow=500&activity-userActivityTable.rowStart=${rowStart}/`;
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
        // ページの表示が完了したか判断----
        if (customerId[0] === userId) {
          const dates = new Set(
            [
              ...elem.contentWindow.document.getElementsByClassName("_GAOyb"),
            ].map((e) => e.innerHTML)
          );

          // ページ遷移したい場合のページ表示完了判断
          if (page >= 2) {
            const intersection = new Set(
              [...dates].filter((e) => preDates.has(e))
            );
            // ページ遷移が未完了　----
            if (
              dates.size === preDates.size &&
              dates.size === intersection.size
            ) {
              console.log("...nowLoading (next page)");
              return;
            }
          }

          // データのパース ------------
          clearInterval(id);
          const sessionInfo = getSessionInfo(elem);
          const res = parseUserInfo(baseInfo, sessionInfo, userId);
          const SessionPerDate = getSessionPerDay(elem);
          res.dailySessions = getDetail(SessionPerDate);

          // 結果を追加 ----------------
          reports.push(res);

          // ローカルストレージに保存 -----
          // 失敗したら処理を中断し、途中経過をダウンロードする。
          try {
            localStorage.setItem("reports", JSON.stringify(reports));
          } catch (e) {
            console.error(
              "localStorageが一杯になりました。もう一度スタートしてください。途中から始まります。"
            );
            const link = document.createElement("a");
            link.href =
              "data:text/plain," + encodeURIComponent(JSON.stringify(reports));
            link.download = "sessions.json";
            link.click();
            localStorage.setItem("lastUser", userId);
            localStorage.removeItem("reports");
            localStorage.setItem("reports", JSON.stringify(reports.slice(-1)));
            return;
          }
          // 次のページに遷移 -----------
          const pageInfo = [
            ...elem.contentWindow.document.querySelectorAll("._GAfR > label"),
          ][2].innerHTML;
          const result = /^(\d+) - (\d+)\/(\d+)$/g.exec(pageInfo);
          const [endRow, totalRow] = [result[2], result[3]];

          // 条件1. 　最後のページ→次ユーザー
          // 条件2.   最終ページでない→次ページに進む。
          // console.log("endRow === totalRow", endRow === totalRow);
          console.log("totalRow: ", endRow);
          // _GAOyb

          if (endRow === totalRow) {
            console.log("Move on to Next User");
            getPage(userList[i], i + 1);
          } else {
            console.log("Move on to Next page");
            getPage(userList[i - 1], i, page + 1, dates);
          }
        }
      }
    }, 2000);
  }

  const parseUserInfo = (baseInfo, sessionInfo, userId) => {
    const res = {};
    res.clientId = userId;
    res.bigQueryClientId = baseInfo[0];
    res.lastVisit = baseInfo[1];
    res.device = baseInfo[2];
    res.platform = baseInfo[3];
    res.firstVisit = baseInfo[4];
    res.channel = baseInfo[5];
    res.ref = baseInfo[6];
    res.totalSessions = sessionInfo[0];
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

  // 初期化 -------------------------------------------------
  // 途中から開始する場合は "isInitial = false" に設定する。
  let isInitial = true;
  let reports = localStorage.getItem("reports");
  let lastUser = localStorage.getItem("lastUser");
  // console.log("sessions", sessions);
  // console.log("userList", userList);
  if (isInitial) {
    // 最初から始める。
    console.log("initial");
    reports = [];
    localStorage.removeItem("lastUser");
  } else if (lastUser) {
    // ラストユーザーの後から始める。
    console.log("continue");
    reports = [];
    const idx = userList.indexOf(lastUser);
    userList = userList.slice(idx + 1);
  } else {
    reports = JSON.parse(reports);
    console.log("through");
  }
  // console.log("lastUser", lastUser);
  // console.log("userList", userList);

  console.log("userList", userList);
  // 実行部 -------------------------------------------------
  if (reports.length > 0) {
    // 保存途中のセッションから始める。
    const start = reports.length - 1;
    getPage(userList[start], start + 1);
  } else {
    // 最初から始める。
    // userList = userList.slice(0, 1);
    getPage(userList[0], 1);
  }
}
