# Editorial C · 双方案评审（G1）

默认 C 保留 `286acf7` 的 baseline。只在 C 小节读取有限参数 `baseline | c1 | c2`，非法值回退 baseline；A/B 的内容、样式和交互保持一致。本轮不选定默认候选。

从仓库根目录启动后，打开以下地址：

```powershell
npm --prefix reusable-kit/demo run dev -- --host 127.0.0.1 --port 4177
```

- Baseline：`http://127.0.0.1:4177/?demo=editorial#ed-c`
- C1：`http://127.0.0.1:4177/?demo=editorial&c=c1#ed-c`
- C2：`http://127.0.0.1:4177/?demo=editorial&c=c2#ed-c`

| 观察项 | C1 · 编辑式关系汇合 | C2 · Student 计算场景 |
| --- | --- | --- |
| 第一眼 | 主句先提出“两路比较，同一 student” | 大字 student 是场景内的视觉主体 |
| 正文组织 | Teacher 是左侧窄注；Student 两路比较展开在右栏 | Teacher 与真实标签置于场景外缘；共享表示与两路比较置于 Student 内部 |
| 公式位置 | 目标与更新顺着 Student 栏下缘继续阅读 | 目标与更新留在 Student 场景内部，桌面并排、窄屏依次排列 |
| 相对 baseline | 取消独立全宽汇合面板；Student 的左边线贯穿比较、目标与更新 | 将论文式两栏改成一个以 Student 为主体的计算场景，外部目标与内部输出分开归属 |
| 局限 | 左侧留白较多；窄屏 Teacher 在前，Student 出现较晚 | 整合场景信息密度更高；窄屏纵向较长 |

两份候选对照同一组内容核查项：

| 语义 | 两种候选共同表达 |
| --- | --- |
| Teacher | 固定、不接收梯度；可预先记录当前输入上的旧响应 |
| 两路比较 | Student 旧类输出对比 Teacher 目标形成 `L_old`；新类输出对比当前真实标签形成 `L_new` |
| 联合目标 | MathML 保留 `J = λ_o L_old + L_new + R`；说明旧损失温度/归一化、旧损失权重和权重衰减 |
| 更新 | 先定义本图 `θ_s` 为 Student 全部可训练参数，再呈现对 `J` 求导后的参数更新式；标明梯度下降教学简化及其与原文记号的区别 |
| 阶段限定 | 仅讲联合优化；此前 warm-up 只训练新任务参数；图为机制示意 |

保留默认 baseline 的原有断言；新增检查覆盖候选精确入口、四种视口、数学/文本完整性、键盘预览链接，以及 A/B DOM 与截图一致性。候选桌面截图使用既有 Visual QA runner 的独立页面配置；精选局部与窄屏图由现有 Playwright 测试按需输出，命令见 README。

本轮实际结果：`npm run build` 退出 0；`npm run test:browser` 10 项通过；统一 Visual QA 54 个状态通过（含 C1/C2 的 6 个桌面状态）。Agent 已查看上述四种视口的候选截图及 baseline；默认 A/B/C 的 1440px 前后截图无像素差异。未配置获批截图比较器（`NOT_RUN`），不据此推断人工验收。依赖与锁文件未变，按方案未重复 `npm ci`。精选截图、原始报告副本和独立核查记录保存在本机 `.visual-qa/editorial-c-pair-review-20261024/`；本轮 runner 与 Playwright 原始产物已按确切路径清理，测试服务已关闭。

本次交付停在 **G1 人工视觉评审**：等待选择 C1、C2、具体混合意见或否决。当前仍为 candidate。
