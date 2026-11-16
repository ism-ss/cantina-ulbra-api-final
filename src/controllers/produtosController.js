const db = require("../database/connection");

// Verifica se um ID é um inteiro positivo
function validarId(id) {
    return /^\d+$/.test(String(id)) &&
        Number.isSafeInteger(Number(id)) &&
        Number(id) > 0;
}

// Valida os dados de um produto
function validarProduto(dados) {
    const { nome, categoria, preco, estoque, ativo } = dados;

    if (
        typeof nome !== "string" ||
        !nome.trim() ||
        nome.length > 80
    ) {
        return "Nome obrigatório, com no máximo 80 caracteres.";
    }

    if (
        typeof categoria !== "string" ||
        !categoria.trim() ||
        categoria.length > 30
    ) {
        return "Categoria obrigatória, com no máximo 30 caracteres.";
    }

    // Validação do preço com até duas casas decimais
    if (
        typeof preco !== "number" ||
        !Number.isFinite(preco) ||
        preco < 0 ||
        preco > 999999.99 ||
        Math.abs(preco * 100 - Math.round(preco * 100)) > 1e-7
    ) {
        return "Preço deve ser válido, com até duas casas decimais.";
    }

    if (!Number.isInteger(estoque) || estoque < 0) {
        return "Estoque deve ser um número inteiro não negativo.";
    }

    if (ativo !== undefined && typeof ativo !== "boolean") {
        return "O campo ativo deve ser true ou false.";
    }

    return null;
}

// GET /api/produtos
async function listar(req, res) {
    try {
        const { categoria, ativo } = req.query;

        let consulta = db("produtos")
            .select("id", "nome", "categoria", "preco", "estoque", "ativo");

        if (categoria !== undefined) {
            if (typeof categoria !== "string" || !categoria.trim()) {
                return res.status(400).json({
                    erro: "Categoria inválida."
                });
            }

            consulta = consulta.where("categoria", categoria);
        }

        if (ativo !== undefined) {
            if (ativo !== "true" && ativo !== "false") {
                return res.status(400).json({
                    erro: "Filtro ativo deve ser true ou false."
                });
            }

            consulta = consulta.where("ativo", ativo === "true");
        }

        const produtos = await consulta.orderBy("id", "asc");

        return res.status(200).json(produtos);
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({
            erro: "Erro ao listar produtos."
        });
    }
}

// GET /api/produtos/:id
async function buscarPorId(req, res) {
    try {
        const { id } = req.params;

        if (!validarId(id)) {
            return res.status(400).json({
                erro: "ID inválido."
            });
        }

        const produto = await db("produtos")
            .where({ id: Number(id) })
            .first();

        if (!produto) {
            return res.status(404).json({
                erro: "Produto não encontrado."
            });
        }

        return res.status(200).json(produto);
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({
            erro: "Erro ao buscar produto."
        });
    }
}

// POST /api/produtos
async function criar(req, res) {
    try {
        const dados = req.body || {};
        const erroValidacao = validarProduto(dados);

        if (erroValidacao) {
            return res.status(400).json({
                erro: erroValidacao
            });
        }

        const nome = dados.nome.trim();
        const categoria = dados.categoria.trim();

        const existente = await db("produtos")
            .where({ nome })
            .first();

        if (existente) {
            return res.status(409).json({
                erro: "Já existe um produto com esse nome."
            });
        }

        const novoProduto = {
            nome,
            categoria,
            preco: dados.preco,
            estoque: dados.estoque,
            ativo: dados.ativo ?? true
        };

        const [id] = await db("produtos").insert(novoProduto);

        const produto = await db("produtos")
            .where({ id })
            .first();

        return res.status(201).json(produto);
    } catch (erro) {
        console.error(erro);

        if (
            erro.code === "SQLITE_CONSTRAINT" &&
            /unique/i.test(erro.message)
        ) {
            return res.status(409).json({
                erro: "Já existe um produto com esse nome."
            });
        }

        return res.status(500).json({
            erro: "Erro ao criar produto."
        });
    }
}

// PUT /api/produtos/:id
async function atualizar(req, res) {
    try {
        const { id } = req.params;

        if (!validarId(id)) {
            return res.status(400).json({
                erro: "ID inválido."
            });
        }

        const produto = await db("produtos")
            .where({ id: Number(id) })
            .first();

        if (!produto) {
            return res.status(404).json({
                erro: "Produto não encontrado."
            });
        }

        const dados = req.body || {};

        const atualizado = {
            nome: dados.nome ?? produto.nome,
            categoria: dados.categoria ?? produto.categoria,
            preco: dados.preco ?? Number(produto.preco),
            estoque: dados.estoque ?? produto.estoque,
            ativo: dados.ativo ?? Boolean(produto.ativo)
        };

        const erroValidacao = validarProduto(atualizado);

        if (erroValidacao) {
            return res.status(400).json({
                erro: erroValidacao
            });
        }

        atualizado.nome = atualizado.nome.trim();
        atualizado.categoria = atualizado.categoria.trim();

        const duplicado = await db("produtos")
            .where({ nome: atualizado.nome })
            .whereNot("id", Number(id))
            .first();

        if (duplicado) {
            return res.status(409).json({
                erro: "Já existe outro produto com esse nome."
            });
        }

        await db("produtos")
            .where({ id: Number(id) })
            .update(atualizado);

        const resultado = await db("produtos")
            .where({ id: Number(id) })
            .first();

        return res.status(200).json(resultado);
    } catch (erro) {
        console.error(erro);

        if (
            erro.code === "SQLITE_CONSTRAINT" &&
            /unique/i.test(erro.message)
        ) {
            return res.status(409).json({
                erro: "Já existe outro produto com esse nome."
            });
        }

        return res.status(500).json({
            erro: "Erro ao atualizar produto."
        });
    }
}

// DELETE /api/produtos/:id
async function excluir(req, res) {
    try {
        const { id } = req.params;

        if (!validarId(id)) {
            return res.status(400).json({
                erro: "ID inválido."
            });
        }

        const produto = await db("produtos")
            .where({ id: Number(id) })
            .first();

        if (!produto) {
            return res.status(404).json({
                erro: "Produto não encontrado."
            });
        }

        const pedido = await db("pedidos")
            .where({ produto_id: Number(id) })
            .first();

        if (pedido) {
            return res.status(409).json({
                erro: "Produto possui pedidos vinculados e não pode ser excluído."
            });
        }

        await db("produtos")
            .where({ id: Number(id) })
            .del();

        return res.status(204).send();
    } catch (erro) {
        console.error(erro);

        if (erro.code === "SQLITE_CONSTRAINT") {
            return res.status(409).json({
                erro: "Produto possui pedidos vinculados."
            });
        }

        return res.status(500).json({
            erro: "Erro ao excluir produto."
        });
    }
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    excluir
};
