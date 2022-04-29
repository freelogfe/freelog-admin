/**
 * 普通对象类型接口
 */

/** 用户数据 */
export interface User {
  userId: number;
  username: string;
  tags: any[];
  latestLoginDate: string;
  createdResourceCount: number;
  createdNodeCount: number;
  signedContractCount: number;
  tradeCount: number;
  balance: string;
  mobile: string;
  email: string;
  createDate: string;
  status: 0 | 1 | 2 | 3;
}

/** 用户标签数据 */
export interface UserTag {
  tagId: number;
  tag: string;
  totalSetCount: number;
  type: 1 | 2;
}

/** 内测资格审核数据 */
export interface Qualifications {
  recordId: string;
  createDate: string;
  occupation: string;
  city: string;
  description: string;
  username: string;
  mobile: string;
  email: string;
  latestLoginData: string;
  auditMsg: string;
  status: 0 | 1 | 2;
}

/** 邀请码数据 */
export interface Code {
  userId: string;
  code: string;
  createDate: string;
  username: string;
  usedCount: number;
  limitCount: number;
  startEffectiveDate: string;
  endEffectiveDate: string;
  status: 0 | 1;
}

/** 邀请码使用记录数据 */
export interface CodeRecord {
  userId: string;
  username: string;
  loginIp: string;
  code: string;
  createDate: string;
}

/** 资源数据 */
export interface Resource {
  resourceId: string;
  resourceType: string;
  resourceName: string;
  userId: number;
  username: string;
  resourceNameAbbreviation: string;
  coverImages: string[];
  intro: string;
  tags: string[];
  latestVersion: string;
  resourceVersions: any[];
  policies: any[];
  baseUpcastResources: any[];
  signCount: number;
  collectCount: number;
  status: 0 | 1 | 2 | 3;
  reason: string;
  remark: string;
}

/** 策略数据 */
export interface Policy {
  policyName: string;
  status: 0 | 1;
  policyText: string;
}

/** 资源标签数据 */
export interface ResourceTag {
  tagId: string;
  tag: string;
  tagName: string;
  tagType: number;
  resourceRange: string[];
  resourceRangeType: number;
  authority: number;
  createDate: string;
  count: number;
}

/** 资源版本数据 */
export interface ResourceVersion {
  versionId: string;
  version: string;
  createDate: string;
  content: string;
  mime: string;
}

/** 节点数据 */
export interface Node {
  nodeId: number;
  nodeName: string;
  nodeDomain: string;
  nodeThemeId: string;
  ownerUserId: number;
  ownerUserName: string;
  status: number;
  createDate: string;
  tags: string[];
  exhibitCount: number;
  signCount: number;
  reason: string;
  remark: string;
}

/** 节点标签数据 */
export interface NodeTag {
  tagId: string;
  tag: string;
  tagName: string;
  count: number;
}

/** 展品数据 */
export interface Exhibit {
  presentableId: string;
  presentableName: string;
  presentableTitle: string;
  tags: string[];
  intro: string;
  onlineStatus: 0 | 1;
  userId: number;
  nodeId: number;
  resolveResources: any[];
  policies: any[];
  resourceInfo: any;
  version: string;
  createDate: string;
  resourceUserName: string;
  resourceName: string;
  signCount: number;
}

/** 合约数据 */
export interface Contract {
  contractId: string;
  contractName: string;
  subjectId: string;
  subjectName: string;
  subjectType: number;
  licensorId: string;
  licensorName: string;
  licensorOwnerId: number;
  licensorOwnerName: string;
  licenseeId: string;
  licenseeName: string;
  licenseeOwnerId: number;
  licenseeOwnerName: string;
  licenseeIdentityType: number;
  policyId: string;
  policyInfo: any[];
  isDefault: number;
  fsmCurrentState: string;
  fsmRunningStatus: 1 | 2 | 4 | 8 | 16;
  authStatus: 1 | 2 | 3 | 4 | 128;
  status: 0 | 1 | 2;
  myStatus: number;
  createDate: string;
  coverImages: string[];
  transitionRecords: any[];
}

/** 交易记录数据 */
export interface TradeRecord {
  recordId: string;
  accountId: string;
  accountName: string;
  accountType: number;
  reciprocalAccountId: string;
  reciprocalAccountName: string;
  reciprocalAccountType: number;
  transactionAmount: string;
  transactionType: number;
  digest: string;
  attachInfo: any;
  status: number;
  createDate: string;
  updateDate: string;
  tradeDetail: any[];
}

/** 活动数据 */
export interface Activity {
  _id?: number;
  title: string;
  startTime: string;
  limitTime: string;
  persist: boolean;
  cover: string;
  link: string;
  publishDate: string;
  status: 1 | 2;
  isDraft: boolean;
}

/** 广告数据 */
export interface Advertisement {
  _id: string;
  place: 1 | 2 | 3 | 4;
  title: string;
  status: 1 | 2 | 3 | 4;
  ev: number;
  pv: number;
  cvr: number;
  startTime: string;
  limitTime: string;
  persist: boolean;
  cover: string;
  linkActivityId: string;
  linkActivityTitle: string;
  linkActivity: string;
  link: string;
  priority: number;
}

/** 翻译数据 */
export interface Translation {
  _id: string;
  i18nTags: TranslationTag[];
  key: string;
  value: {
    zh?: { isDefault?: boolean; content: string };
    en?: { isDefault?: boolean; content: string };
  };
  comment: string;
  createTime: string;
  updateTime: string;
  status: 1 | 2 | 3;
}

/** 翻译标签数据 */
export interface TranslationTag {
  _id: string;
  tagName: string;
  num?: number;
}