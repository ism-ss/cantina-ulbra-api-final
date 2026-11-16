const db = require("../database/connection");

// GET /api/relatorios/vendas-por-categoria
async function vendasPorCategoria(req, res) {
    try {
        const relatorio = await db("pedidos")
            .join(
                "produtos",
                "pedidos.produto_id",
                "produtos.id"
            )
            .select("produtos.categoria")
            .sum("pedidos.valor_total as total_vendido")
            .sum("pedidos.quantidade as quantidade_itens")
            .count("pedidos.id as total_pedidos")
            .groupBy("produtos.categoria")
            .orderBy("produtos.categoria", "asc");

        const resultado = relatorio.map((item) => ({
            categoria: item.categoria,
            total_vendido: Number(item.total_vendido),
            quantidade_itens: Number(item.quantidade_itens),
            total_pedidos: Number(item.total_pedidos)
        }));

        return res.status(200).json(resultado);
    } catch (erro) {
        console.error(erro);

        return res.status(500).json({
            erro: "Erro ao gerar relatório de vendas por categoria."
        });
    }
}

// GET /api/relatorios/top-produtos
async function topProdutos(req, res) {
    try {
        const relatorio = await db("pedidos")
            .join(
                "produtos",
                "pedidos.produto_id",
                "produtos.id"
            )
            .select(
                "produtos.id",
                "produtos.nome"
            )
            .sum("pedidos.quantidade as quantidade_vendida")
            .sum("pedidos.valor_total as total_vendido")
            .groupBy("produtos.id", "produtos.nome")
            .orderBy("quantidade_vendida", "desc")
            .orderBy("total_vendido", "desc")
            .limit(5);

        const resultado = relatorio.map((item) => ({
            id: item.id,
            nome: item.nome,
            quantidade_vendida: Number(item.quantidade_vendida),
            total_vendido: Number(item.total_vendido)
        }));

        return res.status(200).json(resultado);
    } catch (erro) {
        console.error(erro);

        return res.status(500).json({
            erro: "Erro ao gerar relatório dos produtos mais vendidos."
        });
    }
}

// GET /api/relatorios/faturamento
async function faturamento(req, res) {
    try {
        const { data_inicio, data_fim } = req.query;

        const formatoData = /^\d{4}-\d{2}-\d{2}$/;

        function dataValida(data) {
            if (
                typeof data !== "string" ||
                !formatoData.test(data)
            ) {
                return false;
            }

            const [ano, mes, dia] = data.split("-").map(Number);
            const dataUTC = new Date(
                Date.UTC(ano, mes - 1, dia)
            );

            return (
                dataUTC.getUTCFullYear() === ano &&
                dataUTC.getUTCMonth() === mes - 1 &&
                dataUTC.getUTCDate() === dia
            );
        }

        if (
            !dataValida(data_inicio) ||
            !dataValida(data_fim) ||
            data_inicio > data_fim
        ) {
            return res.status(400).json({
                erro: "Informe data_inicio e data_fim válidas no formato AAAA-MM-DD."
            });
        }

        // Inclui todos os horários das duas datas
        const inicio = `${data_inicio} 00:00:00`;
        const fim = `${data_fim} 23:59:59.999`;

        const relatorio = await db("pedidos")
            .whereBetween("created_at", [inicio, fim])
            .sum("valor_total as faturamento_total")
            .count("id as total_pedidos")
            .first();

        return res.status(200).json({
            data_inicio,
            data_fim,
            faturamento_total: Number(
                relatorio.faturamento_total ?? 0
            ),
            total_pedidos: Number(relatorio.total_pedidos)
        });
    } catch (erro) {
        console.error(erro);

        return res.status(500).json({
            erro: "Erro ao gerar relatório de faturamento."
        });
    }
}

module.exports = {
    vendasPorCategoria,
    topProdutos,
    faturamento
};
