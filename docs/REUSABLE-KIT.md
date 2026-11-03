# 通用基础样式与 Reference

`paper.py new` 在 W0 自动将 `reusable-kit/` 的固定基础源码闭包复制到新论文 `web/enhanced/src/shared/`。运行时只导入本地副本；新项目可以脱离仓库独立 `npm ci && npm run build`。旧论文拥有自己的副本，不受共享目录缩减影响。

保留 DER 已使用的 `--rk-*` 色彩与字体、阅读宽度、章节层级、正文/图注、MathML、纯图文双栏和 Reference。Editorial 样式提供阅读页顶栏、浅绿文字高亮与静态地形/叶片分隔纹样；纹样只作背景点缀，不承载论文对象或教学语义。教学图形、网络、向量、训练动画与计算由论文独立实现。

新论文运行 `npm run dev` 后访问 `?style-preview=1` 检查排版、公式、悬停与抽屉；预览只在开发环境加载，正式构建不包含测试内容。首次正式页面前在已有 Design Handoff 确认基线；局部布局放入 `src/styles/paper.css`，无需新增工作流状态。

## Reference API

从本地 `shared/core/reference/ReferenceHub` 导入 `ReferenceProvider`、`Term`、`ReferenceButton`。Provider 接收 `entries: ReferenceEntry[]`、可选 `title` 和 `sourceLink: {href, label}`。条目字段为 `id`、`name`、`definition`，可选 `english`、`role`、`confusion`、`detail`、`source`、`related`。详情与来源支持 ReactNode，由论文提供。正文用 `<Term id="..." />` 或 `<ReferenceButton term="..." />` 触发。空集合安全退化。

抽屉保持 DER 的右侧 dialog、700px 上限、背景、导航、相关词条/返回、内部滚动、Esc/遮罩关闭与焦点恢复。保留最小悬停定位 hook。源码不包含论文事实或默认论文链接。

公共浏览器工具独立安装：`npm --prefix tools/visual-qa ci`，`npx --prefix tools/visual-qa playwright install chromium`。基础回归运行 `python tools/visual-qa/foundation-check.py`；浏览器测试和截图在临时生成的论文上运行，不依赖旧展厅。
