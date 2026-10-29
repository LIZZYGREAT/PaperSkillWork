# Implementation Plan: Dark Experience for General Continual Learning

Paper ID: `der`

## 当前执行与授权（2026-10-29）

当前状态：W7 complete，W8 complete；W9等待用户最终审查。完整检查、限制和最终证据见文末及 audit/final-check.md。

起点 fa3257b / der，原工作区干净。用户要求依据 W7_Approval_W8_Execution_Plan.md 执行，直接确认“W7我认为是通过的”，随后要求不再逐批询问，执行全文、自查后交最终审查，完成部分及时 commit。本次授权解除批次间反馈停止点，继续 W8-A–E；W9 仍待用户最终验收，不执行 W10 Import/Preflight、推送或 PR。

### Vertical Slice Review (W7)

Vertical Slice Review: PASS

真实评审人：用户，依据本聊天“W7我认为是通过的”。CLI 已登记 W7 complete（efc08b9）。保护已认可 S1–S3，尤其生命周期九阶段、网络、样本身份、冻结值、槽位和专注布局。新场景尚未获用户验收；工程补验独立于人工验收。

## 当前入口和复用边界

paths CLI 解析发布源码为本仓库 papers/der/web/enhanced。正式 / 接入认可的 KL / ScoreBoard 和同一生命周期组件；设计评审板反向引用生产组件，不作运行时依赖。保留 ?review=1&focus=lifecycle；移除 Legacy 与退役三场景和专用测试，生命周期回归原样保留，KL/Logits 检查迁到生产页。没有 localhost iframe。

Kit 沿用下文已核实的 Registry/Recipe/source：useAnimationTimeline、SceneTransport、useReducedMotion、ModelPixel、数学与 Reference。运动/槽位/损失支路归 DER，不改 Kit，不建第二运行时。Reservoir 插入函数供后续唯一 trainStep 复用；W5 fixture 生成 θ/M/N/z、损失和更新，时间线只控制揭示。

## W8 批次一 · G0 + Reservoir

- 正式迁移不改变数学计算或已认可构图。冻结入口直接复用同一生命周期实例。
- Reservoir 从空池 K=2 连续四次候选：追加、追加、j=0 替换、j=3 拒收；j 明标教学预设随机结果，拒收也增 N，不重新计算 z，不撤销当前训练。此给定输出入池例与 S7 数值轨迹独立。
- npm test 17/17，build 退出0；定向 test:browser -- --reservoir-only 114断言通过（1440×900/1920×1080、生产 /der-review/），含中间运动、暂停/恢复、回退、完整播放、reduced motion、冻结值及资源错误。KL/Logits/生命周期已跑过1440回归；最终整篇回归待补全。
- 已实看 .visual-qa/der-w8-batch1/review 的替换中间态1440、拒收结果1920，以及正式 Logits 与生命周期截图；最终布局还会复查。
- SOURCE_BUILD=PASS：Node24.18.0、Vite6.4.3，tsc + vite build 退出0。SUBPATH_ASSETS=PASS：上述已执行场景 /der-review/ 的生产资源，无浏览器/资源错误。
- UPSTREAM_SYNTAX / UPSTREAM_OUTPUT=NOT_RUN：相邻 PaperSkill HEAD c6d30defb90480afb2b4fa6ee8083a27d8dafb5c，upstream=git@github.com:ReductTech/PaperSkill.git；git fetch upstream main 终端退出1（原生git码未单独采集），SSH 权限失败，无法核实当前官方脚本一致性。后续再尝试；不称为 W10 通过。
- FULLSCREEN_REAL=NOT_RUN：上轮 Computer Use 因无法可靠识别当前 URL 终止；headless 尺寸不冒充 F11。W9 HUMAN_ACCEPTANCE=PENDING。

## 已确认设计与计算依据

保留 W4/W5 数学分层、页面组织、语义帧、来源、Kit 选型、S7 数值 fixture 与唯一 implementation YAML。重复历史 REVISE/调试流水由 Git 保留。

### 数学呈现边界（沿用已确认的W5/W6约定）

本轮执行《W5 数学表达修订与 W6 首个教学切片实施任务》。保留 W4/W5 因果链、七单元、S1–S3 / I01–I05、固定算例、S7 fixture、唯一 implementation YAML 与既有审批；W5 已 complete，不重复提交完成命令。本次只调整数学呈现层并实现首切片。

主线同时提供机制和必要数学：先说明变量对象与固定/变化身份，再给关键定义式、逐项含义、一段轻量完整的代数推演，最后用图形与有限交互检验。U2 的 KL 定义及 H(p,q)−H(p) 拆解必须默认可见，p/q/k/C 首次出现即说明；固定 p 使 H(p) 成为不随当前网络变化的基准，因而降低 KL 可作为训练目标。U3 的平方距离定义、逐类相减/平方/求和与 softmax 共同平移的原因也在主线。没有公式数量配额，不能把定义或必要短推演全部移到展开区。

U1 默认只观察同类仍判对但整组分数偏好不同，不展示相同 CE 的小数账本。U2 默认用同尺度概率条、一个合理舍入的 KL 总量及同步结论，不逐行铺开所有对数乘积；U3 默认用三类对齐分数和一次短平方和展开，不额外堆差值表与梯度矩阵。完整代入、非负性证明、q−p 与 2(a−z) 求导、KL 的局部二阶关系放 Reference Hub/邻近详情。S7 九位小数与梯度矩阵保留为后续核验依据和深入查看，不进入本次 W6 引擎。

Hover/TermRef 只补当前语境中的短定义与身份，Reference Hub 负责证明、扩展与出处；关闭它们仍须能理解主线。网页使用原生 MathML，设计文档的行间数学继续使用两组 `$$`。允许为排版调整局部比例，不改变数学含义、样本身份、共同尺度、冻结时机或真实训练顺序。

### 页面组织与阅读节奏（已确认方向）

以下 U 编号是本轮确定的阅读单元，非新增工作流/页面 schema。唯一结构化覆盖仍是下方 implementation YAML。七个单元来自内容关系，不是章节或交互数量指标。

