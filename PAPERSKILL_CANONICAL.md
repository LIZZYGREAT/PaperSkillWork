# PAPERSKILL_CANONICAL

本分支 `paper-skill-canonical` 的目标：**在 PaperSkill 官方输出契约内**重新实现高质量
PhyAgentOS 交互教程，不通过修改框架代码绕开其约束。它不是 main（enhanced）的低配版，
而是严格受约束的基准版本。

## 基线冻结（Phase 0，已完成）

```text
BASELINE = 243f6f12e2153fbc8524bd6e71636dd005f32e38（feat: 初始版本有待优化）
```

已核对 `MyPaper/phyagentos_output` 的 framework 文件与
`PaperSkill/paper-skill/assets/react-template/` 完全一致，仅存在两处 scaffold.js 的
预期产物：

1. `index.html` 标题注入（`__PAPER_TITLE_ZH__` → 论文标题）；
2. `src/styles/paper.css` 的 `__METAPHOR_CSS__` 占位符被 paper-specific `:root{}` 覆盖替换。

framework 自此冻结。发现任何模板级漂移，应先以官方模板校正并单独提交
`chore: align canonical scaffold with PaperSkill template`。

## 修改边界（硬约束）

只允许修改：

```text
MyPaper/phyagentos_output/src/data/tutorial.ts
MyPaper/phyagentos_output/src/styles/paper.css
MyPaper/phyagentos_output/src/modules/*
MyPaper/phyagentos_output/public/images/*
```

禁止修改（framework）：`src/App.tsx`、`src/main.tsx`、`src/components/*`、`src/lib/*`、
`src/styles/tokens.css`、`src/styles/components.css`、`src/types.ts`、`vite.config.ts`、
`tsconfig*.json`、`package.json`、`index.html`。

Bilibili：原始生成未包含相关视频，`bilibili` 数组保持省略（契约 §7：无相关视频时省略；
不得伪造 BVID）。

## 每阶段验收门

1. `npm run build`（TypeScript + Vite，0 errors）
2. `node <PaperSkill仓库>/paper-skill/scripts/validate-output.js MyPaper/phyagentos_output`
3. Framework guard（输出只允许出现上面四个允许区域）：

```bash
git diff --name-only 243f6f12e2153fbc8524bd6e71636dd005f32e38 HEAD -- MyPaper/phyagentos_output
```

## 教学结构（10 章，问题驱动）

| 章 | 问题 | 主模块 |
|---|---|---|
| 1 | 具身智能系统里到底有哪些角色？ | role-map |
| 2 | 为什么「执行完成」不等于「任务完成」？ | return-code-lab |
| 3 | PhyAgentOS 为什么叫「OS」？ | os-layer-builder |
| 4 | 不同层如何看到「同一个世界」？ | protocol-views |
| 5 | 为什么是 Session，而不是 Action？ | session-lifecycle |
| 6 | 两种执行流为何能共用一套 Runtime？ | dual-flow |
| 7 | 系统如何知道「任务真的成功」？ | verifier-lab |
| 8 | 失败如何真正变成可复用经验？ | arch-map |
| 9 | 系统怎样在真实世界里保持安全？ | tier-ladder + five-layers |
| 10 | 实验到底证明了什么？ | benchmark-lab + claim-checker |

信息压缩规则：bridge 只承接上章问题；analogy 建立第一次直觉（徒步主题，一主体一动作
一目标）；解释主体放进模块交互与即时反馈；insight 只留一句核心结论；公式在直觉之后；
takeaways 恒为 3 条。

## 交互模式盘点（Phase 3）

| 模块 | 模式 |
|---|---|
| return-code-lab | P6 拖拽操控（+ P1 滑杆微调） |
| session-lifecycle | P2 步进状态机（含非法转移拒绝） |
| os-layer-builder / arch-map | P2 步进装配 / 路径追踪 |
| dual-flow / protocol-views / tier-ladder | P4 模式切换 |
| role-map / five-layers / verifier-lab / claim-checker | P5 可点击热点 / 判定 |
| benchmark-lab | P8 结果对比（First vs Final，同协议内对齐） |
| return-code-lab 微调滑杆 | P1 滑杆 |

覆盖 P1 / P2 / P4 / P5 / P6 / P8 共 6 类，满足 `distinctPatternsMin = 6`；
双模块章节 2 个（第 9、10 章）≥ `dualModuleChaptersMin = 1`；
主动模块 12 个 ≥ `activeModulesMin = 4`。

