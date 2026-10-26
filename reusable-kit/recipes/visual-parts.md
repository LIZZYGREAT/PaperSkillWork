# Visual Parts · candidate

这些小件负责绘图，不拥有论文计算或数据来源。先从 W2/W4 确认要表达的对象，再查询 registry.yaml 的 `use_when` / `avoid_when`。API 和最小用法在 Registry 与 Gallery 详情中，源码为 `foundation/visual-parts/`。

| 小件 | 输入与边界 |
| --- | --- |
| SampleToken | `sampleId`、`label`、`children` 或 `[0,1]` 的 `pixels` 与 `columns`；没有默认数据集 |
| FeatureBlocks | `label`、1–7 的示意 `depth`、`active`；不是实际通道计数 |
| FeatureAggregation | `label`、`active`；不预设池化运算 |
| RepresentationVector | 有限 `values`、`label`、可选正 `extent`；默认按最大绝对值自适应，保留符号和数值 |
| ResponseMeter | `label`、有限 `value/min/max`；范围必须覆盖值，不计算概率；含零尺度从零向正负两侧绘条，保留原生 meter 语义；默认在上方显示“尺度：min 至 max”，同尺度成组使用时统一在组上方标一次，各条传 `showScale={false}` |
| FlowConnector | 无障碍文本 `label`、可选可见标签 `children`、data/control/gradient/reference 的 `kind`、right/down/left 的 `direction`；复杂网络使用 DiagramFlow |
| SemanticMark | frozen/trainable/reference 的 `state` 与文字；不等同 focus |

每个 TSX 导入 `visual-parts.css`；从入口导入 `shared/foundation/styles/kit.css`。不要另带 Gallery CSS 修外观。

竖向连接使用 `direction="down"`，组件直接绘制竖向 SVG 并为标签留出 8px 间距，箭头线宽 1.5px。图形标签复用 `--rk-type-diagram-label`（15px），输入与输出数学符号统一使用 `.rk-diagram-symbol` 和 `--rk-type-diagram-symbol`（18px、正体数学字体）；下标用 `<sub>`，不依赖 Unicode 小号字形。连接件可传数学内容为 `children`，`label` 继续提供无障碍文本。不要把横向 SVG 旋转成竖向，以免视觉边界越过布局盒并碰到标签。

聚合柱、向量柱、得分条与响应条共享 `kit.css` 中的 `--rk-data-positive-fill/line`（浅绿填充、绿描边）和 `--rk-data-negative-fill/line`（浅橙填充、暖橙描边）。零线方向和带符号数值同时保留；聚合采用无外框、无整块底色的开放柱形图，active 状态强调底部基线。全局主题可覆盖这四个变量，不需要页面 override 或独立样式文件。

```sh
python tools/paper.py scaffold-kit <paper-id> --select SampleToken,RepresentationVector,ResponseMeter --allow-unapproved --dry-run
python tools/paper.py scaffold-kit <paper-id> --select SampleToken,RepresentationVector,ResponseMeter --allow-unapproved
```

单独复制这些图元时，使用上方 `--select` 命令和精确依赖闭包。需要一个完整的非分类计算组合时，使用 Gallery 实际运行的 `vector-retrieval` 交付单元：

```sh
python tools/paper.py scaffold-kit <paper-id> --example vector-retrieval --allow-unapproved --dry-run
python tools/paper.py scaffold-kit <paper-id> --example vector-retrieval --allow-unapproved
```

它把同一份 TSX、独立场景 CSS、入口文件、README 和 `SampleToken`、`RepresentationVector`、`ResponseMeter` 依赖一起复制到 `src/shared/examples/vector-retrieval/` 与 `src/shared/foundation/`。在 App 入口导入 Kit 样式，再从 `./shared/examples/vector-retrieval` 导入 `RetrievalExample`。包 README 列出查询向量、候选向量、标签和分数定义的替换位置。样例仅演示合成向量的原始内积与最大值选择，不归一化，也不表示分类概率或论文结果。

另有 PartsSpecimen：需要全部七种小件与 MiniNetworkGlyph，其 CSS 是展厅材质样张布局，并非交付单元。七件分别使用各自 Registry 源码和复制闭包；三个密度的网络分别使用 Glyph 的 compact / standard / inspect。
