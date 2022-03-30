/**
 * 服务器接口
 */

import Axios from "./http";
import {
  AuditQualifications,
  CreateCodeParams,
  HttpResponse,
  ListParams,
  LoginParams,
  OperateParams,
  OperateResourceTag,
  UserIdsParams,
} from "./interface";

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
  static setTag(data: { userIds: number[]; tagIds: number[] }): Promise<HttpResponse> {
    return Axios(`/v2/users/batchSetTag`, { method: "PUT", data });
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
  static editUserTag(tagId: number, data: { tag: string }): Promise<HttpResponse> {
    return Axios("/v2/users/tags/" + tagId, { method: "PUT", data });
  }

  /** 删除用户标签 */
  static deleteUserTag(data: { tagIds: number[] }): Promise<HttpResponse> {
    return Axios("/v2/users/tags", { method: "PUT", data });
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
    return Axios("/v2/resources/search", { method: "GET", params: { ...params, isLoadPolicyInfo: 1 } });
  }

  /** 查询资源 */
  static searchResource(resourceIds: string): Promise<HttpResponse> {
    return Axios("/v2/resources/list", { method: "GET", params: { resourceIds, projection: "coverImages" } });
  }

  /** 获取用户发布资源数 */
  static getUserResourcesCount(params: UserIdsParams): Promise<HttpResponse> {
    return Axios("/v2/resources/count", { method: "GET", params });
  }

  /** 获取资源收藏数 */
  static getResourcesCollectCount(params: { resourceIds: string }): Promise<HttpResponse> {
    return Axios("/v2/collections/resources/batch/count", { method: "GET", params });
  }

  /** 获取资源文件内容 */
  static getResourceFile(versionId: string): Promise<any> {
    return Axios(`/v2/resources/versions/${versionId}/internalClientDownload`, { method: "GET" });
  }

  /** 获取资源依赖树 */
  static getResourceDeps(resourceId: string, params: { version: string }): Promise<any> {
    return Axios(`/v2/resources/${resourceId}/dependencyTree`, { method: "GET", params });
  }

  /** 获取资源标签列表 */
  static getResourcesTagsList(params: ListParams): Promise<HttpResponse> {
    return Axios("/v2/resources/tags/admin", { method: "GET", params });
  }

  /** 获取资源标签使用数量 */
  static getResourcesTagUseCount(params: { tagIds: string }): Promise<HttpResponse> {
    return Axios("/v2/resources/tags/statistics", { method: "GET", params });
  }

  /** 设置或移除资源标签 */
  static setResourceTag(data: { tagNames: string[]; resourceIds: string[]; setType: number }): Promise<HttpResponse> {
    return Axios("/v2/resources/tags/batchSetOrRemoveResourceTag", { method: "PUT", data });
  }

  /** 创建资源标签 */
  static createResourceTag(data: OperateResourceTag): Promise<HttpResponse> {
    return Axios("/v2/resources/tags", { method: "POST", data });
  }

  /** 编辑资源标签 */
  static updateResourceTag(data: OperateResourceTag): Promise<HttpResponse> {
    return Axios("/v2/resources/tags", { method: "PUT", data });
  }

  /** 禁用/解禁资源 */
  static updateResources(data: {
    resourceIds: string[];
    operationType: 1 | 2;
    reason?: string;
    remark?: string;
  }): Promise<HttpResponse> {
    return Axios("/v2/resources/freeOrRecover/batch", { method: "PUT", data });
  }

  /** 查看资源禁用记录 */
  static getResourceRecordList(params: {
    resourceIds: string;
    recordDesc?: 0 | 1;
    recordLimit?: number;
  }): Promise<HttpResponse> {
    return Axios("/v2/resources/freeOrRecover/records", { method: "GET", params });
  }
}

/** Node 类接口 */
export class NodeService {
  /** 获取节点列表 */
  static getNodeList(params: ListParams): Promise<HttpResponse> {
    return Axios("/v2/nodes/search", { method: "GET", params: { ...params, sort: "createDate:-1" } });
  }

  /** 获取用户运营节点数 */
  static getUserNodesCount(params: UserIdsParams): Promise<HttpResponse> {
    return Axios("/v2/nodes/count", { method: "GET", params });
  }

