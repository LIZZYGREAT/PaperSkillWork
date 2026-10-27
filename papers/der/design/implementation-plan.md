# Implementation Plan: Dark Experience for General Continual Learning: a Strong, Simple Baseline

Paper ID: `der`

## Learning Goal and Non-goals

本稿是用户确认方向后的 W5 实现计划。依据已确认 W4 的 S1–S8，把“问题为何引出机制”翻译为可观察的图文关系，再决定哪里需要交互。读者应从有限 ER 的不足，走到概率/KL、logits、在线记忆、增强和标签监督，并最终沿同一组状态重建 DER / DER++。

本轮只改设计文档与 CLI 阶段状态；不写 React/CSS、不复制 Kit、不运行 DER 网页、Import 或 Preflight。个人笔记不作为事实来源，17 项原图表保持 REFERENCE_ONLY。I24–I26 不实施；I21–I23 留在主线外，I12–I20 采用紧凑放置。行间数学使用独立的两组 `$$`，加粗结束标记后留空格。

## Design Handoff, Invariants, and Change Scope

- Design confirmation: CONFIRMED（2026-10-27）。用户选择“采用推荐方向”和“采用 S1–S3（推荐）”；确认 S3 两段计算、S4 选留/训练分段、S7 独立工作台及展开区可复算小模型，首切片为 S1–S3 / I01–I05。
- Rendered-page acceptance: PENDING。本轮没有新的网页或效果图验收。
- W5 CLI structural completion: IN_PROGRESS，由 `paper.yaml` 独立记录，不能据提案结构检查通过代替设计确认。
- 基准：第一轮起点为 `381d369ae7d12d3530bfd527179214a2eb141df1`；确认后定稿从 `19cdc5b` 继续，分支 `der`，工作区干净。
- 已确认边界：W2 决定真实先读后写顺序；W3 决定事实与素材边界；W4 决定 S1–S8 顺序、数学首讲、CORE 及独立贯通任务。本稿不修改三者。
- 保护对象：同一输入 x 与标签 y；更新前生成并冻结的历史 z；唯一可训练网络 θ；固定容量 K、持久记忆 M 和计数 N。禁止用两个网络图暗示常驻 Teacher/Student。
- 可直接调整：局部留白、轴线、字级、图注换行和图文比例；不能借排版删掉关键数学、对象或状态分支。
- 受影响范围：DER 后续页面的局部布局与数据计算；不改 Kit、其他论文或上游工程。

### 页面组织与阅读节奏（已确认方向）

以下 U 编号是本轮确定的阅读单元，非新增工作流/页面 schema。唯一结构化覆盖仍是下方 implementation YAML。七个单元来自内容关系，不是章节或交互数量指标。

| 阅读单元 / W4 主讲范围 | 正文的任务与进入条件 | 图形/公式的任务 | 交互/动画的任务与边界 | 读完留下的问题 |
| --- | --- | --- | --- | --- |
| U1 为什么留旧数据还不够 / S1 I01 → S2 I02 | 从流式分类和有限空间引出 ER，再质疑硬标签记录了多少旧行为 | 上半以数据流和少量留存图作开放式对照；下半固定同一 x、y，并排看整组响应 | 以静态图文为主；不加“任务切换”按钮，不强制播放开场动画 | 已决定记录整组响应，怎样衡量偏离？ |
| U2 概率怎样成为约束 / S3 I03 | 接住旧概率 p 与当前 q，解释为何需要 KL | 两类概率、逐项 p·log(p/q)、和与 q−p 的方向同步对应 | 切换 W4 E01 的三个 q，检验“同样判猫”仍有不同偏离；不任意拖动所有坐标 | 概率方案已可行，为什么还看原始分数？ |
| U3 为什么留下 logits / S3 I04、I05 | 先比较匹配空间，再解决旧目标何时产生 | 三维对齐、偏差平方和、共同平移反例；之后用短时间轴展示不同训练步的 z | 在 W4 E02 的两种 a 间切换；快照只显示冻结数值，不建旧教师网络 | 记录内容已定，但容量有限，哪些记录能留下？ |
| U4 让有限记忆持续工作 / S4 I06、I07 | 先解释选留，再把旧记忆接入 DER 一步 | 固定槽位的 reservoir，随后用更紧凑的读→损失→更新→写演示闭合两项目标 | 两个局部任务分开操作；选择合法 j 验证替换/拒收，然后看一次训练顺序 | 同一原图回放时像素视图是否仍相同？ |
| U5 稳定复现，还要复现正确 / S5 I08 → S6 I09 | 先恢复增强，再质疑冻结目标的正确性；两段间明确写出因果转折 | 同一原图的 A0/A1 视图共指 z；再展示错误历史 z 与真实 y 的不同监督 | 增强用并排对照；DER/DER++ 模式变化只显露额外标签路径及第二采样，不增加模型 | 部件都学过，空池开始怎样连续运行？ |
| U6 一份记忆，四轮学习 / S7 I10 | 不重教局部概念，沿一条状态轨迹核查交接 | 独立系统场景：唯一当前网络、两个记忆槽、候选、联合损失和跨轮状态 | 回退/前进/本轮重播；DER++ 为模式分支；预测是独立只读分支 | 能运行不等于有效，哪些结果能支持它？ |
| U7 用实验回答效果问题 / S8 I11 | 先限定协议再看数值，回收“DER++ 是否必胜” | 条件齐全的精炼对比和反例；完整数据在证据详情 | 首版用静态条件表和可展开来源；不建跨协议排行榜或无必要的大筛选台 | 收束适用范围与未保证的性质 |

U1 的入口可有大标题，其余以问题句和留白分组，避免每节重复大封面。U2/U3 的计算区紧邻解释；U4 的槽位居中，U5 使用宽度较轻的对照，U6 才使用独立完整工作台，U7 回到证据型排版。不以同尺寸卡片包住所有段落。

#### 普通单元的表达落地：U1、U5、U7

