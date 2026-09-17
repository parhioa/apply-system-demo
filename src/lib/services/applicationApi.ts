import { APPROVER_NAME_BY_ROLE, FLOW_BY_TYPE } from '$lib/config/schemas';
import { nextStatus } from '$lib/machine/stateMachine';
import type {
	ApplicationItem,
	ApplicationType,
	ApprovalStep,
	FieldValue,
	TransitionAction,
	User
} from '$lib/types';

const NETWORK_DELAY_MS = 250;

function delay<T>(value: T): Promise<T> {
	return new Promise((resolve) => setTimeout(() => resolve(value), NETWORK_DELAY_MS));
}

function clone<T>(value: T): T {
	return structuredClone(value);
}

function now(): string {
	return new Date().toISOString();
}

function genId(): string {
	return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ===== Mock 用户 =====
export const users: User[] = [
	{ id: 'u1', name: '张三', department: '研发部', role: 'applicant' },
	{ id: 'u2', name: '李四', department: '研发部', role: 'approver' },
	{ id: 'u3', name: '王五', department: '财务部', role: 'approver' }
];

// ===== 构造审批链 =====
function buildFlow(type: ApplicationType): ApprovalStep[] {
	return FLOW_BY_TYPE[type].map((step) => ({
		role: step.role,
		name: APPROVER_NAME_BY_ROLE[step.role] ?? step.role,
		status: 'pending'
	}));
}

// ===== Mock 申请数据 =====
const seed: ApplicationItem[] = [
	{
		id: 'A1001',
		type: 'travel',
		applicantId: 'u1',
		applicantName: '张三',
		department: '研发部',
		fields: {
			destination: '上海',
			startDate: '2026-08-03',
			endDate: '2026-08-05',
			transportation: 'flight',
			amount: 3200,
			reason: '参加 AI 行业峰会'
		},
		status: 'approved',
		flow: [
			{
				role: '直属主管',
				name: '李四',
				status: 'approved',
				comment: '同意',
				time: '2026-08-01T02:00:00.000Z'
			},
			{
				role: '财务审批',
				name: '王五',
				status: 'approved',
				comment: '预算内，同意',
				time: '2026-08-01T06:00:00.000Z'
			}
		],
		currentStepIndex: 2,
		auditLog: [
			{ action: 'submit', operatorName: '张三', comment: '', time: '2026-08-01T01:00:00.000Z' },
			{
				action: 'approve',
				operatorName: '李四',
				comment: '同意',
				time: '2026-08-01T02:00:00.000Z'
			},
			{
				action: 'approve',
				operatorName: '王五',
				comment: '预算内，同意',
				time: '2026-08-01T06:00:00.000Z'
			}
		],
		createTime: '2026-08-01T01:00:00.000Z',
		updateTime: '2026-08-01T06:00:00.000Z'
	},
	{
		id: 'A1002',
		type: 'training',
		applicantId: 'u1',
		applicantName: '张三',
		department: '研发部',
		fields: {
			courseName: '前端工程化实践',
			institution: '极客时间',
			startDate: '2026-07-20',
			endDate: '2026-07-24',
			amount: 1800,
			reason: '提升工程能力'
		},
		status: 'pending',
		flow: [
			{
				role: '直属主管',
				name: '李四',
				status: 'approved',
				comment: '可以',
				time: '2026-09-10T02:00:00.000Z'
			},
			{ role: '人事审批', name: '王五', status: 'pending' }
		],
		currentStepIndex: 1,
		auditLog: [
			{ action: 'submit', operatorName: '张三', comment: '', time: '2026-09-10T01:00:00.000Z' },
			{ action: 'approve', operatorName: '李四', comment: '可以', time: '2026-09-10T02:00:00.000Z' }
		],
		createTime: '2026-09-10T01:00:00.000Z',
		updateTime: '2026-09-10T02:00:00.000Z'
	},
	{
		id: 'A1003',
		type: 'leave',
		applicantId: 'u1',
		applicantName: '张三',
		department: '研发部',
		fields: {
			leaveType: 'annual',
			startDate: '2026-09-21',
			endDate: '2026-09-23',
			days: 3,
			reason: '年度休假'
		},
		status: 'rejected',
		flow: [
			{
				role: '直属主管',
				name: '李四',
				status: 'rejected',
				comment: '项目冲刺期，暂不批',
				time: '2026-09-12T02:00:00.000Z'
			},
			{ role: '人事审批', name: '王五', status: 'pending' }
		],
		currentStepIndex: 0,
		auditLog: [
			{ action: 'submit', operatorName: '张三', comment: '', time: '2026-09-12T01:00:00.000Z' },
			{
				action: 'reject',
				operatorName: '李四',
				comment: '项目冲刺期，暂不批',
				time: '2026-09-12T02:00:00.000Z'
			}
		],
		createTime: '2026-09-12T01:00:00.000Z',
		updateTime: '2026-09-12T02:00:00.000Z'
	},
	{
		id: 'A1004',
		type: 'travel',
		applicantId: 'u2',
		applicantName: '李四',
		department: '研发部',
		fields: {
			destination: '深圳',
			startDate: '2026-06-10',
			endDate: '2026-06-12',
			transportation: 'train',
			amount: 1500,
			reason: '客户现场支持'
		},
		status: 'approved',
		flow: [
			{
				role: '直属主管',
				name: '李四',
				status: 'approved',
				comment: '同意',
				time: '2026-06-08T03:00:00.000Z'
			},
			{
				role: '财务审批',
				name: '王五',
				status: 'approved',
				comment: '同意',
				time: '2026-06-09T01:00:00.000Z'
			}
		],
		currentStepIndex: 2,
		auditLog: [
			{ action: 'submit', operatorName: '李四', comment: '', time: '2026-06-08T02:00:00.000Z' },
			{
				action: 'approve',
				operatorName: '李四',
				comment: '同意',
				time: '2026-06-08T03:00:00.000Z'
			},
			{ action: 'approve', operatorName: '王五', comment: '同意', time: '2026-06-09T01:00:00.000Z' }
		],
		createTime: '2026-06-08T02:00:00.000Z',
		updateTime: '2026-06-09T01:00:00.000Z'
	},
	{
		id: 'A1005',
		type: 'training',
		applicantId: 'u3',
		applicantName: '王五',
		department: '财务部',
		fields: {
			courseName: '新会计准则解读',
			institution: '立信会计学院',
			startDate: '2026-05-10',
			endDate: '2026-05-11',
			amount: 900,
			reason: ''
		},
		status: 'withdrawn',
		flow: [
			{ role: '直属主管', name: '李四', status: 'pending' },
			{ role: '人事审批', name: '王五', status: 'pending' }
		],
		currentStepIndex: 0,
		auditLog: [
			{ action: 'submit', operatorName: '王五', comment: '', time: '2026-05-05T02:00:00.000Z' },
			{
				action: 'withdraw',
				operatorName: '王五',
				comment: '课程时间冲突',
				time: '2026-05-06T01:00:00.000Z'
			}
		],
		createTime: '2026-05-05T02:00:00.000Z',
		updateTime: '2026-05-06T01:00:00.000Z'
	},
	{
		id: 'A1006',
		type: 'leave',
		applicantId: 'u3',
		applicantName: '王五',
		department: '财务部',
		fields: {
			leaveType: 'sick',
			startDate: '2026-09-01',
			endDate: '2026-09-02',
			days: 2,
			reason: '身体不适'
		},
		status: 'pending',
		flow: [
			{ role: '直属主管', name: '李四', status: 'pending' },
			{ role: '人事审批', name: '王五', status: 'pending' }
		],
		currentStepIndex: 0,
		auditLog: [
			{ action: 'submit', operatorName: '王五', comment: '', time: '2026-09-14T03:00:00.000Z' }
		],
		createTime: '2026-09-14T03:00:00.000Z',
		updateTime: '2026-09-14T03:00:00.000Z'
	},
	{
		id: 'A1007',
		type: 'travel',
		applicantId: 'u1',
		applicantName: '张三',
		department: '研发部',
		fields: {
			destination: '北京',
			startDate: '2026-09-25',
			endDate: '2026-09-27',
			transportation: 'train',
			amount: 2100,
			reason: '调研对接'
		},
		status: 'pending',
		flow: [
			{ role: '直属主管', name: '李四', status: 'pending' },
			{ role: '财务审批', name: '王五', status: 'pending' }
		],
		currentStepIndex: 0,
		auditLog: [
			{ action: 'submit', operatorName: '张三', comment: '', time: '2026-09-15T02:00:00.000Z' }
		],
		createTime: '2026-09-15T02:00:00.000Z',
		updateTime: '2026-09-15T02:00:00.000Z'
	},
	{
		id: 'A1008',
		type: 'training',
		applicantId: 'u2',
		applicantName: '李四',
		department: '研发部',
		fields: {
			courseName: '系统架构设计',
			institution: 'InfoQ',
			startDate: '2026-10-12',
			endDate: '2026-10-16',
			amount: 2600,
			reason: '晋升储备'
		},
		status: 'rejected',
		flow: [
			{
				role: '直属主管',
				name: '李四',
				status: 'rejected',
				comment: '年内预算已满',
				time: '2026-08-20T02:00:00.000Z'
			},
			{ role: '人事审批', name: '王五', status: 'pending' }
		],
		currentStepIndex: 0,
		auditLog: [
			{ action: 'submit', operatorName: '李四', comment: '', time: '2026-08-20T01:00:00.000Z' },
			{
				action: 'reject',
				operatorName: '李四',
				comment: '年内预算已满',
				time: '2026-08-20T02:00:00.000Z'
			}
		],
		createTime: '2026-08-20T01:00:00.000Z',
		updateTime: '2026-08-20T02:00:00.000Z'
	},
	{
		id: 'A1009',
		type: 'leave',
		applicantId: 'u2',
		applicantName: '李四',
		department: '研发部',
		fields: {
			leaveType: 'personal',
			startDate: '2026-09-28',
			endDate: '2026-09-29',
			days: 2,
			reason: '家中有事'
		},
		status: 'draft',
		flow: [
			{ role: '直属主管', name: '李四', status: 'pending' },
			{ role: '人事审批', name: '王五', status: 'pending' }
		],
		currentStepIndex: 0,
		auditLog: [],
		createTime: '2026-09-16T05:00:00.000Z',
		updateTime: '2026-09-16T05:00:00.000Z'
	}
];

let db: ApplicationItem[] = clone(seed);

// ===== 用户查询 =====
export function getUserById(id: string): User | undefined {
	return users.find((u) => u.id === id);
}

// ===== 申请查询 =====
export async function getApplications(): Promise<ApplicationItem[]> {
	return delay(
		[...db].sort((a, b) => (a.createTime < b.createTime ? 1 : -1)).map((item) => clone(item))
	);
}

export async function getApplicationById(id: string): Promise<ApplicationItem | null> {
	const item = db.find((it) => it.id === id);
	return delay(item ? clone(item) : null);
}

// ===== 新建 / 更新 =====
export interface CreateApplicationInput {
	type: ApplicationType;
	applicantId: string;
	fields: Record<string, FieldValue>;
	/** true = 直接提交（pending），false = 保存草稿（draft） */
	submitNow: boolean;
}

export async function createApplication(input: CreateApplicationInput): Promise<ApplicationItem> {
	const user = getUserById(input.applicantId);
	if (!user) throw new Error('申请人不存在');
	const nowIso = now();
	const flow = buildFlow(input.type);
	const item: ApplicationItem = {
		id: 'A' + genId().toUpperCase(),
		type: input.type,
		applicantId: user.id,
		applicantName: user.name,
		department: user.department,
		fields: { ...input.fields },
		status: input.submitNow ? 'pending' : 'draft',
		flow,
		currentStepIndex: 0,
		auditLog: input.submitNow
			? [{ action: 'submit', operatorName: user.name, comment: '', time: nowIso }]
			: [],
		createTime: nowIso,
		updateTime: nowIso
	};
	db.push(item);
	return delay(clone(item));
}

export async function updateApplicationFields(
	id: string,
	fields: Record<string, FieldValue>
): Promise<ApplicationItem> {
	const item = db.find((it) => it.id === id);
	if (!item) throw new Error('单据不存在');
	item.fields = { ...fields };
	item.updateTime = now();
	return delay(clone(item));
}

// ===== 审批流转 =====
export async function applyTransition(
	id: string,
	action: TransitionAction,
	comment: string,
	operatorId: string
): Promise<ApplicationItem> {
	const item = db.find((it) => it.id === id);
	if (!item) throw new Error('单据不存在');
	if (!nextStatus(item.status, action)) {
		throw new Error(`当前状态「${item.status}」不允许执行「${action}」`);
	}
	const operator = getUserById(operatorId);
	const operatorName = operator?.name ?? '未知用户';
	const nowIso = now();
	const prevStatus = item.status;

	if (action === 'submit') {
		// 提交 / 重新提交：重置审批链从头开始
		item.flow = buildFlow(item.type);
		item.currentStepIndex = 0;
		item.status = 'pending';
		item.auditLog.push({
			action: prevStatus === 'rejected' ? 'resubmit' : 'submit',
			operatorName,
			comment,
			time: nowIso
		});
	}

	if (action === 'approve') {
		// 推进多级审批链：当前步骤通过，仍非最终步骤时继续停留在 pending
		const step = item.flow[item.currentStepIndex];
		step.status = 'approved';
		step.comment = comment;
		step.time = nowIso;
		item.auditLog.push({ action: 'approve', operatorName, comment, time: nowIso });
		if (item.currentStepIndex >= item.flow.length - 1) {
			item.status = 'approved';
		} else {
			item.currentStepIndex += 1;
		}
	}

	if (action === 'reject') {
		const step = item.flow[item.currentStepIndex];
		step.status = 'rejected';
		step.comment = comment;
		step.time = nowIso;
		item.status = 'rejected';
		item.auditLog.push({ action: 'reject', operatorName, comment, time: nowIso });
	}

	if (action === 'withdraw') {
		item.status = 'withdrawn';
		item.auditLog.push({ action: 'withdraw', operatorName, comment, time: nowIso });
	}

	item.updateTime = nowIso;
	return delay(clone(item));
}

// ===== 报表聚合（服务端/客户端通用）=====
export function aggregateStatistics(list: ApplicationItem[]) {
	const statusCount = { draft: 0, pending: 0, approved: 0, rejected: 0, withdrawn: 0 };
	const typeCount = { travel: 0, training: 0, leave: 0 };
	const departmentCount: Record<string, number> = {};
	const monthly: Record<string, number> = {};

	for (const item of list) {
		statusCount[item.status] += 1;
		typeCount[item.type] += 1;
		departmentCount[item.department] = (departmentCount[item.department] ?? 0) + 1;
		const month = item.createTime.slice(0, 7);
		monthly[month] = (monthly[month] ?? 0) + 1;
	}

	const decided = statusCount.approved + statusCount.rejected;
	const amountByType = list.reduce<Record<string, number>>((acc, item) => {
		const n = Number(item.fields.amount);
		if (Number.isFinite(n)) acc[item.type] = (acc[item.type] ?? 0) + n;
		return acc;
	}, {});

	return {
		statusCount,
		typeCount,
		departmentCount,
		monthly: Object.entries(monthly).sort((a, b) => (a[0] < b[0] ? -1 : 1)),
		approvalRate: decided === 0 ? 0 : Math.round((statusCount.approved / decided) * 100),
		total: list.length,
		amountByType
	};
}

// 供测试重置数据源
export function __resetDb() {
	db = clone(seed);
}
