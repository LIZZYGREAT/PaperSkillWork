import test from "node:test";
import assert from "node:assert/strict";
import { lifecycleSceneAt as at, LIFECYCLE_FIXTURE as fixture } from "../src/modules/review/lifecycle-model.ts";

test("empty memory, pre-update copy, post-update append, then a real stored replay source", () => {
  assert.equal(at(1,1).hasTarget,false);
  assert.deepEqual(at(1,1).lossSources,["current-ce"]);
  assert.equal(at(2,.1).hasTarget,true);
  for(const [clip,t] of [[2,1],[3,.69],[3,1],[4,.91]]) assert.equal(at(clip,t).memoryCount,0);
  assert.equal(at(3,.69).updateCount,0);
  assert.equal(at(3,.7).updateCount,1);
  assert.equal(at(4,.92).memoryCount,1);
  assert.equal(at(4,.92).seen,1);
  assert.ok(at(4,.92).seen<=fixture.capacity);
  assert.equal(at(5,0).replaySource,null);
  assert.equal(at(5,.05).replaySource,fixture.recordId);
  assert.deepEqual(at(5,1).lossSources,["current-ce","historical-squared"]);
  assert.equal(at(7,.74).updateCount,1);
  assert.equal(at(7,.75).updateCount,2);
  assert.deepEqual(at(7,1).writes,[fixture.recordId]);
  assert.equal(at(7,1).seen,1); // Stop before the later current candidate is written.
});

test("copy and replay geometry is continuous while target values and record identity stay fixed", () => {
  for(let clip=0;clip<8;clip++)for(let n=0;n<=100;n++) {
    const s=at(clip,n/100);
    assert.deepEqual(s.z,[2,1,0]);assert.equal(s.recordId,fixture.recordId);
    assert.equal(s.match.squaredDistance,2);
    assert.deepEqual(s.match.differences,[-1,1,0]);
    for(const point of [s.targetOrigin,s.input,s.replayInput,...s.currentPoints,...s.referencePoints]) {
      assert.ok(Number.isFinite(point.x)&&Number.isFinite(point.y));
      assert.ok(point.x>=0&&point.x<=1120&&point.y>=0&&point.y<=640);
    }
  }
  for(const clip of [2,4,5]) {
    const key=clip===5?"replayInput":"targetOrigin";
    assert.equal(new Set([.25,.5,.75].map(t=>JSON.stringify(at(clip,t)[key]))).size,3);
  }
  for(const clip of [2,3,4,5,6]) {
    assert.deepEqual(at(clip,1).targetOrigin,at(clip+1,0).targetOrigin);
    assert.deepEqual(at(clip,1).targetPoints,at(clip+1,0).targetPoints);
  }
  assert.equal("y" in fixture,false); // DER record has no historical label.
});
