/**
 * 服务器接口
 */
import { Reward } from "@/typings/object";
import {
  ListParams,
  ActivityListParams,
  AdsListParams,
  AuditQualificationsParams,
  CodeListParams,
  CodeRecordParams,
  ContractListParams,
  CreateCodeParams,
  CreateOrEditActivityParams,
  CreateOrEditAdsParams,
  ExhibitListParams,
  HttpResponse,
  LoginParams,
  NodeListParams,
  NodeRecordParams,
  OperateNodeParams,
  OperateResourceParams,
  OperateResourceTagParams,
  OperateUserParams,
  QualificationsListParams,
  ResourceListParams,
  ResourceRecordParams,
  ResourceTagListParams,
  SetNodeTagParams,
  SetResourceTagParams,
  TradeListParams,
  TranslationListParams,
  UserIdsParams,
  UserListParams,
  CreateOrEditTranslationParams,
  ChoicenessListParams,
  RewardListParams,
  RewardRecordListParams,
  ResourceTypeListParams,
  CreateOrEditResourceTypeParams,
  ResourcePropertyListParams,
  CreateOrEditResourcePropertyParams,
  ClassificationListParams,
  CreateOrEditClassificationParams,
  setResourceGradeParams,
} from "@/typings/params";
import Axios from "./http";

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
  static getUserList(params: UserListParams): Promise<HttpResponse> {
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
  static freeOrRecoverUser(data: OperateUserParams): Promise<HttpResponse> {
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
  static getQualificationsList(params: QualificationsListParams): Promise<HttpResponse> {
    return Axios("/v2/testQualifications/beta/apply", { method: "GET", params });
  }

  /** 批量审核内测申请 */
  static auditQualifications(data: AuditQualificationsParams): Promise<HttpResponse> {
    return Axios("/v2/testQualifications/beta/apply/batch", { method: "PUT", data });
  }

  /** 获取邀请码列表 */
  static getCodeList(params: CodeListParams): Promise<HttpResponse> {
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
  static getCodeRecordList(params: CodeRecordParams): Promise<HttpResponse> {
    return Axios("/v2/testQualifications/beta/codes/usedRecords", { method: "GET", params });
  }
}

/** Resource 类接口 */
export class ResourceService {
  /** 获取资源列表 */
  static getResourceList(params: ResourceListParams): Promise<HttpResponse> {
    return Axios("/v2/resources/search", { method: "GET", params: { ...params } });
  }

  /** 查询资源是否为编辑精选 */
  static searchChoiceness(resourceIds: string): Promise<HttpResponse> {
    return Axios(`/v2/resources/operations/list?resourceIds=${resourceIds}&projection=resourceId`, {
      method: "GET",
    });
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
  static getResourceDeps(resourceId: string, params: { version: string }): Promise<HttpResponse> {
    return Axios(`/v2/resources/${resourceId}/dependencyTree`, { method: "GET", params });
  }

  /** 获取资源标签列表 */
  static getResourcesTagsList(params: ResourceTagListParams): Promise<HttpResponse> {
    return Axios("/v2/resources/tags/admin", { method: "GET", params });
  }

  /** 获取资源标签使用数量 */
  static getResourcesTagUseCount(params: { tagIds: string }): Promise<HttpResponse> {
    return Axios("/v2/resources/tags/statistics", { method: "GET", params });
  }

  /** 设置或移除资源标签 */
  static setResourceTag(data: SetResourceTagParams): Promise<HttpResponse> {
    return Axios("/v2/resources/tags/batchSetOrRemoveResourceTag", { method: "PUT", data });
  }

  /** 创建资源标签 */
  static createResourceTag(data: OperateResourceTagParams): Promise<HttpResponse> {
    return Axios("/v2/resources/tags", { method: "POST", data });
  }

  /** 编辑资源标签 */
  static updateResourceTag(data: OperateResourceTagParams): Promise<HttpResponse> {
    return Axios("/v2/resources/tags", { method: "PUT", data });
  }

  /** 禁用/解禁资源 */
  static updateResources(data: OperateResourceParams): Promise<HttpResponse> {
    return Axios("/v2/resources/freeOrRecover/batch", { method: "PUT", data });
  }

  /** 查看资源禁用记录 */
  static getResourceRecordList(params: ResourceRecordParams): Promise<HttpResponse> {
    return Axios("/v2/resources/freeOrRecover/records", { method: "GET", params });
  }

  /** 获取资源类型列表 */
  static getResourceTypeList(params: ResourceTypeListParams): Promise<HttpResponse> {
    return Axios("/v2/resources/types/list", { method: "GET", params });
  }

  /** 根据父类型获取子资源类型 */
  static getResourceTypeListByParentType(parentCode: string): Promise<HttpResponse> {
    return Axios("/v2/resources/types/listSimpleByParentCode", { method: "GET", params: { parentCode } });
  }

  /** 操作资源类型 */
  static operateResourceType(data: { codes: string[]; status: 1 | 2 }): Promise<HttpResponse> {
    return Axios("/v2/resources/types/updateStatusBatch", { method: "POST", data });
  }

  /** 查询资源类型数据 */
  static getResourceTypeData(code: string): Promise<HttpResponse> {
    return Axios("/v2/resources/types/getInfoByCode", { method: "GET", params: { code } });
  }

  /** 创建/编辑资源类型 */
  static createOrEditResourceType(
    data: CreateOrEditResourceTypeParams,
    type: "create" | "update"
  ): Promise<HttpResponse> {
    return Axios(`/v2/resources/types/${type}`, { method: "POST", data: { ...data, category: 1 } });
  }

  /** 获取资源类型的属性 */
  static getAttributesOfResourceType(code: string): Promise<HttpResponse> {
    return Axios("/v2/resources/types/getAttrsByCode", { method: "GET", params: { code } });
  }

  /** 获取资源类型分组列表 */
  static getResourceTypeGroupList(params: {
    codeOrName: string;
    category?: number;
    status?: 1 | 2;
  }): Promise<HttpResponse> {
    return Axios("/v2/resources/types/listSimpleByGroup", { method: "GET", params });
  }

  /** 修改资源类型排序 */
  static editResourceTypeSort(data: { code: string; priority: number }): Promise<HttpResponse> {
    return Axios("/v2/resources/types/updatePriority", { method: "POST", data });
  }

  /** 获取资源属性列表 */
  static getResourcePropertyList(params: ResourcePropertyListParams): Promise<HttpResponse> {
    return Axios(`/v2/resources/${params.group === 1 ? "attrs" : "attr-records"}/list`, { method: "GET", params });
  }

  /** 查询资源属性数据 */
  static getResourcePropertyData(key: string): Promise<HttpResponse> {
    return Axios("/v2/resources/attrs/getInfoByKey", { method: "GET", params: { key } });
  }

  /** 创建/编辑资源属性 */
  static createOrEditResourceProperty(
    data: CreateOrEditResourcePropertyParams,
    type: "create" | "update"
  ): Promise<HttpResponse> {
    return Axios(`/v2/resources/attrs/${type}`, { method: "POST", data: { ...data, group: 1 } });
  }
}

/** Node 类接口 */
export class NodeService {
  /** 获取节点列表 */
  static getNodeList(params: NodeListParams): Promise<HttpResponse> {
    return Axios("/v2/nodes/search", { method: "GET", params: { sort: "createDate:-1", ...params } });
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
  static setNodeTag(data: SetNodeTagParams): Promise<HttpResponse> {
    return Axios("/v2/nodes/batchSetOrRemoveNodeTag", { method: "PUT", data });
  }

  /** 禁用节点 */
  static banNode(data: OperateNodeParams): Promise<HttpResponse> {
    return Axios(`/v2/nodes/${data.nodeId}/freeze`, { method: "PUT", data });
  }

  /** 解禁节点 */
  static restoreNode(nodeId: number): Promise<HttpResponse> {
    return Axios(`/v2/nodes/${nodeId}/deArchive`, { method: "PUT" });
  }

  /** 设置节点类型 */
  static setNodeType(data: { nodeIds: number[]; nodeType: number }): Promise<HttpResponse> {
    return Axios(`/v2/nodes/setNodeType`, { method: "POST", data });
  }

  /** 查看节点禁用记录 */
  static getNodeRecordList(params: NodeRecordParams): Promise<HttpResponse> {
    return Axios("/v2/nodes/freeOrRecover/records", { method: "GET", params });
  }

  /** 获取展品列表 */
  static getExhibitList(params: ExhibitListParams): Promise<HttpResponse> {
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
  static getContractList(params: ContractListParams): Promise<HttpResponse> {
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
  static getTradeRecordList(params: TradeListParams): Promise<HttpResponse> {
    return Axios("/v2/transactions/admin/records", { method: "GET", params });
  }

  /** 查询交易流水 */
  static searchTradeList(recordId: string): Promise<HttpResponse> {
    return Axios(`/v2/transactions/admin/records/${recordId}/details`, { method: "GET" });
  }
}

/** Activities 类接口 */
export class ActivitiesService {
  /** 获取运营分类列表 */
  static getClassificationList(params: ClassificationListParams): Promise<HttpResponse> {
    return Axios("/v2/resources/operation-categories/list", { method: "GET", params });
  }

  /** 根据父类型获取子运营分类 */
  static getClassificationListByParent(parentCode: string): Promise<HttpResponse> {
    return Axios("/v2/resources/operation-categories/listSimpleByParentCode", {
      method: "GET",
      params: { parentCode },
    });
  }

  /** 操作运营分类*/
  static operateClassification(data: { codes: string[]; status: 1 | 2 }): Promise<HttpResponse> {
    return Axios("/v2/resources/operation-categories/updateStatusBatch", { method: "POST", data });
  }

  /** 删除运营分类*/
  static deleteClassification(code: string): Promise<HttpResponse> {
    return Axios("/v2/resources/operation-categories/delete", { method: "POST", data: { code } });
  }

  /** 查询运营分类数据 */
  static getClassificationData(code: string): Promise<HttpResponse> {
    return Axios("/v2/resources/operation-categories/getInfoByCode", { method: "GET", params: { code } });
  }

  /** 创建/编辑运营分类 */
  static createOrEditClassification(
    data: CreateOrEditClassificationParams,
    type: "create" | "update"
  ): Promise<HttpResponse> {
    return Axios(`/v2/resources/operation-categories/${type}`, { method: "POST", data });
  }

  /** 获取运营分类分组列表 */
  static getClassificationGroupList(name: string, status?: 1 | 2): Promise<HttpResponse> {
    return Axios("/v2/resources/operation-categories/listSimpleByGroup", { method: "GET", params: { name, status } });
  }

  /** 修改运营分类排序 */
  static editClassificationSort(data: { code: string; priority: number }): Promise<HttpResponse> {
    return Axios("/v2/resources/operation-categories/updatePriority", { method: "POST", data });
  }

  /** 获取编辑精选列表 */
  static getChoicenessList(params: ChoicenessListParams): Promise<HttpResponse> {
    return Axios("/v2/resources/operations", {
      method: "GET",
      params: { sort: "createDate:-1", isLoadPolicyInfo: 1, ...params },
    });
  }

  /** 资源评级 */
  static setResourceGrade(data: setResourceGradeParams): Promise<HttpResponse> {
    return Axios("/v2/resources/operations", { method: "POST", data });
  }

  /** 获取活动列表 */
  static getActivityList(params: ActivityListParams): Promise<HttpResponse> {
    return Axios("/v2/activities/list", {
      method: "GET",
      params: { skipSize: params.skip, pageSize: params.limit, flag: params.status || 0, title: params.keywords || "" },
    });
  }

  /** 查询活动数据 */
  static getActivityData(id: number): Promise<HttpResponse> {
    return Axios("/v2/activities/find", { method: "GET", params: { _id: id } });
  }

  /** 创建活动 */
  static createActivity(data: CreateOrEditActivityParams): Promise<HttpResponse> {
    return Axios("/v2/activities/create", { method: "POST", data });
  }

  /** 编辑活动 */
  static editActivity(data: CreateOrEditActivityParams): Promise<HttpResponse> {
    return Axios("/v2/activities/update", { method: "PUT", data });
  }

  /** 操作活动 */
  static operateActivity(data: { _id: number; status: 1 | 2 }): Promise<HttpResponse> {
    return Axios("/v2/activities/updateStatus", { method: "PUT", data });
  }

  /** 获取活动奖励列表 */
  static getRewardList(params: RewardListParams): Promise<HttpResponse> {
    return Axios("/v2/activities/reward/configs/list", {
      method: "POST",
      data: {
        skipSize: params.skip,
        pageSize: params.limit,
        title: params.keywords || "",
        tag: params.tag,
        rewardType: params.rewardType,
      },
    });
  }

  /** 编辑活动奖励配置 */
  static editReward(data: Reward): Promise<HttpResponse> {
    return Axios("/v2/activities/reward/configs/update", { method: "PUT", data });
  }

  /** 通过 id 获取活动奖励信息 */
  static getRewardById(code: string): Promise<HttpResponse> {
    return Axios("/v2/activities/reward/configs/find", { method: "GET", params: { code } });
  }

  /** 暂停/恢复活动奖励 */
  static operateReward(params: { code: string }): Promise<HttpResponse> {
    return Axios("/v2/activities/reward/configs/pauseOrRecover", { method: "GET", params });
  }

  /** 获取活动奖励统计信息 */
  static getRewardStatistic(id: string): Promise<HttpResponse> {
    return Axios("/v2/activities/reward/configs/statisticInfo", {
      method: "POST",
      data: { code: id },
    });
  }

  /** 获取活动奖励发放记录列表 */
  static getRewardRecordList(params: RewardRecordListParams): Promise<HttpResponse> {
    const data: any = { rewardConfigCode: params.code, skipSize: params.skip, pageSize: params.limit, tag: params.tag };
    if (params.keywords) data.username = params.keywords;
    return Axios("/v2/activities/reward/records/listDetails", { method: "POST", data });
  }

  /** 审核活动奖励发放 */
  static operateIssue(data: { isPass: boolean; ids: string[] }): Promise<HttpResponse> {
    return Axios("/v2/activities/reward/records/verifyBatch", { method: "POST", data });
  }

  /** 扣除活动奖励 */
  static deductIssue(data: { ids: string[]; reason: string }): Promise<HttpResponse> {
    return Axios("/v2/activities/reward/records/deductBatch", { method: "POST", data });
  }

  /** 取消扣除活动奖励 */
  static restoreDeductIssue(data: { ids: string[] }): Promise<HttpResponse> {
    return Axios("/v2/activities/reward/records/cancelDeductBatch", { method: "POST", data });
  }

  /** 获取广告列表 */
  static getAdsList(params: AdsListParams): Promise<HttpResponse> {
    return Axios("/v2/activities/ads/list", {
      method: "GET",
      params: {
        skipSize: params.skip,
        pageSize: params.limit,
        flag: params.status || 0,
        title: params.keywords || "",
        place: params.place,
      },
    });
  }

  /** 修改广告排序 */
  static editAdsSort(data: { _id: string; priority: number }): Promise<HttpResponse> {
    return Axios("/v2/activities/ads/updatePriority", { method: "PUT", data });
  }

  /** 查询广告数据 */
  static getAdsData(id: number): Promise<HttpResponse> {
    return Axios("/v2/activities/ads/find", { method: "GET", params: { _id: id } });
  }

  /** 获取活动列表（排除草稿与已结束活动） */
  static getValidActivityList(): Promise<HttpResponse> {
    return Axios("/v2/activities/list2", { method: "GET", params: { title: "" } });
  }

  /** 创建广告 */
  static createAds(data: CreateOrEditAdsParams): Promise<HttpResponse> {
    return Axios("/v2/activities/ads/create", { method: "POST", data });
  }

  /** 编辑广告 */
  static editAds(data: CreateOrEditAdsParams): Promise<HttpResponse> {
    return Axios("/v2/activities/ads/update", { method: "PUT", data });
  }

  /** 操作广告 */
  static operateAds(data: { _id: number; status: 0 | 4 }): Promise<HttpResponse> {
    return Axios("/v2/activities/ads/updateStatus", { method: "PUT", data });
  }
}

/** i18n 类接口 */
export class InternationalizationService {
  /** 获取翻译列表 */
  static getTranslationList(data: TranslationListParams): Promise<HttpResponse> {
    const { key = "", content = "", tagIds = [], status = 0 } = data;
    const searchData = { key, content, tagIds, status };
    return Axios("/v2/i18n/configs/list", { method: "POST", data: searchData });
  }

  /** 创建翻译 */
  static createTranslation(data: CreateOrEditTranslationParams): Promise<HttpResponse> {
    return Axios("/v2/i18n/configs/create", { method: "POST", data });
  }

  /** 批量创建翻译（用于导入） */
  static batchCreateTranslation(data: {
    flag: number;
    i18nConfigs: CreateOrEditTranslationParams[];
  }): Promise<HttpResponse> {
    return Axios("/v2/i18n/configs/createMulti", { method: "POST", data });
  }

  /** 设置标签 */
  static setTranslationTag(data: { _ids: string[]; tagIds: string[] }): Promise<HttpResponse> {
    return Axios("/v2/i18n/configs/batchBindI18nTags", { method: "PUT", data });
  }

  /** 编辑翻译 */
  static editTranslation(data: CreateOrEditTranslationParams): Promise<HttpResponse> {
    return Axios("/v2/i18n/configs/update", { method: "PUT", data });
  }

  /** 批量提交所有待提交的翻译条目 */
  static publishPreparative(): Promise<HttpResponse> {
    return Axios("/v2/i18n/configs/publishPreparative", { method: "GET" });
  }

  /** 获取翻译标签列表（不分页） */
  static getAllTranslationTagList(): Promise<HttpResponse> {
    return Axios("/v2/i18n/tags/listSimple", { method: "GET" });
  }

  /** 获取翻译标签列表（分页） */
  static getTranslationTagList(params: ListParams): Promise<HttpResponse> {
    return Axios("/v2/i18n/tags/list", {
      method: "GET",
      params: { skipSize: params.skip, pageSize: params.limit, tagName: params.keywords || "" },
    });
  }

  /** 创建翻译标签 */
  static createTranslationTag(data: { tagName: string }): Promise<HttpResponse> {
    return Axios("/v2/i18n/tags/create", { method: "POST", data });
  }

  /** 批量创建翻译标签 */
  static batchCreateTranslationTag(data: { tagNames: string[] }): Promise<HttpResponse> {
    return Axios("/v2/i18n/tags/createMulti", { method: "POST", data });
  }

  /** 编辑翻译标签 */
  static editTranslationTag(data: { _id: string; tagName: string }): Promise<HttpResponse> {
    return Axios("/v2/i18n/tags/update", { method: "PUT", data });
  }

  /** 删除翻译标签 */
  static deleteTranslationTag(data: { _ids: string[] }): Promise<HttpResponse> {
    return Axios("/v2/i18n/tags/deleteMulti", { method: "PUT", data });
  }
}
