import { useEffect, useMemo, useRef, useState } from 'react';
import { exportPdfFromSvg } from './export/pdf';
import { exportSvgFile } from './export/svg';
import { renderIcon } from './renderer/renderIcon';
import { renderTemplate } from './renderer/renderTemplate';
import { SIGN_PRESETS, DEFAULT_FRAME_COLOR } from './data/presets';
import { PLATE_SIZES } from './data/sizes';
import { IconSelector } from './components/IconSelector';
import type { CmykColor, FrameType, PictogramPosition } from './types';

const FRAME_OPTIONS: Array<[FrameType, string]> = [
  ['simple', 'Moldura Simples'],
  ['header', 'Cabeçalho'],
  ['diamond', 'Losango'],
  ['triangle', 'Triângulo'],
  ['circular', 'Circular'],
];

const clamp = (n: number) => Math.max(0, Math.min(100, Number.isFinite(n) ? n : 0));

function cmykToHex({ c, m, y, k }: CmykColor): string {
  const C = clamp(c) / 100;
  const M = clamp(m) / 100;
  const Y = clamp(y) / 100;
  const K = clamp(k) / 100;
  const r = Math.round(255 * (1 - C) * (1 - K));
  const g = Math.round(255 * (1 - M) * (1 - K));
  const b = Math.round(255 * (1 - Y) * (1 - K));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function hexToCmyk(hex: string): CmykColor {
  const raw = hex.replace('#', '');
  const full = raw.length === 3
    ? raw.split('').map((ch) => ch + ch).join('')
    : raw.padEnd(6, '0').slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const k = 1 - Math.max(r, g, b);
  if (k >= 0.999) return { c: 0, m: 0, y: 0, k: 100 };
  const c = ((1 - r - k) / (1 - k)) * 100;
  const m = ((1 - g - k) / (1 - k)) * 100;
  const y = ((1 - b - k) / (1 - k)) * 100;
  return {
    c: Math.round(clamp(c)),
    m: Math.round(clamp(m)),
    y: Math.round(clamp(y)),
    k: Math.round(clamp(k * 100)),
  };
}

function ColorFields({ label, color, setColor }: { label: string; color: CmykColor; setColor: (color: CmykColor) => void }) {
  const hex = cmykToHex(color);
  return <div className="color-block">
    <div className="color-block__header">
      <label className="field-label">{label}</label>
      <input
        className="color-picker"
        type="color"
        value={hex}
        title="Selecionar cor"
        onChange={(event) => setColor(hexToCmyk(event.target.value))}
      />
    </div>
    <div className="cmyk-grid">
      {(['c', 'm', 'y', 'k'] as const).map((key) => (
        <label key={key}>
          <span>{key.toUpperCase()}</span>
          <input
            className="cmyk-input"
            type="number"
            min="0"
            max="100"
            value={color[key]}
            onChange={(event) => setColor({ ...color, [key]: clamp(Number(event.target.value)) })}
          />
        </label>
      ))}
    </div>
  </div>;
}

export default function App() {
  const initialPreset = SIGN_PRESETS.find((preset) => preset.id === 'proibido-fumar') ?? SIGN_PRESETS[0];
  const [presetId, setPresetId] = useState(initialPreset.id);
  const preset = useMemo(() => SIGN_PRESETS.find((item) => item.id === presetId) ?? initialPreset, [presetId, initialPreset]);
  const [frameType, setFrameType] = useState<FrameType>(initialPreset.frameType);
  const [heading, setHeading] = useState(initialPreset.heading ?? 'AVISO');
  const [message, setMessage] = useState(initialPreset.message);
  const [icon, setIcon] = useState(initialPreset.icon ?? 'mdi:alert');
  const [iconSvg, setIconSvg] = useState('');
  const [showIcon, setShowIcon] = useState(true);
  const [position, setPosition] = useState<PictogramPosition>(initialPreset.defaults?.pictogramPosition ?? 'top');
  const [circle, setCircle] = useState(Boolean(initialPreset.defaults?.circle));
  const [prohibition, setProhibition] = useState(Boolean(initialPreset.defaults?.prohibition));
  const [frameColor, setFrameColor] = useState<CmykColor>(initialPreset.defaults?.frameColor ?? DEFAULT_FRAME_COLOR);
  const [backgroundColor, setBackgroundColor] = useState<CmykColor>(initialPreset.defaults?.backgroundColor ?? { c: 0, m: 0, y: 0, k: 0 });
  const [sizeId, setSizeId] = useState('20x30');
  const [custom, setCustom] = useState(false);
  const [customW, setCustomW] = useState(200);
  const [customH, setCustomH] = useState(300);
  const placaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    void renderIcon(icon).then((svg) => { if (active) setIconSvg(svg); });
    return () => { active = false; };
  }, [icon]);

  useEffect(() => {
    setFrameType(preset.frameType);
    setHeading(preset.heading ?? 'AVISO');
    setMessage(preset.message);
    setIcon(preset.icon ?? 'mdi:alert');
    setShowIcon(preset.icon !== undefined);
    setCircle(Boolean(preset.defaults?.circle));
    setProhibition(Boolean(preset.defaults?.prohibition));
    const defaultPos: PictogramPosition = preset.frameType === 'header'
      ? (preset.defaults?.pictogramPosition ?? 'left')
      : (preset.defaults?.pictogramPosition ?? 'top');
    setPosition(defaultPos);
    setFrameColor(preset.defaults?.frameColor ?? DEFAULT_FRAME_COLOR);
    setBackgroundColor(preset.defaults?.backgroundColor ?? { c: 0, m: 0, y: 0, k: 0 });
  }, [preset]);

  const size = custom
    ? { id: 'custom', name: `${customW} × ${customH} mm`, widthMm: customW, heightMm: customH }
    : (PLATE_SIZES.find((item) => item.id === sizeId) ?? PLATE_SIZES[0]);

  const svgMarkup = useMemo(() => renderTemplate({
    frameType,
    widthMm: size.widthMm,
    heightMm: size.heightMm,
    heading,
    message,
    iconSvg,
    iconSlug: icon,
    showIcon,
    appearance: { frameColor, backgroundColor, circle, prohibition, pictogramPosition: position },
  }), [frameType, size.widthMm, size.heightMm, heading, message, iconSvg, icon, showIcon, frameColor, backgroundColor, circle, prohibition, position]);

  const filteredPresets = SIGN_PRESETS.filter((item) => item.frameType === frameType);
  const exportPdf = async () => {
    const svg = placaRef.current?.querySelector('svg');
    if (!svg) return;
    await exportPdfFromSvg(svg as SVGSVGElement, `placa-${presetId}-${size.id}.pdf`, size.widthMm, size.heightMm);
  };
  const selectFrame = (next: FrameType) => {
    setFrameType(next);
    const nextPreset = SIGN_PRESETS.find((item) => item.frameType === next);
    if (nextPreset) setPresetId(nextPreset.id);
    if (next === 'header') {
      setPosition(nextPreset?.defaults?.pictogramPosition ?? 'left');
    }
  };

  return <div className="app-shell">
    <header className="app-header"><div><span className="eyebrow">Ferramenta de produção</span><h1>Gerador de Placas de Sinalização</h1></div><span className="status-pill">Protótipo interno</span></header>
    <main className="app-layout">
      <aside className="config-panel">
        <section className="config-section"><h2>1. Estrutura</h2>
          <label className="field-label">Tipo de estrutura</label>
          <select className="field-select" value={frameType} onChange={(event) => selectFrame(event.target.value as FrameType)}>{FRAME_OPTIONS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
          <label className="field-label">Preset</label>
          <select className="field-select" value={presetId} onChange={(event) => setPresetId(event.target.value)}>{filteredPresets.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select>
        </section>
        <section className="config-section"><h2>2. Conteúdo</h2>
          {frameType === 'header' && <><label className="field-label">Cabeçalho</label><input className="field-input" value={heading} onChange={(event) => setHeading(event.target.value)} /></>}
          <label className="field-label">Texto</label>
          <textarea className="field-textarea" value={message} onChange={(event) => setMessage(event.target.value)} />
          <IconSelector value={icon} showIcon={showIcon} onToggleShowIcon={setShowIcon} onSelectIcon={setIcon} />
          <label className="field-label">Posição</label>
          <select className="field-select" value={position} onChange={(event) => setPosition(event.target.value as PictogramPosition)}><option value="left">À esquerda do texto</option><option value="right">À direita do texto</option><option value="top">Centralizado acima</option></select>
          <label className="check-row"><input type="checkbox" checked={circle} onChange={(event) => setCircle(event.target.checked)} /> Aplicar círculo</label>
          <label className="check-row prohibition"><input type="checkbox" checked={prohibition} onChange={(event) => setProhibition(event.target.checked)} /> Aplicar símbolo de proibição</label>
        </section>
        <section className="config-section"><h2>3. Cores CMYK</h2>
          <ColorFields label="Moldura / Cabeçalho" color={frameColor} setColor={setFrameColor} />
          <ColorFields label="Fundo" color={backgroundColor} setColor={setBackgroundColor} />
        </section>
        <section className="config-section"><h2>4. Tamanho</h2>
          <label className="field-label">Dimensão</label>
          <select className="field-select" value={custom ? 'custom' : sizeId} onChange={(event) => { if (event.target.value === 'custom') setCustom(true); else { setCustom(false); setSizeId(event.target.value); } }}>
            {PLATE_SIZES.map((item) => <option value={item.id} key={item.id}>{item.name} — {item.shape === 'square' ? 'Quadrado' : item.orientation === 'landscape' ? 'Paisagem' : 'Retrato'}</option>)}
            <option value="custom">Tamanho personalizado</option>
          </select>
          {custom && <div className="custom-size"><label>Largura (mm)<input className="field-input" type="number" min="20" value={customW} onChange={(event) => setCustomW(Math.max(20, Number(event.target.value)))} /></label><label>Altura (mm)<input className="field-input" type="number" min="20" value={customH} onChange={(event) => setCustomH(Math.max(20, Number(event.target.value)))} /></label></div>}
        </section>
        <section className="config-section"><h2>5. Exportação</h2><button className="btn btn--primary" onClick={exportPdf}>Gerar PDF Vetorial</button><button className="btn btn--secondary" onClick={() => exportSvgFile(svgMarkup, `placa-${presetId}-${size.id}.svg`)}>Exportar SVG</button></section>
      </aside>
      <section className="preview-panel"><div className="preview-header"><div><span className="eyebrow">Preview</span><h2>Visualização em tempo real</h2></div><span className="preview-badge">{size.name}</span></div><div className="preview-surface"><div ref={placaRef} className="svg-stage" dangerouslySetInnerHTML={{ __html: svgMarkup }} /></div><p className="preview-caption">Dimensões físicas em milímetros · composição SVG vetorial</p></section>
    </main>
  </div>;
}
