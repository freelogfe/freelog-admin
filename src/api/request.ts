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

/** 列表请求参数 */
export interface ListParams {
  skip?: number;
  limit: number;
  [key: string]: any;
}

/** 批量以用户 id 请求参数 */
export interface UserIdsParams {
  userIds: string;
}

/** 操作类请求参数 */
export interface OperateParams {
  status?: number;
  [key: string]: any;
}

/** 登录参数 */
export interface LoginParams {
  loginName: string;
  password: string;
  isRemember?: number;
  returnUrl?: string;
  jwtType?: string;
}

/** 审核内测资格参数 */
export interface AuditQualifications {
  recordIds?: string;
  status?: 1 | 2;
  auditMsg: string;
  [key: string]: any;
}

/** 生成邀请码参数 */
export interface CreateCodeParams {
  createQuantity: string;
  limitCount: number;
  startEffectiveDate?: string;
  endEffectiveDate?: string;
  [key: string]: any;
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
  static getUserList(params: ListParams): Promise<HttpResponse> {
    return Axios("/v2/users", { method: "GET", params });
  }

  /** 获取用户交易次数 */
  static getUserTradeCount(params: UserIdsParams): Promise<HttpResponse> {
    return Axios("/v2/transactions/admin/records/count/statistics", { method: "GET", params });
  }

  /** 获取用户账户信息 */
  static getUserAccount(params: UserIdsParams): Promise<HttpResponse> {
    return Axios("/v2/accounts/admin/individualAccounts/list", { method: "GET", params });
  }

  /** 获取用户标签列表 */
  static getUserTagsList(): Promise<HttpResponse> {
    return Axios("/v2/users/tags", { method: "GET" });
  }

  /** 冻结/恢复用户 */
  static freeOrRecoverUser(data: OperateParams): Promise<HttpResponse> {
    return Axios(`/v2/users/${data.userId}/freeOrRecoverUserStatus`, { method: "PUT", data });
  }

  /** 设置用户标签 */
  static setTag(userId: number, data: { tagIds: number[] }): Promise<HttpResponse> {
    return Axios(`/v2/users/${userId}/setTag`, { method: "PUT", data });
  }

  /** 取消用户标签 */
  static unsetTag(userId: number, data: { tagIds: number[] }): Promise<HttpResponse> {
    return Axios(`/v2/users/${userId}/unsetTag`, { method: "PUT", data });
  }

  /** 创建用户标签 */
  static createUserTag(data: { tags: string[] }): Promise<HttpResponse> {
    return Axios("/v2/users/tags", { method: "POST", data });
  }

  /** 编辑用户标签 */
  static editUserTag(tagId: string, data: { tag: string }): Promise<HttpResponse> {
    return Axios("/v2/users/tags/" + tagId, { method: "PUT", data });
  }

  /** 删除用户标签 */
  static deleteUserTag(tagId: string): Promise<HttpResponse> {
    return Axios("/v2/users/tags/" + tagId, { method: "DELETE" });
  }

  /** 获取内测资格审核列表 */
  static getQualificationsList(params: ListParams): Promise<HttpResponse> {
    return Axios("/v2/testQualifications/beta/apply", { method: "GET", params });
  }

  /** 批量审核内测申请 */
  static auditQualifications(data: AuditQualifications): Promise<HttpResponse> {
    return Axios("/v2/testQualifications/beta/apply/batch", { method: "PUT", data });
  }

  /** 获取邀请码列表 */
  static getCodeList(params: ListParams): Promise<HttpResponse> {
    return Axios("/v2/testQualifications/beta/codes", { method: "GET", params });
  }

  /** 生成邀请码 */
  static createCode(data: CreateCodeParams): Promise<HttpResponse> {
    return Axios("/v2/testQualifications/beta/codes/batchCreate", { method: "POST", data });
  }

  /** 禁用/解禁邀请码 */
  static updateCode(data: { codes: string[]; status: 0 | 1 }): Promise<HttpResponse> {
    return Axios("/v2/testQualifications/beta/codes/batchUpdate", { method: "PUT", data });
  }

  /** 查看邀请码使用记录 */
  static getCodeRecordList(params: ListParams): Promise<HttpResponse> {
    return Axios("/v2/testQualifications/beta/codes/usedRecords", { method: "GET", params });
  }
}

/** Resource 类接口 */
export class ResourceService {
  /** 获取资源列表 */
  static getResourceList(params: ListParams): Promise<HttpResponse> {
    return Axios("/v2/resources", { method: "GET", params });
  }

  /** 获取用户发布资源数 */
  static getUserResourcesCount(params: UserIdsParams): Promise<HttpResponse> {
    return Axios("/v2/resources/count", { method: "GET", params });
  }
}

/** Node 类接口 */
export class NodeService {
  /** 获取用户运营节点数 */
  static getUserNodesCount(params: UserIdsParams): Promise<HttpResponse> {
    return Axios("/v2/nodes/count", { method: "GET", params });
  }
}

/** Contracts 类接口 */
export class ContractsService {
  /** 获取用户消费合约数 */
  static getUserContractsCount(params: UserIdsParams): Promise<HttpResponse> {
    return Axios("/v2/contracts/count", { method: "GET", params });
  }
}
