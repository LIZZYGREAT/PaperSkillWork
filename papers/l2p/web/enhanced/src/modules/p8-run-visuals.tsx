import "./p8-run-visuals.css";

export function P8StateLedger() {
  return <section className="p8-ledger" aria-labelledby="p8-ledger-title">
    <div className="p8-ledger__intro">
      <span className="p8-ledger__eyebrow">参数状态账本</span>
      <h3 id="p8-ledger-title">任务切换数据流，参数版本接着往下走</h3>
      <p>每个 Θ 都是同一组池与分类器的一份状态快照。批末写回产生下一版；任务边界本身不创建新参数。</p>
    </div>
    <div className="p8-ledger__scroll" role="region" tabIndex={0} aria-label="参数版本账本，可横向滚动查看">
      <table>
        <thead><tr><th scope="col">状态</th><th scope="col">由什么产生</th><th scope="col">下一次读取</th><th scope="col">状态含义</th></tr></thead>
        <tbody>
          <tr><th scope="row"><span className="p8-ledger__theta">Θ₀</span></th><td>一次初始化</td><td>Task 1 · Batch 1</td><td>建立 Key、Prompt 与共享分类器 φ</td></tr>
          <tr><th scope="row"><span className="p8-ledger__theta">Θ₁</span></th><td>Task 1 · Batch 1 批末写回</td><td>Task 1 · Batch 2</td><td>下一批用更新后的 Key 重新检索</td></tr>
          <tr className="p8-ledger__handoff"><th scope="row"><span className="p8-ledger__theta">Θ₂</span></th><td>Task 1 · Batch 2 批末写回</td><td>Task 2 · Batch 1</td><td>交接只换数据，K、P、φ 原样继承</td></tr>
          <tr><th scope="row"><span className="p8-ledger__theta">Θ₃</span></th><td>Task 2 · Batch 1 批末写回</td><td>测试样本</td><td>推断只读这份状态，不再更新</td></tr>
        </tbody>
      </table>
    </div>
    <p className="p8-ledger__scroll-note">窄屏可横向滑动查看完整账本</p>
    <p className="p8-ledger__note">每次版本推进都对应一次完整 Batch 更新；单个样本不会单独创建一个新版本。</p>
  </section>;
}

const forwardNodes = [
  { x: 28, width: 140, first: "图像 x", second: "当前样本" },
  { x: 207, width: 154, first: "Query q(x)", second: "无 Prompt 提取" },
  { x: 400, width: 160, first: "Key 池 · Top-N", second: "读取当前 K" },
  { x: 599, width: 165, first: "所选 P + xₑ", second: "拼接分类输入" },
  { x: 803, width: 135, first: "冻结 fᵣ", second: "权重不更新" },
  { x: 977, width: 125, first: "Logits z", second: "共享分类器 φ" },
] as const;

