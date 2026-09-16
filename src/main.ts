import { renderPage } from "./router";
import { getUserById, getExpenseById, updateExpense, createExpense } from "./mockApi";
import { renderDetailModal, setCurrentUser, setCurrentEditExpense, setActiveTab, getCurrentUser, getCurrentEditExpense, getActiveTab } from "./render";
(window as any).renderPage = renderPage;
// ========== 挂载全局 ==========
(window as any).login = function (userId: string) {
  const user = getUserById(userId);
  if (user) {
    setCurrentUser(user);
    // 新增：登录时根据角色设置默认tab
    if(user.role === 'auditor'){
      setActiveTab("audit"); // 审批人登录默认进入审批列表
    }else{
      setActiveTab("mine"); // 申请人登录默认进入我的申请
    }
    renderPage('list');
  }
};

(window as any).logout = function () {
  setCurrentUser(null);
  renderPage('');
};

(window as any).switchTab = function (tab: string) {
  setActiveTab(tab as "audit" | "mine");
  renderPage('list');
};

(window as any).viewDetail = function (id: string) {
  const target = getExpenseById(id);
  if (!target) return;
  renderDetailModal(target);
};

(window as any).editApply = function (id: string) {
  const target = getExpenseById(id);
  if (!target) return;
  setCurrentEditExpense(target);
  renderPage('apply');
};

(window as any).resubmitApply = function (id: string) {
  const target = getExpenseById(id);
  if (!target) return;
  setCurrentEditExpense(target);
  renderPage('apply');
};

(window as any).submitApply = function () {
  const reasonInput = document.getElementById('reason') as HTMLInputElement;
  const amountInput = document.getElementById('amount') as HTMLInputElement;
  if (!reasonInput || !amountInput) return;

  const reason = reasonInput.value;
  const amount = Number(amountInput.value);
  if (!reason || !amount) {
    alert('请填写完整');
    return;
  }
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const editItem = getCurrentEditExpense();
  if (editItem) {
    // 编辑更新
    updateExpense(editItem.id, {
      reason,
      amount,
      status: 'pending'
    });
    setCurrentEditExpense(null);
  } else {
    // 新建
    createExpense({
      applicantId: currentUser.id,
      applicantName: currentUser.name,
      department: currentUser.department,
      reason,
      amount,
      status: currentUser.role === 'auditor' ? 'approved' : 'pending',
      createTime: new Date().toLocaleDateString()
    });
  }
  // 如果当前是审批人，提交后切换到【我的申请】tab
  if(currentUser?.role === 'auditor'){
    setActiveTab("mine");
  }
  renderPage('list');
};

(window as any).cancelApply = function () {
  setCurrentEditExpense(null);
  renderPage('list');
};

(window as any).auditPass = function (id: string) {
  const reason = prompt("请输入审批通过意见（可留空）");
  updateExpense(id, { status: 'approved', auditComment: reason || '' });
  renderPage('list');
};

(window as any).openAuditModal = function (id: string) {
  const reason = prompt("请输入驳回原因");
  if (reason) {
    updateExpense(id, { status: 'rejected', auditComment: reason });
    renderPage('list');
  }
};

(window as any).closeModal = function () {
  const modal = document.getElementById('detail-modal');
  if (modal) modal.remove();
};

// 初始化页面
renderPage('');