U1 开头以一条自然的数据流和只能留存少量记录的容器建立对象关系，正文直接问“旧数据已经过去，参数却还在变，如何复习旧判断？”有限 ER 是顺着这个问题给出的第一个方案，图中不出现任务边界开关。下半沿同一原图 x2、同一真实 y 对照“类别答案”和“整组响应”：硬标签处只写真实类别，响应处保留所有类别坐标，不能把非标签类别画成没有梯度。

为了让“类别仍正确，历史响应却未被保留”可直接核算，U1 增加一个独立教学配对：真实类别为猫，旧分数 (2,1,0)，假设的另一组当前分数 (2,0,1)，坐标均为猫、狗、狐狸。两组都将猫排第一，猫的 softmax 概率相同、标签 CE 相同，狗/狐狸偏好却互换。这是从 W4 硬标签不足问题补充的合成比较，不是论文实测或 U3 的训练结果；它只回答 C11，不新增训练机制。完整向量并排静态呈现，计算可在 W6 复用同一 softmax 函数，例子不需要交互。U1 收束文案为“少量旧图能让模型复习类别；如果还想保护当时的整组判断，就需要保存输出。怎样衡量两次判断有多不一样？”随后进入 U2。

U5 的前半使用同一原图 x2 和两种训练视图的并排图：左侧注明生成历史 z 时使用的 A0(x2)，右侧注明回放使用的 A1(x2)；两条路径指向同一个冻结目标，而不是两份可更新目标。原图身份始终显示，视图只附变换标记。图片可用自写矢量图形说明裁剪/翻转，不能使用未获复用许可的论文或笔记图片，也不能将矢量示意称为真实训练图。图下保留实际匹配公式，I17 的均值—方差推导在邻近 details 展开；主线已经解释“多个视图共用一个 z”为什么鼓励一致，不依赖展开才懂。

U5 前后两段之间明确写出“但更稳定地复现旧输出，不等于旧输出就是正确的”。后半原样采用 E04：猫图的 z=(0.5,2,0) 将狗排第一，y 仍是猫。静态对比先建立旧行为与真实类别的不同要求，再以 DER/DER++ 切换显露第二次历史采样、标签 CE、β 权重和记录中的 y。模式切换只重建本地示例，所有损失仍指向同一网络；不暗示必定立即纠错。读者只需一个模式控件，α/β 不做大型调参台；I18 用短段解释权衡。结尾交接为“目标与记忆都已有了，接下来从空池开始检查它们是否真的按同一个顺序运行”。

U7 以“这套运行规则是否在有限记忆下保住了分类能力？”进入。第一组固定 S-CIFAR-10 Class-IL、K=500、非预训练 ResNet18、50 epochs/task、最终平均准确率和 Table 2 十次运行，报告 ER/DER/DER++ 的 57.74±0.27 / 70.51±1.67 / 72.70±1.36（R01）。条件紧挨数值，不用大排名遮住实验协议。第二组是 MNIST-360、K=500、2×100 ReLU MLP、每图一次、整流结束评测，报告 65.04±1.53 / 69.11±1.66 / 69.62±1.59（R04、C08）。两组分开展示，不能横向混作同一指标。

反例留在正文而非只放详情：S-CIFAR-10 Task-IL、K=500 的 DER 93.40±0.39 低于 ER 93.61±0.27；MNIST-360、K=200 的 DER 55.22±1.67 高于 DER++ 54.16±3.02（R02、R05）。由此回答 U5 的“加标签是否必胜”，并解释 Task-IL 测试任务身份例外。I20 只用短段讲平坦性/校准是经验分析，完整定义与补充表归 I22/I23；± 保持原样，不补统计名称。结果正文静态可读，证据定位原位展开；不为了筛选而复制英文 BenchmarkExplorer。结尾回收有限记忆、类别遗漏和历史错误的局限，收束整篇而非再引入新机制。

### 共同视觉母题与对象身份

沿用 Kit 的暖白画布、深色正文、弱分隔线及绿/暖橙数据语言。颜色不同时承担样本 ID、类别、梯度正负三种含义：样本由 x1/x2、缩略图和文字识别，冻结由锁定文字与边线识别，可训练由 θ 标签识别，正负数才用 Kit 对应数据填充。当前焦点另有描边，不等同于冻结或可训练。

x2 是 S2–S7 的追踪锚：S2 看它的类别与整组响应，S3 确定历史目标表示，S4 看候选选留，S5 看增强视图，S6 看标签职责，S7 看其真实入池和回放生命周期。S3 的概率与三维 logits 小例子分别来自 E01/E02，必须标作不同计算示例，不能伪称它们是同一次前向结果。S7 的 x2 不强行套用局部向量；若需要数值，由完整教学模型计算并明示数据来源。

| 对象 | 稳定身份 / 归属 | 可变化的量 | 不允许的视觉暗示 |
| --- | --- | --- | --- |
| x、y | 原图 ID 与真实类别，随记录保留 | A(x) 的视图可变 | 增强后当作另一条原始样本，或 y 变成网络输入 |
| z | 对应样本及生成步号，冻结到记录退出 | 无；整条被替换后退出 M | z 随 θ 更新或被当前网络覆盖 |
| θ | 一个当前模型容器 | 联合损失更新参数 | 三条损失各自拥有一台模型 |
| M、K、N | 槽位容器、固定容量、已处理项数 | 槽内记录替换；N 每处理项递增 | 每轮重新清池，或 N 是任务编号 |
| Rd、Ry | 本步从旧 M 读取的临时样本组 | 每步可抽不同记录、可重叠 | 必须相同、互斥，或本步新写入立刻参与本步回放 |

### Upstream Delivery Compatibility (W5)

`python tools/paper.py paths der --json` 已执行，退出 0。解析目标为 `C:\Users\lenovo\Desktop\Projects\PaperWork\PaperSkillWork\papers\der\web\enhanced`，无 Final 覆盖。后续复制目的地为该目录的 `src/shared/`；本轮没有复制。

