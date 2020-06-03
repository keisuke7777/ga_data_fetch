{
  ("use strict");
  const _getUserList = () => {
    const elem = document.getElementById("galaxyIframe");
    const target = elem.contentWindow.document.getElementsByClassName(
      "C_USER_LIST_TEXT_DIV _GASu ACTION-nav TARGET-visitors-user-activity"
    );
    console.log(target);
    const res = [...target].map((e) => e.innerHTML);
    return res;
  };

  _getUserList();
}

// const target = elem.contentWindow.document.querySelector(
//     ".C_USER_ACTIVITY_PROFILE_SCORECARD_CONTENT_TEXT div"
//   );
//   console.log(target.innerHTML);
//   // const target = elem.contentWindow.document.querySelector(
//   //   ".C_USER_LIST_TEXT_DIV _GASu ACTION-nav TARGET-visitors-user-activity"
//   // );
//   // console.log(target);
//   // console.log(
//   //   [
//   //     ...document.getElementsByClassName(
//   //       "C_USER_LIST_TEXT_DIV _GASu ACTION-nav TARGET-visitors-user-activity"
//   //     ),
//   //   ].map((e) => e.innerHTML)
//   // );
