// ===== 用户与角色 =====
export type UserRole = 'applicant' | 'approver';

export interface User {
	id: string;
	name: string;
	department: string;
	role: UserRole;
}

// ===== 申请类型 =====
export type ApplicationType = 'travel' | 'training' | 'leave';

export interface ApplicationTypeMeta {
	key: ApplicationType;
	label: string;
	description: string;
}

// ===== schema 驱动的表单字段 =====
export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'select';

export interface FieldOption {
	label: string;
	value: string;
}

export interface FieldSchema {
	/** 字段 key，对应 ApplicationItem.fields 中的键 */
	name: string;
	/** 展示名 */
	label: string;
	type: FieldType;
	/** 是否必填 */
	required?: boolean;
	placeholder?: string;
	options?: FieldOption[];
	/** number 类型最小值 */
	min?: number;
	/** number 类型最大值 */
	max?: number;
	/** 跨字段约束：本字段（date）不得早于该字段，如 endDate.after = 'startDate' */
	after?: string;
}

export type FieldValue = string | number;

// ===== 审批流程 =====
// 审批单状态
export type ApplicationStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'withdrawn';
// 审批单操作类型
export type TransitionAction = 'submit' | 'approve' | 'reject' | 'withdraw';

export interface ApprovalStep {
	/** 审批环节角色，如 直属主管 / 财务审批 */
	role: string;
	/** 环节所属的审批人 */
	name: string;
	status: 'pending' | 'approved' | 'rejected';
	comment?: string;
	time?: string;
}
// 审批动作
export type AuditAction = 'submit' | 'resubmit' | 'approve' | 'reject' | 'withdraw';

export interface AuditLogEntry {
	action: AuditAction;
	operatorName: string;
	comment?: string;
	time: string;
}

// ===== 申请单 =====
export interface ApplicationItem {
	id: string;
	type: ApplicationType;
	applicantId: string;
	applicantName: string;
	department: string;
	/** schema 字段的实际值 */
	fields: Record<string, FieldValue>;
	status: ApplicationStatus;
	/** 多级审批链 */
	flow: ApprovalStep[];
	/** 当前审批到第几步（0 开始） */
	currentStepIndex: number;
	auditLog: AuditLogEntry[];
	createTime: string;
	updateTime: string;
}
