import type { SignPreset } from '../types';

export const DEFAULT_FRAME_COLOR = { c: 0, m: 0, y: 0, k: 100 };
export const DEFAULT_BLUE = { c: 100, m: 70, y: 0, k: 0 };
export const DEFAULT_RED = { c: 0, m: 100, y: 100, k: 0 };
export const DEFAULT_YELLOW = { c: 0, m: 15, y: 100, k: 0 };
export const DEFAULT_YELLOW_PURE = { c: 0, m: 0, y: 100, k: 0 };
export const DEFAULT_GREEN = { c: 100, m: 0, y: 100, k: 0 };
export const DEFAULT_BLACK = { c: 0, m: 0, y: 0, k: 100 };
export const DEFAULT_WHITE = { c: 0, m: 0, y: 0, k: 0 };
export const DEFAULT_BROWN = { c: 30, m: 60, y: 80, k: 35 };
export const DEFAULT_GRAY = { c: 0, m: 0, y: 0, k: 55 };

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
  // ——— Coleta seletiva / recicláveis (padrão brasileiro) ———
  {
    id: 'reciclavel',
    name: 'Reciclável',
    frameType: 'circular',
    message: 'RECICLÁVEL',
    icon: 'mdi:recycle',
    defaults: {
      circle: false,
      prohibition: false,
      frameEnabled: true,
      frameColor: DEFAULT_GREEN,
      backgroundColor: DEFAULT_WHITE,
      iconColor: DEFAULT_GREEN,
      textColor: DEFAULT_GREEN,
      pictogramPosition: 'top',
    },
  },
  {
    id: 'reciclagem-papel',
    name: 'Papel (Azul)',
    frameType: 'simple',
    message: 'PAPEL',
    icon: 'mdi:recycle',
    defaults: {
      circle: false,
      prohibition: false,
      frameColor: DEFAULT_BLUE,
      backgroundColor: DEFAULT_BLUE,
      iconColor: DEFAULT_WHITE,
      textColor: DEFAULT_WHITE,
      pictogramPosition: 'top',
    },
  },
  {
    id: 'reciclagem-plastico',
    name: 'Plástico (Vermelho)',
    frameType: 'simple',
    message: 'PLÁSTICO',
    icon: 'mdi:recycle',
    defaults: {
      circle: false,
      prohibition: false,
      frameColor: DEFAULT_RED,
      backgroundColor: DEFAULT_RED,
      iconColor: DEFAULT_WHITE,
      textColor: DEFAULT_WHITE,
      pictogramPosition: 'top',
    },
  },
  {
    id: 'reciclagem-metal',
    name: 'Metal (Amarelo)',
    frameType: 'simple',
    message: 'METAL',
    icon: 'mdi:recycle',
    defaults: {
      circle: false,
      prohibition: false,
      frameColor: DEFAULT_YELLOW_PURE,
      backgroundColor: DEFAULT_YELLOW_PURE,
      iconColor: DEFAULT_BLACK,
      textColor: DEFAULT_BLACK,
      pictogramPosition: 'top',
    },
  },
  {
    id: 'reciclagem-vidro',
    name: 'Vidro (Verde)',
    frameType: 'simple',
    message: 'VIDRO',
    icon: 'mdi:recycle',
    defaults: {
      circle: false,
      prohibition: false,
      frameColor: DEFAULT_GREEN,
      backgroundColor: DEFAULT_GREEN,
      iconColor: DEFAULT_WHITE,
      textColor: DEFAULT_WHITE,
      pictogramPosition: 'top',
    },
  },
  {
    id: 'reciclagem-organico',
    name: 'Orgânico (Marrom)',
    frameType: 'simple',
    message: 'ORGÂNICO',
    icon: 'mdi:recycle',
    defaults: {
      circle: false,
      prohibition: false,
      frameColor: DEFAULT_BROWN,
      backgroundColor: DEFAULT_BROWN,
      iconColor: DEFAULT_WHITE,
      textColor: DEFAULT_WHITE,
      pictogramPosition: 'top',
    },
  },
  {
    id: 'nao-reciclavel',
    name: 'Não Reciclável (Cinza)',
    frameType: 'simple',
    message: 'NÃO\nRECICLÁVEL',
    icon: 'mdi:trash-can-outline',
    defaults: {
      circle: false,
      prohibition: false,
      frameColor: DEFAULT_GRAY,
      backgroundColor: DEFAULT_GRAY,
      iconColor: DEFAULT_WHITE,
      textColor: DEFAULT_WHITE,
      pictogramPosition: 'top',
    },
  },
  {
    id: 'atencao',
    name: 'Atenção / Cuidado',
    frameType: 'triangle',
    heading: 'ATENÇÃO',
    message: 'CUIDADO',
    icon: 'mdi:alert',
    defaults: {
      frameEnabled: true,
      frameColor: DEFAULT_BLACK,
      backgroundColor: DEFAULT_YELLOW,
      iconColor: DEFAULT_BLACK,
    },
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
