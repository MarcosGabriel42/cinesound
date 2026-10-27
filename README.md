# CineSound

O CineSound é um projeto em desenvolvimento que conecta a descoberta de filmes a perfis musicais inspirados em seus gêneros e atmosferas.

## Objetivo

A proposta é usar filmes como ponto de partida para explorar música. Atualmente, a API pesquisa filmes no TMDB e pode gerar um perfil musical sugerido por regras a partir dos gêneros dos filmes selecionados. Esse perfil inclui estilos, climas, instrumentação e termos de busca; não contém faixas ou artistas específicos.

A interface web implementada permite pesquisar filmes e visualizar seus resultados. A seleção de vários filmes pela interface e a criação de playlists com músicas reais ainda não estão implementadas. A API tem um fluxo de autorização Spotify, mas ainda não armazena tokens nem cria playlists.

## Tecnologias utilizadas

- **Backend:** Node.js, Express 5, PostgreSQL (`pg`), Zod, bcrypt e JSON Web Token.
- **Frontend:** React 19 e Vite.
- **Serviços externos:** TMDB para pesquisa e detalhes de filmes; Spotify para autorização OAuth.
- **Qualidade e testes:** Vitest, Supertest e ESLint.
- **Documentação da API:** OpenAPI/Swagger.

## Funcionalidades implementadas

- Pesquisa de filmes e consulta de detalhes por meio do TMDB.
- Geração de perfil musical baseado em regras a partir dos gêneros de até cinco filmes enviados à API.
- Consulta dos compositores identificados pelo TMDB nos detalhes dos filmes.
- Cadastro e login de usuários, com senhas armazenadas como hash bcrypt e autenticação JWT.
- Consulta dos dados do usuário autenticado.
- Início e callback do fluxo de autorização Spotify; os tokens obtidos não são persistidos.
- Interface React para pesquisar filmes e exibir resultados.
- Endpoint de saúde e documentação interativa da API.

## Estrutura do projeto

```text
backend/
  migrations/   Migrações SQL do PostgreSQL
  src/
    config/     Configuração da conexão com o banco
    controllers/Tratamento das requisições HTTP
    data/       Dados locais usados pelo perfil musical
    docs/       Especificação Swagger/OpenAPI
    middlewares/Middlewares de autenticação e erros
    routes/     Rotas da API
    services/   Integrações e lógica de negócio
  tests/        Testes automatizados do backend
frontend/
  public/       Recursos estáticos
  src/          Aplicação React, estilos e recursos
```

## Pré-requisitos

- Node.js **20.19 ou superior** ou **22.12 ou superior**, requisito do Vite usado pelo frontend.
- npm, incluído com Node.js.
- PostgreSQL para executar os recursos de cadastro e autenticação.
- Credenciais TMDB para pesquisar filmes.
- Credenciais de aplicação Spotify e URI de callback cadastrada no Spotify, caso queira usar o fluxo de autorização Spotify.

## Configuração do ambiente

Na raiz do repositório, crie o arquivo local de ambiente do backend a partir do exemplo:

```powershell
Copy-Item backend/.env.example backend/.env
```

Em outros terminais, copie `backend/.env.example` para `backend/.env` com o comando de cópia apropriado ao seu sistema. Edite o `.env` local e substitua os placeholders pelas configurações necessárias. **Não publique esse arquivo.**

O exemplo documenta estas variáveis:

| Variável | Uso |
|---|---|
| `PORT` | Porta HTTP do backend; o código usa `3000` quando não definida. |
| `TMDB_ACCESS_TOKEN` | Token usado pelo backend para consultar o TMDB. |
| `SPOTIFY_CLIENT_ID` | Identificador da aplicação Spotify. |
| `SPOTIFY_CLIENT_SECRET` | Segredo da aplicação Spotify. |
| `SPOTIFY_REDIRECT_URI` | URI de callback cadastrada no Spotify. |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Parâmetros de conexão com PostgreSQL. |
| `JWT_SECRET` | Segredo usado para assinar e validar tokens JWT. |
| `JWT_EXPIRES_IN` | Expiração dos tokens JWT; o código usa `15m` quando não definida. |

O código fornece defaults locais para alguns parâmetros do servidor e do banco; senhas, tokens e segredos devem ser configurados localmente. Para criar a tabela de usuários, aplique a migração [`backend/migrations/001_create_users.sql`](backend/migrations/001_create_users.sql) ao banco configurado.

## Como executar

### Backend

Em um terminal:

```powershell
cd backend
npm ci
npm run dev
```

O servidor usa a porta configurada em `PORT` ou, por padrão, `3000`.

### Frontend

Em outro terminal:

```powershell
cd frontend
npm ci
npm run dev
```

O Vite disponibiliza o endereço local de desenvolvimento no terminal (por padrão, `http://localhost:5173`). A interface chama o backend em `http://localhost:3000/api`; essa URL está fixa no código atual.

## Endpoints disponíveis

As rotas abaixo são montadas pelo backend. Endpoints que consultam o TMDB precisam de `TMDB_ACCESS_TOKEN`; operações de autenticação dependem também do PostgreSQL e de `JWT_SECRET`.

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/health` | Verifica se a API está funcionando. |
| `GET` | `/api/movies/search?query=...` | Pesquisa filmes pelo título no TMDB. |
| `GET` | `/api/movies/:id` | Consulta detalhes de um filme no TMDB. |
| `POST` | `/api/recommendations` | Gera um perfil musical baseado em regras para IDs de até cinco filmes. Não retorna faixas específicas. |
| `POST` | `/api/auth/register` | Cadastra um usuário. |
| `POST` | `/api/auth/login` | Autentica um usuário e retorna um JWT. |
| `GET` | `/api/auth/me` | Consulta o usuário autenticado; requer token Bearer. |
| `GET` | `/api/spotify/login` | Inicia o fluxo de autorização Spotify. |
| `GET` | `/api/spotify/callback` | Processa o retorno do fluxo de autorização Spotify. |
| `GET` | `/api/docs` | Abre a documentação interativa Swagger. |
| `GET` | `/api/docs.json` | Retorna a especificação OpenAPI em JSON. |

## Testes

Os testes automatizados estão no backend e são executados com Vitest e Supertest. Para instalá-los e executá-los:

```powershell
cd backend
npm ci
npm test
```

O comando `npm test` executa a suíte uma vez. Para o modo interativo de desenvolvimento, use `npm run test:watch`.

O frontend não possui script de testes automatizados configurado. Há scripts de lint e build:

```powershell
cd frontend
npm ci
npm run lint
npm run build
```

## Segurança

- Nunca publique `backend/.env`, tokens, senhas, segredos JWT ou credenciais de serviços.
- Use `backend/.env.example` somente como modelo com placeholders; mantenha os valores reais em arquivos locais ou em um gerenciador de segredos.
- Segredos usados pelo backend não devem ser colocados no código ou no bundle do frontend.
- Se uma credencial real for exposta, removê-la do arquivo atual não invalida o valor: revogue-a ou gere outra no serviço correspondente e avalie a exposição no histórico Git.