已读真实入口：`index.html`→`src/main.tsx`→`App.tsx`，React 18 + TypeScript + Vite 6；`src/data/tutorial.ts` 当前只有空 chapters，`src/modules/registry.tsx` 为空，`TutorialData.meta` 可表达 titleEn/titleZh，现有页面按 componentId 选模块。这些是待 W6 填充的脚手架状态，不是假定已有教程。W6 需提供真实题名/模块注册，保留入口，按实际教学内容扩展局部布局，不借元数据修改 W4。

`vite.config.ts` 的 `base: './'` 支持相对子路径产物；新增本地资源须通过相对模块导入或 Vite base 解析，禁止硬编码 `/images/`。不新增外部服务、CDN、远程字体或训练服务；原生 MathML/Kit 类型声明是数学排版候选，不必增加运行时数学依赖。S7 教学数值若采用小模型，浏览器本地计算，不加载真实论文模型权重。

相邻 PaperSkill 检出 HEAD 为 `c6d30defb90480afb2b4fa6ee8083a27d8dafb5c`，工作树干净，upstream 指向官方 `ReductTech/PaperSkill`。已读 `scripts/import-paper.js`、`scripts/validate-repository.js`、`paper-skill/scripts/validate-output.js` 与本地 contract；未同步远端，因此不能称其为当前官方版本的兼容证明。本轮不运行 Import/Preflight。

已证实的接收关系：本地 `validate-repository.js` 会调用 `validate-output.js`，后者确实检查 `tutorial.ts` 的 kind 数量及 componentId 注册，并非所有生成器约定都只停留在文档。该本地版本读取 contract 的 6–10 chapters、至少 4 modules、至少 1 个双 module chapter；它没有据此强制八阶段一页一章或每章交互。候选七单元与 U4 的两个真实教学任务在完整内容阶段可以自然适配，不能为了数字新增假模块。首切片只有 U1–U3，届时可能出现真实阶段不足的校验失败/提示，要如实分别记录，不篡改数据凑满；W8 再核对完整内容。

未发现要求改变 W4 的确定硬冲突。待 W6 前核实最新官方脚本及配置；若该版本对自定义页面出现实际硬冲突，把命令、失败项和取舍记在本节再决策。`paper.json` 由 W10 的官方 Import 根据用户信息生成，本轮不编造；网页 meta 和 componentId 则由 W6 实际内容填充。MD 的 `$$` 是本设计文档格式，网页拟用 MathML，二者不能混称。

### Reusable Asset Composition Notes (W5 free text)

已检查 Registry、对应 Recipe、实际 TSX/CSS/Hook。以下是设计可行性选型，不是复制记录或批准记录。所有资产仍为 candidate；下面三组 dry-run 均退出 0，目标中仍无 `src/shared/`。公开 DER 页面未创建。

| Registry ID / 使用决定 | 具体用途 / 场景责任 | 实际尺寸或 API 约束 / 预计占用 | Recipe / 内部样式边界 |
| --- | --- | --- | --- |
| SampleToken / 选用 | U1/U3–U6 的稳定原图 ID；图像内容由 DER 提供 | 默认图块 76px、min-height 76px；含图注拟留 96–128px 宽 | visual-parts；原生 children/pixels API，无内部样式改动 |
| RepresentationVector / 选用 | U3 分数与 U4/U6 的 z 详情；不替代逐类计算表 | 每坐标 min-width 34px，正/负区各 44px；三维拟留 140–220px，显式 extent=3 用于 E02 | visual-parts；坐标名/对齐由局部场景负责，不把 z 标成特征向量 |
| ResponseMeter / 选用 | U2 的概率条；明确 min=0、max=1 | 轨道 min-width 48px、高 8px，另有标签和值；每组拟留 200–300px，统一在组上标尺度 | visual-parts；只传计算值，不把组件当 softmax 计算器 |
| MathTypography / 选用 | U2/U3 和后续损失公式的 MathML JSX 类型 | 实际是 d.ts 与 Kit 样式，无独立交互或 DOM 组件；公式宽度随正文 | typography-formula；W6 核对 tsconfig include，不加运行时数学库 |
| FigureFrame / 选用 | 只包真实教学主图，提供标题/图注/当前步 | 无固定尺寸，主图按单元决定；不把全部自然段卡片化 | typography/editorial 语义 + 实际 source；不改内部样式 |
| MiniNetworkGlyph / 后续选用 | U6 表达唯一当前网络；若数值层采用线性教学网络，拓扑为 2→3 | compact max-width 232px、standard 360px、inspect 560px；viewBox 宽 320、高至少184；U6 拟用 220–232px | mini-network-glyph；不沿用示例 Teacher/Student 或 3–5–3 假 CNN |
| FlowConnector / 局部选用 | 邻接数据/参照/梯度的明确连接 | 横向 SVG 44×16px，向下 16×40px；标签另占空间；短关系拟留 56–100px | visual-parts；只有 right/down/left，不假定任意曲线端点能力 |
| useAnimationTimeline / 可选播放时选用 | U4/U6 只有拥有者调用一次，驱动揭示，不计算 θ/M | 无固定尺寸；输入稳定 clip 列表；默认暂停；replayClip 只重播当前 clip | animation-timeline；从 state 派生所有视图，单独实现“重播本轮/从头开始”的轨迹定位 |

S3 组合由 DER 本地负责 p/q 和 softmax/KL/L2 计算、固定类别坐标、逐项代入、解释与例子切换；Kit 只画输入/数值并提供数学类型和图框。S4 的槽位、读写锁、候选托盘、整数抽签及消息由 DER 本地负责。S7 的唯一执行函数、操作轨迹、参数/记录身份和整体布线均属论文局部；不把组件代码改成 DER 算法引擎。

真实命令（均从仓库根执行）：

