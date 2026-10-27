# DER 首切片：有限回放 → 概率约束 → 历史 logits

独立的 React / TypeScript / Vite 源码。当前实现 U1–U3、S1–S3 和 I01–I05，等待 W7 人工学习评审。U4–U7 尚未实现。

## 本地预览与验证

在本目录执行：

```powershell
npm ci
npm run dev -- --host 127.0.0.1 --port 5188 --strictPort
npm test
npm run build
```

预览入口为 <http://127.0.0.1:5188/>。三个阅读单元在同一长页，顶部导航可直达；按需点击术语或“参考资料”。核心数学不依赖展开：KL 的定义、变量和交叉熵拆解，以及平方匹配定义与共同平移的原因都在主线。

W7 定向修订已接入主线 U2、U3 和快照演示，等待用户学习评审。可在 <http://127.0.0.1:5188/?review=1> 单独查看交互工作区：KL 按“观察→同类比较→带符号贡献→汇总”推进，可点公式符号或类别；logit 按“对齐→偏差→平方→求和”推进，并显示同源 softmax 概率；冻结演示区分“输出→复制→参数更新→候选等待入池”。顶部可返回主线。该对照入口不改变 W7 的人工 PENDING 状态。

`npm run test:browser` 使用仓库 `reusable-kit/demo` 已锁定的 Playwright 测试工具链，自动启动并关闭本项目的生产预览，访问 `/der-review/` 子路径，验证两个桌面尺寸的交互、数学可见性、键盘、参考资料与 reduced motion。默认浏览器为本机 Edge；其他环境可用 `PAPERWORK_PLAYWRIGHT_EXECUTABLE` 指定 Chromium 可执行文件。设置 `DER_REVIEW_DIR` 可保留命名截图。该测试工具链只供开发验证，网页运行时和独立构建不引用仓库外部路径。

仓库根目录还可执行共享检查：

```powershell
node tools/visual-qa/cli.mjs --config papers/der/web/enhanced/visual-qa.json
```

完成截图复核后，使用命令输出的确切 run 目录调用同工具的 `--cleanup-run`。实际检查结果、版本和未执行项记在 `../../design/implementation-plan.md`。

## 图形、数据和组件来源

页面的猫形标记、数据流、类别条和冻结时间轴为原创矢量或 DOM 图形；数值是已批准的合成教学算例，不是论文实测结果。两类概率例子和三类 logits 例子彼此独立。快照只演示生成与冻结时序，不执行真实网络训练。17 项原论文/笔记图像继续为 REFERENCE_ONLY，未复制到公开网页。

SampleToken、RepresentationVector、ResponseMeter、MathTypography、FigureFrame，以及 W7 追加的 TermRef/Popover/types 按 Registry 精确闭包复制到 `src/shared/`；复制身份仍为 candidate，内部未修改。TermRef 提供定位、避让、焦点和点按保持行为，DER 项目样式提供浅暖外观。`term-data.tsx` 统一九个条目的短说明、中文深读、出处和相关导航；英文 Kit reference 字段保留英文，中文内容由本项目 Drawer 读取。DER 的正文、计算、交互和 MathML 在 `src/modules/` 本地实现，依同一 `math-model.ts` 驱动图形与结果，无跨纸运行时依赖。
