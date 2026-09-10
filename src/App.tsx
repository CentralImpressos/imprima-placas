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
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Ferramenta</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Gerador de Placas de Sinalização</h1>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            Prototipo interno
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-[420px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Configuração</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">Dados da placa</h2>
            </div>
          </div>

          <div className="space-y-5">
            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">1. Modelo</h3>
              <TemplateSelector
                selectedTemplateId={templateId}
                onSelectTemplate={(nextTemplateId) => {
                  setSignInstance((current) => setSignTemplate(current, nextTemplateId));
                }}
              />
            </section>

            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">2. Formato</h3>
              <div className="space-y-3">{template.fields.map((field) => renderFieldControl(field.id))}</div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">3. Tamanho</h3>
              <SizeSelector
                value={tamanho}
                onChange={(nextSizeId) => setSignInstance((current) => setSignSize(current, nextSizeId))}
              />
            </section>

            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">4. Conteúdo</h3>
              <IconSelector
                value={tipoIcone}
                showIcon={possuiIcone}
                onToggleShowIcon={(showIcon) => handleUpdateSignValue('showIcon', showIcon)}
                onSelectIcon={(nextIcon) => handleUpdateSignValue('icon', nextIcon)}
              />
            </section>

            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">5. Exportação</h3>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={exportarParaPDF}
                  className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
                >
                  Gerar PDF Vetorial
                </button>
                <button
                  type="button"
                  onClick={exportarSVG}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                >
                  Exportar SVG
                </button>
              </div>
            </section>
          </div>
        </aside>

        <div className="rounded-2xl border border-slate-200 bg-slate-100 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Preview</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">Visualização em tempo real</h2>
            </div>
            <div className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              {tamanhoSelecionado.name}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-inner">
            <div className="mx-auto flex max-w-[640px] items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <div className="w-full max-w-[520px]" dangerouslySetInnerHTML={{ __html: svgMarkup }} />
            </div>
            <p className="mt-6 text-center text-xs text-slate-500">
              SVG vetorial renderizado com dimensões físicas em milímetros.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