```text
python tools/paper.py scaffold-kit der --select SampleToken,RepresentationVector,ResponseMeter,MathTypography,FigureFrame --allow-unapproved --dry-run
python tools/paper.py scaffold-kit der --select MiniNetworkGlyph,FlowConnector,useAnimationTimeline --allow-unapproved --dry-run
python tools/paper.py scaffold-kit der --select FormulaBlock,StickySystemView,EvidenceViewer,BenchmarkExplorer --allow-unapproved --dry-run
```

三次均解析到上节 publish_source，复制目的地是其 `src/shared/`。首两组是拟选的 8 项资产，共用依赖去重后实际闭包如下（相对于 `src/shared/`，共12文件）：

```text
compositions/figure-frame/FigureFrame.tsx
foundation/math/mathml-jsx.d.ts
foundation/styles/kit.css
foundation/visual-parts/SampleToken.tsx
foundation/visual-parts/RepresentationVector.tsx
foundation/visual-parts/ResponseMeter.tsx
foundation/visual-parts/FlowConnector.tsx
foundation/visual-parts/visual-parts.css
foundation/neural-network/MiniNetworkGlyph.tsx
foundation/neural-network/mini-network-glyph.css
foundation/animation/useAnimationTimeline.ts
foundation/accessibility/useReducedMotion.ts
```

W6 只需第一组首切片部件，待方案确认后才执行相同 `--select` 命令去掉 `--dry-run`；第二组等 U4/U6 真正开工时按需要追加。入口只引一次 `shared/foundation/styles/kit.css`，图元和 Glyph 自带各自 CSS 导入；MathML d.ts 需要被 tsconfig 读取。所有场景 CSS 留在 DER 本地，不复制 Gallery 样式。当前没有必须修改 Kit 内部样式的证据；适配分类为局部布局与教学数据/语义，不是共享缺陷修复。

第三组是对照候选，不实施复制：FormulaBlock 会带 FormulaTerm/MathTypography；BenchmarkExplorer 会带 SegmentedControl；四者合计闭包为 7 文件（controls/SegmentedControl.tsx、layout/StickySystemView.tsx、math/mathml-jsx.d.ts、styles/kit.css、optional/benchmark-explorer/BenchmarkExplorer.tsx、optional/evidence-viewer/EvidenceViewer.tsx、optional/formula/FormulaBlock.tsx，前三类均位于 foundation/）。FormulaBlock 的符号交互非当前主任务，静态 MathML 更直接；StickySystemView 使用滚动阅读线与手动覆盖，可能和 U6 显式训练步竞争，故先不用；EvidenceViewer/BenchmarkExplorer 的源码有硬编码英文 UI 且 U7 暂无需大筛选，先采用本地中文协议表和原位详情。

`shared-input-models` 及 `vector-retrieval` 已看 README/Recipe 的职责，不选整个 example：前者是两个独立模型，后者是内积检索，都不符合本篇训练语义。FlowConnector 不足以连接复杂图时只拒绝那段布线复用，不因此引入整套旧论文系统。没有复制 Gallery 场景文件，也没有跨论文 runtime import。

Gallery 实际查看状态：尝试启动现有 Demo 并通过浏览器打开 `http://127.0.0.1:5187/?demo=gallery#gallery-parts`，Vite 已就绪，但浏览器两次连接均超时，未取得可复核的部件画面。此项为 NOT_RUN，不称视觉通过；预览服务已关闭。当前尺寸结论依据上方真实 CSS/API，W6 必须在实际切片复核。此限制不影响本轮文档覆盖、计算和 dry-run 证据。

### Critical Teaching and Integration Scenes

以下三个场景的结构与交互方向已获用户确认，网页实现及渲染验收仍未进行。线框里的箭头标注数据、读取、梯度或时间关系；不是可直接执行的算法代码。普通图文按上方职责实施，不要求逐帧稿。

#### A / S3：从一个可行的概率约束，走到 logits 的选择

推荐两个连续阅读单元，各有一个计算焦点。U2 的左侧约 1/3 宽度负责“同判猫为何仍有差异”的引导与结论，右侧约 2/3 是两类概率和代入计算。U3 恢复开放式横向排版，以旧/新两行、类别三列对齐分数，下方对齐差值与平方项。比例是桌面构图起点，不是固定像素锁死，也不是两组同模板控制台。

```text
U2  已有：同一输入，固定旧概率 p               正文约 1/3 | 计算区约 2/3
    为什么同判猫仍不一样？                    p：猫 .8  / 狗 .2   [固定]
    当前 q 的概率分配变了                     q：猫 .6  / 狗 .4   [切换例子]
    ↓ 引出 KL                                两项 p·log(p/q) 对齐 → 总和
    KL 的意义与优化方向                       q−p：(-.2,+.2)；回到当前输出

    交接：概率约束已经可行；原始分数能否直接比较？

U3  旧 z [冻结]          2       1       0      类别坐标固定
    当前 a              1       2       0      [交换例 / 共同平移例]
    a−z                -1      +1       0
    (a−z)²              1       1       0      → 和 2
    共同平移例          概率未变，KL=0；平方和=3

    收束后才展示：本步更新前 θ → 产生 z → 冻结数值 → 候选 (x,z)
    交接给 S4：知道记录什么，但不是每条都能在有限空间中留下。
```

固定数据按 W4 E01/E02 原样使用。U2 旧 p=(0.8,0.2)，当前 q 可切到 (0.6,0.4)、p 本身或 (0.2,0.8)；只开放这三个有教学意义的例子，不加入自由拖动 p/q 的多变量面板。比较前后，p 始终锁定；读者一次操作改变 q，概率条、逐项值、和、输出梯度与结论从同一 q 计算。E01 的两类概率与 E02 的三维分数是不同算例，切换阅读单元时明示，不能把两者画成同一张图的连续前向。

在 q=(0.6,0.4) 时，两个 KL 项约为 +0.230146 和 −0.138629，总和 0.091516；负项保留符号，不画成两个均非负的“距离块”。q=p 时总和和梯度都为零；反转 q 后总和约 0.831777。梯度箭头只是输出层的下降倾向，不能说 θ 的每个分量直接减去 q−p。

