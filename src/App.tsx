import { useEffect, useMemo, useRef, useState } from 'react';
import { exportPdfFromSvg } from './export/pdf';
import { exportSvgFile } from './export/svg';
import { renderIcon } from './renderer/renderIcon';
import { renderTemplate } from './renderer/renderTemplate';
import { SIGN_PRESETS, DEFAULT_FRAME_COLOR } from './data/presets';
import type { CmykColor, FrameType, PictogramPosition } from './types';

const SIZES = [
  ['10x15','10 × 15 cm',100,150],['15x10','15 × 10 cm',150,100],['15x21','15 × 21 cm',150,210],['21x15','21 × 15 cm',210,150],
  ['20x30','20 × 30 cm',200,300],['30x20','30 × 20 cm',300,200],['20x20','20 × 20 cm',200,200],['30x40','30 × 40 cm',300,400],
  ['40x30','40 × 30 cm',400,300],['30x50','30 × 50 cm',300,500],['50x30','50 × 30 cm',500,300],['40x60','40 × 60 cm',400,600],
  ['60x40','60 × 40 cm',600,400],['50x70','50 × 70 cm',500,700],['70x50','70 × 50 cm',700,500],['60x80','60 × 80 cm',600,800],['80x60','80 × 60 cm',800,600],
] as const;
const FRAME_OPTIONS: Array<[FrameType,string]> = [['simple','Moldura Simples'],['header','Cabeçalho'],['diamond','Losango'],['triangle','Triângulo'],['circular','Circular']];
const clamp = (n:number) => Math.max(0, Math.min(100, Number.isFinite(n) ? n : 0));
const colorInput = (color:CmykColor, key:keyof CmykColor, set:(c:CmykColor)=>void) => <input className="cmyk-input" type="number" min="0" max="100" value={color[key]} onChange={e=>set({...color,[key]:clamp(Number(e.target.value))})}/>;

