import { useEffect, useMemo, useRef, useState } from 'react';
import { PLATE_SIZES } from './data/sizes';
import { TEMPLATE_DEFINITIONS } from './data/templates';
import { IconSelector } from './components/IconSelector';
import { Preview } from './components/Preview';
import { SizeSelector } from './components/SizeSelector';
import { TemplateSelector } from './components/TemplateSelector';
import { exportPdfFromSvg } from './export/pdf';
import { exportSvgFile } from './export/svg';
import { renderIcon } from './renderer/renderIcon';
import { renderTemplate } from './renderer/renderTemplate';
import type { PlateFieldValues, PlateTemplateId } from './types';

const DEFAULT_TEMPLATE_ID: PlateTemplateId = 'aviso-azul-01';

export default function PlacaGenerator() {
  const [templateId, setTemplateId] = useState<PlateTemplateId>(DEFAULT_TEMPLATE_ID);
  const [cabecalho, setCabecalho] = useState('ATENÇÃO');
  const [corpo, setCorpo] = useState('É PROIBIDA A ENTRADA DE ANIMAIS');
  const [tamanho, setTamanho] = useState('20x30');
  const [possuiIcone, setPossuiIcone] = useState(true);
  const [tipoIcone, setTipoIcone] = useState('mdi:alert');
  const [iconSvg, setIconSvg] = useState('');

  const placaRef = useRef<HTMLDivElement | null>(null);

  const tamanhoSelecionado = useMemo(
    () => PLATE_SIZES.find((item) => item.id === tamanho) ?? PLATE_SIZES[2],
    [tamanho],
  );

  const template = useMemo(
    () => TEMPLATE_DEFINITIONS.find((item) => item.id === templateId) ?? TEMPLATE_DEFINITIONS[0],
    [templateId],
  );

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
              onChange={(event) => setCabecalho(event.target.value)}
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
              onChange={(event) => setCorpo(event.target.value)}
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
      heading: cabecalho,
      message: corpo,
      icon: tipoIcone,
      showIcon: possuiIcone,
      iconSvg,
    };

    return renderTemplate(templateId, tamanhoSelecionado.id, values);
  }, [cabecalho, corpo, iconSvg, possuiIcone, tamanhoSelecionado.id, templateId, tipoIcone]);

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
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6 flex flex-col items-center">
      <header className="w-full max-w-5xl mb-8 flex flex-col md:flex-row justify-between items-center border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            IMPRIMA COOPER <span className="text-indigo-500 text-sm font-normal">| Gerador Técnico de Placas</span>
          </h1>
          <p className="text-sm text-gray-400">Padrão NBR 16820 / ISO 7010 & Personalizados</p>
        </div>
      </header>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl flex flex-col gap-4">
          <h2 className="text-lg font-bold text-indigo-400 border-b border-gray-700 pb-2">Configuração da Placa</h2>

          <TemplateSelector selectedTemplateId={templateId} onSelectTemplate={setTemplateId} />

          {template.fields.map((field) => renderFieldControl(field.id))}

          <SizeSelector value={tamanho} onChange={setTamanho} />

          <IconSelector
            value={tipoIcone}
            showIcon={possuiIcone}
            onToggleShowIcon={setPossuiIcone}
            onSelectIcon={setTipoIcone}
          />

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={exportarParaPDF}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-md text-sm"
            >
              Gerar PDF Vetorial
            </button>

            <button
              type="button"
              onClick={exportarSVG}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-md text-sm"
            >
              Exportar SVG
            </button>
          </div>
        </div>

        <Preview
          svgMarkup={svgMarkup}
          title={`Preview em Tempo Real [${tamanhoSelecionado.name}]`}
        >
          <p className="mt-6 text-xs text-gray-500 text-center">
            * O motor gera o SVG vetorial e exporta diretamente para PDF com dimensões físicas em milímetros.
          </p>
        </Preview>
      </div>
    </div>
  );
}
