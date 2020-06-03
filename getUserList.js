{
  ("use strict");
  const _getUserList = () => {
    const elem = document.getElementById("galaxyIframe");
    const target = [
      ...elem.contentWindow.document.getElementsByClassName(
        "C_USER_LIST_TEXT_DIV _GASu ACTION-nav TARGET-visitors-user-activity"
      ),
    ];

    const userList = target.map((e) => e.innerHTML);
    return userList;
  };

  _getUserList();
}
