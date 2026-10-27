/** Synthetic teaching inputs. All views derive values from these definitions. */
export const CLASSES = ["猫", "狗", "狐狸"] as const;
export const LABEL_OLD = [2, 1, 0] as const;
export const LABEL_CURRENT = [2, 0, 1] as const;
export const REFERENCE_P = [0.8, 0.2] as const;
export const HISTORY_Z = [2, 1, 0] as const;

export const PROBABILITY_CASES = [
  { id: "near", label: "稍有偏离", values: [0.6, 0.4], conclusion: "两次都更倾向猫，但概率分配已经改变。历史约束仍然有必要。" },
  { id: "equal", label: "与旧分布相同", values: [0.8, 0.2], conclusion: "q 与固定的 p 完全相同，KL 为 0：没有需要惩罚的分布偏离。" },
  { id: "reversed", label: "偏好反转", values: [0.2, 0.8], conclusion: "当前分布转而更倾向狗，对固定旧分布的偏离更大，KL 随之增大。" },
] as const;

export const LOGIT_CASES = [
  { id: "swapped", label: "猫、狗分数交换", values: [1, 2, 0], conclusion: "猫的分数下降，狗的分数上升。平方匹配逐类累计这些偏离。" },
  { id: "shifted", label: "全部分数增加 1", values: [3, 2, 1], conclusion: "每类分数都增加 1，概率却完全不变。概率匹配与 logits 平方匹配约束的对象不同。" },
] as const;

function finiteVector(values: readonly number[]) {
  if (!values.length || values.some((value) => !Number.isFinite(value))) throw new Error("需要非空、有限的向量。");
}

export function softmax(values: readonly number[]): number[] {
  finiteVector(values);
  const maximum = Math.max(...values);
  const exponents = values.map((value) => Math.exp(value - maximum));
  const sum = exponents.reduce((total, value) => total + value, 0);
  return exponents.map((value) => value / sum);
}

export function probabilityComparison(p: readonly number[], q: readonly number[]) {
  finiteVector(p); finiteVector(q);
  if (p.length !== q.length) throw new Error("类别坐标必须一致。");
  for (const distribution of [p, q]) {
    if (distribution.some((value) => value <= 0) || Math.abs(distribution.reduce((a, b) => a + b, 0) - 1) > 1e-10) throw new Error("需要严格为正、归一化的概率。");
  }
  const terms = p.map((value, index) => value * Math.log(value / q[index]));
  const entropy = -p.reduce((total, value) => total + value * Math.log(value), 0);
  const crossEntropy = -p.reduce((total, value, index) => total + value * Math.log(q[index]), 0);
  const rawKL = terms.reduce((total, value) => total + value, 0);
  return { p: [...p], q: [...q], terms, entropy, crossEntropy, kl: Math.abs(rawKL) < 1e-14 ? 0 : rawKL, gradient: q.map((value, index) => value - p[index]) };
}

export function logitComparison(z: readonly number[], a: readonly number[]) {
  finiteVector(z); finiteVector(a);
  if (z.length !== a.length) throw new Error("类别坐标必须一致。");
  const differences = a.map((value, index) => value - z[index]);
  const squares = differences.map((value) => value * value);
  const p = softmax(z); const q = softmax(a);
  return { z: [...z], a: [...a], differences, squares, squaredDistance: squares.reduce((total, value) => total + value, 0), gradient: differences.map((value) => 2 * value), p, q, probabilityKL: probabilityComparison(p, q).kl };
}

export const SNAPSHOT_STEPS = [
  { title: "生成输出", parameter: "θₜ", text: "原图的当前训练视图进入唯一网络，得到本步更新前的输出。此时它还只是候选。" },
  { title: "复制并冻结", parameter: "θₜ", text: "复制输出的数值，得到固定目标 z。保存的是数值，不是另一台旧网络或反向传播图。" },
  { title: "当前参数继续更新", parameter: "θₜ₊₁", text: "本步联合损失更新当前网络；已复制的 z 不随之重算。更新之后，才决定是否把原图与 z 写入记忆。" },
] as const;

export const formatValue = (value: number, digits = 3) => value.toFixed(digits);