U3 默认 z=(2,1,0)、a=(1,2,0)，切换 a=(3,2,1) 时，两组柱使用相同固定 extent=3，不分别自动缩放。所有分数坐标标明猫/狗/狐狸；差值带正负号，平方项单列，保留“概率仍携带相对偏好”的正文。共同平移例展示同 softmax、不同平方和，不能被解释成 logits 方案普遍更优。RepresentationVector 可画两组向量；类名与逐维对应由本地布局提供，不修改组件内部；若绘图对齐不够清楚，改本地语义表，不强迫图元替代计算表。

数学位置：KL 定义、H(p,q)−H(p) 的含义、q−p、平方和展开、2(a−z) 与平移反例都在正文/主图邻近处；KL 非负的短证与 q−p 的求导放 I14 展开，二阶/Jacobian 放 I21 Advanced details。U3 末尾的快照时间轴用不同步号列出若干 z 数值记录，只有一个当前网络，明确生成早于更新、实际写入晚于更新；reservoir 的取舍规则尚不首讲。

| 有理解风险的时刻 | 输入与真实计算 | 画面与文字对应 | 保护关系与可复算检查 |
| --- | --- | --- | --- |
| KL 换例 | 固定 p，替换 q；逐项计算后求和 | 概率条、代入式、总和、q−p 同步 | q 归一化且正；同类项对齐；KL 三例分别约 .091516/0/.831777 |
| 从概率转向 logits | 明示更换为 E02 三类例子；softmax 由分数重算 | 保留旧/新身份，恢复类别坐标 | 不把两类 p 硬接为三维 z 的概率；不新增教师模型 |
| 共同平移反例 | a=z+(1,1,1)，平方和 3，softmax 相同 | 概率相同和分数偏移同时可见 | 共用尺度；计算全精度，显示可舍入；KL 与 L2 不宣称等价 |
| 留下目标 | 更新前产生 z 的数值副本，θ 后续改变 | z 旁标“冻结/生成步”，当前模型标参数版本 | z 不刷新；只有最终候选是否入池的问题交给 S4 |

这个场景的必要互动是“只改当前判断，检查后果”。主线计算和结论始终可读；不需要自动开场或装饰性数字滚动。已确认采用两个连续计算区，保留概率方案先成立、随后才质疑表示的转折。

#### B / S4：先决定记忆怎样留下，再看它如何参与训练

推荐 U4 内先给一个完整可操作的 reservoir 小图，再给一次紧凑训练闭环。前者的唯一操作是“给本次候选选择合法抽签 j”；后者的唯一操作是“推进本步”。两者共享记录样式和槽位编号，但不共享一个让读者猜测先后的混合控制面板。

```text
上半：此前记录 [v1] [v2]，K=2，N=2        | 本次候选 v3=(x3,z3)
      槽位 0     槽位 1                 | j∈{0,1,2}
      j=0 → 槽 0 替换；j=1 → 槽 1 替换；j=2 → 候选不入池
      结果区：M 的新内容，N=3；候选不入池也不等于没训练。

下半：已存在的 M [只读] ──取 Rd──→ 当前网络 θ ←──当前原图 X
                                             │ 同一组参数前向
                               当前 CE(y,概率) + α·历史平方匹配
                                             │ 一次联合梯度更新
                                            θ+
                                             │ 之后才允许写 M
                                  本步候选 (x,z) → reservoir
```

上半可以把 reservoir 当作刚训练完成后的独立函数检查，标题必须写清候选已参与当前训练；不能把先讲 reservoir 的认知顺序画成“先写 M，再用其训练”。满池示例固定 K=2、N=2 与 W4 E03，直接列三个合法 j；这是穷举反事实，不标作真实抽签。N<K 分支的进入态另有短选例，展示无需抽签的追加。真正的随机运行只作为后续可选检查模式，必须显示 seed/实际 j；W6 不实施此场景。

下半的输入来自写入前 M，候选始终停在池外托盘，直到 θ 完成一次更新后才进入上半的选留过程。临时区显示 Rd、当前 Z、Zsave 和两项损失；持久区只显示 θ、M、N，K 是只读配置。对齐线只能从被读取的旧槽位连向回放路径，当前候选不得通过本步 reservoir 反向进入该路径。需要说明回放损失时可复用 E02 的已学平方和 2，只写 α·2 与 Lcurrent 合成；不捏造 θ 的参数变化量，也不把该局部算例说成 E03 的真实训练数值。

| W2 操作 / 场景时刻 | 进入状态 | 计算/触发与离开状态 | 画面动作、文字/公式 | 不变量与复核 |
| --- | --- | --- | --- | --- |
| 读旧记忆 | θ、旧 M、N；候选在池外 | sample(M) 得 Rd；M/N 不变 | 被抽槽位强调，副本进入回放路径 | 当前候选不可在 Rd；“读”无写入 |
| 前向与冻结候选 | 所有路径仍用原 θ | 当前 Z 复制为 Zsave，历史 z 作常量 | z 的冻结标记在当前更新之前出现 | 前向不改 θ；旧 z 不变 |
| 合成与更新 | Lcurrent、Ldark 已计算 | L=Lcurrent+αLdark；一次 θ→θ+ | 两项先合成；一条梯度路径回到唯一模型 | 只加一次更新计数；尚未写 M/N |
| reservoir 处理 | θ+，旧 M、N，候选 | 追加/替换/拒收后 N+1 | 才解锁 j 和槽位写入，原图与 z 同进同出 | K 固定；拒收也加 N；已更新 θ 不撤销 |

可复用 SampleToken、RepresentationVector 与局部 FlowConnector；槽位、候选托盘、j 的解释和阶段写入锁由 DER 本地负责。全图多端点路径不能硬用横向/竖向小连接件绕线；需要时用本地 SVG 端点映射，显式区分 data/reference/gradient/control。已确认保留上半抽签、下半训练的双段说明，不将概率证明、样本抽签、梯度计算同时挤入主图。

#### C / S7：在独立整体场景中看四轮连续学习

