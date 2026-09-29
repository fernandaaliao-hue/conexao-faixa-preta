# Conexão Faixa Preta — convite e inscrições

Página de convite do **Conexão Faixa Preta**, encontro de jiu-jitsu, negócios e conexões da Full Sales.

- **Quando:** 20 de outubro de 2026, terça, das 19h às 22h (horário de Brasília)
- **Onde:** Espaço Full Sales, Rua Gomes de Carvalho, 1996, Vila Olímpia, São Paulo
- **No ar:** https://conexao-faixa-preta.vercel.app

| Página | Para quem | O que faz |
|---|---|---|
| `/` | público | Convite: data, horário, local, contagem regressiva e o botão **Inscreva-se** |
| `/inscricao` | público | Formulário de inscrição |
| `/inscritos` | equipe | Lista de inscritos com busca, contadores e **Baixar planilha** (CSV). Pede a chave de acesso |

## Como está montado

O projeto não tem framework nem etapa de build. São HTML puro e duas funções serverless na Vercel.

```
index.html              convite (tudo cabe numa tela, em qualquer orientação)
inscricao.html          formulário
inscritos.html          painel da equipe
api/inscricao.js        POST /api/inscricao: valida e grava a inscrição
api/inscritos.js        GET  /api/inscritos: lista (JSON ou ?formato=csv); exige a chave
lib/db.js               conexão com o banco e criação da tabela
assets/                 foto-equipe.jpg = foto de fundo (recorte de foto-equipe-original.png, sem logo e sem legenda); os *-original ficam fora do deploy
conexao-faixa-preta.ics arquivo de agenda (Apple/Outlook)
vercel.json             URLs sem ".html" e noindex na página da equipe
```

**Banco:** Neon Postgres, provisionado pelo Marketplace da Vercel (recurso `conexao-faixa-preta-inscricoes`).
A tabela `inscricoes` é criada sozinha na primeira chamada, então não há migração para rodar.

## Regras que não são óbvias

- **E-mail é único.** Quem se inscreve de novo com o mesmo e-mail **atualiza** os próprios dados em vez de gerar uma linha duplicada. A tela avisa "Inscrição atualizada".
- **As opções das listas existem em dois lugares:** `api/inscricao.js` (constantes `FAIXAS_ETARIAS`, `FAIXAS`, `GRAUS`) e os `<select>` de `inscricao.html`.
  O servidor recusa qualquer valor que não esteja na lista dele, então **mudar uma opção exige mudar nos dois lugares**. Se mudar só no HTML, o formulário passa a dar erro.
- Quem marca **"Não treino"** não vê o campo de grau, que é gravado vazio. **"Qual projeto?"** só aparece para quem respondeu "Sim".
- Celular é gravado **só com os dígitos, com DDD** (`11912345678`). O painel formata o número e o transforma em link de WhatsApp.
- Um campo invisível (honeypot) segura robôs: se ele vier preenchido, a resposta é "ok" e nada é gravado.
- O convite ajusta o tamanho do texto para **nunca precisar rolar**. Se entrar conteúdo novo no convite, confira no celular em pé, no celular deitado e no computador.

## Variáveis de ambiente (na Vercel)

| Variável | Origem | Uso |
|---|---|---|
| `DATABASE_URL` (e as `PG*`/`POSTGRES_*`) | injetadas pela integração Neon | conexão com o banco |
| `ADMIN_KEY` | criada à mão | chave da página `/inscritos`. **Não fica no repositório**: peça a quem entregou o projeto |

Para trocar a chave:

```bash
vercel env rm ADMIN_KEY production --yes
vercel env add ADMIN_KEY production
vercel --prod
```

## Rodar e publicar

Pré-requisitos: Node 24+, [Vercel CLI](https://vercel.com/docs/cli) e acesso ao time **full-sales** na Vercel.

```bash
npm install
vercel link                                   # escolha o time full-sales, projeto conexao-faixa-preta
vercel env pull .env.local --yes --environment=production
vercel dev                                    # sobe em http://localhost:3000 com as funções
vercel --prod                                 # publica direto em produção
```

⚠️ **O `.env.local` aponta para o banco de produção** (existe um banco só). Inscrição feita no teste local aparece na lista real, então apague depois de testar.

O repositório **não está ligado à Vercel por Git**: `git push` não publica nada. O deploy é pelo `vercel --prod`.
Se alguém ligar o repositório à Vercel, o autor de cada commit precisa ter assento no time `full-sales`. Sem isso, o deploy fica BLOCKED.

## Pendências e ideias

- Aviso para a equipe (e-mail ou WhatsApp) a cada inscrição nova.
- Limite de vagas, se o espaço tiver lotação.
- Depois do evento, a contagem regressiva passa sozinha a mostrar "Obrigado por fazer parte".
