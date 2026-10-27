# Implementation Plan: Dark Experience for General Continual Learning: a Strong, Simple Baseline

Paper ID: `der`

## Learning Goal and Non-goals

本稿是 W5 第一轮设计提案。依据已确认 W4 的 S1–S8，把“问题为何引出机制”翻译为可观察的图文关系，再决定哪里需要交互。读者应从有限 ER 的不足，走到概率/KL、logits、在线记忆、增强和标签监督，并最终沿同一组状态重建 DER / DER++。

本轮只改设计文档与 CLI 阶段状态；不写 React/CSS、不复制 Kit、不运行 DER 网页、Import 或 Preflight。个人笔记不作为事实来源，17 项原图表保持 REFERENCE_ONLY。I24–I26 不实施；I21–I23 留在主线外，I12–I20 采用紧凑放置。行间数学使用独立的两组 `$$`，加粗结束标记后留空格。

## Design Handoff, Invariants, and Change Scope

- Design confirmation: DRAFT。W4 因果链及取舍已获用户确认；本稿的页面组织、三大场景构图和 W6 范围尚待本轮讨论。
- Rendered-page acceptance: PENDING。本轮没有新的网页或效果图验收。
- W5 CLI structural completion: IN_PROGRESS，由 `paper.yaml` 独立记录，不能据提案结构检查通过代替设计确认。
- 基准：执行前 HEAD 为 `381d369ae7d12d3530bfd527179214a2eb141df1`，分支 `der`，工作区干净。
- 已确认边界：W2 决定真实先读后写顺序；W3 决定事实与素材边界；W4 决定 S1–S8 顺序、数学首讲、CORE 及独立贯通任务。本稿不修改三者。
- 保护对象：同一输入 x 与标签 y；更新前生成并冻结的历史 z；唯一可训练网络 θ；固定容量 K、持久记忆 M 和计数 N。禁止用两个网络图暗示常驻 Teacher/Student。
- 可直接调整：局部留白、轴线、字级、图注换行和图文比例；不能借排版删掉关键数学、对象或状态分支。
- 受影响范围：DER 后续页面的局部布局与数据计算；不改 Kit、其他论文或上游工程。

### 页面组织与阅读节奏（第一轮提案）

以下 U 编号是候选阅读单元，非新增工作流/页面 schema。唯一结构化覆盖仍是下方 implementation YAML。七个单元来自内容关系，不是章节或交互数量指标。

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

相邻 PaperSkill 检出 HEAD 为 `c6d30defb90480afb2b4fa6ee8083a27d8dafb5c`，工作树干净，upstream 指向官方 `ReductTech/PaperSkill`。已读本地接收脚本的入口、kind 和 componentId 注册规则，但未同步远端，因此不能称其为当前官方版本的兼容证明。本轮不运行 Import/Preflight。生成器的章节/模块数量校验不能成为新增冗余交互的理由；确认接收路径与自定义表达的适用范围留在本计划，不另建冲突文档。

### Reusable Asset Composition Notes (W5 free text)

第一部分已完成 Registry/Recipe 发现；下一部分将把 S3/S4/S7 的具体构图与真实 dry-run 闭包记录在此。每个资产仍为 candidate；不依据本稿自动批准，不先执行复制。

### Critical Teaching and Integration Scenes

本轮下一部分集中提交 S3、S4、S7 的布局、语义状态和可复算断言；其余普通图文只保留上方职责，不提前锁定几十帧动画。场景均需接住上个单元的结论，并明确向下个单元交付的状态或问题。

## Visual QA State Plan

本轮无新页面，DER 浏览器验收 NOT_RUN。W6 仅对首切片执行普通桌面 1440×900 与全屏布局模拟 1920×1080，真实 F11 另外记录，不能由模拟替代；无移动专项触发。不运行 Kit 全量回归。

## Primary Spine Mapping

以下是覆盖提案，可用于检查遗漏；页面构图及切片尚未由用户确认。S3 虽分两单元，结构化阶段只登记一次；I03 主讲 U2，I04/I05 主讲 U3。S1/S2、S5/S6 可分别共用阅读单元，但 CORE 不重复分配。

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

暂以场景局部实现作为覆盖字段的 null；部件可分别选用，不能把多个资产串写进一个 reusable_pattern。后续部分依据实际源码与 dry-run 定案，候选身份不变。

## Vertical Slice (W6)

推荐 S1–S3，对应 U1–U3，CORE 为 I01–I05。认知闭环为：不能完整保存历史→有限 ER→标签未记录整组响应→概率/KL 可优化→logits 匹配的区别→记录更新前历史 z→引出 S4 的在线留存。S1/S2 合为一个开放图文单元，S3 的两个计算任务各有足够解释空间。

这是待确认范围，不是 W6 开工指令。首切片不实施 reservoir、DER++、四轮完整系统或结果页，不用未来占位组件凑验收；下一阶段问题以正文衔接即可。若用户选择收缩为 S2–S3，须保留短问题入口并同步 YAML，不擅自删 I01 覆盖。

### Vertical Slice Review (W7)

Vertical Slice Review: PENDING

本轮尚无实际切片，未指定 reviewer、未记录 PASS。后续让读者解释：为什么 ER 的旧标签仍不足；固定 p 与当前 q 如何计算 KL；logits 共同平移为什么出现不同惩罚；z 来自何时以及为什么不保存旧网络；有限容量又引出什么问题。还要判断文字与图形能否共同得到这些结论。

## Full Implementation (W8)

仅记录后续边界：W7 通过首切片之后才覆盖 S4–S8、紧凑 supporting 和主线外 reference。S7 需独立整合设计与状态核对。此处不提前实施、不记录任何 W8 PASS。

## Human Acceptance Record

2026-10-27：W4 已获用户确认；用户本轮要求按 W5 方案执行并每部分 commit。按该方案“先向用户展示三个决定性场景的结构/视觉提案”，本轮交付第一轮提案后等待针对构图和切片范围的反馈，再做第二轮定稿。当前不能将 W5 提案或 CLI 结构检查误写为人已批准视觉设计。
