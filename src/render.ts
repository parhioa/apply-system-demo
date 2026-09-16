import { ExpenseItem, UserItem } from "./types";
import { getExpenseList, getExpenseByApplicantId, getUserList } from "./mockApi";

// 状态中文映射
export const statusMap: Record<string, string> = {
  pending: "待审批",
  approved: "已通过",
  rejected: "已驳回"
};

// 状态样式映射 tailwind
export const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700"
};

// 全局状态
let _currentUser: UserItem | null = null;
let _currentEditExpense: ExpenseItem | null = null;
let _activeTab: "audit" | "mine" = "audit";

// 对外只读getter
export function getCurrentUser() { return _currentUser; }
export function getCurrentEditExpense() { return _currentEditExpense; }
export function getActiveTab() { return _activeTab; }

// 对外setter，用来修改状态
export function setCurrentUser(user: UserItem | null) {
  _currentUser = user;
}
export function setCurrentEditExpense(item: ExpenseItem | null) {
  _currentEditExpense = item;
}
export function setActiveTab(tab: "audit" | "mine") {
  _activeTab = tab;
}

// 渲染登录页面
export function renderLogin(): string {
  // 读取用户列表，动态生成登录卡片
  const userList = getUserList();
  const userButtonsHtml = userList.map(user => {
    // 申请人绿色圆点，审批人蓝色圆点
    const dotColor = user.role === 'applicant' ? 'bg-emerald-400' : 'bg-blue-400';
    return `
      <button onclick="login('${user.id}')" class="flex items-center w-full px-5 py-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-left">
        <span class="w-3 h-3 rounded-full ${dotColor} mr-3"></span>
        <span class="text-slate-700 font-medium">${user.name}（${user.role === 'applicant' ? '申请人' : '审批人'}）</span>
      </button>
    `;
  }).join('');

  return `
    <div class="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div class="text-center mb-10">
        <h1 class="text-[clamp(1.8rem,4vw,2.4rem)] font-medium text-slate-800 tracking-tight">报销审批系统</h1>
        <p class="text-slate-500 mt-2">登录选择身份</p>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 w-full max-w-sm p-6">
        <div class="flex flex-col gap-3">
          ${userButtonsHtml}
        </div>
      </div>
    </div>
    `;
}


// 申请人表格
export function renderApplicantTable(): string {
  const user = getCurrentUser();
  if (!user) return "";
  const list = getExpenseByApplicantId(user.id);
  let rows = '';
  list.forEach(item => {
    rows += `
      <tr>
        <td class="border p-2">${item.id}</td>
        <td class="border p-2">${item.reason}</td>
        <td class="border p-2">${item.amount}</td>
        <td class="border p-2"><span class="px-2 py-1 rounded ${statusColor[item.status]}">${statusMap[item.status]}</span></td>
        <td class="border p-2">${item.createTime}</td>
        <td class="border p-2">${item.auditComment ?? ' '}</td>
        <td class="border p-2">
          <button onclick="viewDetail('${item.id}')" class="px-3 py-1.5 ml-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm transition-colors">预览</button>
          ${item.status === 'pending' ? `<button onclick="editApply('${item.id}')" class="px-3 py-1.5 ml-2 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 text-sm transition-colors">编辑</button>` : ''}
          ${item.status === 'rejected' ? `<button onclick="resubmitApply('${item.id}')" class="px-3 py-1.5 ml-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm transition-colors">重新提交</button>` : ''}
          ${item.status === 'approved' ? `
              <button disabled class="px-3 py-1.5 ml-2 rounded-lg bg-slate-50 text-slate-400 cursor-not-allowed text-sm">编辑</button>
              <button disabled class="px-3 py-1.5 ml-2 rounded-lg bg-slate-50 text-slate-400 cursor-not-allowed text-sm">重新提交</button>
          ` : ''}
        </td>
      </tr>
    `;
  });

  return `
    <table class="w-full border-collapse">
      <thead>
        <tr>
          <th class="border p-2">ID</th>
          <th class="border p-2">事由</th>
          <th class="border p-2">金额</th>
          <th class="border p-2">状态</th>
          <th class="border p-2">创建时间</th>
          <th class="border p-2">审批意见</th>
          <th class="border p-2">操作</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// 审批人审批列表表格
export function renderAuditTable(): string {
  const list = getExpenseList();
  let rows = '';
  list.forEach(item => {
    rows += `
      <tr>
        <td class="border p-2">${item.id}</td>
        <td class="border p-2">${item.applicantName}</td>
        <td class="border p-2">${item.reason}</td>
        <td class="border p-2">${item.amount}</td>
        <td class="border p-2"><span class="px-2 py-1 rounded ${statusColor[item.status]}">${statusMap[item.status]}</span></td>
        <td class="border p-2">
          <button onclick="viewDetail('${item.id}')" class="px-3 py-1.5 mr-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm transition-colors">预览</button>
          <button onclick="auditPass('${item.id}')" class="px-3 py-1.5 rounded-lg ${item.status === 'pending' ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 cursor-not-allowed'} text-sm transition-colors mr-2" ${item.status !== 'pending' ? 'disabled' : ''}>通过</button>
          <button onclick="openAuditModal('${item.id}')" class="px-3 py-1.5 rounded-lg ${item.status === 'pending' ? 'bg-red-50 hover:bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400 cursor-not-allowed'} text-sm transition-colors" ${item.status !== 'pending' ? 'disabled' : ''}>驳回</button>
        </td>
      </tr>
    `;
  });

  return `
    <table class="w-full border-collapse">
      <thead>
        <tr>
          <th class="border p-2">ID</th>
          <th class="border p-2">申请人</th>
          <th class="border p-2">事由</th>
          <th class="border p-2">金额</th>
          <th class="border p-2">状态</th>
          <th class="border p-2">操作</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}
