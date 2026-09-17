import type {
	ApplicationStatus,
	ApplicationType,
	ApplicationTypeMeta,
	FieldSchema
} from '$lib/types';

// ===== 申请类型元信息 =====
export const APPLICATION_TYPES: ApplicationTypeMeta[] = [
	{ key: 'travel', label: '差旅申请', description: '出差交通 / 住宿 / 补贴' },
	{ key: 'training', label: '培训申请', description: '外部培训课程费用' },
	{ key: 'leave', label: '请假申请', description: '事假 / 病假 / 年假' }
];

export function getApplicationTypeMeta(type: ApplicationType): ApplicationTypeMeta {
	return APPLICATION_TYPES.find((t) => t.key === type) ?? APPLICATION_TYPES[0];
}

// ===== schema 驱动的表单字段 =====
export const FIELD_SCHEMAS: Record<ApplicationType, FieldSchema[]> = {
	travel: [
		{
			name: 'destination',
			label: '出差目的地',
			type: 'text',
			required: true,
			placeholder: '例如：上海'
		},
		{ name: 'startDate', label: '开始日期', type: 'date', required: true },
		{ name: 'endDate', label: '结束日期', type: 'date', required: true },
		{
			name: 'transportation',
			label: '交通方式',
			type: 'select',
			required: true,
			options: [
				{ label: '飞机', value: 'flight' },
				{ label: '高铁', value: 'train' },
				{ label: '汽车', value: 'car' }
			]
		},
		{
			name: 'amount',
			label: '预估金额',
			type: 'number',
			required: true,
			min: 1,
			placeholder: '元'
		},
		{
			name: 'reason',
			label: '出差事由',
			type: 'textarea',
			required: true,
			placeholder: '简述出差目的'
		}
	],
	training: [
		{
			name: 'courseName',
			label: '培训课程',
			type: 'text',
			required: true,
			placeholder: '课程名称'
		},
		{
			name: 'institution',
			label: '培训机构',
			type: 'text',
			required: true,
			placeholder: '机构名称'
		},
		{ name: 'startDate', label: '开始日期', type: 'date', required: true },
		{ name: 'endDate', label: '结束日期', type: 'date', required: true },
		{
			name: 'amount',
			label: '培训费用',
			type: 'number',
			required: true,
			min: 1,
			placeholder: '元'
		},
		{ name: 'reason', label: '培训目标', type: 'textarea', required: false, placeholder: '选填' }
	],
	leave: [
		{
			name: 'leaveType',
			label: '请假类型',
			type: 'select',
			required: true,
			options: [
				{ label: '事假', value: 'personal' },
				{ label: '病假', value: 'sick' },
				{ label: '年假', value: 'annual' }
			]
		},
		{ name: 'startDate', label: '开始日期', type: 'date', required: true },
		{ name: 'endDate', label: '结束日期', type: 'date', required: true },
		{ name: 'days', label: '请假天数', type: 'number', required: true, min: 0.5, max: 365 },
		{ name: 'reason', label: '请假事由', type: 'textarea', required: true }
	]
};

export function getFieldSchemas(type: ApplicationType): FieldSchema[] {
	return FIELD_SCHEMAS[type];
}

// ===== 多级审批链（按申请类型配置）=====
export const FLOW_BY_TYPE: Record<ApplicationType, { role: string }[]> = {
	travel: [{ role: '直属主管' }, { role: '财务审批' }],
	training: [{ role: '直属主管' }, { role: '人事审批' }],
	leave: [{ role: '直属主管' }, { role: '人事审批' }]
};

// 审批环节角色 -> 对应的审批人姓名
export const APPROVER_NAME_BY_ROLE: Record<string, string> = {
	直属主管: '李四',
	财务审批: '王五',
	人事审批: '王五'
};

// ===== 状态展示元信息 =====
export const STATUS_META: Record<ApplicationStatus, { label: string; tag: string; dot: string }> = {
	draft: { label: '草稿', tag: 'bg-neutral-100 text-neutral-500', dot: 'bg-neutral-400' },
	pending: { label: '待审批', tag: 'bg-orange-50 text-orange-600', dot: 'bg-orange-500' },
	approved: { label: '已通过', tag: 'bg-green-50 text-green-600', dot: 'bg-green-500' },
	rejected: { label: '已驳回', tag: 'bg-red-50 text-red-600', dot: 'bg-red-500' },
	withdrawn: { label: '已撤销', tag: 'bg-neutral-100 text-neutral-500', dot: 'bg-neutral-400' }
};

// ===== 审批动作展示元信息 =====
export const ACTION_META = {
	submit: { label: '提交申请', color: 'bg-apple hover:bg-apple-hover text-white' },
	resubmit: { label: '重新提交', color: 'bg-apple hover:bg-apple-hover text-white' },
	approve: { label: '通过', color: 'bg-apple hover:bg-apple-hover text-white' },
	reject: { label: '驳回', color: 'bg-red-500 hover:bg-red-600 text-white' },
	withdraw: { label: '撤销', color: 'bg-neutral-200/70 hover:bg-neutral-300/70 text-neutral-700' }
} as const;
