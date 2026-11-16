# Cantina ULBRA API

Trabalho prático da disciplina de Desenvolvimento Back-End da ULBRA. O projeto é uma API para controlar os produtos e pedidos de uma cantina. Também permite consultar relatórios de vendas.

## Tecnologias

- **Node.js:** execução do projeto em JavaScript.
- **Express:** criação das rotas da API.
- **Knex.js:** consultas ao banco, migrations, seeds e transações.
- **SQLite3:** banco de dados utilizado.
- **Nodemon:** reinicia o servidor automaticamente durante o desenvolvimento.

## Como instalar e executar

É necessário ter o Node.js e o npm instalados.

1. Baixe ou clone o projeto e abra a pasta `cantina-ulbra-api` no terminal.
2. Instale as dependências:

   ```bash
   npm install
   ```

3. Crie as tabelas do banco:

   ```bash
   npx knex migrate:latest
   ```

4. Insira os dados de exemplo:

   ```bash
   npx knex seed:run
   ```

5. Inicie o servidor:

   ```bash
   npm start
   ```

   Durante o desenvolvimento também é possível usar:

   ```bash
   npm run dev
   ```

A API fica disponível em `http://localhost:3000`.

**Atenção:** os seeds limpam e inserem novamente os dados iniciais. Não execute esse comando em um banco que tenha informações que você queira manter.

## Estrutura do projeto

