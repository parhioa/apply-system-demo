export interface UserItem {
  id: string;
  name: string;
  department: string;
  role: 'applicant' | 'auditor';
}

export interface ExpenseItem {
  id: string;
  applicantId: string;
  applicantName: string;
  department: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createTime: string;
  auditComment?: string; // 审批意见，同意/驳回理由，可选
}
