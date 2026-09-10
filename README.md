# Imprima Placas

Gerador de placas de sinalização em navegador, com preview vetorial em SVG e exportação em SVG/PDF para produção.

## Stack
- React + Vite + TypeScript
- SVG nativo para preview e exportação
- jsPDF + svg2pdf.js para PDF vetorial
- @iconify/react para pictogramas

## Como instalar

npm install

## Como rodar

npm run dev

## Como buildar

npm run build

## Arquitetura

- src/types: tipos centrais do domínio
- src/data: categorias, tamanhos e templates
- src/templates: definição dos layouts e geometria
- src/renderer: geração do SVG de cada template
- src/export: exportação SVG/PDF
- src/components: composição da interface
- src/utils: utilidades para texto e formatação

## Onde adicionar novos templates

Crie um novo arquivo em src/templates e registre o template em src/data/templates.ts.

## Onde adicionar novos tamanhos

Edite a lista em src/data/sizes.ts.

## Onde adicionar categorias

Edite a lista em src/data/categories.ts.
