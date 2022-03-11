import Axios from "./http";

/** 接口响应数据 */
interface HttpResponse {
  data: {
    data: any;
    errcode: number;
    msg: string;
    [key: string]: any;
  };
  status: number;
  statusText: string;
}

/** 登录参数 */
export interface LoginParams {
  loginName: string;
  password: string;
  isRemember?: number;
  returnUrl?: string;
  jwtType?: string;
}

/** 列表请求参数 */
export interface userListParams {
  currentPage: number;
  skip?: number;
  limit: number;
  [key: string]: any;
}

/** 批量以用户 id 请求参数 */
export interface userIdsParams {
  userIds: string;
}

/** Passport 类接口 */
export class PassportService {
  /** 登录 */
  static login(data: LoginParams): Promise<HttpResponse> {
    return Axios("/v2/passport/login", { method: "POST", data });
  }

  /** 登出 */
  static logout(): Promise<HttpResponse> {
    return Axios("/v2/passport/logout", { method: "GET" });
  }

  /** 获取当前登录用户信息 */
  static getUserData(): Promise<HttpResponse> {
    return Axios("/v2/users/current", { method: "GET" });
  }
}

/** User 类接口 */
export class UserService {
  /** 获取用户列表 */
  static getUserList(params: userListParams): Promise<HttpResponse> {
    return Axios("/v2/users", { method: "GET", params });
  }

  /** 获取用户标签列表 */
  static getUserTagsList(): Promise<HttpResponse> {
    return Axios("/v2/users/tags", { method: "GET" });
  }

  /** 创建用户标签 */
  static createUserTag(data: { tags: string[] }): Promise<HttpResponse> {
    return Axios("/v2/users/tags", { method: "POST", data });
  }

  /** 编辑用户标签 */
  static editUserTag(id: string, data: { tag: string }): Promise<HttpResponse> {
    return Axios("/v2/users/tags/" + id, { method: "PUT", data });
  }

  /** 删除用户标签 */
  static deleteUserTag(id: string): Promise<HttpResponse> {
    return Axios("/v2/users/tags/" + id, { method: "DELETE" });
  }
}

/** Resource 类接口 */
export class ResourceService {
  /** 获取用户发布资源数 */
  static getUserResourcesCount(params: userIdsParams): Promise<HttpResponse> {
    return Axios("/v2/resources/count", { method: "GET", params });
  }
}

/** Node 类接口 */
export class NodeService {
  /** 获取用户运营节点数 */
  static getUserNodesCount(params: userIdsParams): Promise<HttpResponse> {
    return Axios("/v2/nodes/count", { method: "GET", params });
  }
}

/** Contracts 类接口 */
export class ContractsService {
  /** 获取用户消费合约数 */
  static getUserContractsCount(params: userIdsParams): Promise<HttpResponse> {
    return Axios("/v2/contracts/count", { method: "GET", params });
  }
}