// 跳转我的申请列表
export function setTabToMine() {
  setActiveTab("mine");
}

// 列表页面（申请人 / 审批人tab）
export function renderListPage(): string {
  const currentUser = getCurrentUser();
  if (!currentUser) return '';
  const allExpenses = getExpenseList();
  const myExpenses = getExpenseByApplicantId(currentUser.id);

  // 申请人统计
  const myTotal = myExpenses.length;
  const myPending = myExpenses.filter(i => i.status === 'pending').length;
  const myApproved = myExpenses.filter(i => i.status === 'approved').length;
  const myRejected = myExpenses.filter(i => i.status === 'rejected').length;

  // 审批人统计
  const auditPending = allExpenses.filter(i => i.status === 'pending').length;
  const auditApproved = allExpenses.filter(i => i.status === 'approved').length;
  const auditRejected = allExpenses.filter(i => i.status === 'rejected').length;

  let html = `
    <div class="p-6">
      <div class="flex justify-between items-center mb-4">
        <div>
          <div class="relative inline-block group">
            <span class="cursor-pointer">当前用户：${currentUser.name}（${currentUser.role === 'auditor' ? '审批人' : '申请人'}）</span>
            <div class="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg p-3 shadow-md hidden group-hover:block z-50 w-56">
              <div class="text-sm">
                <p><strong>用户ID：</strong>${currentUser.id}</p>
                <p><strong>姓名：</strong>${currentUser.name}</p>
                <p><strong>部门：</strong>${currentUser.department}</p>
                <p><strong>角色：</strong>${currentUser.role === 'auditor' ? '审批人' : '申请人'}</p>
              </div>
            </div>
          </div>  
          <button onclick="logout()" class="ml-4 px-2 py-1 bg-gray-200 rounded">退出登录</button>
        </div>
        <button onclick="renderPage('apply')" class="px-4 py-2 bg-blue-500 text-white rounded">报销申请</button>
      </div>

      <div class="mb-4 rounded-xl border border-slate-100 p-4 bg-white shadow-sm">
        <h3 class="font-medium text-slate-800 mb-3">统计汇总</h3>
        <div class="grid grid-cols-3 gap-3">
          ${currentUser.role === 'applicant' ? `
            <div class="bg-slate-50 rounded-lg p-3 text-center">
              <div class="text-slate-500 text-sm">全部单据</div>
              <div class="text-xl font-medium text-slate-800 mt-1">${myTotal}</div>
            </div>
            <div class="bg-slate-50 rounded-lg p-3 text-center">
              <div class="text-slate-500 text-sm">待审批</div>
              <div class="text-xl font-medium text-slate-800 mt-1">${myPending}</div>
            </div>
            <div class="bg-slate-50 rounded-lg p-3 text-center">
              <div class="text-slate-500 text-sm">已通过 / 已驳回</div>
              <div class="text-xl font-medium text-slate-800 mt-1">${myApproved + myRejected}</div>
            </div>
          ` : `
            <div class="bg-slate-50 rounded-lg p-3 text-center">
              <div class="text-slate-500 text-sm">待审批</div>
              <div class="text-xl font-medium text-slate-800 mt-1">${auditPending}</div>
            </div>
            <div class="bg-slate-50 rounded-lg p-3 text-center">
              <div class="text-slate-500 text-sm">已通过</div>
              <div class="text-xl font-medium text-slate-800 mt-1">${auditApproved}</div>
            </div>
            <div class="bg-slate-50 rounded-lg p-3 text-center">
              <div class="text-slate-500 text-sm">已驳回</div>
              <div class="text-xl font-medium text-slate-800 mt-1">${auditRejected}</div>
            </div>
          `}
        </div>
      </div>
  `;
  const activeTab = getActiveTab();
  // 审批人双tab
  if (currentUser.role === 'auditor') {
    html += `
      <div class="flex mb-4">
        <button onclick="switchTab('audit')" id="tab-audit" class="px-4 py-2 ${activeTab === 'audit' ? 'border-b-2 border-blue-500' : ''}">审批列表</button>
        <button onclick="switchTab('mine')" id="tab-mine" class="px-4 py-2 ${activeTab === 'mine' ? 'border-b-2 border-blue-500' : ''}">我的申请</button>
      </div>
      <div id="tab-content">
        ${activeTab === 'audit' ? renderAuditTable() : renderApplicantTable()}
      </div>
    `;
  } else {
    html += renderApplicantTable();
  }

  html += `</div>`;
  return html;
}

