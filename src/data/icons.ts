export const PICTOGRAMAS_DISPONIVEIS = {
  'Trânsito / Proibição': [
    { nome: 'Proibido estacionar', slug: 'mdi:car-off' },
    { nome: 'Sem entrada', slug: 'mdi:road-variant-off' },
    { nome: 'Proibido fumar', slug: 'mdi:smoking' },
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
} as const;
