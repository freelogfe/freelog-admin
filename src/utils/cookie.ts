/**
 * cookie操作方法
 */

const cookie = {
  /**
   * 设置 cookie
   * @param key 键
   * @param value 值
   */
  set(key: string, value: string | number) {
    const date = new Date();
    date.setTime(date.getTime() + 720 * 24 * 60 * 60 * 1000);
    const expires = "expires=" + date.toUTCString();
    document.cookie = `${key}=${value};${expires};path=/`;
  },

  /**
   * 获取 cookie
   * @param key
   */
  get(key: string) {
    const cookies = document.cookie.split("; ");
    const cookie = cookies.find((item) => item.startsWith(key));
    if (!cookie) return "";
    const value = cookie.split(key + "=")[1];
    return value;
  },

  /**
   * 删除 cookie
   * @param key
   */
  delete(key: string) {
    const date = new Date();
    date.setTime(-1);
    const expires = "expires=" + date.toUTCString();
    document.cookie = `${key}=;${expires};path=/`;
  },

  /**
   * 清空 cookie
   * @param keys
   */
  clear(keys: string[]) {
    keys.forEach((item) => {
      this.delete(item);
    });
  },
};

export default cookie;
