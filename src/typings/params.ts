/**
 * 请求参数类接口
 */

/** 接口响应数据 */
export interface HttpResponse {
  data: {
    data: any;
    errCode: number;
    msg: string;
    [key: string]: any;
  };
  status: number;
  statusText: string;
}

/** 列表请求参数 */
export interface ListParams {
  limit: number;
  currentPage: number;
  skip?: number;
  keywords?: string;
  sort?: string;
}

/** 批量以用户 id 请求参数 */
export interface UserIdsParams {
  userIds: string;
}

/** 登录参数 */
export interface LoginParams {
  loginName: string;
  password: string;
  isRemember?: number;
  returnUrl?: string;
  jwtType?: string;
}

/** 用户列表参数 */
export interface UserListParams extends ListParams {
  tagIds?: string;
  startRegisteredDate?: string | null;
  endRegisteredDate?: string | null;
}

/** 操作用户参数 */
export interface OperateUserParams {
  userId: string;
  status: 0 | 1;
  remark?: string;
  reason?: string;
}

/** 审核内测资格列表参数 */
export interface QualificationsListParams extends ListParams {
  status?: 0 | 1 | 2;
}

/** 审核内测资格参数 */
export interface AuditQualificationsParams {
  recordIds: string[];
  status: 1 | 2;
  auditMsg?: string;
  remark?: string;
}

/** 邀请码列表参数 */
export interface CodeListParams extends ListParams {
  status?: 0 | 1;
  createDate?: string[];
  beginCreateDate?: string | null;
  endCreateDate?: string | null;
}

/** 生成邀请码参数 */
export interface CreateCodeParams {
  createQuantity: string;
  limitCount: number;
  startEffectiveDate?: string;
  endEffectiveDate?: string;
  remark?: string;
}

/** 邀请码使用记录参数 */
export interface CodeRecordParams extends ListParams {
  code?: string;
}

/** 资源列表参数 */
export interface ResourceListParams extends ListParams {
  resourceType?: string;
  omitResourceType?: string;
  isSelf?: 0 | 1;
  status?: 0 | 1 | 2;
  isLoadPolicyInfo?: 0 | 1;
  isLoadLatestVersionInfo?: 0 | 1;
  projection?: string;
  startCreateDate?: string | null;
  endCreateDate?: string | null;
  tags?: string;
}

/** 资源封禁记录参数 */
export interface ResourceRecordParams {
  resourceIds: string;
  recordDesc?: 0 | 1;
  recordLimit?: number;
}

/** 设置资源标签参数 */
export interface SetResourceTagParams {
  tagNames: string[];
  resourceIds: string[];
  setType: 1 | 2;
}

/** 操作资源参数 */
export interface OperateResourceParams {
  resourceIds: string[];
  reason?: string;
  remark?: string;
  operationType: 1 | 2;
}

/** 资源标签列表参数 */
export interface ResourceTagListParams extends ListParams {
  resourceType?: string;
  tagType?: 1 | 2;
  authority?: 1 | 2 | 3;
}

/** 创建/编辑资源标签参数 */
export interface OperateResourceTagParams {
  tagIds?: string[];
  tagName?: string;
  tagType?: number;
  resourceRange?: string[];
  resourceRangeType?: number;
  authority?: number;
}

/** 节点列表参数 */
export interface NodeListParams extends ListParams {
  status?: 0 | 1;
  tags?: string;
  ownerUserId?: number;
  startCreateDate?: string | null;
  endCreateDate?: string | null;
  projection?: string;
}

/** 节点封禁记录参数 */
export interface NodeRecordParams {
  nodeIds: string;
  recordDesc?: 0 | 1;
  recordLimit?: number;
}

/** 设置节点标签参数 */
export interface SetNodeTagParams {
  tagNames: string[];
  nodeIds: number[];
  setType: 1 | 2;
}

/** 操作节点参数 */
export interface OperateNodeParams {
  nodeId: number;
  reason: string;
  remark?: string;
}

/** 展品列表参数 */
export interface ExhibitListParams extends ListParams {
  resourceType?: string;
  tags?: string;
  startCreatedDate?: string | null;
  endCreatedDate?: string | null;
}

/** 合约列表参数 */
export interface ContractListParams extends ListParams {
  licensorId?: string;
  licenseeId?: string;
  subjectIds?: string;
  subjectType?: 1 | 2 | 3;
  keywordsType?: 1 | 2 | 3 | 4;
  status?: 0 | 1 | 2;
  authStatus?: 1 | 2 | 128;
  compositeState?: 1 | 2 | 3 | 4 | 5 | 6;
  licenseeIdentityType?: 1 | 2 | 3;
  isLoadPolicyInfo?: 0 | 1;
  isTranslate?: 0 | 1;
  startDate?: string | null;
  endDate?: string | null;
  projection?: string;
}

/** 交易列表参数 */
export interface TradeListParams extends ListParams {
  accountId?: string;
  startCreateDate?: string | null;
  endCreateDate?: string | null;
  amountStartPoint?: number;
  amountEndPoint?: number;
  accountName?: string;
  reciprocalAccountId?: string;
  reciprocalAccountName?: string;
  relatedAccountName?: string;
  serialNo?: string;
  recordId?: string;
  status?: 1 | 2 | 3;
  transactionType?: 1 | 2;
}

/** 活动列表参数 */
export interface ActivityListParams extends ListParams {
  status?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

/** 广告列表参数 */
export interface AdsListParams extends ListParams {
  status?: 0 | 1 | 2 | 3 | 4;
  place?: 1 | 2 | 3 | 4;
}

/** 创建/编辑活动参数 */
export interface CreateOrEditActivityParams {
  _id?: number;
  title: string;
  startTime?: string;
  limitTime?: string;
  persist: boolean;
  cover?: string;
  link?: string;
  publishDate: string;
  status?: 1 | 2;
  isDraft?: boolean;
}

/** 创建/编辑广告参数 */
export interface CreateOrEditAdsParams {
  _id?: number;
  place: 1 | 2 | 3 | 4;
  title: string;
  startTime?: string;
  limitTime?: string;
  persist: boolean;
  cover: string;
  linkActivityId?: string;
  link?: string;
  priority: number;
  status?: 0 | 1 | 2 | 3 | 4;
}

/** 翻译列表参数 */
export interface TranslationListParams {
  key: string;
  content: string;
  tagIds: string[];
  status: 0 | 1 | 2 | 3;
}

/** 创建/编辑翻译参数 */
export interface CreateOrEditTranslationParams {
  _id?: string;
  key?: string;
  value: {
    zh?: { isDefault?: boolean; content: string };
    en?: { isDefault?: boolean; content: string };
  };
  comment?: string;
  tagIds: string[];
  needPublish: boolean;
}