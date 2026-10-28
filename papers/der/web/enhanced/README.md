# DER 交互教程

独立 React / TypeScript / Vite 项目。W7 已由用户通过，W8 按批次扩展。当前 / 正式接入认可的 KL、Logits、同一生命周期和 Reservoir。

```powershell
npm ci
npm test
npm run build
npm run test:browser
npm run preview -- --host 127.0.0.1 --port 5195 --strictPort
```

入口：正式阅读 /；Reservoir ?focus=reservoir；生命周期 ?review=1&focus=lifecycle#lifecycle-player。冻结入口使用同一 React 组件和时钟，没有跨服务 iframe。设计评审板反向复用生产组件。

Claude / GPT / DeepSeek 是合成教学类别，KL 两类例与三类 Logits 例独立，不是品牌模型的论文性能。ModelPixel 是手工 SVG；17项原论文图像仍为 REFERENCE_ONLY。原文为 arXiv:2004.07211v2，NeurIPS2020。

Reservoir 四项候选依次添加、添加、替换、拒收。j 明标教学预设随机结果；N 每项处理后增加，K 固定。冻结输出是给定的教学值，未入池不撤销当前训练。

浏览器测试使用 reusable-kit/demo 锁定的 Playwright，仅为开发工具依赖。默认 Edge，可用 PAPERWORK_PLAYWRIGHT_EXECUTABLE 指定；用真实 dist 服务于 /der-review/，覆盖两档桌面。DER_REVIEW_DIR 指定内部截图目录；--reservoir-only 用于定向调试，最终整篇须运行无过滤版本。

实际检查记录位于 ../../design/implementation-plan.md；最终审查使用 ../../audit/final-check.md。构建、布局模拟、真实F11独立记录，工程检查不代替用户验收；本轮不执行 W10。
