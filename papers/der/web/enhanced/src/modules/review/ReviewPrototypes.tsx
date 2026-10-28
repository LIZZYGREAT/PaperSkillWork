import { ReferenceProvider, ReferenceButton } from "../Reference";
import KLPrototype from "./KLPrototype";
import LogitPrototype from "./LogitPrototype";
import FreezePrototype from "./FreezePrototype";
import SampleLifecyclePrototype from "./SampleLifecyclePrototype";
import "./review.css";

export default function ReviewPrototypes() {
  return <ReferenceProvider><header className="site-header"><div className="site-header-inner"><a className="site-brand" href="?review=1"><span className="brand-mark">DER</span>教学场景提案</a><nav aria-label="原型导航"><a href="?review=1&amp;focus=lifecycle#lifecycle-player">样本生命周期</a><a href="#review-kl">概率与 KL</a><a href="#review-logits">分数匹配</a><a href="#review-freeze">历史冻结</a><a href="./">原切片</a></nav><ReferenceButton>参考资料</ReferenceButton></div></header><main className="reading-layout review-page"><SampleLifecyclePrototype /><KLPrototype /><LogitPrototype /><FreezePrototype /></main></ReferenceProvider>;
}