| 阅读单元 / W4 主讲范围 | 正文的任务与进入条件 | 图形/公式的任务 | 交互/动画的任务与边界 | 读完留下的问题 |
| --- | --- | --- | --- | --- |
| U1 为什么留旧数据还不够 / S1 I01 → S2 I02 | 从流式分类和有限空间引出 ER，再质疑硬标签记录了多少旧行为 | 上半以数据流和少量留存图作开放式对照；下半固定同一 x、y，并排看整组响应 | 以静态图文为主；不加“任务切换”按钮，不强制播放开场动画 | 已决定记录整组响应，怎样衡量偏离？ |
| U2 概率怎样成为约束 / S3 I03 | 接住旧概率 p 与当前 q，解释为何需要 KL | 两类概率、逐项 p·log(p/q)、和与 q−p 的方向同步对应 | 切换 W4 E01 的三个 q，检验“同样判Claude”仍有不同偏离；不任意拖动所有坐标 | 概率方案已可行，为什么还看原始分数？ |
| U3 为什么留下 logits / S3 I04、I05 | 先比较匹配空间，再解决旧目标何时产生 | 三维对齐、偏差平方和、共同平移反例；之后用短时间轴展示不同训练步的 z | 在 W4 E02 的两种 a 间切换；快照只显示冻结数值，不建旧教师网络 | 记录内容已定，但容量有限，哪些记录能留下？ |
| U4 让有限记忆持续工作 / S4 I06、I07 | 先解释选留，再把旧记忆接入 DER 一步 | 固定槽位的 reservoir，随后用更紧凑的读→损失→更新→写演示闭合两项目标 | 两个局部任务分开操作；选择合法 j 验证替换/拒收，然后看一次训练顺序 | 同一原图回放时像素视图是否仍相同？ |
| U5 稳定复现，还要复现正确 / S5 I08 → S6 I09 | 先恢复增强，再质疑冻结目标的正确性；两段间明确写出因果转折 | 同一原图的 A0/A1 视图共指 z；再展示错误历史 z 与真实 y 的不同监督 | 增强用并排对照；DER/DER++ 模式变化只显露额外标签路径及第二采样，不增加模型 | 部件都学过，空池开始怎样连续运行？ |
| U6 一份记忆，四轮学习 / S7 I10 | 不重教局部概念，沿一条状态轨迹核查交接 | 独立系统场景：唯一当前网络、两个记忆槽、候选、联合损失和跨轮状态 | 回退/前进/本轮重播；DER++ 为模式分支；预测是独立只读分支 | 能运行不等于有效，哪些结果能支持它？ |
| U7 用实验回答效果问题 / S8 I11 | 先限定协议再看数值，回收“DER++ 是否必胜” | 条件齐全的精炼对比和反例；完整数据在证据详情 | 首版用静态条件表和可展开来源；不建跨协议排行榜或无必要的大筛选台 | 收束适用范围与未保证的性质 |

U1 的入口可有大标题，其余以问题句和留白分组，避免每节重复大封面。U2/U3 的计算区紧邻解释；U4 的槽位居中，U5 使用宽度较轻的对照，U6 才使用独立完整工作台，U7 回到证据型排版。不以同尺寸卡片包住所有段落。

#### 普通单元的表达落地：U1、U5、U7

U1 开头以一条自然的数据流和只能留存少量记录的容器建立对象关系，正文直接问“旧数据已经过去，参数却还在变，如何复习旧判断？”有限 ER 是顺着这个问题给出的第一个方案，图中不出现任务边界开关。下半沿同一原图 x2、同一真实 y 对照“类别答案”和“整组响应”：硬标签处只写真实类别，响应处保留所有类别坐标，不能把非标签类别画成没有梯度。

为了让“类别仍正确，历史响应却未被保留”可直接核算，U1 使用独立教学配对：真实类别为Claude，旧分数 (2,1,0)，假设的另一组当前分数 (2,0,1)，坐标均为Claude、GPT、DeepSeek。两组都将Claude排第一，Claude的 softmax 概率相同、标签 CE 相同，GPT/DeepSeek偏好却互换。这是从 W4 硬标签不足问题补充的合成比较，不是论文实测或 U3 的训练结果；它只回答 C11，不新增训练机制。默认只呈现类别与相对分数形状，相同 CE 的具体小数仅作内部核对。例子无需交互。U1 收束文案为“少量旧图能让模型复习类别；如果还想保护当时的整组判断，就需要保存输出。怎样衡量两次判断有多不一样？”随后进入 U2。

U5 的前半使用同一原图 x2 和两种训练视图的并排图：左侧注明生成历史 z 时使用的 A0(x2)，右侧注明回放使用的 A1(x2)；两条路径指向同一个冻结目标，而不是两份可更新目标。原图身份始终显示，视图只附变换标记。图片可用自写矢量图形说明裁剪/翻转，不能使用未获复用许可的论文或笔记图片，也不能将矢量示意称为真实训练图。图下保留实际匹配公式，I17 的均值—方差推导在邻近 details 展开；主线已经解释“多个视图共用一个 z”为什么鼓励一致，不依赖展开才懂。

U5 前后两段之间明确写出“但更稳定地复现旧输出，不等于旧输出就是正确的”。后半原样采用 E04：Claude图的 z=(0.5,2,0) 将GPT排第一，y 仍是Claude。静态对比先建立旧行为与真实类别的不同要求，再以 DER/DER++ 切换显露第二次历史采样、标签 CE、β 权重和记录中的 y。模式切换只重建本地示例，所有损失仍指向同一网络；不暗示必定立即纠错。读者只需一个模式控件，α/β 不做大型调参台；I18 用短段解释权衡。结尾交接为“目标与记忆都已有了，接下来从空池开始检查它们是否真的按同一个顺序运行”。

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

已读真实入口：`index.html`→`src/main.tsx`→`App.tsx`，React 18 + TypeScript + Vite 6；`src/data/tutorial.ts` 当前只有空 chapters，`src/modules/registry.tsx` 为空，`TutorialData.meta` 可表达 titleEn/titleZh，现有页面按 componentId 选模块。这些是待 W6 填充的脚手架状态，不是假定已有教程。W6 保留入口，按实际教学内容扩展局部布局，不借元数据修改 W4。

W6 元数据使用完整英文题名 `Dark Experience for General Continual Learning: a Strong, Simple Baseline`、中文题名“DER / DER++：用有限记忆保留历史预测”，首页短标识为 DER / DER++。概率计算、logits 比较和目标快照分别使用本地组件 ID `der-probability-constraint`、`der-logit-matching`、`der-memory-snapshot`，在 tutorial.ts 声明并在真实 widgetRegistry 中逐项注册；普通问题正文仍是普通图文。componentId 名称可作同义的局部工程调整，但必须同时修改引用和注册，不新增空注册项占位。MathML 的 d.ts 应被实际 tsconfig 包含；静态图形、类别坐标与数据计算由 DER 模块拥有，不从 Kit 或另一篇论文借入事实。

`vite.config.ts` 的 `base: './'` 支持相对子路径产物；新增本地资源须通过相对模块导入或 Vite base 解析，禁止硬编码 `/images/`。不新增外部服务、CDN、远程字体或训练服务；原生 MathML/Kit 类型声明是数学排版候选，不必增加运行时数学依赖。S7 教学数值若采用小模型，浏览器本地计算，不加载真实论文模型权重。

相邻 PaperSkill 检出 HEAD 为 `c6d30defb90480afb2b4fa6ee8083a27d8dafb5c`，工作树干净，upstream 指向官方 `ReductTech/PaperSkill`。已读 `scripts/import-paper.js`、`scripts/validate-repository.js`、`paper-skill/scripts/validate-output.js` 与本地 contract；定稿时尝试 `git -C ../PaperSkill fetch upstream main`，退出 1：本机 MSYS SSH 的 NtCreateDirectoryObject 返回 0xC0000022，随后 Git 报无法读取远端。未取得成功刷新的官方版本，不能将当前本地检查称为最新官方兼容证明。此失败不改动上游源码，不以此改动已确认的教学结构。本轮不运行 Import/Preflight。

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

