// Biblioteca de pictogramas disponíveis no popup de seleção de ícone.
//
// Notas importantes de manutenção:
//
// 1. O MESMO slug pode aparecer em mais de uma categoria com nomes
//    diferentes (ex: 'mdi:dog' em "Proibições gerais" e em "Ambiente / Lazer").
//    Isso é intencional: o SIGNIFICADO da placa (proibido x permitido) vem do
//    TEMPLATE escolhido (círculo vermelho de proibição, quadrado azul de
//    obrigação, verde de informação/permissão), não do ícone em si. O MDI não
//    tem "versões" opostas do mesmo pictograma, então reaproveitamos o glyph.
//
// 2. Alguns conceitos não têm um ícone fiel no MDI (biblioteca de uso geral,
//    não feita para sinalização ISO 7010). Nesses casos, escolhi a melhor
//    aproximação disponível e deixei um comentário "// aprox.:" explicando
//    a limitação, em vez de inventar um slug que não existe (o que renderiza
//    em branco no popup). Se algum dia vocês migrarem pra pictogramas ISO
//    7010 de verdade (svg custom), esses são os primeiros candidatos a trocar.
//
// 3. Todo ícone aqui deve ser conferido visualmente no popup depois de
//    qualquer edição — um slug com erro de digitação não dá erro de build,
//    só renderiza vazio.

