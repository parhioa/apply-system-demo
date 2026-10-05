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
- Vitest + Testing Library + jsdom（单元测试与组件测试，带 HTML 报告）
- Playwright（端到端测试）
- husky + lint-staged（git 提交前自动校验）
- pnpm（包管理）
- adapter-node / Docker 部署

## 快速开始

```sh
pnpm install
pnpm run dev
```

## 脚本

| 命令                   | 说明                                               |
| ---------------------- | -------------------------------------------------- |
| `pnpm run dev`         | 开发服务器                                         |
| `pnpm run check`       | svelte-check 类型检查                              |
| `pnpm test`            | 单元与组件测试（Vitest + jsdom），并生成 HTML 报告 |
| `pnpm run test:e2e`    | 端到端测试（Playwright + Chromium）                |
| `pnpm run test:e2e:ui` | 端到端测试（Playwright 交互式 UI 模式）            |
| `pnpm run test:report` | 运行单元测试并自动打开 HTML 测试报告               |
| `pnpm run lint`        | Prettier 格式检查 + ESLint                         |
| `pnpm run format`      | Prettier 自动格式化                                |
| `pnpm run build`       | 生产构建（adapter-node）                           |
| `pnpm run preview`     | 预览生产构建                                       |

## 项目结构

```
src/
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
tests/
  e2e/        # Playwright 端到端用例
scripts/
  open-report.mjs  # 跑完单测后自动打开 HTML 报告
```

单元测试与被测模块同目录（`xxx.test.ts`），方便就近维护。

## 测试

### 单元 / 组件测试

```sh
pnpm test
```

共 11 个测试文件、162 个用例，重点覆盖正常路径与边界/异常路径：

| 模块                      | 覆盖内容                                                                                                                                                                                                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `services/applicationApi` | 查询排序与深拷贝隔离、新建（草稿/提交/申请人不存在/入参被外部改写）、字段更新（整体替换、空对象、单据不存在）、多级审批推进、驳回重提重置审批链、撤销、未知操作人、**状态×动作非法流转矩阵遍历**、非法流转不污染数据、统计聚合（空列表不除零、通过率取整、月度升序、金额跳过非法值） |
| `stores/auth`             | 登录成功、**登录失败（未知/空串/大小写不匹配）返回 false 且不覆盖已有登录态**、重复登录、登出与登出幂等、订阅通知                                                                                                                                                                    |
| `stores/applications`     | loading 置位与复位、请求失败的错误上抛与列表不变、并发加载的竞态、保存/更新/流转成功与失败路径                                                                                                                                                                                       |
| `machine/stateMachine`    | 各状态合法与非法动作、转移表覆盖全部状态、目标状态合法性、三个函数结论一致、未知状态/未知动作兜底、无自环、终态不可流转                                                                                                                                                              |
| `config/schemas`          | 申请类型与字段 schema 完整性、select 候选项、number 范围合法性、审批链角色与审批人映射、状态/动作元信息全覆盖                                                                                                                                                                        |
| `utils/validation`        | 必填/非必填、number 非法值与闭区间边界（NaN、Infinity、字符串数字）、date 格式、错误收集、摘要与金额兜底、日期格式化                                                                                                                                                                 |
| `components/*`            | StatusTag 全状态、ApplicationForm 五类控件与回调/禁用/错误、PreviewPanel 占位符与跳转、ProgressBar 四种步骤状态、ApplicationTable 空态/金额/点击                                                                                                                                     |

另外提供两个测试钩子：`__resetDb()` 重置 mock 数据源，`__setNetworkDelay(ms)` 把模拟网络延迟调为 0，
避免用例等待真实延迟。

每次运行都会在 `test-report/` 下生成一个可交互的 **HTML 测试报告**（需安装 `@vitest/ui`），
包含用例通过/失败数、每个用例耗时、失败堆栈等信息。使用 `pnpm run test:report`
跑完测试后会自动启动本地服务并在浏览器中打开报告，也可以手动用：

```sh
pnpm exec vite preview --outDir test-report
```

### 端到端测试（Playwright）

```sh
pnpm exec playwright install chromium   # 首次使用需安装浏览器
pnpm run test:e2e
```

覆盖真实浏览器中的完整业务流程：

- 未登录访问受保护页自动跳转登录页
- 申请人视角只能看到自己的申请、列表状态筛选
- 申请人创建差旅申请 -> 预览 -> 提交 -> 状态变为待审批
- 多级审批：直属主管通过后仍需财务审批，末级通过后才变为已通过
- 驳回后申请人可修改并重新提交
- 统计报表页指标与图表渲染

E2E 用例放在 `tests/e2e/`，运行后会额外生成 `playwright-report/` 可视化报告。

## Git Hooks（提交前校验）

提交时由 **husky + lint-staged** 自动对暂存文件执行校验，有问题会直接阻止提交：

- `.js / .ts / .svelte / .css`：`eslint --fix` + `prettier --write`
- `.md / .json / .yaml / .yml`：`prettier --write`

钩子在 `pnpm install`（`prepare: husky`）时自动安装，无需手动配置。紧急跳过可加 `--no-verify`。

## Docker 部署

仓库内置 `Dockerfile`（多阶段：pnpm 安装依赖 -> 构建 -> 运行 adapter-node 产物），需先安装 Docker：

```sh
docker build -t apply-system .
# docker run -p 3000:3000 apply-system
docker run -p 3000:3000 apply-system:latest
```

要点：

- 服务默认监听 `$PORT`（3000），换端口用 `docker run -p 8080:3000 -e PORT=3000`
- 数据是浏览器端内存 mock，**容器重启后数据重置**为种子数据，仅适合演示，不适合持久化存储

## 说明

- 数据为浏览器端内存 mock（Promise + 延迟模拟网络），刷新后重置为种子数据
- 登录为明文的模拟实现，仅用于演示角色权限
