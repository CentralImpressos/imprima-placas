import { useMemo, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { PICTOGRAMAS_DISPONIVEIS } from './data/icons';
import { PLATE_SIZES } from './data/sizes';
import { exportPdfFromSvg } from './export/pdf';
import { exportSvgFile } from './export/svg';
import { renderTemplate } from './renderer/renderTemplate';
import type { PlateFieldValues, PlateTemplateId } from './types';

const DEFAULT_TEMPLATE_ID: PlateTemplateId = 'aviso-azul-01';

export default function PlacaGenerator() {
  const [templateId, setTemplateId] = useState<PlateTemplateId>(DEFAULT_TEMPLATE_ID);
  const [cabecalho, setCabecalho] = useState('ATENÇÃO');
  const [corpo, setCorpo] = useState('PROIBIDO ESTACIONAR\nSUJEITO A GUINCHO');
  const [tamanho, setTamanho] = useState('20x30');
  const [possuiIcone, setPossuiIcone] = useState(true);
  const [tipoIcone, setTipoIcone] = useState('mdi:car-off');
  const [modoInternoEmMassa, setModoInternoEmMassa] = useState(false);

  const placaRef = useRef<HTMLDivElement | null>(null);

  const tamanhoSelecionado = useMemo(
    () => PLATE_SIZES.find((item) => item.id === tamanho) ?? PLATE_SIZES[2],
    [tamanho]
  );

  const svgMarkup = useMemo(() => {
    const values: PlateFieldValues = {
      heading: cabecalho,
      message: corpo,
      icon: tipoIcone,
      showIcon: possuiIcone
    };

    return renderTemplate(templateId, tamanhoSelecionado.id, values);
  }, [cabecalho, corpo, possuiIcone, tamanhoSelecionado.id, templateId, tipoIcone]);

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
        tamanhoSelecionado.heightMm
      );
    } catch (error) {
      console.error('Erro ao exportar PDF vetorial:', error);
      alert('Não foi possível gerar o PDF vetorial. Verifique o console para detalhes.');
    }
  };

  const exportarSVG = () => {
    exportSvgFile(svgMarkup, `placa-${templateId}-${tamanhoSelecionado.id}.svg`);
  };

  const executarGeracaoEmMassa = () => {
    alert("Rotina interna disparada! Gerando catálogo completo ISO 7010 e NBR 16820 em lote (PDFs vetorizados)...");
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

        <div className="mt-4 md:mt-0 flex items-center bg-gray-800 p-2 rounded-lg border border-gray-700">
          <label className="text-xs font-semibold mr-3 text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={modoInternoEmMassa}
              onChange={(e) => setModoInternoEmMassa(e.target.checked)}
              className="mr-2 accent-indigo-500"
            />
            Modo Operador Interno (Lote)
          </label>
        </div>
      </header>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl flex flex-col gap-4">
          <h2 className="text-lg font-bold text-indigo-400 border-b border-gray-700 pb-2">Configuração da Placa</h2>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Template</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value as PlateTemplateId)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="aviso-azul-01">Aviso Azul 01</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Texto do Cabeçalho</label>
            <input
              type="text"
              value={cabecalho}
              onChange={(e) => setCabecalho(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Texto Principal (Corpo)</label>
            <textarea
              rows={3}
              value={corpo}
              onChange={(e) => setCorpo(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Dimensão Comercial</label>
            <select
              value={tamanho}
              onChange={(e) => setTamanho(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              {PLATE_SIZES.map((size) => (
                <option key={size.id} value={size.id}>{size.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-gray-300">Incluir Pictograma</span>
            <input
              type="checkbox"
              checked={possuiIcone}
              onChange={(e) => setPossuiIcone(e.target.checked)}
              className="w-4 h-4 accent-indigo-500 cursor-pointer"
            />
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Pictograma</label>
            <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
              {Object.entries(PICTOGRAMAS_DISPONIVEIS).map(([categoria, itens]) => (
                <div key={categoria}>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">{categoria}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {itens.map((item) => {
                      const selecionado = tipoIcone === item.slug;

                      return (
                        <button
                          key={item.slug}
                          type="button"
                          onClick={() => setTipoIcone(item.slug)}
                          className={`flex items-center gap-2 rounded-lg border px-2 py-2 text-left transition-colors ${
                            selecionado
                              ? 'border-indigo-400 bg-indigo-500/10 text-indigo-200'
                              : 'border-gray-700 bg-gray-900 text-gray-200 hover:border-gray-500'
                          }`}
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-800/80">
                            <Icon icon={item.slug} className="h-5 w-5" />
                          </span>
                          <span className="text-[10px] leading-tight uppercase tracking-wide">{item.nome}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={exportarParaPDF}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-md text-sm"
            >
              Gerar PDF Vetorial (Pronto)
            </button>

            <button
              type="button"
              onClick={exportarSVG}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-md text-sm"
            >
              Exportar SVG
            </button>

            {modoInternoEmMassa && (
              <button
                onClick={executarGeracaoEmMassa}
                className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-md text-sm border border-emerald-500"
              >
                Gerar Catálogo Completo em Lote (Interno)
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-gray-950 p-8 rounded-2xl border border-gray-800 flex flex-col items-center justify-center relative shadow-inner">
          <span className="absolute top-4 left-4 text-xs font-mono text-gray-500">
            Preview em Tempo Real [{tamanhoSelecionado.name}]
          </span>

          <div ref={placaRef} className="w-full max-w-md" dangerouslySetInnerHTML={{ __html: svgMarkup }} />

          <p className="mt-6 text-xs text-gray-500 text-center">
            * O motor gera o SVG vetorial e exporta diretamente para PDF com dimensões físicas em milímetros.
          </p>
        </div>
      </div>
    </div>
  );
}
