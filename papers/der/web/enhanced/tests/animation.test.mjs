import test from "node:test";
import assert from "node:assert/strict";
import { klSceneAt, logitSceneAt, freezeSceneAt } from "../src/modules/review/animation-model.ts";
const near = (a,b) => assert.ok(Math.abs(a-b)<1e-12, `${a} != ${b}`);
test("every KL interpolation sample remains normalized with exact signed terms and entropy identity", () => {
  for (let selected=0; selected<3; selected++) for(let n=0;n<=100;n++) {
    const s=klSceneAt(1,n/100,selected);
    assert.deepEqual(s.p,[.8,.2]); near(s.q.reduce((a,b)=>a+b),1);
    s.terms.forEach((v,i)=>near(v,s.p[i]*Math.log(s.p[i]/s.q[i])));
    near(s.kl,s.terms.reduce((a,b)=>a+b)); near(s.kl,s.crossEntropy-s.entropy);
    assert.ok(s.kl>=-1e-12); assert.ok(s.q.every(v=>v>0));
  }
  assert.ok(klSceneAt(4,.5,0).terms[1]<0);
  assert.equal(klSceneAt(5,1,1).kl,0);
});
test("logit samples use the same input for point locations, differences, squares and softmax", () => {
  for(let n=0;n<=100;n++) for(const selected of [0,1]) {
    const t=n/100, s=logitSceneAt(1,t,selected);
    near(s.squaredDistance, (selected===0?2:3)*t*t);
    s.squares.forEach((v,i)=>near(v,(s.a[i]-s.z[i])**2));
    if(selected===1) { s.q.forEach((v,i)=>near(v,s.p[i])); near(s.probabilityKL,0); }
  }
});
test("freeze copy is born separately, follows a continuous path, and remains frozen across update and handoff", () => {
  assert.equal(freezeSceneAt(0,1).hasRecord,false);
  assert.equal(freezeSceneAt(1,0).hasRecord,false);
  const a=freezeSceneAt(1,.25), b=freezeSceneAt(1,.5), c=freezeSceneAt(1,.75);
  assert.ok(a.recordX>b.recordX && b.recordX>c.recordX);
  assert.ok(a.recordY<b.recordY && b.recordY<c.recordY);
  for(const clip of [1,2,3]) for(const t of [.25,.5,.75,1]) {
    const s=freezeSceneAt(clip,t); assert.equal(s.recordId,"x2@t");
    assert.deepEqual(s.z,[2,1,0]); assert.equal(s.inMemory,false);
  }
  near(freezeSceneAt(1,1).recordX,freezeSceneAt(2,0).recordX);
  near(freezeSceneAt(2,1).recordX,freezeSceneAt(3,0).recordX);
});