// 申请表单页面
export function renderApplyForm(): string {
  const editItem = getCurrentEditExpense();
  return `
    <div class="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl w-full max-w-lg p-6 shadow-sm border border-slate-100">
        <h2 class="text-lg font-medium text-slate-800 mb-5">${editItem ? '编辑报销申请' : '发起报销申请'}</h2>
        <div class="mb-4">
          <label class="block text-slate-600 text-sm mb-1.5">报销事由</label>
          <input id="reason" value="${editItem?.reason || ''}" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
        </div>
        <div class="mb-6">
          <label class="block text-slate-600 text-sm mb-1.5">金额</label>
          <input id="amount" value="${editItem?.amount || ''}" type="number" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
        </div>
        <div class="flex justify-end gap-3">
          <button onclick="submitApply()" class="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm transition-colors">提交</button>
          <button onclick="cancelApply()" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm transition-colors">取消</button>
        </div>
      </div>
    </div>
  `;
}

// 详情弹窗渲染
export function renderDetailModal(item: ExpenseItem): void {
  const modalDiv = document.createElement('div');
  modalDiv.id = 'detail-modal';
  modalDiv.className = 'fixed inset-0 bg-black/50 flex items-center justify-center';
  modalDiv.innerHTML = `
    <div class="bg-white p-6 rounded w-96">
      <h2 class="text-lg font-bold mb-4">单据详情</h2>
      <p>申请人ID：${item.applicantId}</p>
      <p>申请人：${item.applicantName}</p>
      <p>所属部门：${item.department}</p>
      <p>部门：${item.department}</p>
      <p>事由：${item.reason}</p>
      <p>金额：${item.amount}</p>
      <p>状态：<span class="px-2 py-1 rounded ${statusColor[item.status]}">${statusMap[item.status]}</span></p>
      <p>创建时间：${item.createTime}</p>
      <p>审批意见：${item.auditComment ?? '-'}</p>
      <button onclick="closeModal()" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded">关闭</button>
    </div>
  `;
  document.body.appendChild(modalDiv);
}