export function P8TrainInferMap() {
  return <figure className="p8-flow">
    <div className="p8-flow__heading">
      <span>一条共享前向，两个不同的结束方式</span>
      <p>检索与分类使用同一条前向路径；只有训练分支继续接收标签并更新参数。</p>
    </div>
    <div className="p8-flow__scroll" role="region" tabIndex={0} aria-label="训练与推断分岔流程图，可横向滚动查看">
      <svg viewBox="0 0 1130 500" role="img" aria-labelledby="p8-flow-title p8-flow-description">
        <title id="p8-flow-title">共享前向之后分成训练和测试推断两条路径</title>
        <desc id="p8-flow-description">输入图像依次经过无 Prompt Query、Key Top-N 检索、Prompt 条件分类和共享分类器得到 Logits。训练分支结合标签和匹配损失，累积整批梯度后更新参数；测试分支不使用标签、任务 ID 或损失，只选出预测类别，参数 Θ3 保持固定。</desc>
        <defs>
          <marker id="p8-flow-arrow-shared" markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto"><path d="M0 0 7 3.5 0 7" fill="#6f9880" /></marker>
          <marker id="p8-flow-arrow-branch" markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto"><path d="M0 0 7 3.5 0 7" fill="#91a99a" /></marker>
          <marker id="p8-flow-arrow-train" markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto"><path d="M0 0 7 3.5 0 7" fill="#668b72" /></marker>
          <marker id="p8-flow-arrow-infer" markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto"><path d="M0 0 7 3.5 0 7" fill="#789baa" /></marker>
        </defs>
        <text x="28" y="24" className="p8-flow__lane-label">共享前向路径 · 检索与分类</text>
        {forwardNodes.map((node, index) => <g key={node.first} className={`p8-flow__node p8-flow__node--shared${index === 3 ? " p8-flow__node--prompt" : index === 4 ? " p8-flow__node--frozen" : ""}`}>
          <rect x={node.x} y="43" width={node.width} height="58" rx="7" />
          <text x={node.x + node.width / 2} y="68" className="p8-flow__main" textAnchor="middle">{node.first}</text>
          <text x={node.x + node.width / 2} y="87" className="p8-flow__sub" textAnchor="middle">{node.second}</text>
          {index < forwardNodes.length - 1 && <path className="p8-flow__edge p8-flow__edge--shared" d={`M${node.x + node.width + 5} 72H${forwardNodes[index + 1].x - 10}`} markerEnd="url(#p8-flow-arrow-shared)" />}
        </g>)}

        <path className="p8-flow__edge p8-flow__edge--branch" d="M1039 102V138H300V164" markerEnd="url(#p8-flow-arrow-branch)" />
        <path className="p8-flow__edge p8-flow__edge--branch" d="M1039 138H830V164" markerEnd="url(#p8-flow-arrow-branch)" />
        <text x="300" y="184" className="p8-flow__branch-title" textAnchor="middle">训练 · 有标签 y</text>
        <text x="830" y="184" className="p8-flow__branch-title" textAnchor="middle">测试 · 无标签、无任务 ID</text>

        <path className="p8-flow__edge p8-flow__edge--train" d="M300 242V251M300 303V327M300 378V402" markerEnd="url(#p8-flow-arrow-train)" />
        <g className="p8-flow__node p8-flow__node--train">
          <rect x="77" y="195" width="446" height="47" rx="5" />
          <text x="300" y="224" className="p8-flow__main" textAnchor="middle">分类损失 Lcls + 匹配损失 λLmatch</text>
        </g>
        <g className="p8-flow__node p8-flow__node--train">
          <rect x="77" y="254" width="446" height="49" rx="5" />
          <text x="300" y="275" className="p8-flow__main" textAnchor="middle">累积当前 Batch 的样本损失与选集</text>
          <text x="300" y="292" className="p8-flow__sub" textAnchor="middle">每个槽位汇总本批中命中的贡献</text>
        </g>
        <g className="p8-flow__node p8-flow__node--train">
          <rect x="77" y="329" width="446" height="49" rx="5" />
          <text x="300" y="350" className="p8-flow__main" textAnchor="middle">整批反向传播</text>
          <text x="300" y="367" className="p8-flow__sub" textAnchor="middle">梯度流向可训练的 K、P 与 φ</text>
        </g>
        <g className="p8-flow__node p8-flow__node--train-write">
          <rect x="77" y="404" width="446" height="49" rx="5" />
          <text x="300" y="434" className="p8-flow__main" textAnchor="middle">一次优化器写回 · Θᵦ → Θᵦ₊₁</text>
        </g>
        <text x="300" y="487" className="p8-flow__foot" textAnchor="middle">下一批读取新版本并重新检索</text>

        <path className="p8-flow__edge p8-flow__edge--infer" d="M830 242V252M830 303V327" markerEnd="url(#p8-flow-arrow-infer)" />
        <g className="p8-flow__node p8-flow__node--infer">
          <rect x="607" y="195" width="446" height="47" rx="5" />
          <text x="830" y="224" className="p8-flow__main" textAnchor="middle">argmax(z) · 选择最高分类分数</text>
        </g>
        <g className="p8-flow__node p8-flow__node--infer-result">
          <rect x="607" y="254" width="446" height="49" rx="5" />
          <text x="830" y="284" className="p8-flow__main" textAnchor="middle">输出预测类别 ŷ</text>
        </g>
        <path className="p8-flow__read-rule" d="M638 337H1022" />
        <text x="830" y="367" className="p8-flow__read-title" textAnchor="middle">Θ₃ · 只读</text>
        <text x="830" y="393" className="p8-flow__sub" textAnchor="middle">不计算损失，也不反向传播或写回参数</text>
      </svg>
    </div>
    <p className="p8-flow__scroll-note">窄屏可横向滑动查看完整流程</p>
    <figcaption>两种模式共享同一个检索与分类模型；标签决定是否进入损失计算与参数更新分支。</figcaption>
  </figure>;
}