先从 W2 确立唯一执行轨迹，再设计画面。统一状态输入为 θ、M、N；记录包含原图 ID、冻结 logits、生成参数版本以及 DER++ 标签。每步依次为旧 M 采样→增强→当前和回放前向→联合损失→一次参数更新→逐条 reservoir→下一轮。完整预测只读当前 θ，不能经过训练损失或 M。

推荐“中间唯一网络，左侧输入/记忆，右侧本步计算，底部跨轮时间线”的稳定整体构图。比较过“把前面局部模块顺次拼接”的方案：它重复第一次讲解，且看不到本轮读的记录为何下一轮消失，所以不采用；也不采用全页固定大侧栏，把正文压成窄缝。

```text
本步进入：第 i 轮        θ_(i−1) / N / K       模式 DER 或 DER++ [重置后切换]
┌──────────────┐      ┌─────────────────┐       ┌────────────────────┐
│ 当前原图 xi   │ ───→ │ 唯一当前网络 θ  │ ────→ │ 当前 Z / Zsave     │
│ 标签 yi→CE    │      │ 所有路径共享参数│       │ Lcurrent(yi,概率)  │
│ 候选托盘 vi   │      │                 │       │                    │
├──────────────┤      │ 本步只更新一次  │       │ Ldark + α          │
│ 记忆 M       │ ─取→ │                 │ ────→ │ Llabel + β [++]    │
│ 槽 0 / 槽 1 │ Rd,Ry└─────────────────┘       │ 合成 L / 梯度详情 │
└──────────────┘            ↑ 联合梯度             └────────────────────┘
      ↑ 参数更新后才写       └──────────────────────────────┘
      └────── 候选记录 / j / 替换或拒收 ──────────────────────

底部：第1轮 空池 ─ 第2轮 回放 ─ 第3轮 替换 ─ 第4轮 拒收 ─ 只读预测
当前说明紧邻主图下沿；上一语义步 / 下一语义步 / 本轮重播 / 展开状态检查
```

线框表达布局与归属，不赋予所有箭头相同语义。原图 x 才进入网络，y 从样本归属区旁路直达 CE，不能沿图中原图箭头一起进入模型；历史标签同理。实际图中，数据为实线，历史目标为带“固定 z”的参照线，梯度为反向虚线，写 M 为更新结束后才激活的独立路径。屏幕较宽时图面使用可用宽度但限制对象间距；1440×900 起点约 1200px 内容宽，左列 220px、中列 240px、右列 300px，其余留给连接和边距。主图与控制优先可见，完整数值检查放其后原位展开，不能靠缩小字号塞满视口。1920×1080 保持同一局部关系，允许增大留白，不把关系拉散到屏幕四角。实际值由 W6/W8 渲染再调整。

唯一计算源拟为 DER 本地纯函数 `trainStep(state,batch,choices)` 产生的不可变操作轨迹。它承担真实教学计算；时间线只决定揭示哪一项结果，不能另算一份损失或另维护副本 M。选择预设教学轨迹时显式记录 Rd/Ry 与 j，回退恢复已有轨迹快照，不再抽签或训练一次。进入预测只计算查询输出，θ/M/N 保持逐值一致。更换 DER/DER++ 模式会从 θ0 重建整条轨迹，禁止在 θ3 上偷偷补标签路径后沿用旧结果。

数值分两层：默认主图明确 θ 的版本、记录身份、损失来源与 reservoir 的 E03 决策，不伪造 ResNet 的实测参数；展开计算若需要给出真实 θ 数值，推荐采用清楚定义的三类小型线性分类器 h_W(u)=Wu，用固定二维合成输入和解析 CE/L2 梯度逐轮重算。u 是教学图片标记的合成特征，不声称来自论文 CNN；S7 中第一次引入其简化计算须在旁注明。此举是实现方式提案，不改 E03 的四轮读写语义，不与 S3 的独立 E01/E02 向量冒充同一训练轨迹。小模型的固定输入、初值、学习率和结果需在定稿时明确并验证；未确认前不提交手设 θ 或三组互不一致的 logits。

| W2 操作 / 高风险时刻 | 进入状态 / 计算 | 离开状态与图文同步 | 必须固定 / 可复算断言 |
| --- | --- | --- | --- |
| 初始化与空池首轮 | θ0、M=[]、N=0；无历史样本 | 历史支路不可用，当前 CE 正常；保存更新前 z1 候选 | 首轮不调用空池 sample；空池补全标注 M01 |
| 旧记忆读取 | 第2轮进入 θ1、M=[v1]、N=1 | Rd=v1；DER++ 的 Ry 也只能是 v1，允许重叠；M 只读 | 当前 v2 尚未入池；两次调用身份可核对 |
| 前向、损失与一次更新 | 参数仍为本步进入版本；z 候选已固定 | 损失求和后一次 θ 更新，M/N 仍保持进入值 | 旧 z 不反传、不刷新；更新前 Zsave 与写入 z 逐值相同 |
| 第3轮先用再换 | 旧池 [v1,v2]，示例 Rd=v1、Ry=v2 | 更新 θ2→θ3 后 j=0，池变 [v3,v2]，N=3 | v1 可用于本步训练，之后才失去未来回放资格 |
| 第4轮未入池仍训练 | θ3、池 [v3,v2]；Rd=v2、Ry=v3 | 完成 θ3→θ4 后 j=3 拒收 v4；池不变，N=4 | 不撤销当前 CE/梯度；不是“未训练 x4” |
| 跨轮交接 / 回退重播 | 本轮最终 θ/M/N 和不可变轨迹 | 下一轮直接读取终态；回退只改变查看位置 | snapshot[i].exit 等于 snapshot[i+1].entry；重播不二次更新 |
| 只读预测 | 当前 θ4 与查询输入 | 只走评测前向及 argmax，不连接损失与池槽 | 预测前后 θ/M/N 深比较相同；测试预处理不冒用随机训练增强 |

