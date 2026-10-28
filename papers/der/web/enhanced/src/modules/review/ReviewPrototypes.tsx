import { ReferenceProvider, ReferenceButton } from "../Reference";
import { KLBoard, ScoreBoard } from "../MechanismScenes";
import SampleLifecyclePrototype from "./SampleLifecyclePrototype";
import "./review.css";
export default function ReviewPrototypes() {
  return <ReferenceProvider><header className="site-header"><div className="site-header-inner"><a className="site-brand" href="./">DER · 阅读正文</a><nav aria-label="场景导航"><a href="#review-lifecycle">样本生命周期</a><a href="#review-kl">概率与 KL</a><a href="#review-logits">分数匹配</a></nav><ReferenceButton>参考资料</ReferenceButton></div></header><main className="reading-layout review-page"><SampleLifecyclePrototype /><div id="review-kl"><KLBoard /></div><div id="review-logits"><ScoreBoard /></div></main></ReferenceProvider>;
}
