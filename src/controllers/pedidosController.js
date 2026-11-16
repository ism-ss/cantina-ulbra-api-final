const db = require("../database/connection");

// Verifica se o ID é um número inteiro positivo
function validarId(id) {
    return /^\d+$/.test(String(id)) &&
        Number.isSafeInteger(Number(id)) &&
        Number(id) > 0;
}

// GET /api/pedidos
// Lista pedidos com paginação e filtro por aluno
async function listar(req, res) {
    try {
        const { limit = "10", offset = "0", aluno } = req.query;

        const limite = Number(limit);
        const deslocamento = Number(offset);

        if (
            !/^\d+$/.test(String(limit)) ||
            !Number.isSafeInteger(limite) ||
            limite < 1 ||
            limite > 100 ||
            !/^\d+$/.test(String(offset)) ||
            !Number.isSafeInteger(deslocamento) ||
            deslocamento < 0
        ) {
            return res.status(400).json({
                erro: "Paginação inválida. Use limit entre 1 e 100 e offset maior ou igual a 0."
            });
        }

        if (
            aluno !== undefined &&
            (typeof aluno !== "string" || !aluno.trim())
        ) {
            return res.status(400).json({
                erro: "Filtro de aluno inválido."
            });
        }

        let consulta = db("pedidos")
            .select(
                "id",
                "aluno_nome",
                "produto_id",
                "quantidade",
                "valor_total",
                "created_at",
                "updated_at"
            );

        if (aluno !== undefined) {
            consulta = consulta.where(
                "aluno_nome",
                "like",
                `%${aluno.trim()}%`
            );
        }

        const pedidos = await consulta
            .orderBy("id", "asc")
            .limit(limite)
            .offset(deslocamento);

        return res.status(200).json({
            limit: limite,
            offset: deslocamento,
            pedidos
        });
    } catch (erro) {
        console.error(erro);

        return res.status(500).json({
            erro: "Erro ao listar pedidos."
        });
    }
}

// GET /api/pedidos/:id
// Busca um pedido e inclui o nome do produto
async function buscarPorId(req, res) {
    try {
        const { id } = req.params;

        if (!validarId(id)) {
            return res.status(400).json({
                erro: "ID inválido."
            });
        }

        const pedido = await db("pedidos")
            .join(
                "produtos",
                "pedidos.produto_id",
                "produtos.id"
            )
            .select(
                "pedidos.id",
                "pedidos.aluno_nome",
                "pedidos.produto_id",
                "produtos.nome as produto_nome",
                "pedidos.quantidade",
                "pedidos.valor_total",
                "pedidos.created_at",
                "pedidos.updated_at"
            )
            .where("pedidos.id", Number(id))
            .first();

        if (!pedido) {
            return res.status(404).json({
                erro: "Pedido não encontrado."
            });
        }

        return res.status(200).json(pedido);
    } catch (erro) {
        console.error(erro);

        return res.status(500).json({
            erro: "Erro ao buscar pedido."
        });
    }
}

// POST /api/pedidos
// Cria pedido e desconta o estoque usando transação
async function criar(req, res) {
    try {
        const {
            aluno_nome,
            produto_id,
            quantidade
        } = req.body || {};

        if (
            typeof aluno_nome !== "string" ||
            !aluno_nome.trim() ||
            aluno_nome.length > 100 ||
            !validarId(produto_id) ||
            !Number.isInteger(quantidade) ||
            quantidade < 1
        ) {
            return res.status(400).json({
                erro: "Dados inválidos. Informe aluno_nome, produto_id e quantidade válida."
            });
        }

        // O preço e o valor_total enviados pelo cliente são ignorados.
        const resultado = await db.transaction(async (trx) => {
            const produto = await trx("produtos")
                .where({ id: Number(produto_id) })
                .first();

            if (!produto) {
                return {
                    status: 404,
                    erro: "Produto não encontrado."
                };
            }

            if (!Boolean(produto.ativo)) {
                return {
                    status: 400,
                    erro: "Produto inativo não pode ser vendido."
                };
            }

            if (produto.estoque < quantidade) {
                return {
                    status: 409,
                    erro: "Estoque insuficiente para realizar o pedido."
                };
            }

            // O preço sempre vem do banco de dados
            const valorTotal = Math.round(
                Number(produto.preco) * quantidade * 100
            ) / 100;

            if (valorTotal > 999999.99) {
                return {
                    status: 400,
                    erro: "Valor total ultrapassa o limite permitido."
                };
            }

            // Desconta o estoque somente se houver quantidade suficiente
            const alterados = await trx("produtos")
                .where({ id: Number(produto_id) })
                .where("estoque", ">=", quantidade)
                .decrement("estoque", quantidade);

            if (alterados === 0) {
                return {
                    status: 409,
                    erro: "Estoque insuficiente para realizar o pedido."
                };
            }

            const [id] = await trx("pedidos").insert({
                aluno_nome: aluno_nome.trim(),
                produto_id: Number(produto_id),
                quantidade,
                valor_total: valorTotal
            });

            const pedido = await trx("pedidos")
                .where({ id })
                .first();

            return {
                status: 201,
                pedido
            };
        });

        if (resultado.erro) {
            return res.status(resultado.status).json({
                erro: resultado.erro
            });
        }

        return res.status(201).json(resultado.pedido);
    } catch (erro) {
        console.error(erro);

        return res.status(500).json({
            erro: "Erro ao criar pedido."
        });
    }
}

// DELETE /api/pedidos/:id
// Cancela pedido e devolve o estoque usando transação
async function excluir(req, res) {
    try {
        const { id } = req.params;

        if (!validarId(id)) {
            return res.status(400).json({
                erro: "ID inválido."
            });
        }

        const resultado = await db.transaction(async (trx) => {
            const pedido = await trx("pedidos")
                .where({ id: Number(id) })
                .first();

            if (!pedido) {
                return {
                    status: 404,
                    erro: "Pedido não encontrado."
                };
            }

            // Devolve a quantidade ao estoque
            await trx("produtos")
                .where({ id: pedido.produto_id })
                .increment("estoque", pedido.quantidade);

            // Remove o pedido
            await trx("pedidos")
                .where({ id: Number(id) })
                .del();

            return {
                status: 204
            };
        });

        if (resultado.erro) {
            return res.status(resultado.status).json({
                erro: resultado.erro
            });
        }

        return res.status(204).send();
    } catch (erro) {
        console.error(erro);

        return res.status(500).json({
            erro: "Erro ao cancelar pedido."
        });
    }
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    excluir
};
