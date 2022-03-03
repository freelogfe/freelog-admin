/**
 * 格式化日期
 * @param time 时间戳、字符串日期等等
 * @param format 自定义输出结果格式（YYYY:年，MM:月，DD:日，hh:时，mm:分，ss:秒）
 */
export const formatDate = (time: string | undefined, format = "YYYY-MM-DD hh:mm:ss") => {
  if (!time) return "";

  const date = new Date(time);

  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  const result = format
    .replace("YYYY", year)
    .replace("MM", month)
    .replace("DD", day)
    .replace("hh", hour)
    .replace("mm", minutes)
    .replace("ss", seconds);
  return result;
};

/**
 * 相对时间
 * @param time 时间戳、字符串日期等等
 */
export const relativeTime = (time: string | undefined) => {
  if (!time) return;

  const timeStamp = new Date(time).getTime();
  const now = new Date();
  const current = now.getTime();
  const timeDifference = current - timeStamp;
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();
  const today = new Date(`${currentYear}-${currentMonth}-${currentDay}`).getTime();
  const MINUTE = 60 * 1000;
  const YESTERDAY = today - 24 * 60 * MINUTE;
  const SIX_DAYS_AGO = today - 6 * 24 * 60 * MINUTE;
  let result = "";

  if (timeDifference < MINUTE) {
    result = "刚刚";
  } else if (timeDifference < 60 * MINUTE) {
    const minutes = Math.floor(timeDifference / MINUTE);
    result = `${minutes}分钟前`;
  } else if (timeStamp >= today) {
    const hours = Math.floor(timeDifference / (60 * MINUTE));
    result = `${hours}小时前`;
  } else if (timeStamp >= YESTERDAY) {
    const hoursMinutes = formatDate(time, "hh:mm");
    result = `昨天 ${hoursMinutes}`;
  } else if (timeStamp >= SIX_DAYS_AGO) {
    const days = Math.ceil((today - timeStamp) / (24 * 60 * MINUTE));
    result = `${days}天前`;
  } else {
    result = formatDate(time, "YYYY-MM-DD");
  }

  return result;
};

// 判断设备
export const judgeDevice = () => {
  const mobile =
    /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i;
  const inMobile = navigator.userAgent.match(mobile);
  return !!inMobile;
};

// 弹出轻提示
let timeout: any = null;
export const showToast = (msg: string) => {
  const toast = document.getElementById("toast-wrapper");
  if (toast) document.body.removeChild(toast);
  if (timeout) clearTimeout(timeout);

  const div = document.createElement("div");
  div.className = "toast-wrapper";
  div.id = "toast-wrapper";
  div.innerHTML = msg;
  document.body.appendChild(div);

  timeout = setTimeout(() => {
    document.body.removeChild(div);
  }, 2000);
};
