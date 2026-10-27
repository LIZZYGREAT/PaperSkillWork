import { ReferenceProvider, ReferenceButton } from "../Reference";
import KLPrototype from "./KLPrototype";
import "./review.css";

export default function ReviewPrototypes() {
  return <ReferenceProvider><header className="site-header"><div className="site-header-inner"><a className="site-brand" href="?review=1"><span className="brand-mark">DER</span>教学场景提案</a><nav aria-label="原型导航"><a href="#review-kl">01 概率与 KL</a><a href="./">原切片对照</a></nav><ReferenceButton>参考资料</ReferenceButton></div></header><main className="reading-layout review-page"><p className="review-notice">W7 修订提案 · 合成教学例 · 等待方向审查</p><KLPrototype /></main></ReferenceProvider>;
}
