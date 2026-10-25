# Visual Parts · candidate

这些小件负责绘图，不拥有论文计算或数据来源。先从 W2/W4 确认要表达的对象，再查询 registry.yaml 的 `use_when` / `avoid_when`。API 和最小用法在 Registry 与 Gallery 详情中，源码为 `foundation/visual-parts/`。

| 小件 | 输入与边界 |
| --- | --- |
| SampleToken | `sampleId`、`label`、`children` 或 `[0,1]` 的 `pixels` 与 `columns`；没有默认数据集 |
| FeatureBlocks | `label`、1–7 的示意 `depth`、`active`；不是实际通道计数 |
| FeatureAggregation | `label`、`active`；不预设池化运算 |
| RepresentationVector | 有限 `values`、`label`、可选正 `extent`；默认按最大绝对值自适应，保留符号和数值 |
| ResponseMeter | `label`、有限 `value/min/max`；范围必须覆盖值，不计算概率；含零尺度从零向正负两侧绘条，保留原生 meter 语义；默认在上方显示“尺度：min 至 max”，同尺度成组使用时统一在组上方标一次，各条传 `showScale={false}` |
| FlowConnector | `label`、data/control/gradient/reference 的 `kind`、right/down/left 的 `direction`；复杂网络使用 DiagramFlow |
| SemanticMark | frozen/trainable/reference 的 `state` 与文字；不等同 focus |

每个 TSX 导入 `visual-parts.css`；从入口导入 `shared/foundation/styles/kit.css`。不要另带 Gallery CSS 修外观。

聚合柱、向量柱、得分条与响应条统一使用 `--rk-accent` 实色填充。正负值通过相对零线的方向和带符号数值区分；聚合的 active 状态强调外框，柱体不另换颜色。

```sh
python tools/paper.py scaffold-kit <paper-id> --select SampleToken,RepresentationVector,ResponseMeter --allow-unapproved --dry-run
python tools/paper.py scaffold-kit <paper-id> --select SampleToken,RepresentationVector,ResponseMeter --allow-unapproved
```

查看新场景：`demo/src/examples/RetrievalExample.tsx` 与 `retrieval-example.css`。这是合成向量的原始内积检索，查询、候选、最大值归场景所有；它不使用分类输出头。将这两个文件复制到使用方的 src 中，把 `../../../foundation/` 全部替换成 `./shared/foundation/`。同时选择 `EditorialTypography` 以使用图文排版语言。渲染 `<RetrievalExample />` 即可运行；隔离复制检查实际编译并操作此源码。

另有 PartsSpecimen：需要全部七种小件与 MiniNetworkGlyph，其 CSS 是样张布局；三个密度的网络分别使用 Glyph 的 compact / standard / inspect，无内部 override。
