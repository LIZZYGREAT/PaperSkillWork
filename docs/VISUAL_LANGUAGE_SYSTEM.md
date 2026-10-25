# Reusable Kit 视觉语言与重建记录

目标：可独立取用的小件、可以自由重组的场景。统一文字与绘图语言，不统一论文页面。

## S0 · 基准与审计（2026-10-25）

分支 `docs/workflow-governance`，起点 `3633d31`，工作区干净。只修改 Kit、复制 CLI、相关测试和使用指引；`papers/**` 与上游只读。

已阅读交接方案、背景需求、五张参考图以及 EWCNetworkDiagram、iCaRL SharedTrainingHead、LwF 入口。原 Gallery 实际运行后查看了首屏、网络局部和窄屏双模型截图：首屏主要是工具控件与说明；网络被父布局拉得过宽；移动端层标签变成列表，与图中层位置脱离。输入和特征图形在 Demo 内重复实现。Gallery 的 token 和组件 overrides 导致复制后的外观不可靠。

| 处理 | 资产与原因 |
| --- | --- |
| 保留内核 | MiniNetworkGlyph 的 ID/拓扑/focus；DiagramFlow 几何与窄屏语义列表；useAnimationTimeline 单一时钟 |
| 重建外观 | 小网络比例与标签、排版、默认材质、Gallery 首屏与阅读顺序 |
| 拆成小件 | 输入对象、特征块、聚合、带符号向量、指定尺度的响应条、轻量语义连接 |
| 仅作参考 | iCaRL 训练头、EWC 完整教学图、LwF 论文场景；不搬入算法事实 |
| 删除重复职责 | Gallery 公共组件 overrides、复制整个 foundation 的隐式规则、Demo 内重复图元 |

基准命令：`npm.cmd ci --no-audit --no-fund --cache ../../../../.npm-cache`（实际使用绝对缓存路径）退出 0；`npm.cmd run build` 退出 0；`node scripts/capture-redesign.mjs baseline` 退出 0，1440×900 / 1920×1080 / 390×900 无页面横向溢出、无浏览器资源错误。沙箱内浏览器启动失败后，在允许的提升环境启动本地 Edge Chromium。依赖最初安装遇 DNS 失败，重试成功。Python requirements 已满足。

实际截图保留在工作区父目录 `.qa/kit-redesign-20261025/baseline/`，供前后复核，未作为人工批准基线提交。`capture-redesign.mjs` 可重现截图。

## 验收边界

S1、S4、S6 画面供人判断；开发可以在 candidate 状态继续。自动检查与 Agent 视觉复核不代填人工签收。A/B/D/F 的最终人工判断仍待用户完成。

## 可执行视觉规则（S1）

- `kit.css` 是颜色、文字、间距、状态与既有组件的基础；canvas 为中性暖白，surface 为白，figure 为淡绿；ink/secondary text、weak/strong line、accent、warning 各司其职。数据与状态不靠颜色独自表达。
- 正文字体使用系统无衬线中文回退；数学使用 Cambria Math 等数学字体；数字用 tabular/mono。Hero 34–64px、章节 22–28px、局部 19–22px、正文 16px、引导 18px、注释 13–14px、图标注 12–15px、公式 20px。不用缩放或省略号塞文字。
- `editorial.css` 提供可选 headline/mark、lead、caption、equation、aside、figure-explanation 和 state 类。不是强制的整页模板；大标题不用每节重复。默认靠空白、轴线和文字建立层级，只有真实分组才有表面。
- focus 使用独立描边；冻结有虚线形状及文字，可训练有实线及文字。关系线必须由调用方声明类型和方向。聚焦不删除拓扑。
- 图形遵循内容尺寸，场景控制最大宽度；正常、紧凑、放大分别校准，放大不改拓扑。窄屏重排解释，保持字号。交互支持键盘，reduced motion 不自动播放装饰。
- 资产所需 CSS 属于资产；Gallery 只能安排展厅。已删除 `gallery-theme.css` 对公共组件的整层覆盖，以及 Gallery 私有基础 token。图文组合可直接用 `.rk-figure-explanation`，也可以局部编排。

S1 实现：`VisualSpecimen.tsx` 使用真实 MiniNetworkGlyph、状态标识和 MathML。`npm.cmd --prefix reusable-kit/demo run build` PASS（0）；`node scripts/capture-redesign.mjs s1` PASS（0），三个视口无横向溢出和浏览器错误。已实看 1440/1920 首屏与 390 样张：标题、图、公式有明确主次，窄屏重排；网络标签窄屏列表问题留给 S2。画面位于 `.qa/kit-redesign-20261025/s1/`，供人工校准，尚未签收。

## S2 · 独立视觉小件

新增 SampleToken（调用方内容/像素及 ID）、FeatureBlocks、FeatureAggregation、RepresentationVector（带符号及显式 extent）、ResponseMeter（调用方尺度）、FlowConnector（数据/控制/梯度/参照线型）、SemanticMark。每个组件导入自带 CSS，不需要 Gallery；没有计算 sigmoid 或预设论文事实。非法数值/尺度提供可访问的错误提示。

MiniNetworkGlyph 增加 compact / standard / inspect 三种使用密度（232/360/560px 上限），缩短层间距、调整节点半径，窄屏标签仍对齐原层；斜线端点按节点半径裁出。保留完整拓扑、稳定 ID、压缩披露和 focus。删除场景对 Glyph 内部宽度的补丁。

`npm.cmd run build` PASS（0）；浏览器 `--grep 'signed values|network focus'` 2 tests PASS（0），覆盖 30 边/11 节点、聚焦不改位置、独立双模型、向量正负值、动态得分与尺度、三个视口层标签对齐。首次测试发现 range 默认 margin 导致局部 2px 溢出，已修复并复测。实看 `.qa/kit-redesign-20261025/s2[-debug]/` 样张与小件、网络；外观脱离 Gallery overrides。原网络父布局仍疏散，S3 重排场景。

## S3 · 自由组合与独立场景

三个主要构图为紧凑学习器/局部网络、共享输入上方分流到并排独立模型、输入与提取在首行而表示/得分/响应在下一行的阶段教学。局部网络将输入、图、说明收拢；双模型身份在外层，前向没有 Teacher → Student。提取流程直接组合公共特征块、聚合和连接；向量和响应直接使用小件。单次 useAnimationTimeline 拥有阶段，计算留在场景。

新增独立的 RetrievalExample，用相同小件组成非对称的原始内积检索。切换 q 后派生得分和最大值，不假定分类或概率。候选数据、查询和排序属于场景，不抽成通用算法组件。Editorial 样段使用 S1 真实样张。

场景 CSS 从 Gallery 拆到 examples 配套文件。主要 Recipe 的 TSX/CSS 与运行源码同步。`npm.cmd run build` PASS（0）；五项浏览器测试 PASS（0），覆盖播放/暂停/重播、阶段交接、Wz 与 sigmoid、reduced motion、两个查询内积、390/1440/1920 几何。构建发现 ES2020 无 replaceAll，改用 split/join 后重新构建测试。s3-final 截图已实看局部网络、双模型、提取流程及窄屏；无溢出。长局部截图中悬浮 topbar 属于展厅，非场景依赖。
