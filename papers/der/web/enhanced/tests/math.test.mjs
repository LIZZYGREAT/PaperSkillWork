import test from "node:test";
import assert from "node:assert/strict";
import { softmax, probabilityComparison, logitComparison, REFERENCE_P, PROBABILITY_CASES, HISTORY_Z, LOGIT_CASES, LABEL_OLD, LABEL_CURRENT } from "../src/modules/math-model.ts";

const near = (actual, expected, tolerance = 1e-12) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
test("softmax is stable and preserves normalized class coordinates", () => {
  const small = softmax([2, 1, 0]); const large = softmax([1002, 1001, 1000]);
  near(small.reduce((a,b) => a+b), 1); small.forEach((value,i) => near(value,large[i]));
  assert.ok(small.every((value) => value > 0));
});
test("all approved probability cases use one fixed target and match KL / entropy identity", () => {
  const expected = [0.09151622184943578, 0, 0.8317766166719343];
  PROBABILITY_CASES.forEach((item,index) => {
    const before = [...REFERENCE_P]; const result = probabilityComparison(REFERENCE_P,item.values);
    near(result.kl,expected[index]); near(result.kl,result.crossEntropy-result.entropy);
    assert.deepEqual(REFERENCE_P,before);
  });
  assert.ok(probabilityComparison(REFERENCE_P,PROBABILITY_CASES[0].values).terms[1] < 0);
});
test("KL output gradient agrees with finite differences through softmax", () => {
  const a=[Math.log(.6),Math.log(.4)], epsilon=1e-6;
  const result=probabilityComparison(REFERENCE_P,softmax(a));
  a.forEach((_,i) => { const plus=[...a],minus=[...a];plus[i]+=epsilon;minus[i]-=epsilon;
    near((probabilityComparison(REFERENCE_P,softmax(plus)).kl-probabilityComparison(REFERENCE_P,softmax(minus)).kl)/(2*epsilon),result.gradient[i],1e-9);
  });
});
test("logit examples keep history frozen, with correct distance and gradient", () => {
  LOGIT_CASES.forEach((item,index) => {
    const before=[...HISTORY_Z];const result=logitComparison(HISTORY_Z,item.values);
    assert.equal(result.squaredDistance,[2,3][index]);assert.deepEqual(HISTORY_Z,before);
    const epsilon=1e-6;
    item.values.forEach((_,k) => {const plus=[...item.values],minus=[...item.values];plus[k]+=epsilon;minus[k]-=epsilon;
      near((logitComparison(HISTORY_Z,plus).squaredDistance-logitComparison(HISTORY_Z,minus).squaredDistance)/(2*epsilon),result.gradient[k],1e-8);
    });
  });
});
test("common translation gives identical probabilities but nonzero squared distance", () => {
  const result=logitComparison(HISTORY_Z,LOGIT_CASES[1].values);
  result.p.forEach((v,i)=>near(v,result.q[i]));assert.equal(result.probabilityKL,0);assert.equal(result.squaredDistance,3);
});
test("hard-label example is equally correct while the other-class preference changes", () => {
  const p=softmax(LABEL_OLD),q=softmax(LABEL_CURRENT);
  near(-Math.log(p[0]),-Math.log(q[0]));assert.ok(p[1]>p[2]);assert.ok(q[1]<q[2]);
});
test("invalid probability support, dimensions, or nonfinite values cannot silently form a loss", () => {
  assert.throws(()=>probabilityComparison([.8,.2],[1,0]));assert.throws(()=>probabilityComparison([.8,.2],[.4,.4]));
  assert.throws(()=>logitComparison([1],[1,2]));assert.throws(()=>softmax([Infinity]));
});
