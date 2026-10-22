# PaperSkillWork 宏观工作流 v3

本工作流用于制作能帮助读者理解论文内容与动机的教程。基本顺序是：

> 先确定论文的学习主线，再筛选内容优先级；先明确优先级，再设计交互；两者都明确后再开始实现。

W 阶段描述的是制作流程，不是固定的章节提纲。只有 W6 才开始编写教程页面代码。W2、W4、W7、W9 需要人工进行语义评审；W0、W1、W3、W5、W6、W8 通过结构检查后自动完成。W10 由使用者在 PaperSkill 中完成官方发布流程后记录。结构检查不能证明教程具备良好的教学效果。

本文定义 W0–W10 的阶段契约和结构状态门禁；各阶段的具体执行步骤见 [任务对应的 Skill](../AGENTS.md#task-routes)。教学逻辑与示例规则见 [TEACHING_DESIGN_STANDARD.md](TEACHING_DESIGN_STANDARD.md)，网页浏览器检查见 [VISUAL_QA.md](VISUAL_QA.md)。`tools/paper.py stage ... complete` 只验证代码明确实现的结构与覆盖条件；它不会运行项目测试、构建、浏览器、截图复核或人工学习判断。本次修订不改变阶段或机器可读 schema。

## W0–W10 一览

```text
W0 来源登记
 ↓
W1 原文缓存与素材清单
 ↓
W2 论文理解模型
 ↓
W3 证据与素材筛选
 ↓
W4 学习主线与信息优先级
 ↓
W5 视觉与交互规划
 ↓
W6 首个纵向切片
 ↓
W7 人工学习体验评审
 ↓
W8 完整实现
 ↓
W9 学习效果与证据审计
 ↓
W10 上游打包与预检
```

| 阶段 | 要回答的问题与工作内容 | 完成条件 |
| --- | --- | --- |
| W0 | 当前处理的是哪篇论文、哪份来源？记录标题、作者、期刊/会议与年份、来源类型和位置；如有 URL 和来源哈希，也一并记录。此阶段不设计章节、比喻或动画。 | `paper.yaml` 中的必需来源元数据齐全后自动完成。 |
| W1 | 后续工作能否依赖一次稳定、完整的原文阅读和执行依据？完整读取或提取原文，缓存 Algorithm、关键公式与符号、结构图、执行顺序及其定位；没有正式伪代码时，保留足以恢复流程的文字依据。同时登记全部视觉素材。此阶段不设计教学顺序、数学课程或 UI 动画。 | 现有缓存文件、清单元数据和图表目录都通过校验后自动完成。 |
| W2 | 论文实际上怎样执行？基于原文建立论文理解模型，涵盖问题、洞见、对象、架构、流程、状态/时间、训练/运行、结果和局限，并用来源明确的伪代码整合输入、初始化、真实顺序、跨轮状态与独立的推断入口。此阶段不设计网页。 | **人工评审：** 单看模型即可指出初态、一步操作、更新后状态、下一轮继承对象和推断入口，且真实顺序未因教学方便而改写。新执行模型的 CLI 结构检查只在首次提交 W2 complete 时执行；日常检查不追溯性否决此前已接受的 W2。机器检查不判断算法语义是否正确。 |
| W3 | 哪些解释与关键算法语义可以安全发布，哪些原文视觉素材有帮助？核验核心伪代码、公式、状态转移及训练/推断分工，区分论文算法、等价整理和教学假设；逐条建立必要证据，并为每项视觉素材决定使用或排除。 | 结构和引用通过检查后自动完成。若来源/证据冲突尚未解决、表述不安全或素材使用权不明确，则保持阻塞。 |
| W4 | 读者应如何从已有认识发现问题、按需引入机制与数学工具，并最终重建真实算法？写出连续推演、概念首讲与回收边界、关键数学的渐进解释，以及至少一个依据 W2 的完整算法贯通环节；为每个候选内容标记 `CORE`、`SUPPORTING`、`REFERENCE` 或 `DELETE`。 | **人工评审：** 以读者视角走通因果链，并确认最终整合阶段能串起真实执行；首讲位置与数学工具的引入时机合理。 |
| W5 | 如何把已确认的 W4 教学逻辑和 W2 真实算法变成页面表达？决定正文、图形、公式、伪代码、交互、动画或整体场景的分工；为复杂场景登记对象生命周期、语义帧对齐和保护边界，并为完整贯通环节重新设计整体表达。 | 机器可读的实现计划覆盖所有优先级并通过校验；同时以 `python tools/paper.py paths <paper-id> --json` 的绝对 `publish_source` 确认实际发布源码、React/Vite 入口与元数据、组件注册、资源子路径及特殊依赖风险。只在现有 Design Handoff 中记录有证据的硬冲突和待决取舍，不把生成器视觉偏好机械套用到自定义页面。此时还不写页面代码或运行 Import/Preflight。 |
| W6 | 首个切片能否形成可体验的认知推进闭环？实现通常为 2–3 个主线阶段的最小真实切片，使读者从问题、机制、操作走到结论与下一问题。 | CLI 只检查切片覆盖和必要源码入口。Agent 使用 `paths.publish_source` 的绝对路径直接运行当前官方 `syntax-check.js --require-parser` 与 `validate-output.js`，并另行执行切片构建、交互和浏览器检查；解释真实 warning，不造占位内容。只记录 `UPSTREAM_SYNTAX`、`UPSTREAM_OUTPUT`、`SOURCE_BUILD`、`SUBPATH_ASSETS` 四项独立状态；上游 revision 或解析器不可核实时，受影响项为 `NOT_RUN` 并说明原因。CLI 通过或任一上游源码检查通过均不代表学习质量验收通过。 |
| W7 | 初次阅读者是否理解为什么引入机制、能否准确解释关键操作、能否从图文共同得到结论并自然进入下一部分？此时不要求最终贯通页完成。 | **人工评审：** 记录 PASS/REVISE 和理由。REVISE 时记录反馈与保留项、修复切片、重跑 W6 范围的 QA 并再次人工复审；不重复提交已完成的 W6 complete，也不重置 W4/W5 阶段状态。 |
| W8 | 如何按已批准语义完成全部内容？以同一计算模型驱动数据、状态、公式与动画，逐段验证复杂流程与交接；实现全部 CORE，紧凑呈现 SUPPORTING，将 REFERENCE 放在主线之外并省略 DELETE。 | CLI 只检查实现覆盖和素材文件条件。Agent 对将要发布的同一源码重跑当前官方语法/输出校验，运行实际项目构建与测试，并在生产产物和非根子路径下检查资源及浏览器网络；在现有计划记录 `UPSTREAM_SYNTAX`、`UPSTREAM_OUTPUT`、`SOURCE_BUILD`、`SUBPATH_ASSETS` 的状态、命令、工具版本与证据。 |
| W9 | 学习者能否说明关键机制为何需要，并沿认知连续、数学解释充分的主线重建真实算法？人工核验完整贯通场景的独立设计，以及代表性初态、中间态、交接与终态中文字、图形、公式、动画、数据的一致性；同时审阅证据、视觉、无障碍、移动端和示例边界。 | 人工评审：确认 W8 使用当前官方工具检查的源码与 `paths.publish_source` 指向的 W10 源一致，实际操作最终桌面/移动页面；在 audit/final-check.md 区分兼容预检、正式 W10 Preflight、Agent 视觉复核和人的学习/证据结论。源码若有后续变化，重查受影响项目。 |
| W10 | 教程能否作为独立上游项目导入和验证？ | W9 经使用者确认后，使用者在现有 PaperSkill 检出中运行官方 Import、validate、`npm run catalog`（检查后安全恢复自动索引）和 preflight；通过后再记录 W10。它仍是唯一正式发布门禁。操作步骤见唯一的[人工投稿操作手册](UPSTREAM_RELEASE.md)。 |

## W1：原文缓存与视觉素材清单

使用以下目录结构：

```text
source-cache/
├── content.md
├── manifest.json
├── evidence.json
└── figures/
```

`content.md` 保存完整提取或转录的论文文本，并按章节、页码、公式记录定位信息；其中应能定位原文 Algorithm、关键公式与符号、结构图、算法执行顺序。论文没有正式伪代码时，保留足以支持后续流程整理的文字依据。`manifest.json` 保存来源元数据、可用时的来源哈希、提取信息，以及所有原文图表。每项图表至少记录 `id`、`locator`、`caption`，并可选填 `image_path`、`type`、`candidate_role`。`evidence.json` 保存建立证据登记表所需的原文定位笔记。继续使用这三份现有缓存，不增加第二份伪代码缓存或新元数据 schema。缓存内容是内部规划资料，不会自动成为公开教程内容；W1 不提前安排教学顺序、数学知识课程或 UI 动画。

原文视觉素材按以下类型分类：`ARCHITECTURE`、`PIPELINE`、`ALGORITHM`、`MECHANISM`、`RESULT`、`ABLATION`、`DATASET_EXAMPLE`、`QUALITATIVE_RESULT` 或 `LOW_VALUE`。清单必须包含所有原文视觉素材，包括之后决定不使用的素材。

## W2：论文理解模型；W3：证据与素材筛选

论文理解模型只回答“这篇论文在做什么、实际怎样执行？”。它首先应以简短段落说明原有问题、作者做出的改变，以及这种改变可能带来的帮助。对于复杂系统，应在规划界面前记录组件、所有权、连接/分支、输入、输出，以及共享部分和任务专属部分。追踪一条完整的数据流、状态流或请求流。对于训练类论文，适用时记录输入、输出、监督信号、损失、反向/控制信号和参数更新。

`research/paper-model.md` 的 `Algorithm Execution Model` 是连贯执行模型：说明原文伪代码与整理版的关系，列出输入与初始化，以伪代码保留真实的训练/更新顺序、关键分支和多轮循环，单独描述预测/推断入口，并区分临时值、派生值、跨轮持久对象、模型参数、冻结量和可更新量。缺少正式 Algorithm 时必须将流程标作依据原文整理，不得伪称原文伪代码；关键操作指向页码、公式、算法或章节，但不要求每行重复引用。已有 Data Flow、State and Time、Training、Inference / Runtime 用于解释架构和局部机制，不各自重写一整套算法。

证据登记表回答“哪些内容可以安全地表述？”。每条重要主张都要记录证据 ID、主张、来源定位、类型、适用条件和允许使用的措辞。类型包括 `PAPER_FACT`、`PAPER_RESULT`、`AUTHOR_INTERPRETATION`、`OUR_INTERPRETATION`、`IMPLEMENTATION_MAPPING`、`GENERAL_BACKGROUND` 和 `TEACHING_EXAMPLE`。数值结果应关联对应的数据集、模型、数据划分、指标和实验协议。W3 还要确认 W2 的核心伪代码、关键公式、重要状态转移和训练/推断分工可追溯，并区分论文原有算法、根据原文抽象的等价表述以及教学假设或合成演示；只为关键或容易误解的映射使用现有类型建立证据，不复制整套伪代码或新增字段。W3 不决定教学页面顺序，也不因公式复杂而把它提前教学。

对于选作教学用途的素材，W3 记录来源论文/版本、图表编号和页码、来源定位/路径、原始图注、教学作用、处理计划、证据链接、署名信息及已批准的使用权依据。原图必须存在于 `source-cache/figures/`；W3 不要求生成衍生图。W5 在 `design/implementation-plan.md` 中增加机器可读的素材映射，将每项选用的公开素材分配到一个学习主线阶段或 `Reference Hub`，并选择 `original`、`crop`、`redraw` 或 `overlay`。W6/W8 期间生成 `assets/figures/web/` 下的衍生图和对应网页副本；W8 检查网页文件与 README 来源说明。W10 由 PaperSkill 官方 Import 直接生成正式版本，并由官方 validate 和 preflight 检查。对于重要但未使用的素材，应说明原因。能访问论文 PDF 并不代表获得了图片使用权。

## W4：信息优先级与学习主线

人工确认一条问题驱动的因果/运行主线，并为每个内容项分配唯一优先级：`CORE`、`SUPPORTING`、`REFERENCE` 或 `DELETE`。CORE 必须安排在主线上，SUPPORTING 保持精简，REFERENCE 位于主线之外，DELETE 省略。`Reader's Causal Path` 要用足以支撑页面编写的连贯文字说明读者已有状态、新问题、机制或数学工具的引入理由、所得理解和向后交付的问题；同时记录术语首讲、引用式回收、不可抢跑的知识、核心数学的渐进解释策略，以及至少一个重新组织而非拼接前页的算法贯通阶段。W4 不写网页逐字稿，也不指定图形、动画布局或技术组件。现有 `stages` / `items` YAML 仍是唯一机器可读的优先级和覆盖来源，不新增逐页 schema。W4 的审查契约与具体步骤见 [TEACHING_DESIGN_STANDARD.md](TEACHING_DESIGN_STANDARD.md) 和 `learning-architecture` Skill；此处不规定章节数或页面字段。

## W5：交互规划

W5 把已确认的 W4 学习主线和 W2 执行模型交接为现有 `design/implementation-plan.md`。它决定正文、图形、公式、伪代码、交互、动画与整体系统场景的表达分工，但不改写 W4 的首讲顺序和因果链，也不改变 W2 的真实算法。对复杂教学场景，在现有自由文本中登记教学目的、读者已有认识、固定输入、持久/临时状态、输出与生命周期、稳定对象身份、页面承接、可调整细节和必须保护的语义、计算、顺序与视觉关系；普通文字页不套用帧模板。

完整算法贯通场景先由 W2 推出全局执行模型，再针对系统理解重新设计整体构图、主次信息、跨阶段转换、叙事焦点和关键状态可见性，而不是把先前组件拼在一起。仅为重要或高风险时刻记录精简语义帧契约，使 W2 操作、进入状态、计算/触发、离开状态、图形动作、正文/公式、保护不变量与核验方式对齐。复杂度本身不是缺陷；允许长流程、多层动画、精密空间关系和充分解释，只要每个重要变化都传递明确算法事实。

`implementation:` 下的 YAML 代码块仍是唯一机器可读计划：每个 CORE 恰好映射一次，每个 SUPPORTING 有精简位置，REFERENCE 位于主线之外，DELETE 不进入实现；证据与阶段引用必须能解析。不新增复杂场景 schema。

`vertical_slice.stages` 与 `required_core_items` 定义 W6 覆盖范围；选用的素材须映射到 Learning Spine 阶段或 Reference Hub 并指定渲染方式。可复用模式名称必须登记于 `reusable-kit/registry.yaml`，使用和复制边界见 [`docs/reusable-kit.md`](reusable-kit.md)。

### 上游要求处理

W5 不再要求所有项目手写章节/模块映射表。按真实学习主线设计页面，并用 `python tools/paper.py paths <paper-id> --json` 的绝对 `publish_source` 在现有 design/implementation-plan.md 记录实际源码路径、React/Vite 接收结构、真实教程元数据/注册关系、Vite 子路径资源方案和特殊依赖/API/网络/构建风险。该路径使用共享 Final-first/Enhanced-fallback 逻辑，不读取贡献者 Git 配置；配置的 Final 目录缺失时必须报告错误，不能静默回退。W10 仍使用 `release-info --json` 读取论文/发布者元数据。只有影响真实接收的具体冲突才记录官方证据、待决取舍和受保护的已批准设计；将 `contract.md` 的生成器专属视觉约定按适用范围判断，不转化为统一画布或教学模板。W5 不运行 Import/Preflight。

新建网页时模板直接提供完整的 React/Vite 源入口。`src/data/tutorial.ts` 由真实页面实现同步填充；自定义 App 可以直接渲染页面，不需要虚构 `componentId`。不得生成空白章节、假交互、占位模块或第二套教学运行时。

## W6–W9：实现与评审

W6 只实现计划中的首个真实切片；模板已提供正式源码入口。切片要形成可真实体验的认知推进闭环，范围通常为 2–3 个阶段但可按内容调整。`tools/paper.py stage ... W6 complete` 检查结构覆盖和源码入口，不会执行依赖安装、构建、浏览器或上游检查。切片可构建后，Agent 用 `paths.publish_source` 绝对路径直接运行相邻 PaperSkill 检出中的官方 `syntax-check.js --require-parser` 和 `validate-output.js`，并单独检查交互和浏览器。真实 partial-slice warning 应解释，不得伪造未来章节或注册项；当前上游版本或解析器无法核实时，将受影响的 `UPSTREAM_SYNTAX` / `UPSTREAM_OUTPUT` 分别记为 NOT_RUN，W8 须在最终源码上补跑。交付时列出四项独立状态、实际命令/退出码、上游 revision/工具版本、证据、浏览器状态/视口范围和 NOT_RUN 原因。检查报告和关键截图后，将结论记入现有 implementation-plan，再用 Visual QA runner 的显式入口清理本轮单个 run 目录；失败证据保留到诊断/复测完成。无需新建报告，使用现有 implementation-plan、Visual QA 产物和任务交付说明。

W6/W8 的上游校验器版本必须可复核：检查相邻 PaperSkill `git remote -v`、工作区状态、HEAD 和两个目标脚本；仅在 `upstream` 明确指向官方 `ReductTech/PaperSkill` 且工作树干净时尝试 `git fetch upstream main`。Fetch 失败就记录网络/远端错误，缓存的 `upstream/main` SHA 不得称为当前版本。个人分支不需要切换或覆盖，但其本地实际执行脚本必须与成功更新的 `upstream/main` 对应文件逐字一致；缺文件、内容不一致或无法验证时，当前官方兼容状态为 NOT_RUN。本项目依赖按其锁文件安装后才能运行 `--require-parser`，不得接受缺少解析器时自动跳过。SHA、命令、退出码、版本和 warning 记在既有 implementation-plan/final-check，不创建历史日志。

W7 是独立的人类学习效果门禁，分别审阅机制引入理由、关键操作准确性、图文共同作用和向后承接；它不要求尚未实现的最终贯通场景完成，只有记录 PASS 后才能进入 W8。REVISE 后在原计划中记录反馈、受影响范围与须保留的已批准内容；修复切片并重跑 W6 范围的构建、交互和视觉检查，再由人复审。这里“重跑 W6”是重跑检查，不是再次执行已完成的 `stage ... W6 complete`。如果要改变 W4 核心教学顺序或推理，先由用户明确重新确认并记录决定；W4/W5 已完成的状态不因此自动回退。

W8 完成计划覆盖。复杂流程按可独立验证的真实状态片段推进，以同一项目级数据/计算模型派生算法输出、对象身份、状态转移、公式和动画；教学可见状态只呈现论文状态与推导结果，不改变其语义。重要状态应可定位、复现、暂停核对，并检查初态、中间态、跨段交接、终态和必要的连续运动；不能以降低复杂度为由砍掉真实语义，也不能用整张静态画面替换伪装连续计算。普通样式修复不得删除已批准的文字推演、公式映射或动画关键状态；改变既定教学逻辑前请求用户决策。`tools/paper.py stage ... W8 complete` 只检查实现覆盖和素材文件条件，结构完成不等于工程质量 PASS，也不会执行项目测试、构建、DOM 断言、浏览器或上游检查。Agent 必须在 `paths.publish_source` 指向的最终发布源上重跑官方语法/输出校验（若不可用须分别说明 NOT_RUN）、项目测试、实际生产构建、DOM/数据不变量，以及按 VISUAL_QA.md 检查的子路径产物与浏览器网络；只记录 `UPSTREAM_SYNTAX`、`UPSTREAM_OUTPUT`、`SOURCE_BUILD`、`SUBPATH_ASSETS` 四项 PASS / FAIL / NOT_RUN，并在现有计划中写实际命令、退出码、已核实的 PaperSkill `upstream/main` SHA、工具版本、证据和 NOT_RUN 原因。任何源码后续变化都要重跑受影响检查；存在必需的 FAIL 或 NOT_RUN 时不得笼统宣称 W8 质量 QA 全通过。检查记录沿用 implementation-plan、Visual QA 产物和 W9 final-check，不以 CLI 或构建替代视觉、语义或人工学习验收。检查报告及关键截图后，结论写入现有 implementation-plan，再清理本轮单个 runner 目录；失败诊断和所需复审结束前保留必要证据。

W9 由人审阅最终学习效果、证据和呈现，记录于现有 `audit/final-check.md`。确认 W8 四项状态与证据对应于最终 `paths.publish_source`，并实际操作最终桌面及移动端页面；如源有变化，重跑受影响检查并重新查看相关页面。存在必需 FAIL/NOT_RUN 时，不能把总体 QA 写为全通过。分别记录源码兼容预检、人工学习/证据验收及尚待 W10 证明的官方 Import/Validate/Preflight，不能相互冒充。检查并记录截图结论后，只清理本次确切 runner 目录；需要诊断或复审的证据先保留，清理后不引用已失效截图路径。各阶段具体步骤见对应 Skill 和 [`VISUAL_QA.md`](VISUAL_QA.md)。

## W10：一次正式上游预检

W9 经用户接受后，由用户按[唯一的 W10 投稿手册](UPSTREAM_RELEASE.md)在既有 PaperSkill 检出中运行官方 Import、validate、目录生成检查（恢复自动索引）和 preflight，再记录 W10。该阶段是唯一正式发布门禁；Codex 不运行 PaperSkill 发布命令、Push 或 PR。细节以投稿手册为准。

## 工作区文件

`tools/paper.py new` 生成的文件、路径和占位符以 [`TEMPLATE_CONTRACT.md`](TEMPLATE_CONTRACT.md) 为准。每项设计决策留在对应的现有论文级文档中，不新增平行合同。

## 工具行为与历史工作区

Workflow v3 is the only active workflow contract. `tools/paper.py` validates metadata, source caches, evidence and asset plans, implementation coverage, and workspace paths. W2/W4/W7/W9 require `--reviewed-by` and `--note`; W0/W1/W3/W5/W6/W8 record `completed_by: automation` after their checks pass. W10 records the user's successful official PaperSkill preflight and does not check a PaperSkillWork export or machine report. The tooling does not judge teaching quality.

Historical v1/v2 artifacts are preserved by Git history and are not supported by the current CLI or tests. Inspect historical work through Git history or migrate it manually into a new Workflow v3 workspace.