## 类比呈现方式的显式偏离（2026-09-13，用户指示）

应用户要求，**移除了每章类比卡与 Hero 对比的原徒步 Canvas 动画**
（`hike-analogy.tsx` / `hero-compare.tsx` 已删除），改用文字组件：

- `analogy-note`（`src/modules/analogy-note.tsx`）：以
  「主体 → 动作 → 目标」chips + 一句类比文案承载
  animation-library.md 句子测试（one subject + one verb + one goal）的文本形式；
  徒步锚定主题与每章动作不变。
- `hero-points`（`src/modules/hero-points.tsx`）：Hero 新旧两栏改为
  红/绿语义色要点清单（contract.md §5：红 = 失败/旧方法，绿 = 成功/本文方法）。

合规性说明：

- framework 未动——`AnalogyCard`/`Hero` 的 `componentId` 组件槽是官方设计
  （types.ts 注释：optional canvas widget id），`AnalogyCard` 在无动画时
  本就渲染空白 560×140 canvas 占位符，填入文字组件是避免空白占位的必要手段。
- 主动交互密度（contract.md §3）不受影响：analogy card 从不计入
  active modules（autoplay-only 不计数），12 个主模块全保留。
- **显式偏离**：chapter-template.md「Analogy Card = 560×140 canvas animation」
  与 animation-library.md 的 Shared Animation Contract（rAF/循环/reduced-motion
  等）不再适用——没有 Canvas 就没有动画契约可违反；句子测试与禁止模式以
  文字形式继续满足。此偏离为用户明确指示，validator 对此无检查项，机器门全绿。

## 证据审计（Phase 5，全部通过）

对照论文 PDF（arXiv:2607.16636v1，46 页）逐项核对，零修正：

| 项 | 论文出处 | 结果 |
|---|---|---|
| V(G, S₀, S_T, τ, H) → {success, failure, replan} | §Verifier 判定式 | ✓ |
| Aₜ = Policy(I, Oₜ, Sₜ, Hₜ) / Tₜ = Agent(I, Oₜ, Sₜ, Hₜ) | §双执行流 | ✓ |
| 状态机 pending→claimed→running→finalizing→awaiting_verification→verifying→terminal | §Session State Machine | ✓ |
| 五份协议文件（SESSIONS/SKILLRUNTIME/TARGETS/ENVIRONMENT/LESSONS） | §文件协议 | ✓ |
| 五层安全命名（Preflight/ActionBridge/SafetyGuard/Heartbeat/target-local） | §Layered Safety | ✓ |
| Optimus-67 RedStone 0.30±0.16 > Optimus-3 0.29 > Optimus-2 0.28；Diamond 19 vs 15；Gold 0.06；Armor 0.15 | Optimus-67 表 | ✓ |
| StarDojo 22.0 vs SPIKE 18.0；Crafting 50 vs 23.8；Easy 37.5 / Medium 3.7 / Hard 0.0；Social 8.0 | §5.1.3 | ✓ |
| DST 1.02±0.08 → 2.10±0.88（+106%）；Day3 0→30%；Charlie 黑暗 80% | Table 3 | ✓ |
| LIBERO 74.5→75.5 / 92.8→93.2 / 97.0→97.8 / 97.3→98.6 | Table 4 | ✓ |
| CALVIN 74.3→75.7 / 38.9→45.6 / 85.3→89.4 | Table 5 | ✓ |
| RoboCasa365 17.6→26.8（救回 23）/ 35.6→42.8（18）/ 34.0→42.4（21），增益 +9.2/+7.2/+8.4 | Table 6 | ✓ |
| First = 策略首试；Final = 验证器触发恢复后（不改权重/不重置/不放宽） | §5.2 | ✓ |
| 「more than 19 robot embodiments」；真机评测偏 safety-critical validation（预检拒绝/拦截/急停延迟） | 摘要 / §5.3 | ✓ |

## 迁移说明

模块代码来自 main（enhanced）分支的 `src/modules/*`——该目录同属 PaperSkill 允许区域，
且这些模块仅依赖 React、`./registry`、`./kit`，不依赖 enhanced-only 的
Prose / 扩展 types / 修改后 components。迁移的是教学设计与交互实现本身；所有章节文案
已按 canonical schema（无 prose / links / points 字段）重新压缩进
bridge / analogy / module desc / insight / formula / takeaways。
