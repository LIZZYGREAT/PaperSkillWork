# PhyAgentOS Workflow v1 Migration

PhyAgentOS 是 PaperSkillWork Workflow v1 建立之前完成的首个实验项目。

因此部分 Workflow Gate 已在实际开发过程中完成，但当时尚未采用标准化产物结构。

## 已完整迁移

- G0 Workspace
- G1 Research
- G3 Canonical
- G6 Enhanced

## Legacy Gate

以下工作实际已经发生，但仍需要按照 Workflow v1 重新整理为标准产物：

### G2 Evidence Audit

此前已经进行了多轮论文原文核对、实验数字核对与网页事实审查。

后续需要整理为：

`research/02_evidence_audit.md`

### G4 Narrative Design

Enhanced 开发过程中已经重新设计过完整的章节认知顺序与徒步类比主线。

后续需要反向整理为：

`design/storyboard.md`

### G5 Interaction Design

当前 Enhanced 已实现多项交互实验。

后续需要把现有实现反向整理为：

`design/interaction-plan.md`

### G7 Final Audit & Release

当前 Release Gate 尚未完成，待创建并验收：

- `audit/content-check.md`；
- `audit/release-check.md`。

此前制作的课程讲稿与演示材料不属于 Workflow v1 Gate 产物；若保留，可作为可选材料存放在：

`presentation/`

目录。最终 PaperSkill 发布仍须通过独立 PaperSkill 仓库的官方 import、validation、build 与 PR 流程。

## Canonical Archive Note

G3 在旧流程中已完成，但 canonical 网页当前没有归档到 `web/canonical/`。作为 PhyAgentOS legacy migration case，`paper.yaml` 保留 G3 `complete`；`paper.py check` 会给出 WARN，不伪造本地 canonical 目录。

## Migration Principle

此次迁移只整理已有成果，不重新设计或修改已验收的 Enhanced 网页。

PhyAgentOS 将作为后续论文 Workflow v1 的参考样板。
