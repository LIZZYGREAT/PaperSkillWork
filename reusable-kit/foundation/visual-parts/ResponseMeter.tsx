import { useId } from 'react';
import './visual-parts.css';

/** No sigmoid, softmax, normalization or prediction policy lives here. */
export function ResponseMeter({ value, min, max, label }: { value: number; min: number; max: number; label: string }) {
  const id = useId();
  if (![value, min, max].every(Number.isFinite) || min >= max || value < min || value > max) return <span role="alert">响应值须位于明确的有限尺度 [min, max] 内。</span>;
  return <div className="rk-response-meter" data-value={value}><label htmlFor={id}>{label}</label><meter id={id} value={value} min={min} max={max} /><output htmlFor={id}>{Number(value.toFixed(3))}</output><small>尺度 {min} … {max}</small></div>;
}