已确认首切片 W6 只需第一组部件，实际开工时才执行相同 `--select` 命令去掉 `--dry-run`；第二组等 U4/U6 真正开工时按需要追加。入口只引一次 `shared/foundation/styles/kit.css`，图元和 Glyph 自带各自 CSS 导入；MathML d.ts 需要被 tsconfig 读取。所有场景 CSS 留在 DER 本地，不复制 Gallery 样式。当前没有必须修改 Kit 内部样式的证据；适配分类为局部布局与教学数据/语义，不是共享缺陷修复。

第三组是对照候选，不实施复制：FormulaBlock 会带 FormulaTerm/MathTypography；BenchmarkExplorer 会带 SegmentedControl；四者合计闭包为 7 文件（controls/SegmentedControl.tsx、layout/StickySystemView.tsx、math/mathml-jsx.d.ts、styles/kit.css、optional/benchmark-explorer/BenchmarkExplorer.tsx、optional/evidence-viewer/EvidenceViewer.tsx、optional/formula/FormulaBlock.tsx，前三类均位于 foundation/）。FormulaBlock 的符号交互非当前主任务，静态 MathML 更直接；StickySystemView 使用滚动阅读线与手动覆盖，可能和 U6 显式训练步竞争，故先不用；EvidenceViewer/BenchmarkExplorer 的源码有硬编码英文 UI 且 U7 暂无需大筛选，先采用本地中文协议表和原位详情。

`shared-input-models` 及 `vector-retrieval` 已看 README/Recipe 的职责，不选整个 example：前者是两个独立模型，后者是内积检索，都不符合本篇训练语义。FlowConnector 不足以连接复杂图时只拒绝那段布线复用，不因此引入整套旧论文系统。没有复制 Gallery 场景文件，也没有跨论文 runtime import。

Gallery 实际查看状态：尝试启动现有 Demo 并通过浏览器打开 `http://127.0.0.1:5187/?demo=gallery#gallery-parts`，Vite 已就绪，但浏览器两次连接均超时，未取得可复核的部件画面。此项为 NOT_RUN，不称视觉通过；预览服务已关闭。当前尺寸结论依据上方真实 CSS/API，W6 必须在实际切片复核。此限制不影响本轮文档覆盖、计算和 dry-run 证据。

### Critical Teaching and Integration Scenes

以下三个场景的结构与交互方向已获用户确认，网页实现及渲染验收仍未进行。线框里的箭头标注数据、读取、梯度或时间关系；不是可直接执行的算法代码。普通图文按上方职责实施，不要求逐帧稿。

#### A / S3：从一个可行的概率约束，走到 logits 的选择

推荐两个连续阅读单元，各有一个计算焦点。U2 的左侧约 1/3 宽度负责“同判Claude为何仍有差异”的引导与结论，右侧约 2/3 是两类概率和代入计算。U3 恢复开放式横向排版，以旧/新两行、类别三列对齐分数，下方对齐差值与平方项。比例是桌面构图起点，不是固定像素锁死，也不是两组同模板控制台。

```text
U2  已有：同一输入，固定旧概率 p               正文约 1/3 | 计算区约 2/3
    为什么同判Claude仍不一样？                    p：Claude .8  / GPT .2   [固定]
    当前 q 的概率分配变了                     q：Claude .6  / GPT .4   [切换例子]
    ↓ 变量身份、KL 定义与逐类含义             概率形状与一个 KL 总量
    log 比拆分为 H(p,q)−H(p)，解释固定基准     同步结论；完整数值和梯度在 Reference

    交接：概率约束已经可行；原始分数能否直接比较？

U3  旧 z [冻结]          2       1       0      类别坐标固定
    当前 a              1       2       0      [交换例 / 共同平移例]
    平方距离定义及逐类含义                    一次短展开 → 总量 2
    共同平移例          概率未变，KL=0；平方和=3

    收束后才展示：本步更新前 θ → 产生 z → 冻结数值 → 候选 (x,z)
    交接给 S4：知道记录什么，但不是每条都能在有限空间中留下。
```

固定数据按 W4 E01/E02 原样使用。U2 旧 p=(0.8,0.2)，当前 q 可切到 (0.6,0.4)、p 本身或 (0.2,0.8)；只开放这三个有教学意义的例子，不加入自由拖动 p/q 的多变量面板。比较前后，p 始终锁定；读者一次操作改变 q，概率条、KL 总量、公式对应身份与结论从同一 q 计算。完整逐项值与输出梯度也从同一数据派生，但默认放按需内容。E01 的两类概率与 E02 的三维分数是不同算例，切换阅读单元时明示，不能把两者画成同一张图的连续前向。

在 q=(0.6,0.4) 时，两个 KL 项约为 +0.230146 和 −0.138629，总和 0.091516；负项保留符号，不画成两个均非负的“距离块”。q=p 时总和和梯度都为零；反转 q 后总和约 0.831777。梯度箭头只是输出层的下降倾向，不能说 θ 的每个分量直接减去 q−p。

U3 默认 z=(2,1,0)、a=(1,2,0)，切换 a=(3,2,1) 时，两组柱使用相同固定 extent=3，不分别自动缩放。所有分数坐标标明Claude/GPT/DeepSeek；差值带正负号，平方项单列，保留“概率仍携带相对偏好”的正文。共同平移例展示同 softmax、不同平方和，不能被解释成 logits 方案普遍更优。RepresentationVector 可画两组向量；类名与逐维对应由本地布局提供，不修改组件内部；若绘图对齐不够清楚，改本地语义表，不强迫图元替代计算表。

数学位置：KL 定义、变量角色、H(p,q)−H(p) 的一步拆解与优化意义、平方匹配定义和一次短展开、平移反例及其 softmax 数学原因均在正文/主图邻近处。q−p、2(a−z) 的完整求导和 KL 非负性证明在按需内容，二阶/Jacobian 放 I21 Advanced details。U3 末尾用一个候选 z 追踪生成、复制与之后的参数变化，只有一个当前网络，明确生成早于更新、实际写入晚于更新；reservoir 的取舍规则尚不首讲。

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
├──────────────┤      │ 本步只更新一次  │       │ α·Ldark            │
│ 记忆 M       │ ─取→ │                 │ ────→ │ β·Llabel [++]      │
│ 槽 0 / 槽 1 │ Rd,Ry└─────────────────┘       │ 合成 L / 梯度详情 │
└──────────────┘            ↑ 联合梯度             └────────────────────┘
      ↑ 参数更新后才写       └──────────────────────────────┘
      └────── 候选记录 / j / 替换或拒收 ──────────────────────

