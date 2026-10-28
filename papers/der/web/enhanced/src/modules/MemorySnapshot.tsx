import SampleLifecyclePrototype from "./review/SampleLifecyclePrototype";
import { Term, ReferenceButton } from "./Reference";
export default function MemorySnapshot() {
  return <div className="snapshot-lesson"><p className="lesson-intro">比较对象已经确定：把更新前的 <Term id="logits" /> 复制为 <Term id="z" />。网络继续学习，这份数值保持原样。下面跟随同一份记录，观察生成、冻结、入池和未来回放。</p><SampleLifecyclePrototype /><p className="lesson-intro">生命周期中的两次写入恰好有空位。流还会继续，容量却固定：下一单元要决定谁留下、谁被替换。<ReferenceButton term="z">核对冻结时序与出处</ReferenceButton></p><a href="#U4-reservoir-and-step">观察有限记忆如何选留 ↓</a></div>;
}
