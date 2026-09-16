# apply-system-demo
报销审批系统（demo）

# How to Run / 运行方式
- install dependencies / 安装依赖
npm install
- start dev server / 启动开发服务
npm run dev
- run unit tests / 执行单元测试
npm test

# 报销审批系统前端 Demo
> Coding challenge project built with TypeScript + Tailwind CSS, pure frontend mock system.
> 基于 TypeScript + Tailwind CSS 的编程挑战项目，纯前端 Mock 系统

## 项目简介
原生TS开发报销审批系统
src/main.ts         # global functions & mount methods / 全局函数与方法挂载
src/render.ts       # page / modal render functions / 页面与弹窗渲染函数
src/mockApi.ts      # mock data, type definitions, data api / Mock 数据、类型定义、数据接口
src/index.html
tests/mockApi.test.ts # unit test for mock api logic / Mock接口逻辑单元测试

## Features / 功能点
1. Dual Role Login System / 双角色登录系统
   - 两种角色：申请人 / 审批人
   - 申请人：提交报销申请、查看我的申请、编辑并重新提交被驳回的申请
   - 审批人：查看待审批列表/我的列表。审批人提交的申请，创建后自动审批通过
   - 用户信息，鼠标悬浮在用户名称时可查看用户详细信息
2. Expense Application Modal / 报销申请
   - 点击「报销申请」打开表单弹窗
   - 支持新建报销申请和编辑已有申请
3. Application List Page / 申请列表
   - 申请人：仅能看到自己的申请记录
   - 审批人：可在「审批列表」和「我的申请」两个 Tab 间切换
   - 操作按钮：预览、编辑、重新提交、通过、驳回；不符合状态的按钮自动置灰禁用
4. Statistics Summary Panel / 统计汇总面板
   - 申请人：全部单据、待审批、已通过、已驳回数量
   - 审批人：待审批、已通过、已驳回数量
5. Detail Modal / 预览详情弹窗
   - 点击预览，在弹窗中查看报销单完整信息

## Unit Test / 测试用例
1. getUserList：验证正常读取全部用户Mock数据，包含申请人、审批人
2. getUserById：根据用户ID查询用户，不存在ID返回undefined
3. getExpenseByApplicantId：按申请人ID过滤单据，仅返回对应申请人的申请记录
4. getExpenseById：根据单据ID查询单条报销记录，不存在ID返回undefined
5. createExpense：新增报销单，校验新增后列表数量增加，自动生成id
6. updateExpense：更新单据字段，校验修改生效；传入不存在单据id返回null




