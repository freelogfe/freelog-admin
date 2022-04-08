/**
 * 公共方法
 */

/**
 * 格式化日期
 * @param time 时间戳、字符串日期等等
 * @param format 自定义输出结果格式（YYYY:年，MM:月，DD:日，hh:时，mm:分，ss:秒）
 */
export const formatDate = (time: Date | string | number | undefined, format = "YYYY-MM-DD hh:mm:ss") => {
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
export const relativeTime = (time: Date | string | undefined) => {
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
    result = formatDate(time);
  }

  return result;
};

/**
 * 相差时间
 * @param time 时间戳、字符串日期等等
 */
export const differenceTime = (time: Date | string | undefined) => {
  if (!time) return;

  const timeStamp = new Date(time).getTime();
  const now = new Date();
  const current = now.getTime();
  let timeDifference = timeStamp - current;
  const MINUTE = 60 * 1000;
  const days = Math.floor(timeDifference / (MINUTE * 60 * 24));
  timeDifference -= days * MINUTE * 60 * 24;
  const hours = Math.floor(timeDifference / (MINUTE * 60));
  timeDifference -= hours * MINUTE * 60;
  const minutes = Math.floor(timeDifference / MINUTE);
  timeDifference -= minutes * MINUTE;
  const seconds = Math.floor(timeDifference / 1000);
  let result = "";

  if (days) {
    result = `${days}天`;
  }
  if (hours) {
    result += `${hours}小时`;
  }
  if (minutes) {
    result += `${minutes}分钟`;
  }
  if (seconds) {
    result += `${seconds}秒`;
  }

  return result;
};

/**
 * 时间段处理（用于列表时间段筛选）
 * @param dateRange
 */
export const dateRange = (dateRange: string[] | undefined | null) => {
  if (!dateRange) return [null, null];

  const startDate = formatDate(dateRange[0]);
  const endDate = formatDate(dateRange[1], "YYYY-MM-DD") + " 23:59:59";

  return [startDate, endDate];
};