```text
cantina-ulbra-api/
├── src/
│   ├── controllers/
│   │   ├── produtosController.js
│   │   ├── pedidosController.js
│   │   └── relatoriosController.js
│   ├── routes/
│   │   ├── produtosRoutes.js
│   │   ├── pedidosRoutes.js
│   │   └── relatoriosRoutes.js
│   ├── database/
│   │   ├── migrations/
│   │   ├── seeds/
│   │   └── connection.js
│   └── server.js
├── knexfile.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

Os arquivos em `routes` definem as rotas, os `controllers` contêm as validações e as operações, e a pasta `database` guarda a conexão e os arquivos do banco.

## Banco de dados

O banco tem duas tabelas:

- **`produtos`:** `id`, `nome`, `categoria`, `preco`, `estoque` e `ativo`. O nome é único, o estoque não pode ser negativo e o produto começa ativo por padrão.
- **`pedidos`:** `id`, `aluno_nome`, `produto_id`, `quantidade`, `valor_total`, `created_at` e `updated_at`. O `produto_id` se relaciona com a tabela de produtos.

Um produto pode aparecer em vários pedidos. Os seeds criam 6 produtos nas categorias **Salgados** e **Bebidas**, além de 5 pedidos em datas diferentes.

## Endpoints

Todas as rotas começam com `/api`. Para enviar dados em `POST` e `PUT`, utilize JSON com `Content-Type: application/json`.

### Produtos

| Método | Rota | O que faz | Exemplo de requisição | Exemplo de resposta |
| --- | --- | --- | --- | --- |
| GET | `/api/produtos` | Lista produtos e aceita filtros de categoria e ativo | `GET /api/produtos?categoria=Bebidas&ativo=true` | `200` — `[ {"id":4,"nome":"Refrigerante","categoria":"Bebidas","preco":6,"estoque":47,"ativo":1} ]` |
| GET | `/api/produtos/:id` | Busca um produto pelo ID | `GET /api/produtos/1` | `200` — `{"id":1,"nome":"Coxinha","categoria":"Salgados","preco":7.5,"estoque":28,"ativo":1}` |
| POST | `/api/produtos` | Cadastra um produto | `POST /api/produtos` com `{"nome":"Sanduiche Natural","categoria":"Salgados","preco":12.5,"estoque":15}` | `201` — retorna o produto cadastrado com seu ID |
| PUT | `/api/produtos/:id` | Atualiza dados do produto, inclusive se está ativo | `PUT /api/produtos/1` com `{"preco":8,"ativo":true}` | `200` — retorna o produto atualizado |
| DELETE | `/api/produtos/:id` | Exclui um produto sem pedidos registrados | `DELETE /api/produtos/6` | `204` — sem conteúdo |

### Pedidos

| Método | Rota | O que faz | Exemplo de requisição | Exemplo de resposta |
| --- | --- | --- | --- | --- |
| GET | `/api/pedidos` | Lista pedidos com paginação e filtro por aluno | `GET /api/pedidos?limit=2&offset=0&aluno=Lucas` | `200` — `{"limit":2,"offset":0,"pedidos":[{"id":1,"aluno_nome":"Lucas Silva","produto_id":1,"quantidade":2,"valor_total":15}]}` |
| GET | `/api/pedidos/:id` | Busca um pedido e mostra o nome do produto | `GET /api/pedidos/1` | `200` — `{"id":1,"aluno_nome":"Lucas Silva","produto_id":1,"produto_nome":"Coxinha","quantidade":2,"valor_total":15}` |
| POST | `/api/pedidos` | Cria um pedido e diminui o estoque | `POST /api/pedidos` com `{"aluno_nome":"Joao","produto_id":4,"quantidade":2}` | `201` — pedido criado com `valor_total` de `12` |
| DELETE | `/api/pedidos/:id` | Cancela o pedido e devolve o estoque | `DELETE /api/pedidos/1` | `204` — sem conteúdo |

Na listagem de pedidos, `limit` tem valor padrão de 10 (máximo 100) e `offset` começa em 0. O filtro `aluno` é opcional.

### Relatórios

| Método | Rota | O que faz | Exemplo de requisição | Exemplo de resposta |
| --- | --- | --- | --- | --- |
| GET | `/api/relatorios/vendas-por-categoria` | Mostra valor vendido, quantidade de itens e pedidos por categoria | `GET /api/relatorios/vendas-por-categoria` | `200` — `[ {"categoria":"Bebidas","total_vendido":36,"quantidade_itens":5,"total_pedidos":2} ]` |
| GET | `/api/relatorios/top-produtos` | Mostra os cinco produtos mais vendidos | `GET /api/relatorios/top-produtos` | `200` — `[ {"id":3,"nome":"Pao de Queijo","quantidade_vendida":4,"total_vendido":20} ]` |
| GET | `/api/relatorios/faturamento` | Calcula o faturamento entre duas datas | `GET /api/relatorios/faturamento?data_inicio=2026-11-01&data_fim=2026-11-10` | `200` — `{"data_inicio":"2026-11-01","data_fim":"2026-11-10","faturamento_total":79,"total_pedidos":5}` |

Os valores das respostas são exemplos baseados nos dados iniciais. Eles podem mudar quando produtos ou pedidos forem alterados. No SQLite, o campo `ativo` pode aparecer como `1` ou `0`.

## Regras de negócio

1. O valor total do pedido é calculado pela API usando o preço do produto no banco. Mesmo que o cliente envie outro valor, ele não é utilizado.
2. Não é possível criar um pedido se o estoque for insuficiente (`409`).
3. Quando um pedido é criado, o estoque diminui. Quando é cancelado, a quantidade volta ao estoque.
4. Produtos inativos não podem ser vendidos (`400`).
5. Um produto que já possui pedidos não pode ser excluído (`409`).

Por exemplo, se um refrigerante custa R$ 6,00 e um aluno compra duas unidades, a API calcula R$ 12,00 e retira duas unidades do estoque.

## Transações do Knex

Utilizei `db.transaction()` na **criação** e no **cancelamento de pedidos**, porque essas operações modificam mais de uma informação no banco.

Ao criar um pedido, o sistema verifica o produto e o estoque, diminui a quantidade disponível e registra o pedido. Essas alterações precisam acontecer juntas. Se ocorrer um erro no meio da operação, a transação desfaz as alterações (*rollback*), evitando que o estoque diminua sem que o pedido seja salvo.

Ao cancelar um pedido, o sistema devolve a quantidade ao estoque e exclui o pedido dentro da mesma transação. Assim, se alguma etapa falhar, as alterações são desfeitas.

Também fiz um teste com uma falha simulada dentro de uma transação e confirmei que o estoque voltou ao valor anterior.

## Códigos de resposta HTTP

| Código | Quando é utilizado |
| --- | --- |
| `200` | Consulta ou atualização realizada |
| `201` | Produto ou pedido criado |
| `204` | Exclusão concluída, sem resposta no corpo |
| `400` | Dados inválidos ou produto inativo |
| `404` | Produto ou pedido não encontrado |
| `409` | Conflito, como estoque insuficiente ou nome duplicado |
| `500` | Erro interno tratado pela API |

## Observações

O banco SQLite é criado pelas migrations e pode ser preenchido pelos seeds. Por isso, o arquivo `.sqlite3` não precisa ser enviado ao GitHub.

Os relatórios usam consultas do Knex com `join`, `groupBy`, `sum`, `count` e `whereBetween`.
