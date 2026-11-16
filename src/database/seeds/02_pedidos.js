/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */

exports.seed = async function (knex) {
    await knex("pedidos").del();

    const pedidos = [
        {
            aluno_nome: "Lucas Silva",
            produto_id: 1,
            quantidade: 2,
            created_at: "2026-11-01 10:00:00"
        },
        {
            aluno_nome: "Mariana Costa",
            produto_id: 4,
            quantidade: 3,
            created_at: "2026-11-03 14:30:00"
        },
        {
            aluno_nome: "Pedro Oliveira",
            produto_id: 2,
            quantidade: 1,
            created_at: "2026-11-05 09:15:00"
        },
        {
            aluno_nome: "Ana Souza",
            produto_id: 5,
            quantidade: 2,
            created_at: "2026-11-07 16:00:00"
        },
        {
            aluno_nome: "Rafael Santos",
            produto_id: 3,
            quantidade: 4,
            created_at: "2026-11-10 11:45:00"
        }
    ];

    for (const pedido of pedidos) {
        const produto = await knex("produtos")
            .where({ id: pedido.produto_id })
            .first();

        const valorTotal = Math.round(
            Number(produto.preco) * pedido.quantidade * 100
        ) / 100;

        await knex("pedidos").insert({
            ...pedido,
            valor_total: valorTotal,
            updated_at: pedido.created_at
        });

        await knex("produtos")
            .where({ id: pedido.produto_id })
            .decrement("estoque", pedido.quantidade);
    }
};

