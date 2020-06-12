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
      // localStorage.setItem("lastUser", lastUser);
      const savedUsers = new Set(reports.map((user) => user.clientId));
      console.log("saved users:", savedUsers.size);
      // console.log("lastUser", lastUser);
      const link = document.createElement("a");
      link.href =
        "data:text/plain," + encodeURIComponent(JSON.stringify(reports));
      link.download = "reports.json";
      link.click();
      // キャッシュを消すためのスーパーリロード
      // window.location.reload(true);
      return;
    }
    sleep(2000);
    // ページ遷移  --------------
    const rowStart = 500 * (page - 1);
    // TODO: 日付は自動で取得したい。
    window.location.href = `https://analytics.google.com/analytics/web/?authuser=0#/report/visitors-user-activity/a62914155w99339460p103300385/_u.date00=20191210&_u.date01=20200610&_r.userId=${userId}&_r.userListReportStates=%3F_u.date00=20191210%2526_u.date01=20200610%2526explorer-table-dataTable.sortColumnName=analytics.transactions%2526explorer-table-dataTable.sortDescending=true%2526explorer-table.plotKeys=%5B%5D%2526explorer-table.rowStart=9%2526explorer-table.rowCount=10&_r.userListReportId=visitors-legacy-user-id&activity-userActivityTable.activityTypeFilter=PAGEVIEW,GOAL,ECOMMERCE,EVENT&activity-userActivityTable.sorting=descending&activity-userActivityTable.rowShow=500&activity-userActivityTable.rowStart=${rowStart}/`;
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

          // InterValの停止 -----
          clearInterval(id);

          // データのパース ------------
          const sessionInfo = getSessionInfo(elem);
          let res = parseUserInfo(baseInfo, sessionInfo, userId);
          const SessionPerDate = getSessionPerDate(elem);
          res.dailySessions = getSessions(SessionPerDate);
          const customDimension = getCustomDimension(elem);
          Object.assign(res, customDimension);

          // 半年より前の集客の場合はスキップ -------
          // const firstVisit = /^(\d+)月 (\d+), (\d+)$/g.exec(res.firstVisit);
          // const firstVisitDate = new Date(
          //   firstVisit[3] + "/" + firstVisit[1] + "/" + firstVisit[2]
          // );
          // from = new Date();
          // from.setMonth(from.getMonth() - 6);
          // if (firstVisitDate.getTime() < from.getTime()) {
          //   console.log("This user is not in range");
          //   console.log("Move on to Next User");
          //   getPage(userList[i], i + 1);
          //   return;
          // }

          // 結果を追加 ----------------
          reports.push(res);

          // ローカルストレージに保存 -----
          // 失敗したら処理を中断し、途中経過をダウンロードする。
          // try {
          //   localStorage.setItem("reports", JSON.stringify(reports));
          // } catch (e) {
          //   console.error(
          //     "localStorageが一杯になりました。もう一度スタートしてください。途中から始まります。"
          //   );
          //   const link = document.createElement("a");
          //   link.href =
          //     "data:text/plain," + encodeURIComponent(JSON.stringify(reports));
          //   link.download = "sessions.json";
          //   link.click();
          //   localStorage.setItem("lastUser", userId);
          //   localStorage.removeItem("reports");
          //   localStorage.setItem("reports", JSON.stringify(reports.slice(-1)));
          //   return;
          // }
          // 次のページに遷移 -----------
          const pageInfo = [
            ...elem.contentWindow.document.querySelectorAll("._GAfR > label"),
          ][2].innerHTML;
          const result = /^(\d+) - (\d+)\/(\d+)$/g.exec(pageInfo);
          const [endRow, totalRow] = [result[2], result[3]];
          console.log(`nowRow/totalRow: ${endRow}/${totalRow}`);

          if (endRow === totalRow) {
            console.log("Move on to Next User");
            getPage(userList[i], i + 1);
            return;
          } else {
            console.log("Move on to Next page");
            getPage(userList[i - 1], i, page + 1, dates);
            return;
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
    res.complete = sessionInfo[4];
    res.objective = sessionInfo[5];
    res.registration = sessionInfo[6];
    res.registrationValue = sessionInfo[7];
    return res;
  };

  const getSessionInfo = (elem) => {
    const info = [
      ...elem.contentWindow.document.getElementsByClassName("_GAFI"),
    ].map((e) => e.innerHTML);
    return info;
  };

  // スクレイピング ---------
  const getSessionPerDate = (elem) => {
    // 日別のセッションを取得する。
    const SessionPerDate = [
      ...elem.contentWindow.document.getElementsByClassName("_GAvi"),
    ];
    return SessionPerDate;
  };

  const getSessions = (SessionPerDates) => {
    // SessionPerDate: HTML要素のリスト
    // 日別のセッション取得
    const sessions = SessionPerDates.map((elem) => {
      // console.log("elem", elem);

      return {
        date: elem.getElementsByClassName("_GAOyb")[0].innerHTML,
        channel: elem.getElementsByClassName("_GArR")[0].innerHTML,
        // セッション別
        sessions: [...elem.getElementsByClassName("_GAGf")].map(
          (sessionElem) => {
            return {
              sessionTime: sessionElem.getElementsByClassName("_GAMI")[0]
                .innerHTML,
              duration: sessionElem.getElementsByClassName("_GARE")[0]
                .innerHTML,
              activities: [...sessionElem.getElementsByClassName("_GAej")].map(
                (activityElem) => {
                  const eventType = checkEventType(
                    activityElem.getElementsByClassName("_GAFg")[0]
                  );

                  return {
                    time: activityElem.getElementsByClassName("_GAj3b")[0]
                      .innerHTML,
                    activityType: eventType,
                    activity: activityElem
                      .getElementsByClassName(
                        "C_USER_ACTIVITY_TABLE_ACTIVITY_SECTION_HEADER_DESC"
                      )[0]
                      .childNodes[0].innerHTML.replace(
                        /<("[^"]*"|'[^']*'|[^'">])*>/g,
                        ""
                      ),
                    detail: getDetail(activityElem),
                  };
                }
              ),
            };
          }
        ),
      };
    });
    return sessions;
  };

  const getDetail = (elem) => {
    const detailElem = elem.getElementsByClassName("_GARib")[0];
    const info = [...detailElem.getElementsByClassName("_GAsxb")].map(
      (infoElem) => {
        const key = infoElem.getElementsByClassName("_GASIb")[0].innerHTML;
        const values = [
          ...infoElem.getElementsByClassName(
            "C_USER_ACTIVITY_TABLE_ACTIVITY_DETAIL_ITEM_VALUE"
          ),
        ].map((e) => e.innerHTML);
        return [key, values.length === 1 ? values[0] : values];
      }
    );

    res = {};
    for (let i = 0; i < info.length; i++) {
      res[info[i][0]] = info[i][1];
    }

    return res;
  };

  const checkEventType = (elem) => {
    // elem: EventTypeのdom要素
    if (elem.classList.contains("_GALr")) {
      return "e-commerce";
    } else if (elem.classList.contains("_GAEo")) {
      return "page view";
    } else if (elem.classList.contains("_GApn")) {
      return "event";
    } else if (elem.classList.contains("_GAqG")) {
      return "revenue";
    } else if (elem.classList.contains("_GAct")) {
      return "objective";
    } else {
      return "not set";
    }
  };

  const getCustomDimension = (elem) => {
    // C_USER_ACTIVITY_PROFILE_CUSTOM_DIMENSION_CONTENT_TEXT
    const customDimensionKeys = [
      ...elem.contentWindow.document.getElementsByClassName("_GAlH"),
    ].map((e) => e.innerHTML.replace("AA_", ""));
    const customDimensionValues = [
      ...elem.contentWindow.document.getElementsByClassName(
        "C_USER_ACTIVITY_PROFILE_CUSTOM_DIMENSION_CONTENT_TEXT"
      ),
    ].map((e) => e.innerHTML);

    res = {};
    for (let i = 0; i < customDimensionKeys.length; i++) {
      res[customDimensionKeys[i]] = customDimensionValues[i];
    }
    return res;
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
    localStorage.removeItem("reports");
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
    // userList = userList.slice(5, 10);
    getPage(userList[0], 1);
  }
}
