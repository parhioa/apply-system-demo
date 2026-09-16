import { ExpenseItem, UserItem } from "./types";

// 用户Mock数据
export const userList: UserItem[] = [
  {
    id: "u1",
    name: "张三",
    department: "研发部",
    role: "applicant"
  },
  {
    id: "u2",
    name: "李四",
    department: "财务部",
    role: "auditor"
  }
];

// 报销申请Mock数据源
let expenseList: ExpenseItem[] = [
  {
    id: "1",
    applicantId: "u1",
    applicantName: "张三",
    department: "研发部",
    amount: 1200,
    reason: "出差交通费",
    status: "pending",
    createTime: "2026-09-10"
  },
  {
    id: "2",
    applicantId: "u1",
    applicantName: "张三",
    department: "研发部",
    amount: 350,
    reason: "办公用品采购",
    status: "rejected",
    createTime: "2026-09-11"
  },
  {
    id: "3",
    applicantId: "u1",
    applicantName: "张三",
    department: "研发部",
    amount: 2600,
    reason: "客户拜访餐饮",
    status: "approved",
    createTime: "2026-09-12"
  }
];

// 根据ID查询单条报销记录
export function getExpenseById(id: string): ExpenseItem | undefined {
  return expenseList.find(item => item.id === id);
}

// 获取全部报销列表
export function getExpenseList(): ExpenseItem[] {
  return [...expenseList];
}

// 根据申请人ID，只获取该申请人的单据
export function getExpenseByApplicantId(userId: string): ExpenseItem[] {
  return expenseList.filter(item => item.applicantId === userId);
}

// 创建新报销单
export function createExpense(data: Omit<ExpenseItem, 'id'>): ExpenseItem {
  const newItem: ExpenseItem = {
    ...data,
    id: Date.now().toString()
  };
  expenseList.push(newItem);
  return newItem;
}

// 更新报销单
export function updateExpense(id: string, payload: Partial<ExpenseItem>): ExpenseItem | null {
  const index = expenseList.findIndex(item => item.id === id);
  if (index === -1) return null;
  expenseList[index] = { ...expenseList[index], ...payload };
  return expenseList[index];
}

// 根据id获取用户
export function getUserById(id: string): UserItem | undefined {
  return userList.find(u => u.id === id);
}

// 获取全部用户
export function getUserList(): UserItem[] {
  return userList;
}
