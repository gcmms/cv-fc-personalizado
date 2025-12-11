# FCamara Perfil → PDF (Vue + Vite)

App Vue 3 para enviar um PDF de perfil (ex.: export do LinkedIn), extrair texto, permitir edição de seções e gerar um PDF padronizado com identidade FCamara. Pronto para deploy no Vercel (build estático).

## Rodar localmente
1. Instale dependências: `npm install`
2. Dev server: `npm run dev` (abre em http://localhost:5173)
3. Build: `npm run build` (gera `dist/`)

## Deploy no Vercel
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

## Fluxo de uso
1. Envie o PDF do perfil (export do LinkedIn ou similar).
2. O app extrai o texto e pré-preenche nome/headline/resumo.
3. Edite ou adicione seções.
4. Clique em “Baixar PDF” para gerar o PDF brandado.

## Personalizações rápidas
- Trocar logo para asset local: coloque um arquivo em `public/` e ajuste o `src` no `App.vue`.
- Ajustar cores/tipografia: editar `src/style.css`.
