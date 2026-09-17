# 通用申请审批系统 (Apply System)

一个基于 **SvelteKit** 实现的通用申请（差旅 / 培训 / 请假）流程演示系统，覆盖申请提交、预览回改、审批流转、统计报表。

## 功能

- **通用申请流程**：差旅（travel）、培训（training）、请假（leave）三类申请，schema 驱动的动态表单
- **表单 - 预览联动**：填写后进入预览页，逐字段展示，任意字段点击即可跳回表单对应位置修改
- **草稿与提交**：支持存草稿（draft）、直接提交进入审批流
- **审批状态机**：`draft → pending → approved | rejected | withdrawn`，多级审批（直属主管 → 财务/人事），驳回后修改可重新提交
- **申请列表与详情**：状态 / 类型筛选、审批进度条、按角色执行审批操作、操作记录时间线
- **统计报表**：ECharts 可视化（状态分布饼图、类型分布柱状图、部门/预算折线图、通过率）
- **权限模拟**：申请人（user）/ 审批人（admin）两种视角登录，审批人可见未处理单据

## 技术栈

- SvelteKit 2 + Svelte 5（runes 模式）
- TypeScript
- Tailwind CSS v4
- Apache ECharts
- Vitest + Testing Library + jsdom（单元测试与组件测试）
- husky + lint-staged（git 提交前自动校验）
- pnpm（包管理）
- adapter-node / Docker 部署

## 快速开始

```sh
pnpm install
pnpm run dev
```

## 脚本

| 命令               | 说明                             |
| ------------------ | -------------------------------- |
| `pnpm run dev`     | 开发服务器                       |
| `pnpm run check`   | svelte-check 类型检查            |
| `pnpm test`        | 单元与组件测试（Vitest + jsdom） |
| `pnpm run lint`    | Prettier 格式检查 + ESLint       |
| `pnpm run format`  | Prettier 自动格式化              |
| `pnpm run build`   | 生产构建（adapter-node）         |
| `pnpm run preview` | 预览生产构建                     |

## 项目结构

```
src/
  lib/
    types/            # 领域类型定义
    config/schemas.ts # 申请类型 schema、审批链、状态/动作元信息
    utils/validation.ts
    machine/stateMachine.ts      # 状态转移机
    services/applicationApi.ts   # mock 数据服务（Promise 模拟网络延迟）
    stores/           # 登录态、申请数据 store
    components/       # StatusTag / ApplicationForm / PreviewPanel /
                      # ApplicationTable / ProgressBar / BaseChart / ApplicationWizard
  routes/
    login/    # 登录
    list/     # 申请列表（筛选）
    apply/    # 新建申请（+apply/[id] 编辑）
    detail/   # 申请详情（审批操作 / 进度 / 记录）
    report/   # 统计报表
```

## 测试

```sh
pnpm test
```

测试覆盖：

- 状态机流转（各状态合法 / 非法动作、终态、可执行动作列表）
- 字段校验（必填、数字范围、日期格式、错误映射）
- mock 数据服务（新建、草稿、多级审批推进、驳回重提、撤销、统计聚合）
- 组件（StatusTag 文案、ApplicationForm 渲染与交互、PreviewPanel 预览与跳转）

## Git Hooks（提交前校验）

提交时由 **husky + lint-staged** 自动对暂存文件执行校验，有问题会直接阻止提交：

- `.js / .ts / .svelte / .css`：`eslint --fix` + `prettier --write`
- `.md / .json / .yaml / .yml`：`prettier --write`

钩子在 `pnpm install`（`prepare: husky`）时自动安装，无需手动配置。紧急跳过可加 `--no-verify`。

## Docker 部署

```sh
docker build -t apply-system .
docker run -p 3000:3000 apply-system
```

## 说明

- 数据为浏览器端内存 mock（Promise + 延迟模拟网络），刷新后重置为种子数据
- 登录为明文的模拟实现，仅用于演示角色权限