export default function App() {
  const [presetId,setPresetId] = useState('proibido-fumar');
  const preset = useMemo(()=>SIGN_PRESETS.find(p=>p.id===presetId) ?? SIGN_PRESETS[0],[presetId]);
  const [frameType,setFrameType] = useState<FrameType>(preset.frameType);
  const [heading,setHeading] = useState(preset.heading ?? 'AVISO');
  const [message,setMessage] = useState(preset.message);
  const [icon,setIcon] = useState(preset.icon ?? 'mdi:alert');
  const [iconSvg,setIconSvg] = useState('');
  const [showIcon,setShowIcon] = useState(true);
  const [position,setPosition] = useState<PictogramPosition>(preset.defaults?.pictogramPosition ?? 'top');
  const [prohibition,setProhibition] = useState(Boolean(preset.defaults?.prohibition));
  const [frameColor,setFrameColor] = useState<CmykColor>(preset.defaults?.frameColor ?? DEFAULT_FRAME_COLOR);
  const [backgroundColor,setBackgroundColor] = useState<CmykColor>(preset.defaults?.backgroundColor ?? {c:0,m:0,y:0,k:0});
  const [sizeId,setSizeId] = useState('20x30');
  const [custom,setCustom] = useState(false);
  const [customW,setCustomW] = useState(200); const [customH,setCustomH] = useState(300);
  const placaRef = useRef<HTMLDivElement|null>(null);

  useEffect(()=>{ let active=true; void renderIcon(icon).then(svg=>{if(active)setIconSvg(svg)}); return ()=>{active=false}; },[icon]);
  useEffect(()=>{ setFrameType(preset.frameType); setHeading(preset.heading ?? 'AVISO'); setMessage(preset.message); setIcon(preset.icon ?? 'mdi:alert'); setProhibition(Boolean(preset.defaults?.prohibition)); setPosition(preset.defaults?.pictogramPosition ?? 'top'); setFrameColor(preset.defaults?.frameColor ?? DEFAULT_FRAME_COLOR); setBackgroundColor(preset.defaults?.backgroundColor ?? {c:0,m:0,y:0,k:0}); },[preset]);

  const size = custom ? { id:'custom', name:`${customW} × ${customH} mm`, widthMm:customW, heightMm:customH } : (()=>{const s=SIZES.find(x=>x[0]===sizeId) ?? SIZES[4]; return {id:s[0],name:s[1],widthMm:s[2],heightMm:s[3]}})();
  const svgMarkup = useMemo(()=>renderTemplate({frameType,widthMm:size.widthMm,heightMm:size.heightMm,heading,message,iconSvg,showIcon,appearance:{frameColor,backgroundColor,prohibition,pictogramPosition:position}}),[frameType,size.widthMm,size.heightMm,heading,message,iconSvg,showIcon,frameColor,backgroundColor,prohibition,position]);
  const exportPdf=async()=>{const svg=placaRef.current?.querySelector('svg'); if(!svg)return; await exportPdfFromSvg(svg as SVGSVGElement,`placa-${presetId}-${size.id}.pdf`,size.widthMm,size.heightMm)};
  const filteredPresets = SIGN_PRESETS.filter(p=>p.frameType===frameType);
  const selectFrame=(next:FrameType)=>{setFrameType(next); const nextPreset=SIGN_PRESETS.find(p=>p.frameType===next); if(nextPreset)setPresetId(nextPreset.id)};

  return <div className="app-shell">
    <header className="app-header"><div><span className="eyebrow">Ferramenta de produção</span><h1>Gerador de Placas de Sinalização</h1></div><span className="status-pill">Protótipo interno</span></header>
    <main className="app-layout">
      <aside className="config-panel">
        <section className="config-section"><h2>1. Modelo</h2>
          <label className="field-label">Tipo de estrutura</label><select className="field-select" value={frameType} onChange={e=>selectFrame(e.target.value as FrameType)}>{FRAME_OPTIONS.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select>
          <label className="field-label">Preset</label><select className="field-select" value={presetId} onChange={e=>setPresetId(e.target.value)}>{filteredPresets.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}{filteredPresets.length===0&&<option value={presetId}>{preset.name}</option>}</select>
        </section>
        <section className="config-section"><h2>2. Conteúdo</h2>
          {frameType==='header'&&<><label className="field-label">Cabeçalho</label><input className="field-input" value={heading} onChange={e=>setHeading(e.target.value)}/></>}
          <label className="field-label">Texto</label><textarea className="field-textarea" value={message} onChange={e=>setMessage(e.target.value)}/>
          <label className="field-label">Pictograma</label><input className="field-input" value={icon} onChange={e=>setIcon(e.target.value)} placeholder="mdi:alert"/>
          <label className="check-row"><input type="checkbox" checked={showIcon} onChange={e=>setShowIcon(e.target.checked)}/> Mostrar pictograma</label>
          <label className="field-label">Posição</label><select className="field-select" value={position} onChange={e=>setPosition(e.target.value as PictogramPosition)}><option value="left">À esquerda do texto</option><option value="right">À direita do texto</option><option value="top">Centralizado acima</option></select>
          <label className="check-row prohibition"><input type="checkbox" checked={prohibition} onChange={e=>setProhibition(e.target.checked)}/> Aplicar símbolo de proibição</label>
        </section>
        <section className="config-section"><h2>3. Cores CMYK</h2>
          <div className="color-block"><label className="field-label">Moldura / Cabeçalho</label><div className="cmyk-grid">{(['c','m','y','k'] as const).map(k=><div key={k}><span>{k.toUpperCase()}</span>{colorInput(frameColor,k,setFrameColor)}</div>)}</div></div>
          <div className="color-block"><label className="field-label">Fundo</label><div className="cmyk-grid">{(['c','m','y','k'] as const).map(k=><div key={k}><span>{k.toUpperCase()}</span>{colorInput(backgroundColor,k,setBackgroundColor)}</div>)}</div></div>
        </section>
        <section className="config-section"><h2>4. Tamanho</h2>
          <label className="field-label">Dimensão</label><select className="field-select" value={custom?'custom':sizeId} onChange={e=>{if(e.target.value==='custom')setCustom(true);else{setCustom(false);setSizeId(e.target.value)}}}>{SIZES.map(s=><option value={s[0]} key={s[0]}>{s[1]} — {s[2]>s[3]?'Paisagem':s[2]===s[3]?'Quadrado':'Retrato'}</option>)}<option value="custom">Tamanho personalizado</option></select>
          {custom&&<div className="custom-size"><label>Largura (mm)<input className="field-input" type="number" min="20" value={customW} onChange={e=>setCustomW(Math.max(20,Number(e.target.value)))}/></label><label>Altura (mm)<input className="field-input" type="number" min="20" value={customH} onChange={e=>setCustomH(Math.max(20,Number(e.target.value)))}/></label></div>}
        </section>
        <section className="config-section"><h2>5. Exportação</h2><button className="btn btn--primary" onClick={exportPdf}>Gerar PDF Vetorial</button><button className="btn btn--secondary" onClick={()=>exportSvgFile(svgMarkup,`placa-${presetId}-${size.id}.svg`)}>Exportar SVG</button></section>
      </aside>
      <section className="preview-panel"><div className="preview-header"><div><span className="eyebrow">Preview</span><h2>Visualização em tempo real</h2></div><span className="preview-badge">{size.name}</span></div><div className="preview-surface"><div ref={placaRef} className="svg-stage" dangerouslySetInnerHTML={{__html:svgMarkup}}/></div><p className="preview-caption">Dimensões físicas em milímetros · composição SVG vetorial</p></section>
    </main>
  </div>;
}
