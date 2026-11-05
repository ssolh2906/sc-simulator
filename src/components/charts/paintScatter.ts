import type { ThemeColors } from "@/hooks/useThemeColors";
import type { Tick } from "./axes";

export type Pt = { x: number; y: number; color: string; alpha?: number; r?: number; tip?: string };
/** Full-width horizontal (y) or full-height vertical (x) guide line. */
export type GuideLine = { x?: number; y?: number; color: string; label?: string; dashed?: boolean };
export type Segment = { x1: number; y1: number; x2: number; y2: number; color: string; width?: number };
export type PlotLabel = { x: number; y: number; text: string; size?: number };
/** Direction in data units; length is set by `len`. */
export type ArrowMark = { x: number; y: number; dx: number; dy: number; color: string };

export type ScatterSpec = {
  points: Pt[];
  xDomain: [number, number];
  yDomain: [number, number];
  xLabel?: string;
  yLabel?: string;
  xTicks?: Tick[];
  yTicks?: Tick[];
  lines?: GuideLine[];
  segments?: Segment[];
  labels?: PlotLabel[];
  arrows?: ArrowMark[];
  arrowLen?: number;
  /** Start positions for the morph animation (same order as points). */
  from?: { x: number; y: number }[];
};

export type Hit = { px: Float32Array; py: Float32Array };

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** Draw one frame. `progress` drives the morph and arrow growth (1 = final). */
export function paintScatter(cv: HTMLCanvasElement, W: number, H: number, s: ScatterSpec, c: ThemeColors, progress: number): Hit {
  const dpr = window.devicePixelRatio || 1;
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
  }
  const g = cv.getContext("2d")!;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, H);

  const ticks = Boolean(s.xTicks || s.yTicks);
  const pad = ticks ? { l: 50, r: 12, t: 12, b: 40 } : { l: 24, r: 10, t: 10, b: 24 };
  const [x0, x1] = s.xDomain;
  const [y0, y1] = s.yDomain;
  const X = (v: number) => pad.l + ((v - x0) / (x1 - x0)) * (W - pad.l - pad.r);
  const Y = (v: number) => H - pad.b - ((v - y0) / (y1 - y0)) * (H - pad.t - pad.b);
  const mono = `11px ${c.fontMono}`;

  g.font = mono;
  g.lineWidth = 1;
  g.strokeStyle = c["--line"];
  g.fillStyle = c["--muted"];
  for (const t of s.xTicks ?? []) {
    g.beginPath();
    g.moveTo(X(t.v), pad.t);
    g.lineTo(X(t.v), H - pad.b);
    g.stroke();
    g.textAlign = "center";
    g.fillText(t.label ?? String(t.v), X(t.v), H - pad.b + 15);
  }
  for (const t of s.yTicks ?? []) {
    g.beginPath();
    g.moveTo(pad.l, Y(t.v));
    g.lineTo(W - pad.r, Y(t.v));
    g.stroke();
    g.textAlign = "right";
    g.fillText(t.label ?? String(t.v), pad.l - 6, Y(t.v) + 4);
  }
  g.textAlign = "center";
  if (s.xLabel) g.fillText(s.xLabel, pad.l + (W - pad.l - pad.r) / 2, H - 6);
  if (s.yLabel) {
    g.save();
    g.translate(12, pad.t + (H - pad.t - pad.b) / 2);
    g.rotate(-Math.PI / 2);
    g.fillText(s.yLabel, 0, 0);
    g.restore();
  }

  const e = ease(progress);
  const n = s.points.length;
  const hit: Hit = { px: new Float32Array(n), py: new Float32Array(n) };
  for (let i = 0; i < n; i++) {
    const p = s.points[i];
    const f = s.from?.[i];
    const x = X(f ? f.x + (p.x - f.x) * e : p.x);
    const y = Y(f ? f.y + (p.y - f.y) * e : p.y);
    hit.px[i] = x;
    hit.py[i] = y;
    g.globalAlpha = p.alpha ?? 0.8;
    g.fillStyle = p.color;
    g.beginPath();
    g.arc(x, y, p.r ?? 2.4, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;

  for (const sg of s.segments ?? []) {
    g.strokeStyle = sg.color;
    g.lineWidth = sg.width ?? 2;
    g.beginPath();
    g.moveTo(X(sg.x1), Y(sg.y1));
    g.lineTo(X(sg.x2), Y(sg.y2));
    g.stroke();
  }

  for (const l of s.lines ?? []) {
    g.strokeStyle = l.color;
    g.lineWidth = 2;
    g.setLineDash(l.dashed === false ? [] : [5, 4]);
    g.beginPath();
    if (l.x !== undefined) {
      g.moveTo(X(l.x), pad.t);
      g.lineTo(X(l.x), H - pad.b);
    } else if (l.y !== undefined) {
      g.moveTo(pad.l, Y(l.y));
      g.lineTo(W - pad.r, Y(l.y));
    }
    g.stroke();
    g.setLineDash([]);
    if (l.label) {
      g.font = `600 ${mono}`;
      g.fillStyle = l.color;
      g.textAlign = l.x !== undefined ? "left" : "right";
      if (l.x !== undefined) g.fillText(l.label, X(l.x) + 4, pad.t + 12);
      else g.fillText(l.label, W - pad.r - 4, Y(l.y!) - 5);
      g.font = mono;
    }
  }

  const len = (s.arrowLen ?? 0.5) * e;
  for (const a of s.arrows ?? []) {
    const ax = X(a.x);
    const ay = Y(a.y);
    const bx = X(a.x + a.dx * len);
    const by = Y(a.y + a.dy * len);
    const ang = Math.atan2(by - ay, bx - ax);
    g.strokeStyle = a.color;
    g.fillStyle = a.color;
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(ax, ay);
    g.lineTo(bx, by);
    g.stroke();
    if (len > 0.05) {
      g.beginPath();
      g.moveTo(bx, by);
      g.lineTo(bx - 6 * Math.cos(ang - 0.45), by - 6 * Math.sin(ang - 0.45));
      g.lineTo(bx - 6 * Math.cos(ang + 0.45), by - 6 * Math.sin(ang + 0.45));
      g.closePath();
      g.fill();
    }
  }

  for (const L of s.labels ?? []) {
    g.font = `600 ${L.size ?? 11}px ${c.fontSans}`;
    const tw = g.measureText(L.text).width;
    const x = X(L.x);
    const y = Y(L.y);
    g.fillStyle = c["--surface"];
    g.globalAlpha = 0.88;
    g.beginPath();
    g.roundRect(x - tw / 2 - 5, y - 9, tw + 10, 18, 9);
    g.fill();
    g.globalAlpha = 1;
    g.fillStyle = c["--ink"];
    g.textAlign = "center";
    g.fillText(L.text, x, y + 4);
  }
  return hit;
}