  /** 获取节点标签列表 */
  static getNodeTagsList(): Promise<HttpResponse> {
    return Axios("/v2/nodes/tags", { method: "GET" });
  }

  /** 获取节点运营的展品数 */
  static getNodeExhibitCount(params: { nodeIds: string }): Promise<HttpResponse> {
    return Axios("/v2/presentables/admin/presentableStatistics", { method: "GET", params });
  }

  /** 获取节点下所有展品的签约数总和 */
  static getNodeExhibitSignCount(params: { licensorIds: string; subjectType?: 1 | 2 | 3 }): Promise<HttpResponse> {
    return Axios("/v2/contracts/licensors/signCount", { method: "GET", params });
  }

  /** 获取节点标签使用数量 */
  static getNodeTagUseCount(params: { tagIds: string }): Promise<HttpResponse> {
    return Axios("/v2/nodes/tags/statistics", { method: "GET", params });
  }

  /** 创建节点标签 */
  static createNodeTag(data: { tags: string[] }): Promise<HttpResponse> {
    return Axios("/v2/nodes/tags", { method: "POST", data });
  }

  /** 编辑节点标签 */
  static editNodeTag(tagId: string, data: { tagName: string }): Promise<HttpResponse> {
    return Axios("/v2/nodes/tags/" + tagId, { method: "PUT", data });
  }

  /** 删除节点标签 */
  static deleteNodeTag(params: { tagIds: string }): Promise<HttpResponse> {
    return Axios("/v2/nodes/tags/", { method: "DELETE", params });
  }

  /** 设置或移除节点标签 */
  static setNodeTag(data: { tagNames: string[]; nodeIds: number[]; setType: 1 | 2 }): Promise<HttpResponse> {
    return Axios("/v2/nodes/batchSetOrRemoveNodeTag", { method: "PUT", data });
  }

  /** 禁用节点 */
  static banNode(
    nodeId: number,
    data: {
      reason: string;
      remark?: string;
    }
  ): Promise<HttpResponse> {
    return Axios(`/v2/nodes/${nodeId}/freeze`, { method: "PUT", data });
  }

  /** 解禁节点 */
  static restoreNode(nodeId: number): Promise<HttpResponse> {
    return Axios(`/v2/nodes/${nodeId}/deArchive`, { method: "PUT" });
  }

  /** 查看节点禁用记录 */
  static getNodeRecordList(params: {
    nodeIds: string;
    recordDesc?: 0 | 1;
    recordLimit?: number;
  }): Promise<HttpResponse> {
    return Axios("/v2/nodes/freeOrRecover/records", { method: "GET", params });
  }

  /** 获取展品列表 */
  static getExhibitList(params: ListParams): Promise<HttpResponse> {
    return Axios("/v2/presentables/search", { method: "GET", params });
  }

  /** 查询展品 */
  static searchExhibit(presentableIds: string): Promise<HttpResponse> {
    return Axios("/v2/presentables/list", { method: "GET", params: { presentableIds, projection: "coverImages" } });
  }
}

/** Contracts 类接口 */
export class ContractsService {
  /** 获取合约列表 */
  static getContractList(params: ListParams): Promise<HttpResponse> {
    return Axios("/v2/contracts/search", { method: "GET", params: { ...params, isLoadPolicyInfo: 1, isTranslate: 1 } });
  }

  /** 获取合约流转记录 */
  static getContractTransitionRecords(contractId: string): Promise<HttpResponse> {
    return Axios(`/v2/contracts/${contractId}/transitionRecords`, { method: "GET", params: { isTranslate: 1 } });
  }

  /** 获取用户消费合约数 */
  static getUserContractsCount(params: UserIdsParams): Promise<HttpResponse> {
    return Axios("/v2/contracts/count", { method: "GET", params });
  }

  /** 获取标的物签约数 */
  static getSubjectSignCount(params: { subjectIds: string; subjectType: 1 | 2 | 3 }): Promise<HttpResponse> {
    return Axios("/v2/contracts/subjects/signCount", { method: "GET", params });
  }
}

/** Transactions 类接口 */
export class TransactionsService {
  /** 获取交易列表 */
  static getContractList(params: ListParams): Promise<HttpResponse> {
    return Axios("/v2/transactions/admin/records", { method: "GET", params });
  }
}
