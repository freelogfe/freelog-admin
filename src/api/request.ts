import Axios from "./http";

// 接口响应通过格式
interface HttpResponse {
  status: number;
  statusText: string;
  data: {
    code: number;
    desc: string;
    [key: string]: any;
  };
}

interface LoginParams {
  loginName: string;
  password: string;
}

// User类接口
export class UserService {
  /**
   * 登录
   */
  static async login(params: LoginParams): Promise<HttpResponse> {
    return Axios("/v2/passport/login", { method: "POST", data: { ...params } });
  }

  /**
   * 登出
   */
  static async logout(): Promise<HttpResponse> {
    return Axios("/v2/passport/logout", { method: "GET" });
  }

  /**
   * 获取当前登录用户信息
   */
  static async getUserData(): Promise<HttpResponse> {
    return Axios("/v2/users/current", { method: "GET" });
  }
}
