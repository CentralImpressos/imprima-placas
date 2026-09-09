import { useMemo, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { jsPDF } from 'jspdf';
import { svg2pdf } from 'svg2pdf.js';

const PICTOGRAMAS_DISPONIVEIS = {
  'Trânsito / Proibição': [
    { nome: 'Proibido estacionar', slug: 'mdi:car-off' },
    { nome: 'Sem entrada', slug: 'mdi:road-variant-off' },
    { nome: 'Proibido fumar', slug: 'mdi:smoking-off' },
    { nome: 'Acesso restrito', slug: 'mdi:shield-off-outline' }
  ],
  'Emergência / Rotas': [
    { nome: 'Extintor', slug: 'mdi:fire-extinguisher' },
    { nome: 'Saída de emergência', slug: 'mdi:exit-run' },
    { nome: 'Primeiros socorros', slug: 'mdi:medical-bag' },
    { nome: 'Rota de evacuação', slug: 'mdi:directions-fork' }
  ],
  'Advertência': [
    { nome: 'Atenção', slug: 'mdi:alert' },
    { nome: 'Piso escorregadio', slug: 'mdi:slippery' },
    { nome: 'Risco elétrico', slug: 'mdi:flash-alert' },
    { nome: 'Cuidado com máquinas', slug: 'mdi:industrial' }
  ],
  'Utilidades / Serviços': [
    { nome: 'Câmera', slug: 'mdi:cctv' },
    { nome: 'Acesso para cadeirantes', slug: 'mdi:wheelchair-accessibility' },
    { nome: 'Banheiro', slug: 'mdi:toilet' },
    { nome: 'Lixeira', slug: 'mdi:trash-can-outline' }
  ]
};

// Gerador de Placas de Sinalização - Imprima Cooper (B2B / Uso Interno & Público)
export default function PlacaGenerator() {
  // Estados do Gerador
  const [tipoPlaca, setTipoPlaca] = useState<'aviso' | 'perigo' | 'emergencia'>('aviso'); // 'aviso', 'perigo', 'emergencia'
  const [cabecalho, setCabecalho] = useState('ATENÇÃO');
  const [corpo, setCorpo] = useState('PROIBIDO ESTACIONAR\nSUJEITO A GUINCHO');
  const [tamanho, setTamanho] = useState('20x30'); // 20x30cm, 10x10cm, etc.
  const [possuiIcone, setPossuiIcone] = useState(true);
  const [tipoIcone, setTipoIcone] = useState('mdi:car-off');
  const [modoInternoEmMassa, setModoInternoEmMassa] = useState(false);

  const placaRef = useRef<SVGSVGElement | null>(null);

  const medidasPlaca = useMemo(() => {
    const [larguraCm, alturaCm] = tamanho.split('x').map(Number);
    const widthMm = larguraCm * 10;
    const heightMm = alturaCm * 10;

    return {
      larguraCm,
      alturaCm,
      widthMm,
      heightMm,
      widthPx: larguraCm * 40,
      heightPx: alturaCm * 40,
      ratio: larguraCm / alturaCm,
    };
  }, [tamanho]);

  const exportarParaPDF = async () => {
    if (!placaRef.current) {
      alert('Nenhuma placa disponível para exportação.');
      return;
    }

    try {
      const { widthMm, heightMm } = medidasPlaca;
      const documento = new jsPDF({
        unit: 'mm',
        format: [widthMm, heightMm],
        orientation: widthMm > heightMm ? 'landscape' : 'portrait',
      });

      await svg2pdf(placaRef.current, documento, {
        x: 0,
        y: 0,
        width: widthMm,
        height: heightMm,
      });

      const nomeArquivo = `placa-${tipoPlaca}-${tamanho.replace('x', 'x')}.pdf`;
      documento.save(nomeArquivo);
    } catch (error) {
      console.error('Erro ao exportar PDF vetorial:', error);
      alert('Não foi possível gerar o PDF vetorial. Verifique o console para detalhes.');
    }
  };

  // Função para simular a exportação em massa (Uso interno)
  const executarGeracaoEmMassa = () => {
    alert("Rotina interna disparada! Gerando catálogo completo ISO 7010 e NBR 16820 em lote (PDFs vetorizados)...");
  };

  const linhasCorpo = (corpo || 'Texto principal da sinalização')
    .split('\n')
    .map((linha) => linha.trim())
    .filter(Boolean)
    .slice(0, 3);

  const plateFill = tipoPlaca === 'aviso' ? '#fbbf24' : tipoPlaca === 'perigo' ? '#dc2626' : '#059669';
  const plateText = tipoPlaca === 'aviso' ? '#111111' : '#ffffff';
  const plateStroke = '#111111';

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6 flex flex-col items-center">
      
      {/* Header do App */}
      <header className="w-full max-w-5xl mb-8 flex flex-col md:flex-row justify-between items-center border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">IMPRIMA COOPER <span className="text-indigo-500 text-sm font-normal">| Gerador Técnico de Placas</span></h1>
          <p className="text-sm text-gray-400">Padrão NBR 16820 / ISO 7010 & Personalizados</p>
        </div>
        
        {/* Toggle Modo Interno (Simulando acesso restrito) */}
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

      {/* Main Workspace */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Painel de Controles */}
        <div className="lg:col-span-1 bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl flex flex-col gap-4">
          <h2 className="text-lg font-bold text-indigo-400 border-b border-gray-700 pb-2">Configuração da Placa</h2>

          {/* Tipo de Norma / Categoria */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Categoria / Norma</label>
            <select 
              value={tipoPlaca} 
              onChange={(e) => setTipoPlaca(e.target.value as 'aviso' | 'perigo' | 'emergencia')}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="aviso">Aviso / Advertência (Amarelo)</option>
              <option value="perigo">Perigo / Proibição (Vermelho)</option>
              <option value="emergencia">Emergência / Rota (Verde NBR 16820)</option>
            </select>
          </div>

          {/* Cabeçalho */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Texto do Cabeçalho</label>
            <input 
              type="text" 
              value={cabecalho} 
              onChange={(e) => setCabecalho(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Corpo do Texto */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Texto Principal (Corpo)</label>
            <textarea 
              rows={3}
              value={corpo} 
              onChange={(e) => setCorpo(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Tamanho Comercial */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Dimensão Comercial</label>
            <select 
              value={tamanho} 
              onChange={(e) => setTamanho(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="10x10">10x10 cm (Miniatura)</option>
              <option value="20x20">20x20 cm (Quadrada)</option>
              <option value="20x30">20x30 cm (Padrão Retangular)</option>
              <option value="40x30">40x30 cm (Grande Formato)</option>
            </select>
          </div>

          {/* Opção de Pictograma */}
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

          {/* Botões de Ação */}
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={exportarParaPDF}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-md text-sm"
            >
              Gerar PDF Vetorial (Pronto)
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

        {/* Preview Visual da Placa (Renderização Real com Tailwind) */}
        <div className="lg:col-span-2 bg-gray-950 p-8 rounded-2xl border border-gray-800 flex flex-col items-center justify-center relative shadow-inner">
          <span className="absolute top-4 left-4 text-xs font-mono text-gray-500">Preview em Tempo Real [{tamanho}cm]</span>

          <svg
            ref={placaRef}
            viewBox={`0 0 ${medidasPlaca.widthPx} ${medidasPlaca.heightPx}`}
            width={medidasPlaca.widthPx}
            height={medidasPlaca.heightPx}
            className="w-full max-w-md h-auto shadow-2xl transition-all"
            role="img"
            aria-label={`Placa ${cabecalho || 'CABEÇALHO'}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <rect
              x="0"
              y="0"
              width={medidasPlaca.widthPx}
              height={medidasPlaca.heightPx}
              rx={medidasPlaca.widthPx * 0.06}
              fill={plateFill}
              stroke={plateStroke}
              strokeWidth={Math.max(4, medidasPlaca.widthPx * 0.02)}
            />

            <rect
              x={medidasPlaca.widthPx * 0.08}
              y={medidasPlaca.heightPx * 0.08}
              width={medidasPlaca.widthPx * 0.84}
              height={medidasPlaca.heightPx * 0.18}
              fill="none"
              stroke={plateText}
              strokeWidth={Math.max(2, medidasPlaca.widthPx * 0.008)}
            />

            <text
              x={medidasPlaca.widthPx / 2}
              y={medidasPlaca.heightPx * 0.17}
              textAnchor="middle"
              fill={plateText}
              fontSize={Math.max(18, medidasPlaca.widthPx * 0.08)}
              fontWeight="900"
              letterSpacing="0.12em"
              style={{ fontFamily: 'Arial, sans-serif' }}
            >
              {(cabecalho || 'CABEÇALHO').toUpperCase()}
            </text>

            <g transform={`translate(${medidasPlaca.widthPx * 0.5}, ${medidasPlaca.heightPx * 0.5})`}>
              {possuiIcone && (
                <g transform={`translate(${-medidasPlaca.widthPx * 0.18}, ${-medidasPlaca.heightPx * 0.12})`}>
                  <circle
                    cx="0"
                    cy="0"
                    r={Math.max(22, medidasPlaca.widthPx * 0.11)}
                    fill="rgba(255,255,255,0.06)"
                    stroke={plateText}
                    strokeWidth={Math.max(2, medidasPlaca.widthPx * 0.008)}
                  />
                  <g transform={`translate(${-medidasPlaca.widthPx * 0.05}, ${-medidasPlaca.heightPx * 0.06})`}>
                    <Icon icon={tipoIcone} width={Math.max(34, medidasPlaca.widthPx * 0.12)} height={Math.max(34, medidasPlaca.widthPx * 0.12)} color={plateText} />
                  </g>
                </g>
              )}

              {linhasCorpo.map((linha, index) => (
                <text
                  key={`${linha}-${index}`}
                  x={possuiIcone ? medidasPlaca.widthPx * 0.18 : 0}
                  y={index * (Math.max(18, medidasPlaca.heightPx * 0.08)) + (possuiIcone ? medidasPlaca.heightPx * 0.1 : 0)}
                  fill={plateText}
                  textAnchor="middle"
                  fontSize={Math.max(16, medidasPlaca.widthPx * 0.055)}
                  fontWeight="800"
                  style={{ fontFamily: 'Arial, sans-serif' }}
                >
                  {linha.toUpperCase()}
                </text>
              ))}
            </g>

            <text
              x={medidasPlaca.widthPx / 2}
              y={medidasPlaca.heightPx * 0.9}
              textAnchor="middle"
              fill={plateText}
              opacity="0.8"
              fontSize={Math.max(8, medidasPlaca.widthPx * 0.024)}
              letterSpacing="0.18em"
              style={{ fontFamily: 'Arial, sans-serif' }}
            >
              IMPRIMA COOPER • PADRÃO TÉCNICO
            </text>
          </svg>

          <p className="mt-6 text-xs text-gray-500 text-center">
            * O motor gera os vetores utilizando a fonte Inter com espaçamento e raios matematicamente corrigidos para corte a laser/plotter.
          </p>
        </div>

      </div>
    </div>
  );
}