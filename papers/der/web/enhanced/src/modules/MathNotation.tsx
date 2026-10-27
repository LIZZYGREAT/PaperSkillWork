import type { ReactNode } from "react";

function Sum({ upper = false, index = "k" }: { upper?: boolean; index?: string }) {
  return upper ? <munderover><mo>∑</mo><mrow><mi>{index}</mi><mo>=</mo><mn>1</mn></mrow><mi>C</mi></munderover> : <munder><mo>∑</mo><mi>{index}</mi></munder>;
}
const Sub = ({ value, index = "k" }: { value: string; index?: string }) => <msub><mi>{value}</mi><mi>{index}</mi></msub>;
export function Equation({ label, children, id }: { label: string; children: ReactNode; id?: string }) {
  return <div className="equation" data-vqa-check-clipping id={id}><math xmlns="http://www.w3.org/1998/Math/MathML" display="block" aria-label={label}>{children}</math></div>;
}
export function KLDefinition() {
  return <Equation id="kl-definition" label="KL 散度等于从类别 1 到 C，旧概率 p k 乘以 p k 与 q k 比值的对数之和。"><mrow><msub><mi>D</mi><mtext>KL</mtext></msub><mo>(</mo><mi>p</mi><mo>∥</mo><mi>q</mi><mo>)</mo></mrow><mo>=</mo><Sum upper /><Sub value="p" /><mi mathvariant="normal">log</mi><mfrac><Sub value="p" /><Sub value="q" /></mfrac></Equation>;
}
export function KLDecomposition() {
  return <Equation id="kl-decomposition" label="KL 等于负的 p 加权 log q 之和，减去负的 p 加权 log p 之和，也就是交叉熵 H p q 减去熵 H p。"><msub><mi>D</mi><mtext>KL</mtext></msub><mo>=</mo><munder><mrow><mo>(</mo><mo>−</mo><Sum /><Sub value="p" /><mi mathvariant="normal">log</mi><Sub value="q" /><mo>)</mo></mrow><mrow><mi>H</mi><mo>(</mo><mi>p</mi><mo>,</mo><mi>q</mi><mo>)</mo></mrow></munder><mo>−</mo><munder><mrow><mo>(</mo><mo>−</mo><Sum /><Sub value="p" /><mi mathvariant="normal">log</mi><Sub value="p" /><mo>)</mo></mrow><mrow><mi>H</mi><mo>(</mo><mi>p</mi><mo>)</mo></mrow></munder></Equation>;
}
export function SquaredDefinition() {
  return <Equation id="squared-definition" label="历史匹配损失等于当前 logits a 与历史 logits z 的平方欧氏距离，即各类别分数差的平方之和。"><msub><mi>L</mi><mtext>dark</mtext></msub><mo>=</mo><msubsup><mrow><mo>‖</mo><mi>a</mi><mo>−</mo><mi>z</mi><mo>‖</mo></mrow><mn>2</mn><mn>2</mn></msubsup><mo>=</mo><Sum upper /><msup><mrow><mo>(</mo><Sub value="a" /><mo>−</mo><Sub value="z" /><mo>)</mo></mrow><mn>2</mn></msup></Equation>;
}
export function ShiftIdentity() {
  return <Equation label="所有 logits 增加同一个 c，softmax 分子分母同时乘 e 的 c 次方，概率不变。"><mfrac><msup><mi>e</mi><mrow><Sub value="z" /><mo>+</mo><mi>c</mi></mrow></msup><mrow><Sum index="j" /><msup><mi>e</mi><mrow><Sub value="z" index="j" /><mo>+</mo><mi>c</mi></mrow></msup></mrow></mfrac><mo>=</mo><mfrac><mrow><msup><mi>e</mi><mi>c</mi></msup><msup><mi>e</mi><Sub value="z" /></msup></mrow><mrow><msup><mi>e</mi><mi>c</mi></msup><Sum index="j" /><msup><mi>e</mi><Sub value="z" index="j" /></msup></mrow></mfrac><mo>=</mo><mfrac><msup><mi>e</mi><Sub value="z" /></msup><mrow><Sum index="j" /><msup><mi>e</mi><Sub value="z" index="j" /></msup></mrow></mfrac></Equation>;
}
