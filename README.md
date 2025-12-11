# FCamara Linkding → PDF (Vue + Vite)

App Vue 3 simples para buscar um bookmark do Linkding, permitir editar seções e gerar um PDF padronizado com a identidade FCamara. Pronto para deploy no Vercel (build estático).

## Rodar localmente
1. Instale dependências: `npm install`
2. Dev server: `npm run dev` (abre em http://localhost:5173)
3. Build: `npm run build` (gera `dist/`)

> Observação: se sua instância do Linkding bloquear CORS, rode o app na mesma origem ou crie um proxy em `/api` no Vercel para encaminhar a requisição.

## Deploy no Vercel
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

## Fluxo de uso
1. Cole a URL do recurso do Linkding (ex.: `/api/bookmarks/123/`) e, se necessário, o token.
2. Clique em “Buscar dados” para preencher título/URL/descrição/tags.
3. Edite ou adicione seções.
4. Clique em “Baixar PDF” para gerar o PDF brandado.

## Personalizações rápidas
- Trocar logo para asset local: coloque um arquivo em `public/` e ajuste o `src` no `App.vue`.
- Ajustar cores/tipografia: editar `src/style.css`.
