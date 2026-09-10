import type { PlateCategory } from '../types';

export const CATEGORIES: PlateCategory[] = [
  { id: 'avisos', name: 'Avisos', description: 'Sinalização de atenção e cuidado' },
  { id: 'proibicao', name: 'Proibição', description: 'Sinalização de proibição e restrição' },
  { id: 'obrigatorio', name: 'Obrigatório', description: 'Instrução e obrigatório' },
  { id: 'emergencia', name: 'Emergência', description: 'Saída, evacuação e socorro' },
  { id: 'servicos', name: 'Serviços', description: 'Informação e acessos' },
  { id: 'personalizadas', name: 'Personalizadas', description: 'Modelos internos e específicos' }
];