export const PICTOGRAMAS_DISPONIVEIS = {
  'Trânsito': [
    { nome: 'Bicicleta', slug: 'mdi:bicycle' },
    { nome: 'Motocicleta', slug: 'mdi:motorbike' },
    { nome: 'Caminhão', slug: 'mdi:truck' },
    { nome: 'Pedestre', slug: 'mdi:walk' },
    { nome: 'Virar à esquerda', slug: 'mdi:arrow-left-bold' },
    { nome: 'Virar à direita', slug: 'mdi:arrow-right-bold' },
    { nome: 'Velocidade', slug: 'mdi:speedometer' },
    { nome: 'Estacionamento (E)', slug: 'mdi:alpha-e' },
    { nome: 'Vaga acessível', slug: 'mdi:wheelchair' },
    { nome: 'Estacionamento de bicicleta', slug: 'mdi:bicycle' },
  ],

  'Proibições gerais': [
    { nome: 'Cigarro', slug: 'mdi:smoking' },
    { nome: 'Celular', slug: 'mdi:cellphone' },
    { nome: 'Comida', slug: 'mdi:food' },
    { nome: 'Bebidas', slug: 'mdi:glass-cocktail' },
    { nome: 'Animais', slug: 'mdi:dog' },
    { nome: 'Nadar', slug: 'mdi:swim' },
    { nome: 'Câmera / Fotografar', slug: 'mdi:camera' },
    { nome: 'Sem entrada', slug: 'mdi:cancel' },
    { nome: 'Acesso restrito', slug: 'mdi:shield-outline' },
  ],

  'Avisos / Riscos': [
    { nome: 'Atenção', slug: 'mdi:alert' },
    { nome: 'Elétrico', slug: 'mdi:flash' },
    { nome: 'Risco elétrico (com alerta)', slug: 'mdi:flash-alert' },
    { nome: 'Piso escorregadio', slug: 'mdi:human-handsdown' }, // aprox.: MDI não tem "pessoa escorregando"; reaproveita o mesmo glyph de "Queda"
    { nome: 'Queda', slug: 'mdi:human-handsdown' },
    { nome: 'Cuidado com máquinas', slug: 'mdi:cog' }, // aprox.: sem ícone específico de "maquinário industrial" confirmado no MDI
    { nome: 'Risco biológico', slug: 'mdi:biohazard' },
    { nome: 'Alta temperatura', slug: 'mdi:thermometer-alert' },
    { nome: 'Cuidado com degrau', slug: 'mdi:stairs' },
    { nome: 'Material inflamável', slug: 'mdi:fire' },
    { nome: 'Radiação', slug: 'mdi:radioactive' },
    { nome: 'Cuidado com o cão', slug: 'mdi:dog-side' },
    { nome: 'Frágil', slug: 'mdi:glass-fragile' },
    { nome: 'Empilhadeira', slug: 'mdi:forklift' },
    { nome: 'Risco de corte', slug: 'mdi:content-cut' },
    { nome: 'Risco de explosão', slug: 'mdi:bomb' },
    { nome: 'Gás', slug: 'mdi:gas-cylinder' },
    { nome: 'Perigo químico', slug: 'mdi:flask' },
    { nome: 'Piso irregular', slug: 'mdi:terrain' },
    { nome: 'Área molhada', slug: 'mdi:water-alert' },
    { nome: 'Carga suspensa', slug: 'mdi:crane' },
  ],

  'Obrigações / EPI': [
    { nome: 'Use máscara', slug: 'mdi:face-mask' },
    { nome: 'Use capacete', slug: 'mdi:hard-hat' },
    { nome: 'Use luvas', slug: 'mdi:hand-back-left' }, // aprox.: MDI não tem ícone específico de luva
    { nome: 'Use óculos de proteção', slug: 'mdi:safety-goggles' },
    { nome: 'Use cinto de segurança', slug: 'mdi:seatbelt' },
    { nome: 'Lave as mãos', slug: 'mdi:hand-wash' },
    { nome: 'Mantenha distância', slug: 'mdi:human-greeting-proximity' },
    { nome: 'Use protetor auricular', slug: 'mdi:ear-hearing' },
    { nome: 'Use calçado de segurança', slug: 'mdi:shoe-print' }, // aprox.: MDI não tem "bota industrial"; pegada é o mais neutro disponível
    { nome: 'Obrigatório', slug: 'mdi:check-circle' },
    { nome: 'Use respirador', slug: 'mdi:air-filter' },
    // 'Use colete de segurança' foi removido: não existe ícone de colete no
    // MDI e todas as aproximações testadas (mdi:human, mdi:tshirt-crew) não
    // comunicam a mensagem. Recomendo um SVG customizado se esse item for
    // essencial pro catálogo.
  ],

  'Emergência / Rotas': [
    { nome: 'Extintor', slug: 'mdi:fire-extinguisher' },
    { nome: 'Saída de emergência', slug: 'mdi:exit-run' },
    { nome: 'Primeiros socorros', slug: 'mdi:medical-bag' },
    { nome: 'Rota de evacuação', slug: 'mdi:directions-fork' },
    { nome: 'Ponto de encontro', slug: 'mdi:map-marker-radius' },
    { nome: 'Alarme de incêndio', slug: 'mdi:fire-alert' },
    { nome: 'Hidrante', slug: 'mdi:fire-hydrant' },
    { nome: 'Telefone de emergência', slug: 'mdi:phone-alert' },
    { nome: 'Desfibrilador', slug: 'mdi:heart-flash' },
    { nome: 'Chuveiro de emergência', slug: 'mdi:shower' },
    { nome: 'Lava-olhos', slug: 'mdi:eye-outline' },
    { nome: 'Porta corta-fogo', slug: 'mdi:door' },
    { nome: 'Alarme', slug: 'mdi:alarm-light' },
  ],

  'Sinalização / Utilidades': [
    { nome: 'Câmera de segurança', slug: 'mdi:cctv' },
    { nome: 'Acessibilidade', slug: 'mdi:wheelchair' },
    { nome: 'Banheiro', slug: 'mdi:toilet' },
    { nome: 'Banheiro masculino', slug: 'mdi:human-male' },
    { nome: 'Banheiro feminino', slug: 'mdi:human-female' },
    { nome: 'Banheiro família', slug: 'mdi:human-male-female-child' },
    { nome: 'Lixeira', slug: 'mdi:trash-can-outline' },
    { nome: 'Reciclagem', slug: 'mdi:recycle' },
    { nome: 'Elevador', slug: 'mdi:elevator' },
    { nome: 'Escada (localização)', slug: 'mdi:stairs' },
    { nome: 'Escada rolante', slug: 'mdi:escalator' },
    { nome: 'Wi-Fi', slug: 'mdi:wifi' },
    { nome: 'Bebedouro', slug: 'mdi:cup-water' },
    { nome: 'Informações', slug: 'mdi:information' },
    { nome: 'Recepção', slug: 'mdi:desk' },
    { nome: 'Entrada', slug: 'mdi:door-open' },
    { nome: 'Seta para cima', slug: 'mdi:arrow-up-bold' },
    { nome: 'Seta para baixo', slug: 'mdi:arrow-down-bold' },
    { nome: 'Seta para esquerda', slug: 'mdi:arrow-left-bold' },
    { nome: 'Seta para direita', slug: 'mdi:arrow-right-bold' },
  ],

  'Ambiente / Lazer': [
    { nome: 'Gramado', slug: 'mdi:grass' },
    { nome: 'Não pisar na grama', slug: 'mdi:grass' },
    { nome: 'Área de lazer', slug: 'mdi:slide' },
    { nome: 'Piscina', slug: 'mdi:pool' },
    { nome: 'Ducha', slug: 'mdi:shower' },
    { nome: 'Animais permitidos', slug: 'mdi:dog' },
    { nome: 'Coleira obrigatória', slug: 'mdi:dog-side' },
    { nome: 'Crianças', slug: 'mdi:account-child' },
    { nome: 'Adulto acompanhando criança', slug: 'mdi:human-male-boy' },
    { nome: 'Área verde', slug: 'mdi:tree' },
    { nome: 'Fumar permitido', slug: 'mdi:smoking' },
    { nome: 'Água potável', slug: 'mdi:water-check' },
    { nome: 'Limpe os dejetos do seu pet', slug: 'mdi:emoticon-poop' },
  ],
} as const;