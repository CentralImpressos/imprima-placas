import type { SignPreset } from '../types';

export const DEFAULT_FRAME_COLOR = { c: 0, m: 0, y: 0, k: 100 };
export const DEFAULT_BLUE = { c: 100, m: 70, y: 0, k: 0 };
export const DEFAULT_RED = { c: 0, m: 100, y: 100, k: 0 };
export const DEFAULT_YELLOW = { c: 0, m: 15, y: 100, k: 0 };
export const DEFAULT_YELLOW_PURE = { c: 0, m: 0, y: 100, k: 0 };
export const DEFAULT_GREEN = { c: 85, m: 0, y: 80, k: 10 };
export const DEFAULT_BLACK = { c: 0, m: 0, y: 0, k: 100 };

export const SIGN_PRESETS: SignPreset[] = [
  {
    id: 'proibido-fumar',
    name: 'Proibido Fumar',
    frameType: 'simple',
    message: 'PROIBIDO\nFUMAR',
    icon: 'mdi:smoking',
    defaults: { circle: true, prohibition: true, frameColor: DEFAULT_FRAME_COLOR, pictogramPosition: 'top' },
  },
  {
    id: 'entrada-animais',
    name: 'Entrada de Animais',
    frameType: 'header',
    heading: 'AVISO',
    message: 'É PROIBIDA A ENTRADA DE ANIMAIS',
    icon: 'mdi:dog',
    defaults: {
      frameColor: DEFAULT_FRAME_COLOR,
      pictogramPosition: 'top',
      circle: true,
      prohibition: true,
    },
  },
  {
    id: 'criancas-acompanhadas',
    name: 'Crianças Acompanhadas',
    frameType: 'header',
    heading: 'AVISO',
    message: 'CRIANÇAS SOMENTE ACOMPANHADAS DE UM RESPONSÁVEL',
    icon: 'mdi:account-child',
    defaults: { frameColor: DEFAULT_BLUE, pictogramPosition: 'top' },
  },
  {
    id: 'ducha-piscina',
    name: 'Ducha Antes da Piscina',
    frameType: 'header',
    heading: 'AVISO',
    message: 'OBRIGATÓRIO PASSAR PELA DUCHA ANTES DE ENTRAR NA PISCINA',
    icon: 'mdi:shower',
    defaults: { frameColor: DEFAULT_BLUE, pictogramPosition: 'top' },
  },
  {
    id: 'proibido-nadar',
    name: 'Proibido Nadar',
    frameType: 'simple',
    message: 'PROIBIDO\nNADAR',
    icon: 'mdi:swim',
    defaults: { circle: true, prohibition: true },
  },
  {
    id: 'piscina-manutencao',
    name: 'Piscina em Manutenção',
    frameType: 'header',
    heading: 'AVISO',
    message: 'PISCINA EM MANUTENÇÃO',
    icon: 'mdi:pool',
    defaults: { frameColor: DEFAULT_BLUE, pictogramPosition: 'top' },
  },
  {
    id: 'velocidade-20',
    name: 'Velocidade Máxima 20 km/h',
    frameType: 'header',
    heading: 'AVISO',
    message: 'VELOCIDADE MÁXIMA PERMITIDA\n20 km/h',
    icon: 'mdi:speedometer',
    defaults: { frameColor: DEFAULT_BLUE, pictogramPosition: 'top' },
  },
  {
    id: 'reciclagem',
    name: 'Reciclagem',
    frameType: 'circular',
    message: 'RECICLÁVEL',
    icon: 'mdi:recycle',
    defaults: { frameColor: DEFAULT_GREEN },
  },
  {
    id: 'atencao',
    name: 'Atenção / Cuidado',
    frameType: 'triangle',
    heading: 'ATENÇÃO',
    message: 'CUIDADO',
    icon: 'mdi:alert',
    defaults: { frameColor: DEFAULT_YELLOW, backgroundColor: DEFAULT_YELLOW },
  },
  {
    id: 'risco-eletrico',
    name: 'Risco Elétrico',
    frameType: 'diamond',
    message: '',
    icon: 'mdi:flash',
    defaults: {
      frameEnabled: true,
      circle: false,
      prohibition: false,
      frameColor: DEFAULT_BLACK,
      backgroundColor: DEFAULT_YELLOW_PURE,
      iconColor: DEFAULT_BLACK,
      pictogramPosition: 'top',
    },
  },
];

export function getPresetById(id: string): SignPreset {
  return SIGN_PRESETS.find((preset) => preset.id === id) ?? SIGN_PRESETS[0];
}
