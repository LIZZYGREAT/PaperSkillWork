# PhyAgentOS 交互式论文教程

基于论文 *PhyAgentOS: A Self-Evolving Operating System for Embodied Agents with Decoupled Cognitive Planning and Physical Execution*（arXiv:2607.16636）的简体中文交互式教程。

## 项目定位

本项目是 **PaperSkill-generated + Agent-enhanced** 产物：PaperSkill 提供基础教程结构与生成规范；当前版本在此基础上进行了二次教学设计、交互、无障碍和视觉增强。因此源码允许修改框架组件，并混合使用 React DOM、SVG 与少量 Canvas，不代表未经修改的 PaperSkill canonical output。

教学主线保持问题驱动：领域角色 → Verification Gap → Runtime 系统层 → State-as-a-File → Session → 双执行流 → SessionVerifier → 系统级自演化 → 渐进验证与安全 → 实验证据边界。

## 核心交互模块

项目包含 16 个教学实验室，以及 1 个各章复用的徒步类比场景。模块注册表位于 `src/modules/registry.tsx`。

| 组件 | 章节 | 教学作用 |
| --- | --- | --- |
| `AnalogyScene` | 各章 | 随章节变化的徒步类比场景 |
| `RoleMap` | 1.1 | 找出语义验证与经验复用的责任空缺 |
| `ReturnCodeLab` | 2.1 | 体验 Execution Success 与 Semantic Failure 的冲突 |
| `OSLayerBuilder` | 3.1 | 逐项搭建 Runtime 能力并与 ROS 对照 |
| `ArchGraph` | 3.2 | 从主链渐进展开完整系统架构 |
| `ProtocolViews` | 4.1 | 观察同一现实状态在五份协议中的不同视图 |
| `SessionLifecycle` | 5.1 | 推进状态机并尝试非法状态转移 |
| `PreflightLab` | 5.2 | 在接触机器人前完成兼容性预检 |
| `DualFlow` | 6.1 | 对比 Policy-driven 与 Agent-directed 执行流 |
| `VerifierLab` | 7.1 | 根据 G / S₀ / S_T / τ / H 自行给出 verdict |
| `ArchMap` | 8.1 | 追踪失败、子会话、复验到经验固化的完整旅程 |
| `GrandLoop` | 8.2 | 可暂停、跳转的系统级自演化闭环 |
| `TierLadder` | 9.1 | 对比 Game / Simulation / Real Robot 渐进验证 |
| `FiveLayers` | 9.2 | 注入故障并观察五层防御的责任边界 |
| `BenchmarkLab` | 10.1 | 按协议和指标阅读六个实验基准 |
| `ClaimChecker` | 10.2 | 区分论文支持、过度解读与错误主张 |
| `GrandTrail` | 10.3 | 汇总 Session 环路、First→Final 与三层验证 |

## 技术实现

- React 18 + TypeScript + Vite。
- 教学数据集中在 `src/data/tutorial.ts`。
- 交互组件位于 `src/modules/`，共享控件位于 `src/modules/kit.tsx`。
- `src/styles/tokens.css` 定义设计令牌，`components.css` 保留基础框架样式，`paper.css` 包含增强页面与实验室样式。
- 页面支持侧栏章节导航、键盘翻页、术语 Hover/Focus 解释、响应式布局和 `prefers-reduced-motion`。

## 本地运行

```bash
npm install
npm run dev
npm run build
npm run preview
```

开发预览默认位于 `http://localhost:5173`，生产构建输出到 `dist/`。

## 构建与验收

执行完整验收：

```bash
npm run check
```

该命令依次完成：

1. TypeScript 编译与 Vite 生产构建；
2. PaperSkill 官方结构 validator；
3. enhanced audit，包括模块注册、README、资源、术语、章节结构和临时文件检查。

也可以分别运行：

```bash
npm run validate:paper-skill
npm run audit:enhanced
```

## 当前限制

- 系统成功率提升来自验证、恢复、记忆与运行时治理，不表示底层 VLA 权重或模型能力本身提升。
- 真机实验主要验证跨硬件集成与安全机制，不等同于大规模真机任务成功率评测。
- Verifier 的误判率、不同恢复机制的独立贡献，以及恢复带来的时间与推理成本仍缺少充分量化。
- 当前版本是增强成果；若要测试 PaperSkill 自身的严格生成边界，应另行保留 canonical 输出。
