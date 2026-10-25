import { useState } from 'react';
import { SampleToken } from '../../../foundation/visual-parts/SampleToken';
import { RepresentationVector } from '../../../foundation/visual-parts/RepresentationVector';
import { ResponseMeter } from '../../../foundation/visual-parts/ResponseMeter';
import './retrieval-example.css';

const candidates = [{ id: 'a', values: [1, 0, -1] }, { id: 'b', values: [-1, 1, 0] }];
const queries = [[1, .5, -1], [-.5, 1, .5]];

/** Independent teaching example: raw dot-product retrieval, no classifier head. */
export function RetrievalExample() {
  const [index, setIndex] = useState(0);
  const query = queries[index];
  const results = candidates.map(item => ({ ...item, score: item.values.reduce((sum, v, i) => sum + v * query[i], 0) }));
  const best = results.reduce((a, b) => a.score >= b.score ? a : b);
  return <section className="retrieval-example" data-retrieval-query={index} aria-labelledby="retrieval-title">
    <div className="retrieval-example__copy"><p className="rk-caption">一个新的组合 / 向量检索</p><h2 className="rk-type--heading-2" id="retrieval-title">相同小件，<br />换一种解释。</h2><p className="rk-lead">用内积比较两个候选表示。查询变化时，图、数值与排序一起变化。</p><button type="button" onClick={() => setIndex(1 - index)}>切换查询向量</button><p className="rk-caption">合成教学向量；使用原始内积，未做归一化，不表示概率。</p></div>
    <div className="retrieval-example__comparison"><div className="retrieval-example__query"><SampleToken sampleId={`query-${index}`} label="查询 q"><span aria-hidden="true">q</span></SampleToken><RepresentationVector values={query} label="查询表示" /></div>
      {results.map(item => <div className="retrieval-example__result" key={item.id} data-candidate={item.id} data-score={item.score}><RepresentationVector values={item.values} label={`候选 ${item.id}`} /><ResponseMeter value={item.score} min={-3} max={3} label={`qᵀ${item.id}`} /></div>)}
      <p className="rk-aside" role="status">当前最大内积：候选 {best.id}，{best.score}。<br />两组候选向量保持不变。</p>
    </div>
  </section>;
}
