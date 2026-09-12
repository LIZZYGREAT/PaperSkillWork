# PhyAgentOS：面向具身智能体的认知规划与物理执行解耦的自演化操作系统 交互式教程

基于论文 *PhyAgentOS: A Self-Evolving Operating System for Embodied Agents with Decoupled Cognitive Planning and Physical Execution*（arXiv:2607.16636）的 React + TypeScript + Vite 交互式教学网页。

全部章节文案、公式与实验数字均对照论文原文核验（V(G, S₀, S_T, τ, H)、五份协议文件、六步自演化闭环、五层纵深安全、Optimus-67 / StarDojo / DST-Dojo / LIBERO / CALVIN / RoboCasa365 的 First/Final 协议数字）。

## 本地运行

```bash
npm install
npm run dev       # 开发预览 http://localhost:5173
npm run build     # 产出 dist/ 静态站点
npm run preview   # 预览构建结果
```

## 网页结构

- **封面**：论文信息 + 「三个范式之下的操作系统层」故事 + 新旧对比 + 开始阅读入口。
- **§1–§10**：每章 = 本节作用 → 生活类比（SVG 徒步场景）→ 正文三段 → 1–2 个交互实验室 → 洞察/公式 → 三张要点卡。
- **12 个交互实验室**（均注册于 `src/modules/registry.tsx`）：

| 模块 | 章节 | 交互 |
| ---- | ---- | ---- |
| ReturnCodeLab | 1.1 | 执行进度滑块 + 核对目标证据（返回码 vs 语义判定） |
| ProtocolViews | 2.1 | 点击五份协议文件查看字段与记忆层次 |
| SessionLifecycle | 3.1 | 会话状态机六步步进 |
| PreflightLab | 4.1 | 执行流 × 目标端组合，观察 AdapterPlan 成立/被拒 |
| SafetyBoundary | 4.2 | 动作越界滑块：放行 / 有界投影 / 拦截 |
| VerdictCompare | 5.1 | 同一条轨迹在两种视角下的判定动画 |
| DualFlow | 6.1 | 策略流 / 工具流切换（SVG 循环动画） |
| EvolveLoop | 7.1 | 六步闭环步进 + 假设验证/固化状态 + 记忆卡 |
| ArchMap | 8.1 | 点击架构组件高亮责任链 |
| TierLadder | 9.1 | 游戏/模拟/真机三层验证阶梯 |
| FiveLayers | 9.2 | 注入五类故障看被哪一层拦下 |
| BenchmarkLab | 10.1 | 六个基准的 First/Final 分组条形对比 |

## 主要目录

| 路径 | 说明 |
| ---- | ---- |
| `src/data/tutorial.ts` | 全部章节文案与结构数据 |
| `src/modules/*` | 交互实验室组件（DOM/SVG 实现，无 canvas） |
| `src/styles/paper.css` | 设计系统与全部自定义样式 |
| `src/components/*` | Hero / Module / Formula / Takeaway / Prose 等 |
| `src/App.tsx` | 滑页布局、侧栏、进度条、键盘导航 |

## 交互与无障碍

- 键盘 `←` / `→` 翻页，`Home` / `End` 跳转；焦点在滑块等表单控件上时不劫持方向键。
- 动画尊重 `prefers-reduced-motion`；章节内容错落入场；顶部阅读进度条 + 侧栏百分比。
- 阅读位置自动记忆（localStorage），刷新后回到上次章节。