操作默认暂停，读者按语义步前进/后退；“本轮重播”只重现同一轨迹，另有“从第1轮重新开始”。若加可选连续播放，只在拥有者使用一次 useAnimationTimeline，关键损失/更新/入池的结果需可停留观察；reduced motion 下保留相同语义步与手动导航。滚动只能改变阅读位置，不能触发训练步骤；不同时引入 StickySystemView 的滚动时钟。

到 U6 前，U5 已说明稳定性与正确性，入口只恢复三项损失的来源；离开时交给 U7 的问题是“这套机制在对应协议中效果如何”。模型/记忆/查询的所有者在全过程保持不变。已确认采用稳定整体工作台、手动主导的四轮演练及可展开小模型数值计算；具体计算设定在下方固定，网页阶段不得另手设一份不一致的训练输出。

## Visual QA State Plan

本轮无新页面，DER 浏览器验收 NOT_RUN。以下均是后续观测计划，未填写 PASS。首切片只检查 U1–U3，其余状态随实际实现进入对应阶段。每一代表态在普通桌面 1440×900 与全屏布局模拟 1920×1080 观察；真实 F11 另记实际尺寸和结果，不能由模拟替代。无移动专项触发，不运行 Kit 全量回归。

| 单元 / 受影响状态 | 两种桌面布局都需观察的内容 | 语义/几何断言与保留信息 |
| --- | --- | --- |
| U1 入口及响应对照 | 首屏对象、段落密度、从 ER 到软目标的桥接 | y 不充作模型输入；类名和向量对应；无页面横向溢出 |
| U2 初态、q=p、q 反转、返回 | 固定 p、负 KL 单项、和、梯度及键盘选例 | p 不漂移；q 归一化；图/代入/结果同步；不只靠颜色 |
| U3 E02 两种 a、快照结束态 | 共用 extent、完整三列及平方项、冻结标记与生成步 | 换例不自动缩放；softmax/L2 结论可同屏核对；旧模型不常驻 |
| U4 旧池读取、更新后写入、j=2 拒收 | 槽位端点、候选托盘、合成与更新顺序 | 更新前无写；N 与 K 含义不混淆；读写线型清楚 |
| U5 增强/错误历史与 DER++ 路径 | 同一原图身份、两个视图、z/y 的不同职责 | z 不刷新；只新增标签损失和第二采样，不新增模型 |
| U6 空池、第2轮、第3轮写入前后、第4轮拒收、预测、回退 | 全图稳定、局部数值展开、单步/重播及 reduced motion | 对应语义帧断言；控制不遮主图；回退不重复训练；预测不读池 |
| U7 协议比较与反例、证据详情展开 | 条件与数值靠近、±原样、反例不被折叠隐藏 | 不混协议；无超出证据的通用优越声明 |

## Primary Spine Mapping

以下是已确认方向的实现覆盖。S3 虽分两单元，结构化阶段只登记一次；I03 主讲 U2，I04/I05 主讲 U3。S1/S2、S5/S6 分别共用阅读单元，CORE 不重复分配。

```yaml
implementation:
  stages:
    - {id: S1, page: U1-replay-entry, core_items: [I01], evidence_refs: [C01, C11, C16], primary_vehicle: '问题正文与有限回放静态对照', reusable_pattern: null, reason: '先建立旧数据不可完整取得的缺口，再给出有限 ER'}
    - {id: S2, page: U1-replay-entry, core_items: [I02], evidence_refs: [C11, C10, B03], primary_vehicle: '同图同标签与整组响应对照', reusable_pattern: null, reason: '直接承接 ER，并揭示标签没有保存的历史行为'}
    - {id: S3, page: 'U2-probability / U3-logit-memory', core_items: [I03, I04, I05], evidence_refs: [C10, C02, C13, C12, M02, M06, B01, B02, B03, E01, E02], primary_vehicle: '先概率 KL 再 logits 平方匹配的两段可计算对照', reusable_pattern: null, reason: '先验证概率监督可行，再比较表示空间，最后决定目标采集时机'}
    - {id: S4, page: U4-reservoir-and-step, core_items: [I06, I07], evidence_refs: [C06, M03, I01, C02, C04, M04, M06], primary_vehicle: '槽位抽签与单步读写顺序演示', reusable_pattern: null, reason: '记录内容确定后解决在线选留，再闭合基本 DER'}
    - {id: S5, page: U5-consistency-and-correction, core_items: [I08], evidence_refs: [C14, M06], primary_vehicle: '同一原图的两种增强视图与固定目标对照', reusable_pattern: null, reason: '恢复前段暂固定视图的真实训练条件'}
    - {id: S6, page: U5-consistency-and-correction, core_items: [I09], evidence_refs: [C03, C05, C15, E04], primary_vehicle: '错误历史引出标签监督与三损失同网络图', reusable_pattern: null, reason: '从一致但可能错误的目标自然引出 DER++'}
    - {id: S7, page: U6-complete-system, core_items: [I10], evidence_refs: [C04, C05, C06, M01, M02, M03, M04, M05, M06, E03], primary_vehicle: '独立系统级四轮连续执行与只读预测', reusable_pattern: null, reason: '核查空池、回放、更新、写入及跨轮交接，不拼接局部演示'}
    - {id: S8, page: U7-evidence-and-limits, core_items: [I11], evidence_refs: [R01, R02, R04, R05, C07, C08, C09, I01, I02], primary_vehicle: '协议先行的精炼结果对照与反例', reusable_pattern: null, reason: '运行闭环后用实验证据检验效果，不从机制直觉断言优越'}
  assets: []
  supporting:
    - {item: I12, placement: compact-inline}
    - {item: I13, placement: compact-inline}
    - {item: I14, placement: expandable}
    - {item: I15, placement: expandable}
    - {item: I16, placement: compact-inline}
    - {item: I17, placement: expandable}
    - {item: I18, placement: compact-inline}
    - {item: I19, placement: compact-inline}
    - {item: I20, placement: compact-inline}
  reference:
    - {item: I21, placement: Advanced details}
    - {item: I22, placement: Evidence details}
    - {item: I23, placement: Evidence details}
  vertical_slice:
    stages: [S1, S2, S3]
    required_core_items: [I01, I02, I03, I04, I05]
```

