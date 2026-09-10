import { useEffect, useMemo, useRef, useState } from 'react';
import { createSignInstance } from './domain/sign/instance';
import { IconSelector } from './components/IconSelector';
import { SizeSelector } from './components/SizeSelector';
import { TemplateSelector } from './components/TemplateSelector';
import { exportPdfFromSvg } from './export/pdf';
import { exportSvgFile } from './export/svg';
import { renderIcon } from './renderer/renderIcon';
import { renderTemplate } from './renderer/renderTemplate';
import { setSignSize, setSignTemplate, updateSignValue } from './domain/sign/instance';
import { resolveSignInstance } from './signs/resolveSignInstance';
import type { PlateFieldValues, PlateTemplateId, SignInstance } from './types';

const DEFAULT_TEMPLATE_ID: PlateTemplateId = 'aviso-azul-01';
const DEFAULT_SIGN_ID = DEFAULT_TEMPLATE_ID;

export default function PlacaGenerator() {
  const [signInstance, setSignInstance] = useState<SignInstance>(() => createSignInstance(DEFAULT_SIGN_ID, '20x30'));
  const [iconSvg, setIconSvg] = useState('');

  const placaRef = useRef<HTMLDivElement | null>(null);

  const resolvedSign = useMemo(() => resolveSignInstance(signInstance), [signInstance]);

  const templateId = resolvedSign.template.id as PlateTemplateId;

  const tamanho = signInstance.sizeId;
  const cabecalho = typeof resolvedSign.values.heading === 'string' ? resolvedSign.values.heading : 'ATENÇÃO';
  const corpo = typeof resolvedSign.values.message === 'string' ? resolvedSign.values.message : 'É PROIBIDA A ENTRADA DE ANIMAIS';
  const possuiIcone = Boolean(resolvedSign.values.showIcon);
  const tipoIcone = typeof resolvedSign.values.icon === 'string' ? resolvedSign.values.icon : 'mdi:alert';

  const tamanhoSelecionado = resolvedSign.size;

  const template = resolvedSign.template;

  const handleUpdateSignValue = (field: string, value: string | boolean) => {
    setSignInstance((current) => updateSignValue(current, field, value));
  };

  const renderFieldControl = (fieldId: string) => {
    switch (fieldId) {
      case 'heading':
        return (
          <div key={fieldId}>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Texto do Cabeçalho
            </label>
            <input
              type="text"
              value={cabecalho}
              onChange={(event) => handleUpdateSignValue('heading', event.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        );
      case 'message':
        return (
          <div key={fieldId}>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Texto Principal (Corpo)
            </label>
            <textarea
              rows={3}
              value={corpo}
              onChange={(event) => handleUpdateSignValue('message', event.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    async function loadIcon() {
      const svg = await renderIcon(tipoIcone);
      if (mounted) {
        setIconSvg(svg);
      }
    }

    if (possuiIcone) {
      void loadIcon();
      return () => {
        mounted = false;
      };
    }

    setIconSvg('');
    return () => {
      mounted = false;
    };
  }, [possuiIcone, tipoIcone]);

  const svgMarkup = useMemo(() => {
    const values: PlateFieldValues = {
      ...resolvedSign.values,
      iconSvg,
    };

    return renderTemplate(templateId, tamanhoSelecionado.id, values);
  }, [iconSvg, resolvedSign, tamanhoSelecionado.id, templateId]);

  const exportarParaPDF = async () => {
    const svgElement = placaRef.current?.querySelector('svg');

    if (!svgElement) {
      alert('Nenhuma placa disponível para exportação.');
      return;
    }

    try {
      await exportPdfFromSvg(
        svgElement as SVGSVGElement,
        `placa-${templateId}-${tamanhoSelecionado.id}.pdf`,
        tamanhoSelecionado.widthMm,
        tamanhoSelecionado.heightMm,
      );
    } catch (error) {
      console.error('Erro ao exportar PDF vetorial:', error);
      alert('Não foi possível gerar o PDF vetorial. Verifique o console para detalhes.');
    }
  };

  const exportarSVG = () => {
    exportSvgFile(svgMarkup, `placa-${templateId}-${tamanhoSelecionado.id}.svg`);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <div className="brand-block">
            <span className="eyebrow">Ferramenta</span>
            <h1>Gerador de Placas de Sinalização</h1>
          </div>
          <div className="status-pill">Prototipo interno</div>
        </div>
      </header>

      <main className="app-layout">
        <aside className="config-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Configuração</span>
              <h2>Dados da placa</h2>
            </div>
          </div>

          <div className="config-stack">
            <section className="config-section">
              <h3>1. Modelo</h3>
              <TemplateSelector
                selectedTemplateId={templateId}
                onSelectTemplate={(nextTemplateId) => {
                  setSignInstance((current) => setSignTemplate(current, nextTemplateId));
                }}
              />
            </section>

            <section className="config-section">
              <h3>2. Formato</h3>
              <div className="field-stack">{template.fields.map((field) => renderFieldControl(field.id))}</div>
            </section>

            <section className="config-section">
              <h3>3. Tamanho</h3>
              <SizeSelector
                value={tamanho}
                onChange={(nextSizeId) => setSignInstance((current) => setSignSize(current, nextSizeId))}
              />
            </section>

            <section className="config-section">
              <h3>4. Conteúdo</h3>
              <IconSelector
                value={tipoIcone}
                showIcon={possuiIcone}
                onToggleShowIcon={(showIcon) => handleUpdateSignValue('showIcon', showIcon)}
                onSelectIcon={(nextIcon) => handleUpdateSignValue('icon', nextIcon)}
              />
            </section>

            <section className="config-section config-section--export">
              <h3>5. Exportação</h3>
              <div className="action-stack">
                <button type="button" onClick={exportarParaPDF} className="btn btn--primary">
                  Gerar PDF Vetorial
                </button>
                <button type="button" onClick={exportarSVG} className="btn btn--secondary">
                  Exportar SVG
                </button>
              </div>
            </section>
          </div>
        </aside>

        <section className="preview-panel">
          <div className="preview-header">
            <div>
              <span className="eyebrow">Preview</span>
              <h2>Visualização em tempo real</h2>
            </div>
            <div className="preview-badge">{tamanhoSelecionado.name}</div>
          </div>

          <div className="preview-surface">
            <div className="svg-stage" dangerouslySetInnerHTML={{ __html: svgMarkup }} />
          </div>
          <p className="preview-caption">SVG vetorial renderizado com dimensões físicas em milímetros.</p>
        </section>
      </main>
    </div>
  );
}
