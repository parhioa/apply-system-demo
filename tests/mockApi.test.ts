import { describe, expect, it } from 'vitest';

import {
  getUserList,
  getUserById,
  getExpenseList,
  getExpenseById,
  getExpenseByApplicantId,
  createExpense,
  updateExpense
} from '../src/mockApi';

describe('mockApi 核心业务函数单元测试', () => {
  it('getUserList：能够正常返回用户数组，包含u1、u2', () => {
    const users = getUserList();
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThanOrEqual(2);
    const u1 = users.find(u => u.id === 'u1');
    const u2 = users.find(u => u.id === 'u2');
    expect(u1).toBeDefined();
    expect(u2).toBeDefined();
  });

  it('getUserById：根据id查询单个用户，查询不存在id返回undefined', () => {
    const user = getUserById('u1');
    expect(user?.name).toBe('张三');
    const notExistUser = getUserById('u999');
    expect(notExistUser).toBeUndefined();
  });

  it('getExpenseByApplicantId：只返回指定申请人的单据', () => {
    const list = getExpenseByApplicantId('u1');
    list.forEach(item => {
      expect(item.applicantId).toBe('u1');
    });
  });

  it('getExpenseById：根据单据ID查询单条报销记录', () => {
    const item = getExpenseById('1');
    expect(item?.reason).toBe('出差交通费');
    const emptyItem = getExpenseById('999');
    expect(emptyItem).toBeUndefined();
  });

  it('createExpense：新增报销单据，列表长度增加', () => {
    const before = getExpenseList().length;
    const newRecord = createExpense({
      applicantId: 'u1',
      applicantName: '张三',
      department: '研发部',
      reason: '单元测试新增单据',
      amount: 500,
      status: 'pending',
      createTime: '2026-09-16'
    });
    const after = getExpenseList().length;
    expect(after).toBe(before + 1);
    expect(newRecord.id).toBeDefined();
  });

  it('updateExpense：更新报销单字段，修改数据生效；不存在id返回null', () => {
    const originItem = getExpenseById('1');
    expect(originItem).toBeDefined();
    const updated = updateExpense('1', { reason: '测试修改事由', amount: 888 });
    expect(updated?.reason).toBe('测试修改事由');
    expect(updated?.amount).toBe(888);

    // 更新不存在id
    const nullResult = updateExpense('999', { amount: 100 });
    expect(nullResult).toBeNull();
  });
});