`assets: []` 对应 W3 没有选中可公开原图；自写教学图和小例子不是这些 REFERENCE_ONLY 页图的裁剪或描摹。SUPPORTING 保留 W4 原主讲位置，REFERENCE 置于主线之外，DELETE 不进入实现映射。

## Reusable Pattern Library

结构化 `reusable_pattern: null` 表示没有采用一个整套 Kit 交互模式来负责该阶段；上方图元仍可按真实闭包组合，不串写多个 ID。Architecture Explorer/双模型 example 不用于唯一当前网络；Flow Stepper 的抽象循环不替代真实 θ/M/N；StickySystemView 暂不用于手动训练；公式和结果模式均已查源码并记录不采用理由。Term Hover/Reference Hub 后续只负责短定义和外部于主线的 I21–I23，不能承载本该在正文的推理。

## Vertical Slice (W6)

用户已确认 S1–S3，对应 U1–U3，CORE 为 I01–I05。认知闭环为：不能完整保存历史→有限 ER→标签未记录整组响应→概率/KL 可优化→logits 匹配的区别→记录更新前历史 z→引出 S4 的在线留存。S1/S2 合为一个开放图文单元，S3 的两个计算任务各有足够解释空间。

范围已确定，本轮仍只完成 W5。首切片不实施 reservoir、DER++、四轮完整系统或结果页，不用未来占位组件凑验收；下一阶段问题以正文衔接即可。S7 小模型只在本计划固定计算依据，不提前实现为 W6 隐藏组件。之后若改变首切片范围，必须同步覆盖和确认记录，不能静默删 I01。

SUPPORTING 的具体落点：U1 原位短回忆 I12/I13；U2 的 I14 紧邻梯度结论可展开；U4 的 I15 概率归纳可展开、I16 iCaRL 比较一短段；U5 的 I17 增强均值/方差推导可展开、I18 权衡系数紧邻三项损失；U6 的 I19 原文消歧作为算法旁说明；U7 的 I20 分析含义一短段。I21–I23 在主线之后的参考/证据区，主线对必要结论本身不依赖点开；I24–I26 排除。

本轮没有 W6 执行结果：UPSTREAM_SYNTAX、UPSTREAM_OUTPUT、SOURCE_BUILD、SUBPATH_ASSETS 均为 NOT_RUN（设计阶段尚无本轮页面实现，不调用这些源码质量检查）。真正 W6 执行时，按同一实际 publish_source 分别记录命令/退出码、官方脚本版本、构建与浏览器状态；不以本次 W5 覆盖检查替代。

### Vertical Slice Review (W7)

Vertical Slice Review: PENDING

本轮尚无实际切片，未指定 reviewer、未记录 PASS。后续让读者解释：为什么 ER 的旧标签仍不足；固定 p 与当前 q 如何计算 KL；logits 共同平移为什么出现不同惩罚；z 来自何时以及为什么不保存旧网络；有限容量又引出什么问题。还要判断文字与图形能否共同得到这些结论。

## Full Implementation (W8)

仅记录后续边界：W7 通过首切片之后才覆盖 S4–S8、紧凑 supporting 和主线外 reference。S7 需独立整合设计与状态核对。此处不提前实施、不记录任何 W8 PASS。

## Human Acceptance Record

2026-10-27：用户要求按 W5 执行方案分部分 commit。第一轮完成后，用户对三个场景选择“采用推荐方向”，对首切片选择“采用 S1–S3（推荐）”。确认内容为 A 的两个连续计算单元、B 的选留/训练双段、C 的稳定整体工作台与展开区可复算合成小模型，以及 S1–S3 / I01–I05 的首切片范围。本轮据此完成普通图文单元与技术细节定稿，不改变 W4 顺序或 W2 时序。

这份确认只接受设计与范围；Rendered-page acceptance 和 W7 均保持 PENDING。W5 在结构与引用核验通过后由 CLI 自动完成；本轮不实施 W6，也不将确认设计说成人已看过真实页面。

### 本轮核验（2026-10-27）

- `python tools/paper.py paths der --json`、三组 `scaffold-kit ... --dry-run`、`python tools/paper.py check der` 与 `git diff --check` 均退出 0。check 唯一 warning 为文档含本机绝对路径；这是按 W5 要求真实记录 publish_source 和复制目的地，不是网页运行时依赖。
- 直接调用现有 W5 校验并审阅映射：CORE 11/11 仅分配一次，SUPPORTING 9/9，REFERENCE 3/3，DELETE 未混入；证据引用可解析；只有一份 implementation YAML；无选中公开页图，无 Kit 实际复制，W6 保持 pending。
- 独立复算 S3 的 KL 两个带符号项、三种总和和 E02 平方差；枚举 K=2 前四个流项的 reservoir 留存概率，四项最终均为 1/2。这里只核对提案算例，不声称已经实现或验证了 S7 小模型、页面动画或浏览器状态。
- 指定回归命令为 `python -m pytest -q --basetemp=C:/Users/lenovo/Desktop/Projects/PaperWork/.tmp-der-w5-20261027 -o cache_dir=C:/Users/lenovo/Desktop/Projects/PaperWork/.tmp-der-w5-cache-20261027 tests/test_workflow_implementation.py tests/test_workflow_schema.py tests/test_document_governance.py`，结果 18 passed，退出 0。使用独占工作区临时目录，避免此前默认目录权限问题；本轮临时目录/缓存交付前清理。
- DER 页面构建、交互、桌面/F11、上游 Import/Preflight 均未运行，符合本轮规划范围；Kit Gallery 只尝试查看但连接超时，NOT_RUN，不能当作视觉签收。预览服务和本次失败预览标签已关闭。W5 结构检查、设计确认和实际页面验收仍分别记录。
