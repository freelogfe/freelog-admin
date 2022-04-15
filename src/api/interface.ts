/**
 * 数据类型接口
 */

/** 接口响应数据 */
export interface HttpResponse {
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
  sort?: string;
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

/** 创建/编辑资源标签参数 */
export interface OperateResourceTag {
  tagIds?: string[];
  tagName?: string;
  tagType?: number;
  resourceRange?: string[];
  resourceRangeType?: number;
  authority?: number;
}

/** 创建/编辑活动参数 */
export interface CreateOrEditActivity {
  _id?: number;
  title: string;
  startTime?: string;
  limitTime?: string;
  persist: boolean;
  cover?: string;
  link?: string;
  publishDate: string;
  status?: 1 | 2;
}

/** 创建/编辑广告参数 */
export interface CreateOrEditAds {
  _id?: number;
  place: number;
  title: string;
  startTime?: string;
  limitTime?: string;
  persist: boolean;
  cover?: string;
  linkActivityId?: string;
  link?: string;
  priority: number;
  status?: 1 | 2 | 3 | 4;
}
