# Vista Explodida 3D — Intech Machine

Catálogo web com as categorias de produtos (levantadas da pasta **Vista Explodida** do Google Drive) e visualizador 3D interativo das peças.

## Páginas
- `index.html` — 20 categorias, busca por categoria/modelo e lista de modelos por categoria.
- `produto-bp500.html` — piloto: Bomba periférica **BP500** com vista explodida 3D (38 posições), códigos de reposição, dados técnicos, descritivo e downloads.

## Como abrir
Os módulos JS precisam de um servidor local:

```bash
python3 -m http.server 8000
```

Depois acesse http://localhost:8000. (Também funciona via GitHub Pages.)

## Estrutura
- `assets/js/data.js` — categorias, modelos, especificações e lista de peças da BP500 (planilha `BP500 - Novo.xlsx` + PDF).
- `assets/js/bp500-3d.js` — modelo 3D paramétrico (Three.js) montado a partir da vista explodida oficial.
- `assets/docs/` — PDF original da vista explodida.

Para adicionar um novo produto: inclua os dados em `data.js`, crie o modelo em `assets/js/<produto>-3d.js` e registre em `PRODUTOS_3D`.
