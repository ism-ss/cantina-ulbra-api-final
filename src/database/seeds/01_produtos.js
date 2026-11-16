/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */

exports.seed = async function (knex) {
    await knex("pedidos").del();
    await knex("produtos").del();

    await knex("produtos").insert([
        {
            id: 1,
            nome: "Coxinha",
            categoria: "Salgados",
            preco: 7.50,
            estoque: 30,
            ativo: true
        },
        {
            id: 2,
            nome: "Pastel",
            categoria: "Salgados",
            preco: 8.00,
            estoque: 25,
            ativo: true
        },
        {
            id: 3,
            nome: "Pao de Queijo",
            categoria: "Salgados",
            preco: 5.00,
            estoque: 40,
            ativo: true
        },
        {
            id: 4,
            nome: "Refrigerante",
            categoria: "Bebidas",
            preco: 6.00,
            estoque: 50,
            ativo: true
        },
        {
            id: 5,
            nome: "Suco Natural",
            categoria: "Bebidas",
            preco: 9.00,
            estoque: 20,
            ativo: true
        },
        {
            id: 6,
            nome: "Agua Mineral",
            categoria: "Bebidas",
            preco: 3.50,
            estoque: 60,
            ativo: true
        }
    ]);
};

