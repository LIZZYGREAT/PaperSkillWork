import ModelPixel, { type ModelClass } from './review/ModelPixel';
export function Network({ x = 0, y = 0, theta = 'θ', active = false }: {
    x?: number;
    y?: number;
    theta?: string;
    active?: boolean;
}) {
    const layers = [[36, 80, 124], [22, 61, 100, 139], [36, 80, 124]];
    return <g transform={`translate(${x} ${y})`} className="der-network" data-active={active}><rect width="218" height="220" rx="14" className="der-network-surface"/><text x="109" y="31" textAnchor="middle" className="der-svg-title">当前模型 {theta}</text><g transform="translate(33 48)">{layers.slice(0, -1).flatMap((layer, l) => layer.flatMap((cy, i) => layers[l + 1].map((ny, j) => <line key={`${l}-${i}-${j}`} x1={l * 76} y1={cy} x2={(l + 1) * 76} y2={ny}/>)))}{layers.flatMap((layer, l) => layer.map((cy, i) => <circle key={`${l}-${i}`} cx={l * 76} cy={cy} r="6"/>))}</g></g>;
}
export function Sample({ x, y, model = 0, id, muted = false, size = 66 }: {
    x: number;
    y: number;
    model?: ModelClass;
    id: string;
    muted?: boolean;
    size?: number;
}) {
    return <g transform={`translate(${x} ${y})`} className="der-sample" data-sample-id={id} opacity={muted ? .25 : 1}><rect width={size} height={size} rx="10"/><ModelPixel model={model} x={size * .16} y={size * .16} size={size * .68}/></g>;
}
export function Vector({ x, y, values, symbol = 'z₁' }: {
    x: number;
    y: number;
    values: readonly (number | string)[];
    symbol?: string;
}) {
    return <g transform={`translate(${x} ${y})`} className="der-vector"><text x="0" y="31" className="der-svg-math">{symbol}</text>{values.map((v, k) => <g key={k}><rect x={42 + k * 52} width="46" height="46" rx="6"/><text x={65 + k * 52} y="30" textAnchor="middle">{v}</text></g>)}</g>;
}
