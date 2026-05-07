# NovaWave Studio

Site estático criado do zero com HTML, CSS e JavaScript puro.

## Estrutura

- `index.html`: estrutura da página e seções
- `styles.css`: estilo visual responsivo
- `script.js`: interações (menu mobile e feedback do formulário)
- `assets/fonts/`: fontes locais do projeto

## Como executar

Opção 1: abrir `index.html` diretamente no navegador.

Opção 2 (recomendada): subir um servidor local simples:

```bash
python3 -m http.server 5173
```

Depois, acesse:

`http://localhost:5173`

## Fontes (Design System)

As fontes do projeto são carregadas localmente via `@font-face` em `styles.css`.

- **Títulos e Texto/UI**: Proxima Nova (Regular/Semibold/Bold/Extrabold)

Para funcionar, coloque os arquivos exatamente com estes nomes em `assets/fonts/`:

- `Proxima Nova Regular.ttf`
- `Proxima Nova Semibold.ttf`
- `Proxima Nova Bold.otf`
- `Proxima Nova Extrabold.ttf`

## Próximos passos sugeridos

- Integrar formulário com backend/API
- Adicionar projetos reais com imagens
- Publicar em um serviço de hospedagem (opcional)