底部：第1轮 空池 ─ 第2轮 回放 ─ 第3轮 替换 ─ 第4轮 拒收 ─ 只读预测
当前说明紧邻主图下沿；上一语义步 / 下一语义步 / 本轮重播 / 展开状态检查
```

线框表达布局与归属，不赋予所有箭头相同语义。原图 x 才进入网络，y 从样本归属区旁路直达 CE，不能沿图中原图箭头一起进入模型；历史标签同理。实际图中，数据为实线，历史目标为带“固定 z”的参照线，梯度为反向虚线，写 M 为更新结束后才激活的独立路径。屏幕较宽时图面使用可用宽度但限制对象间距；1440×900 起点约 1200px 内容宽，左列 220px、中列 240px、右列 300px，其余留给连接和边距。主图与控制优先可见，完整数值检查放其后原位展开，不能靠缩小字号塞满视口。1920×1080 保持同一局部关系，允许增大留白，不把关系拉散到屏幕四角。实际值由 W6/W8 渲染再调整。

唯一计算源拟为 DER 本地纯函数 `trainStep(state,batch,choices)` 产生的不可变操作轨迹。它承担真实教学计算；时间线只决定揭示哪一项结果，不能另算一份损失或另维护副本 M。选择预设教学轨迹时显式记录 Rd/Ry 与 j，回退恢复已有轨迹快照，不再抽签或训练一次。进入预测只计算查询输出，θ/M/N 保持逐值一致。更换 DER/DER++ 模式会从 θ0 重建整条轨迹，禁止在 θ3 上偷偷补标签路径后沿用旧结果。

数值分两层：默认主图明确 θ 的版本、记录身份、损失来源与 reservoir 的 E03 决策，不伪造 ResNet 的实测参数；展开计算使用已确认的三类小型线性分类器 h_W(u)=Wu。u 是教学记录的二维合成表示，不声称来自论文 CNN；主图的样本 ID 与展开区的数据项对应，但不声称计算出了真实图片的特征。当前输出、冻结 z、损失和参数更新均由下方固定设定计算，不与 S3 的独立 E01/E02 向量冒充同一训练轨迹。

##### S7 小模型的固定计算设定

这是本项目对 W4 E03 四轮状态轨迹的数值展开；参数和视图由 W5 合成，计算规则依据 B01/B02 与 W2 联合训练顺序，不是论文训练数据、准确率或新的方法模块。固定三类坐标依次为Claude、GPT、DeepSeek，单条当前输入、单条每次回放；无 bias、无 momentum、无 dropout/BN、无动态扩头。参数 θ=W，初态 M=[]、N=0、K=2，η=0.1、α=0.5；DER++ 的 β=0.5，DER 不计算标签回放项。这些系数只是此合成算例配置，不是论文全实验唯一最优值。

$$
W_0=\begin{pmatrix}0.2&-0.1\\0&0.1\\-0.1&0\end{pmatrix},
\qquad h_W(u)=Wu,
\qquad A_s(u)=(u_1+0.1s,\ u_2),\quad s\in\{-1,+1\}.
$$

A_s 是二维教学数据的微小视图变化，标签按 fixture 保持；不将它说成真实图像裁剪的计算，也不声称任意变换都保持类别。可视层区分原始 u、视图标记 s 和结果 A_s(u)，原始 u 才入池，z 来自本次当前视图的更新前网络。Fixture 的全表只用于教学配置和重播；训练函数每轮只读取当前项、旧 M 及本轮选择，不能借全表恢复已淘汰样本参与回放。

| 轮次 / 当前项 | 原始 u / 真实 y | 当前视图 s | Rd / 回放视图 s | DER++ 的 Ry / 回放视图 s | 参数更新后的 reservoir |
| --- | --- | --- | --- | --- | --- |
| 1 / x1 | (1,0) / Claude | +1 | 无 | 无 | 追加 v1；N=1 |
| 2 / x2 | (0,1) / GPT | −1 | v1 / −1 | v1 / +1 | 追加 v2；N=2 |
| 3 / x3 | (1,1) / DeepSeek | +1 | v1 / +1 | v2 / −1 | j=0，替换 v1；N=3 |
| 4 / x4 | (1,−1) / Claude | −1 | v2 / −1 | v3 / +1 | j=3，拒收 v4；N=4 |

这些是预设的合法教学选择，不称为一次真实随机抽样；三、四轮 j 分别属于 [0,2]、[0,3]。需要随机探索时另开明示模式并从头计算，不能沿用下面核对值。DER 与 DER++ 各从同一 W0 开始，记录池身份相同，但第三轮起响应和后续参数可以不同。

对当前视图 v，q=softmax(Wv)；真实标签 y 采用同一三类坐标，e_y 为其 one-hot。v_d、z_d 属于 Rd 的增强输入与冻结目标；v_l、y_l 属于 Ry 的增强输入与真实标签。当前 CE 梯度、历史匹配梯度、标签回放梯度和一次联合更新为：

$$
g_c=(q-e_y)v^\top,\qquad
g_d=2(Wv_d-z_d)v_d^\top,\qquad
g_l=(\operatorname{softmax}(Wv_l)-e_{y_l})v_l^\top,
\qquad W^+=W-\eta(g_c+\alpha g_d+\beta g_l).
$$

DER 的最后一项省略；空池两种回放项均省略。所有梯度在进入本轮的同一个 W 上计算；先将当前 z=WA_s(u) 复制为数值，再更新 W，最后根据表中选择入池。Softmax 用减去最大值的稳定实现；计算保留浮点精度，只在显示时舍入。

下表是本轮独立复算的核对值，保留九位小数。Ldark/Llabel 是未乘系数的值；总损失是 Lcurrent+0.5Ldark（DER）或再加 0.5Llabel（DER++）。界面应使用公式计算，不能反过来把此舍入表当作动画数据源。

| 模式 / 轮次 | Lcurrent | Ldark | Llabel | 总损失 | 终态池身份 |
| --- | ---: | ---: | ---: | ---: | --- |
| DER / 1 | 0.924831171 | 0 | 不计算 | 0.924831171 | [v1] |
| DER / 2 | 0.996218307 | 0.001450076 | 不计算 | 0.996943345 | [v1,v2] |
| DER / 3 | 1.320544135 | 0.008208513 | 不计算 | 1.324648391 | [v3,v2] |
| DER / 4 | 0.795830653 | 0.005751480 | 不计算 | 0.798706393 | [v3,v2] |
| DER++ / 1 | 0.924831171 | 0 | 无样本 | 0.924831171 | [v1] |
| DER++ / 2 | 0.996218307 | 0.001450076 | 0.860131109 | 1.427008899 | [v1,v2] |
| DER++ / 3 | 1.339471793 | 0.017769232 | 0.935701131 | 1.816206974 | [v3,v2] |
| DER++ / 4 | 0.763913071 | 0.010760951 | 1.173231484 | 1.355909289 | [v3,v2] |

首轮 z1=(0.22,0,−0.11)，第二轮候选 z2≈(−0.126637418,0.103501054,0.013136364)，这两个时刻两模式尚相同；之后须分别从各模式 W 计算，不能共享旧结果。DER 的 W4 三行为 (0.266925345,−0.215478335)、(−0.096221826,0.149995574)、(−0.069122901,0.065498583)；DER++ 为 (0.274097285,−0.245087785)、(−0.130273778,0.159440379)、(−0.042242889,0.085663228)。

只读查询固定 u_query=(1,0.5)，评测视图为恒等映射；两模式都在三类中取 argmax。DER 查询 logits≈(0.159186177,−0.021224039,−0.036373610)，DER++≈(0.151553393,−0.050553588,0.000588725)，均输出Claude。该结果只演示预测入口，不是方法性能比较；同一步查询前后 W/M/N 深比较必须相同。记录 z1/z2/z3 需与各自产生步的更新前数值逐值相等，槽位替换时整条记录退出；按前后步执行轨迹检查跨轮交接。

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

下列为已确认的观测范围；实际W8结果见本文件末尾及audit/final-check.md。首切片只检查 U1–U3，其余状态随实际实现进入对应阶段。每一代表态在普通桌面 1440×900 与全屏布局模拟 1920×1080 观察；真实 F11 另记实际尺寸和结果，不能由模拟替代。无移动专项触发，不运行 Kit 全量回归。

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
    - {id: S2, page: U1-replay-entry, core_items: [I02], evidence_refs: [C11, C10, B01, B03], primary_vehicle: '同图同标签与整组响应对照', reusable_pattern: null, reason: '直接承接 ER，并揭示标签没有保存的历史行为'}
    - {id: S3, page: 'U2-probability / U3-logit-memory', core_items: [I03, I04, I05], evidence_refs: [C10, C02, C13, C12, M02, M06, B01, B02, B03, E01, E02], primary_vehicle: '先概率 KL 再 logits 平方匹配的两段可计算对照', reusable_pattern: null, reason: '先验证概率监督可行，再比较表示空间，最后决定目标采集时机'}
    - {id: S4, page: U4-reservoir-and-step, core_items: [I06, I07], evidence_refs: [C06, M03, I01, C02, C04, M04, M06, E02], primary_vehicle: '槽位抽签与单步读写顺序演示', reusable_pattern: null, reason: '记录内容确定后解决在线选留，再闭合基本 DER'}
    - {id: S5, page: U5-consistency-and-correction, core_items: [I08], evidence_refs: [C14, M06], primary_vehicle: '同一原图的两种增强视图与固定目标对照', reusable_pattern: null, reason: '恢复前段暂固定视图的真实训练条件'}
    - {id: S6, page: U5-consistency-and-correction, core_items: [I09], evidence_refs: [C03, C05, C15, E04], primary_vehicle: '错误历史引出标签监督与三损失同网络图', reusable_pattern: null, reason: '从一致但可能错误的目标自然引出 DER++'}
    - {id: S7, page: U6-complete-system, core_items: [I10], evidence_refs: [C02, C03, C04, C05, C06, C14, M01, M02, M03, M04, M05, M06, B01, B02, E03], primary_vehicle: '独立系统级四轮连续执行与只读预测', reusable_pattern: null, reason: '核查空池、回放、更新、写入及跨轮交接，不拼接局部演示'}
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

范围已确定，W5 完成后按此执行 W6。首切片不实施 reservoir、DER++、四轮完整系统或结果页，不用未来占位组件凑验收；下一阶段问题以正文衔接即可。S7 小模型只在本计划固定计算依据，不提前实现为 W6 隐藏组件。之后若改变首切片范围，必须同步覆盖和确认记录，不能静默删 I01。

SUPPORTING 的具体落点：U1 原位短回忆 I12/I13；U2 的 I14 紧邻梯度结论可展开；U4 的 I15 概率归纳可展开、I16 iCaRL 比较一短段；U5 的 I17 增强均值/方差推导可展开、I18 权衡系数紧邻三项损失；U6 的 I19 原文消歧作为算法旁说明；U7 的 I20 分析含义一短段。I21–I23 在主线之后的参考/证据区，主线对必要结论本身不依赖点开；I24–I26 排除。

W5 定稿时四项源码检查均未运行；当前 W6 的实际命令、状态与限制记录如下，W5 的结构通过不作为 W6 质量依据。

### W8-B–E · 全篇实施与首轮回归

用户已直接要求执行全文、自查后交最终审查，不再停于批次间询问。新增 DER 单步、增强、DER++、独立四轮工作台与实验证据，沿原 W4 的 U4–U7 接入。

- 唯一 training-model.ts 按 W5 固定二维模型、η=0.1、α=β=0.5 复算两模式；八组损失、两组预测与 W5 九位小数表一致，联合梯度有限差分通过。空池、分别采样可重合/不同、旧 M 先读、冻结值、一次更新后写入、替换和拒收都有状态测试。
- DER 单步与四轮台共用 trainStep；增强用同一 first-record / W1 计算视图输出，固定 z 不刷新。DER++ 合成错误例不编造优化后的类别，画面显示旧 z 与 y 的独立职责。
- 工作台从 θ0/M空/N0/K2 到四轮连续继承，选择阶段只读取不可变快照；预测只读 θ4，参数/记忆/计数不改。提供完整视图、目标、联合梯度和参数矩阵查看。模式切换从同一 W0 重算全轨迹。
- 实验数据取 W3 R01/R02/R04/R05 与 W2 Results，主线显示两种 CIFAR 协议、MNIST容量差异与三项反例；按条件重绘，不发布原表截图；补充结果及 Fisher/ECE/ghost-class 边界进入 Reference。
- npm test 20/20；SOURCE_BUILD=PASS（71 modules、Node24.18.0、Vite6.4.3，退出0）。新增场景 test:browser -- --w8-only 共680断言通过，两档桌面、全阶段参数/计数/池身份、完整结果、暂停/回退、reduced motion、预测、模式切换、证据与几何。最后端点与第二旧记录来源的修正将随整篇回归复核，不声称已过最终 W8。
- 实看代表图后修正：增强分支端点缺口、文字交叉；工作台回放源改从实际旧槽边缘发出；DER++ 不同 Ry 时明确第二旧记录；Reservoir 专注页压缩头部留白、将固定候选说明移出运动路径。公式仍用 MathML，图内损失下标用 SVG tspan。
- 相邻旧检查器本地诊断（非当前官方验收）：syntax-check.js <publish_source> --require-parser / validate-output.js <publish_source> 均退出0，无占位项，7 chapters/10注册模块。HEAD=c6d30defb90480afb2b4fa6ee8083a27d8dafb5c；缓存 upstream/main=c096ab528186f754ca3f8680ace8b12f6d1cf341；脚本 Git blobs=2bcfa6f815054ee498574c51cef05f0c315b4298 / 1a58ca06bd9fa47b6730904f1622189011cc32fe。HTTPS fetch亦失败（连接被重置），当前官方 UPSTREAM_SYNTAX/UPSTREAM_OUTPUT 仍为 NOT_RUN。
- 真实F11再次尝试失败：Windows UI 工具无法可靠识别当前浏览器 URL，安全终止；停止操作个人浏览器。FULLSCREEN_REAL=NOT_RUN，保持最终人审明确待核。

## W8 最终自检与 W9 交接（2026-10-29）

全部 S4–S8 / I06–I11 已实现。最终无过滤浏览器2364断言通过；随后工作台局部几何修正再跑新增场景764断言，以及候选/旁注/网络避让24断言。21项数学/状态/证据测试全部通过。SOURCE_BUILD=PASS（最终 tsc/Vite退出0，71 modules，index-phdlzviR.js / index-DpXOBddT.css）；SUBPATH_ASSETS=PASS（生产 /der-review/，无浏览器/资源错误）。

公共 Visual QA 40状态、两个桌面布局通过；报告run为 .visual-qa/run-2026-10-28T17-33-55-233Z，已核读actualUrl与诊断并实看必要截图。其后仅改工作台：候选沿空白列下降，拒收向侧边退出，M标题与旁注避开运动，已占槽不显示“空”。两档末次定向几何/截图通过。上述检查 scope 与未执行项详记 audit/final-check.md。

真实连续播放127532ms、21阶段、508样本逐值匹配；未模拟时间。受保护生命周期核心TSX/model/CSS相对fa3257b完全无改动；1440的0/8阶段前后截图SHA256相同：87e4375130aa1ff678be7c45886e885609f5d3c2b365c85d7b361ba2d3f3eb45 / ebfc413a4f28cd73c2f6903a0c0f5cd48dd7270e5c5b65f0d1ac06d0d6b8f973。

UPSTREAM_SYNTAX / UPSTREAM_OUTPUT 仍 NOT_RUN（两次fetch终端退出1，原生git码未单独采集，无法核实当前官方版本）；相邻旧脚本的本地诊断都PASS，不冒称当前官方检查。FULLSCREEN_REAL=NOT_RUN（Windows UI URL安全识别失败）；FULLSCREEN_LAYOUT=PASS；W9 HUMAN_ACCEPTANCE=PENDING。

已校正M03的证明定位：Appendix D只有Algorithm 3，等概率陈述在§3，本教程归纳不是附录证明。未改既有论文理解或因果主线。

审阅入口：正式 /；?focus=reservoir；?focus=der-step；?focus=augmentation；?focus=der-plus；?focus=workbench；?focus=evidence；受保护 ?review=1&focus=lifecycle#lifecycle-player。生产预览由本轮启动于 http://127.0.0.1:5195/，保留供用户审查。最后交接在现有 audit/final-check.md；不新增平行报告、不进行W10。

最终收尾：CLI 已登记 W8 complete，当前 W9 pending。公共 runner 清理输出 CLEANED: <上述同一run>，Test-Path=False；本轮三处自建测试输出目录均验证在工作区内、非链接后精确删除。13个必要文件（关键PNG、最终录像、采样JSON和原机器报告JSON）保留于最终证据目录；归档JSON保留原run相对路径，实际保留画面以命名PNG为准。未触碰其他历史QA目录。

## W9 截图反馈修订（2026-10-29）

用户明确要求四处修订：KL定义/熵拆解前置并修复内部滚动；同标签对照图注等宽、mark突出划线句并删除划掉的品牌实验句；结果图误差标记改为协调的柔和区间；正式正文生命周期启用既有侧栏讲解/公式。此授权包括正文侧栏布局调整，不重新申请已授权的视觉变化。保护类别、同源数学、九阶段、图内对象、冻结/读写时序、同一播放状态和专注入口；共享样式/控制受影响范围须针对回归。W7/W8保留既有完成记录，W9仍PENDING。

追加截图反馈：生命周期标题/引导文字对齐普通正文栏；只让舞台和侧栏突破正文宽度。正常标题的左右边界须与 reading-layout 精确一致。

### 本轮截图反馈的已执行检查

实现提交 a45fae9。普通生命周期直接复用已认可的侧栏：控制、分段文字、公式与示例说明都在左侧，保持同一组件/时钟；标题和引导文字回到 reading-layout 对齐线，下方舞台局部加宽。math-model.ts / lifecycle-model.ts 没有改动。

- BUILD：npm.cmd --prefix papers/der/web/enhanced run build，退出0；Node24.18.0、Vite6.4.3，71 modules；index-D99Hv4HX.js / index-C5JYbR8T.css。
- 数学/状态/证据测试：npm test 21/21通过。
- 五项反馈定向回归：test:browser -- --review-feedback，1440×900与1920×1080共42断言，退出0。覆盖公式在动画/控件之前、公式容器无滚动/裁切、图注边界、mark/删除文案、四协议区间样式和数值位置、侧栏布局、正文标题边线、同一网络DOM与阶段在专注切换中保持。
- 公共 Visual QA：node tools/visual-qa/cli.mjs --config .visual-qa/feedback-config-20261029.json，退出0；run-2026-10-29T00-58-22-881Z共14状态，两档桌面Geometry/BrowserErrors均PASS；STYLE仅显式背景基线PASS。actualUrl均为 /der-review/。
- 已实看两档最终KL、图注、误差区间、普通侧栏与标题边线、原专注版的代表截图。公式没有靠裁切或隐藏滚动条处理；旧overflow-x:auto让MathML字形外延触发内部纵向滚动，现改自然高度与必要留白。接入侧栏时发现新字号覆盖挤压紧凑冻结块，已撤销不匹配的覆盖、恢复原版局部字号。
- 回归契约按用户要求从旧“文字在图上方/单段16px”改为原版“侧栏多段14px”，并检查全部段落；没有删除冻结/读写/暂停/键盘/对象身份断言。专注版1440的阶段0/8截图与上轮归档SHA256完全相同（87e437...3eb45 / ebfc413...8f973）。
- 最终必要画面与机器报告归档：C:/Users/lenovo/.codex/visualizations/2026/10/28/01a1836d-f85f-7e31-b7b3-3847b946b36b/der-feedback-20261029。原run截图路径用于追溯，实际保留画面以归档命名PNG为准。
- FULLSCREEN_LAYOUT=PASS（布局模拟），FULLSCREEN_REAL=NOT_RUN（延用UI安全识别限制）；不将本轮反馈当作W9最终人工PASS，不执行W10。

本轮收尾：无过滤test:browser最终2490断言通过，两档各1245，退出0；包括本轮反馈检查和原有全流程。公共runner的确切run清理输出CLEANED、Test-Path=False；必要证据已归档，两个本轮自建测试截图目录随后精确清理。工作流仍W9 PENDING，未代签人工终审。


### 2026-10-29 · 用户要求公式先行与独立数学讲解

用户直接授权：除 D1 单样本生命周期外，所有含公式模块先呈现公式，再单独详细解释，再进入机制动画。KL 增加散度曲线、方向性、非负性与梯度；Logit Matching 增加平方函数、逐坐标梯度、参数链式求导与共同平移。Reservoir、DER 单步、增强、DER++、四轮工作台同步调整公式顺序与讲解。保留原核心单元顺序、动画状态/计算引擎、合成示例边界及结果数据。D1 的 TSX/CSS/model 不改动；W7 既有通过记录保留，W9 人工终审仍 PENDING。新增图像为同源数学探索，不代替算法训练轨迹；局部样式避免影响 D1 与 Reference Hub。验证包括数学差分、公式顺序/交互、既有全流程、两档桌面截图。此节记录本轮范围，结果收尾追加。

本轮实现与首轮检查：七个主线模块已采用公式→独立讲解→原机制动画；新增 KL 正反向曲线/切线、二类受约束导数与 log-softmax 推导，平方函数/标量梯度步，Reservoir 离散留存曲线与归纳。讲解公式使用原生 MathML；局部 CSS 使用独有 lesson-reading / lesson-derivation，避免旧全局类名冲突，保留 block math 排版。24 项单元测试通过；公式定向浏览器 114 断言通过；生产构建退出 0（Node 24.18.0、Vite 6.4.3，75 modules），最终排版公共 Visual QA 14 状态 GEOMETRY/STYLE/BROWSER_ERRORS PASS（STYLE 仅配置主线 MathML display 断言；其余靠截图复核）。完整全流程正在运行，最终结果在收尾追加。D1 源码、生命周期模型及训练引擎均无差异。最初试运行发现并修复 Node .ts 导入后缀、MathML display 和旧类名冲突；一次未成功构建后的预启动回归已中断，不计入最终通过结果。

本轮收尾复核：

- 七单元计数回归发现 DER 单步、增强、DER++ 三处遗留 `lesson-section`，已改为专用 `lesson-derivation`，保持原七单元断言；三模块两档公共视觉复测 6 状态通过。曲线端点的选中圆点移出曲线裁切层，曲线/切线仍按绘图区裁切，新增端点完整可见检查。
- `npm --prefix papers/der/web/enhanced test`：24/24 PASS，退出 0；含二类归一化 KL 曲线有限差分、平方梯度与一步下降、Reservoir 留存归纳，原生命周期/训练/实验数据测试保留。
- 无过滤 `npm --prefix papers/der/web/enhanced run test:browser`：两档各 1301，总 2602 断言 PASS，退出 0。覆盖原 KL/Logit 动画、D1 九阶段/侧栏/专注切换、Reservoir、DER/增强/DER++、四轮两模式、预测只读、键盘、减少动态、Reference、图注和误差带。该全回归后只移动绘图端点的选中圆点；最终构建的 `--formula-only` 专项两档各 61，总 122 断言 PASS，另检查曲线扫描、暂停、标量一步更新、端点、原生 MathML 与七模块公式→讲解→动画顺序。没有为通过而降低既有断言。
- SOURCE_BUILD=PASS：最终 `npm --prefix papers/der/web/enhanced run build` 退出 0，75 modules；Node 24.18.0、Vite 6.4.3。产物引用 `index-Dp06vX94.js` / `index-CKpmrUfX.css`。SUBPATH_ASSETS=PASS：生产 dist 在 `/der-review/` 提供，完整和最终专项均无请求/页面错误；Vite base=`./`。
- 公共 runner 首次 14 状态、局部修正后 6 状态：GEOMETRY_QA / BROWSER_ERRORS 均 PASS；首次仅主线配置了 MathML display 样式断言并 PASS，其余样式依实际截图复核，不将未配置项说成自动 PASS。已查看两档公式条、正文/曲线、非负性、梯度推导、共同平移、训练讲解与原动画交界及关键动态截图，VISUAL_REVIEW=PASS（本轮检查范围）。D1 源码/CSS/模型无改动，已对照原专注图审看主图；不将本轮截图声称为旧基准的逐字节一致。
- 相邻现有 PaperSkill 检查器本地诊断：`node ../PaperSkill/paper-skill/scripts/syntax-check.js <publish_source> --require-parser`（44 文件）和 `validate-output.js <publish_source>` 均退出 0 / PASS。当前官方检查器仍受上文网络核实限制，UPSTREAM_SYNTAX / UPSTREAM_OUTPUT=NOT_RUN；本地诊断不替代当前官方验证。
- Desktop Window=PASS（1440×900），FULLSCREEN_LAYOUT=PASS（1920×1080），DPR=1；FULLSCREEN_REAL=NOT_RUN（本轮为 headless Edge 156.0.4314.50，未操作真实 F11）。W9 用户最终审查维持 PENDING。
- 必要证据 33 文件归档于 `C:/Users/lenovo/.codex/visualizations/2026/10/28/01a1836d-f85f-7e31-b7b3-3847b946b36b/der-formulas-20261029/`（各模块两档、数学推导/曲线边界和中间态、D1 对照及两份 runner JSON）。两个已完成公共 run 按终端报告的确切路径执行 cleanup，均 CLEANED 且 Test-Path=False；本轮原生测试目录与中断 run 的部分截图在归档、诊断复测结束后精确清理。保留用户审查用 5195 预览，HTTP 200 已确认。

## W9 REVISE · 内容责任审查与返修保护边界（2026-10-29）

本轮审查基准为 `33f3dbbf59951c1e5736278b181e001bf8c6c8c2`，即 W8 完成与“公式优先”测试门禁同时存在的 HEAD。从该 HEAD 的提交链可见：`07db1fd` 加入完整 S4–S8 场景、四轮工作台与实验页；`7d94b55` 随后新增七个公式讲义及曲线；`33f3dbb` 再将统一先后顺序固化进 DOM 测试。W7 首切片人工通过记录在 `efc08b9`，W8 仍是结构完成记录。当前人工结论 `REVISE` 指向 W8 新增内容；`paper.yaml` 的 W7/W8 状态不回退，W9 仍 `pending`，不得进入 W10。

保护的现有内容包括：W7 已确认的 U1–U3 因果与动态关系；`MechanismScenes.tsx` 中 KL 和 Logit Matching 的概率/分数对照与类别次序；`review/SampleLifecyclePrototype.tsx`、`review/lifecycle-model.ts`、`review/lifecycle.css` 中已通过的九阶段生命周期及专注播放（含用户后来明确要求的正文侧栏修订）；`training-model.ts`、`reservoir-model.ts`、`formula-model.ts`、`evidence-data.ts` 的计算源与论文数据；W2/W4、证据定位、类别名和历史记录身份。P0/P1 不改这些受保护模块与算法纯函数；W7 原审批不会被新结论撤销或扩展到 Reservoir。

### P0：按阅读单元梳理信息责任

**U2 / KL。** 读者已有软最大值和当前分类损失的基本印象，刚看到固定的旧分布与当前分布；本段要回答概率蒸馏是否可行、方向为何重要。主视觉沿用获认可的固定 `p` 对当前 `q` 及同类别贡献，正文只留 KL 定义、变量含义和解释曲线所需的短推演。旧 `p` 与新的 KL 对象不重教 softmax/CE；完整梯度链、严格非负证明与反向散度数值表移至 Reference 按需查看。

**U3 / Logit Matching。** 读者刚比较过概率目标，接下来要看直接保留整组分数会多约束什么。主视觉仍用同一类别轴对照冻结 `z` 和当前 `a`，并保留原三类例足以读懂平方距离；主线显示 `||a-z||²`、符号角色和必要结果。完整链式求导及长数值代入按需展开；KL 与 logits 的关键差异及 W4 需要的共同平移反例不能删成新的理解缺口。

**U4 / Reservoir。** 读者已经知道候选是 `(x,z)` 且 `z` 冻结，需要理解容量 `K`、池 `M`、计数 `N` 如何在持续到达中共同变化。主视觉须看到同一批有身份的记录流、固定槽位、一次完整抽签，以及替换与拒收的不同结果；正文紧邻说明满池规则和拒收后 `N` 仍递增。`K/n` 归纳证明移到旁支；独立概率曲线不再占据主舞台。

**U4 / DER 单步。** 读者刚学完选留，需要把回放接回训练顺序。主画面必须呈现当前 `(x,y)` 与旧 `(x,z)` 两条输入、更新前同一个 `θ`、当前 CE 与历史匹配如何合成一次更新，最后才处理候选入池；`z` 始终可追踪为固定副本。只保留联合目标和一次更新所需解释；不重讲 CE、平方差和完整输出/参数梯度，拒收不取消本步训练必须讲清。

**U5 / 增强。** 读者已理解原图与冻结 `z`，现在要看保存时和回放时的视图为什么可以不同。主视觉展示同一原图身份、实际可区分的 `A₀(x)` 与 `A₁(x)`，以及二者共用同一 `z`；关键公式是当前视图与该冻结目标的匹配，旁边直接解释。均值—方差等式作为就近可展开的帮助，不先挤占主画面；合成小模型与图像像素变换的边界必须标明。

**U5 / DER++。** 读者已知道匹配目标稳定但未必正确，需要看到真实标签为何提供另一方向的监督。开场直接展示真实 `y` 与错误旧 `z` 的冲突，再让 `Rd`、`Ry` 从写入前同一记忆分别抽取，可重合也可不同；当前损失和两种历史监督最终只触发一次联合更新。保留三项联合目标、职责和“提供纠偏机会但不保证改对”；不再逐页重教 CE/L2 或展开全梯度。

**U6 / 四轮贯通。** 读者已掌握局部操作，目标是沿同一 `θ、M、N` 重建从空池、回放、替换到拒收与只读预测的真实执行。主画面连续继承轮次状态，每一步只唤回必要符号，不把四轮拆成彼此独立的框图，也不重复整套损失推导；完整 `W`、梯度和精度表留在可复核细节。

**U7 / 实验证据。** 读者已能解释算法，接下来需要按协议判断哪些结论被实际结果支持。正文以清楚的对照图、条件和简短解释呈现 Class-IL、Task-IL、MNIST-360、容量与占优/不占优结果；完整源表与附加分析按需查阅。这里的主任务是证据比较，不需用无关动画增加交互。

### P0 已执行范围

`FormulaLesson` 的固定三段 DOM 模板已拆成中性的 `ReadingUnit` 容器和由各阅读模块自行组合的片段。各模块当前仍显式保留既有显示顺序，后续重排留在其自己的设计/实现中；共享组件和浏览器测试不再强制七个模块统一“公式先行”。测试仍核对七个阅读单元各自保有公式、解释与机制入口，MathML 尺寸/边界、公式数值/曲线交互、数据一致性及 D1 侧栏回归。此 P0 只撤销模板/测试门禁，不代表 W9 接受当前公式页的构图。

源仓库已通过其 README 规定的共享 Playwright 锁定版本运行两档 Chromium；截图和交互回归保存在 `C:/Users/lenovo/.codex/visualizations/2026/10/29/01a18566-4e3d-7401-968f-252bee2a2d93/der-p0` 与 `.../der-p0-formulas`。自动回归为两档公式专项 122 项、两档截图反馈专项 42 项、单元测试 24/24 与生产构建 PASS；实际查看了七个公式关键片段及 KL/D1 代表画面。截图测试为 headless Chromium；真实浏览器 F11 未运行。完整页面重做、S4–S6 的高保真方向审阅与 W9 复审仍在后续阶段。

### P1 方向稿与短动态预览（2026-10-29）

P1 只提供 Reservoir、增强视图、DER++ 三个方向供用户审阅。入口是 Vite 开发预览专用的 `web/enhanced/p1-review.html`，不改正式 `App.tsx` 路由，生产构建也不包含该入口。原有 `reservoir-model.ts`、`training-model.ts`、D1 已认可生命周期和论文数据均未修改。

- Reservoir 直接显示既有预设轨迹的连续流、两个固定槽、同槽替换和拒收；动画的中间帧表现旧记录离槽，提交帧显示 x₃ 占据原槽，拒收后 N=4、M 保持不变。
- 增强方向用同一合成原图身份展示保存时视图和可切换的裁剪/翻转回放视图；冻结 z 与当前 a 并列。图像为合成 SVG，logits/损失来自既有 W5 二维小模型，画面已标出二者边界。
- DER++ 方向沿用 E04 合成错例（真实 y=Claude、旧 z 将 GPT 排第一），独立展示 Rd/Ry 可重合或抽到不同记录，以及当前 CE、dark 匹配和标签 CE 汇入一次 θ 更新；不承诺更新后必定纠错。

P1 复核：`npm.cmd --prefix papers/der/web/enhanced run build` PASS（tsc、Vite 75 modules），生产 `dist` 不含 `p1-review.html`。仓库公共 Visual QA runner 经本机 Edge 156.0.4314.50 在 1440×900 和 1920×1080 捕获 20 个状态，20/20 PASS；`GEOMETRY_QA`、`BROWSER_ERRORS` PASS、浏览器错误为 0、无横向溢出/裁切/12px 以下语义文本。实际截图已审阅三种方向的静态/动态关键帧。该 runner 将 `STYLE_QA`、`REGRESSION`、其自身的 `BUILD`、`VISUAL_REVIEW` 留作 NOT_RUN；构建和人工图像复核分别另行完成。页面内容在较小窗口中可纵向滚动，截图为完整页面。

Playwright Chromium 安装在本轮因 CDN DNS 失败（`ENOTFOUND cdn.playwright.dev`）；按照已实跑的 `docs/VISUAL_QA.md` Windows 回退流程，使用本机 Edge 完成同一 runner 的预览。这支持流程可用，不代表 Chromium 下载成功。报告和 20 张截图归档于 `C:/Users/lenovo/.codex/visualizations/2026/10/29/01a18566-4e3d-7401-968f-252bee2a2d93/der-p1`。P1 的 Agent 视觉复核完成；方向选择、P2–P4 和 W9 最终人工验收仍待用户审阅，本阶段不启动它们。

#### Reservoir 视觉反馈返修（2026-10-29）

用户指出原 Reservoir 画面的箭头、虚线、动画节奏和抽签控件不协调。本轮重排该方向稿：将抽签移到输入流与固定槽之间，统一“写入”绿色实线箭头和“离池”琥珀色虚线；替换与拒收各自落到明确的池外收纳区。旧记录移出和新候选写入分段运动，到站后淡出交接；固定槽只显示最终留存，满池选择值在收紧的决策卡中突出。没有修改算法、轨迹、正式页面或增强/DER++ 场景。

修订后 `npm.cmd --prefix papers/der/web/enhanced run build` PASS（75 modules）。公共 Visual QA 用 Edge 156.0.4314.50 在 1440×900 与 1920×1080 的 20 状态全部 PASS，几何、浏览器错误均 PASS，0 浏览器错误；实看替换中段、替换完成、拒收三个 Reservoir 关键帧，确认箭头落点、抽签卡、动画交接及两档布局。最终报告为 `C:/Users/lenovo/.codex/visualizations/2026/10/29/01a18566-4e3d-7401-968f-252bee2a2d93/der-p1/reservoir-revision-20261029/run-2026-10-29T03-41-46-385Z/report.md`，同目录保留截图。人工方向选择与 W9 最终验收仍待用户。
