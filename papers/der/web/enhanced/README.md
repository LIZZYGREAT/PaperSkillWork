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

当前 `/` 仍为旧正式切片（U2/U3/Snapshot 的 wrapper 调用 `LegacyKL` / `LegacyLogit` / `LegacyFreeze`）。`?review=1` 是待审原型工作区；生命周期请直接使用[获认可的专注播放器](http://127.0.0.1:5188/?review=1&focus=lifecycle#lifecycle-player)。两种生命周期显示共享同一组件与时钟，返回阅读保留进度。其余场景需先提交高保真设计，再进行动画重做与正式页整合；W7 保持 PENDING。

展示类别由 `src/data/model-classes.ts` 统一，三类坐标为 `[Claude, GPT, DeepSeek]`；U2 只取 Claude / GPT 两类独立正概率例，不属于 U3 的同一次前向。`ModelPixel.tsx` 的手工像素图通过 `ModelMark.tsx` 复用于原图和旧正式页。这些是合成分类标签，不是品牌模型参与论文实验或性能对比。

`npm run test:browser` 使用仓库 `reusable-kit/demo` 已锁定的 Playwright 测试工具链，自动启动并关闭本项目的生产预览，访问 `/der-review/` 子路径，验证两个桌面尺寸的交互、数学可见性、键盘、参考资料与 reduced motion。默认浏览器为本机 Edge；其他环境可用 `PAPERWORK_PLAYWRIGHT_EXECUTABLE` 指定 Chromium 可执行文件。设置 `DER_REVIEW_DIR` 可保留命名截图。该测试工具链只供开发验证，网页运行时和独立构建不引用仓库外部路径。

仓库根目录还可执行共享检查：

```powershell
node tools/visual-qa/cli.mjs --config papers/der/web/enhanced/visual-qa.json
```

完成截图复核后，使用命令输出的确切 run 目录调用同工具的 `--cleanup-run`。实际检查结果、版本和未执行项记在 `../../design/implementation-plan.md`。

## 图形、数据和组件来源

页面的猫形标记、数据流、类别条和冻结时间轴为原创矢量或 DOM 图形；数值是已批准的合成教学算例，不是论文实测结果。两类概率例子和三类 logits 例子彼此独立。快照只演示生成与冻结时序，不执行真实网络训练。17 项原论文/笔记图像继续为 REFERENCE_ONLY，未复制到公开网页。

SampleToken、RepresentationVector、ResponseMeter、MathTypography、FigureFrame，以及 W7 追加的 TermRef/Popover/types 按 Registry 精确闭包复制到 `src/shared/`；复制身份仍为 candidate，内部未修改。TermRef 提供定位、避让、焦点和点按保持行为，DER 项目样式提供浅暖外观。`term-data.tsx` 统一九个条目的短说明、中文深读、出处和相关导航；英文 Kit reference 字段保留英文，中文内容由本项目 Drawer 读取。DER 的正文、计算、交互和 MathML 在 `src/modules/` 本地实现，依同一 `math-model.ts` 驱动图形与结果，无跨纸运行时依赖。

### 生命周期视觉修订（2026-10-28）

查看 `?review=1#lifecycle-player`。输入、输出和冻结记忆采用 Claude、GPT、DeepSeek 三类像素图，`ModelPixel.tsx` 为手工 SVG 解释图，未下载品牌素材；仅作合成分类类别，不是模型性能比较。网络为相邻层完整全连接的3→5→3结构抽象。

九阶段包含第二次更新后的 `(x₂,z₂)` 写入。`z₂=(u₁,u₂,u₃)` 为当前 x₂ 的更新前响应符号，绝不复用旧图的回放输出 `aⱼ=(1,2,0)`；容量2的第二个空位按0编号显示为 `slot 1`。读写及冻结时序依据 `research/paper-model.md` 的执行整理。前向/反向传播与更新进度同钟连续驱动；阶段菜单支持鼠标与键盘。完整检查记录见 `../../design/implementation-plan.md`，W7等待用户复审。

专注播放入口：`?review=1&focus=lifecycle#lifecycle-player`。左栏包含控制、阶段讲解和公式；右侧等比显示整幅舞台，模型、输出与记忆可同屏观看。示例说明可展开。普通页“专注播放”进入，返回阅读或Escape退出，保留当前播放位置；这不是浏览器F11全屏。

阶段选择停在起点暂停：01 为 `0.0s`，02 为 `7.2s`。“上一步”在当前阶段已有进度时先回该阶段起点；已在起点暂停时，再回上一阶段起点。第一阶段播放中也能回到 `0.0s`；reduced motion 仍显示完整语义帧。DeepSeek 输出卡按用户反馈略加宽，算法和数值未变。
