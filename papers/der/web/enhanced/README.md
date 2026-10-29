# DER / DER++ 完整交互教程

独立 React / TypeScript / Vite 项目，正式实现 S1–S8、I01–I11、7阅读单元/10模块。W7 已由用户通过；W8 实施与自检完成，W9 待最终用户审查。没有执行 W10 发布。

```powershell
npm ci
npm test
npm run build
npm run test:browser
npm run preview -- --host 127.0.0.1 --port 5195 --strictPort
```

| 入口 | 内容 |
| --- | --- |
| / | 完整阅读主线 |
| ?focus=reservoir | 在线追加、替换、拒收 |
| ?focus=der-step | 当前与回放两路、一次更新后写入 |
| ?focus=augmentation | 原图/不同视图/同一冻结目标 |
| ?focus=der-plus | 错误历史、独立标签监督与两次采样 |
| ?focus=workbench | 同一状态贯通四轮训练与只读预测 |
| ?focus=evidence | 协议先行的实验、反例与局限 |
| ?review=1&focus=lifecycle#lifecycle-player | 已认可的生命周期专注播放器 |

冻结说明直接复用生命周期组件/状态，没有本地 iframe 或跨服务运行依赖。设计板反向复用正式生产场景。

Claude / GPT / DeepSeek 是合成教学类别，KL 两类例与 Logits 三类例独立，不是品牌模型的论文性能。ModelPixel 是手工 SVG；论文17项图像仍为 REFERENCE_ONLY，未发布 PDF/原表截图。原文版本 arXiv:2004.07211v2 / NeurIPS2020。实验图由 W3 核对数据重绘，保留协议、容量、训练设置和 ± 原样；与合成动画明确区分。

training-model.ts 是单步与四轮工作台唯一训练计算源：2→3无偏置线性模型、η=.1、α=β=.5、预设合法回放/抽签。损失/冻结值/梯度/参数/记忆均可复算，四轮核对值与 W5 一致。它是教学算例，不是论文 CNN 实验。独立 Reservoir 场景沿用给定冻结输出，仅演示入池；拒收不撤销当前训练。

页面复用已有 SceneTransport、useAnimationTimeline、reduced motion、Reference 和候选 Kit 副本。公开运行时自包含，不依赖其他论文或 reusable-kit/demo；后者锁定的 Playwright 仅为开发检查工具。默认 Edge，可用 PAPERWORK_PLAYWRIGHT_EXECUTABLE 指定。

```powershell
# 可选定向调试；整篇验收必须跑上方无过滤版本
npm run test:browser -- --reservoir-only
npm run test:browser -- --w8-only
# 需先启动本地生产预览；可用 DER_PREVIEW_URL 指定
npm run test:playback
npm run test:workbench-layout
```

DER_REVIEW_DIR / DER_PLAYBACK_DIR 可指定内部证据目录。通用视觉检查从仓库根运行 node tools/visual-qa/cli.mjs --config papers/der/web/enhanced/visual-qa.json。读取报告、实际查看截图并归档必要证据后，再按输出的确切 run 路径清理。

检查：21项数学/状态/证据测试、2364整篇浏览器断言、后续764项新增场景与24项避让复测通过；两档桌面40状态公共视觉检查通过；真实连续播放21阶段约127.5秒。具体命令、版本、来源、受保护区域、限制与审查问题见 ../../design/implementation-plan.md 和 ../../audit/final-check.md。当前官方上游检查器版本网络核实与真实 F11 仍 NOT_RUN；本地旧脚本诊断通过，不等于正式 W10。

2026-10-29截图反馈：普通正文生命周期直接显示已有侧栏；标题对齐正文。可运行 npm run test:browser -- --review-feedback 快速复核公式前置/无内部滚动、图注和mark、误差区间、正常侧栏和专注切换；默认完整浏览器回归也包含这些断言。
