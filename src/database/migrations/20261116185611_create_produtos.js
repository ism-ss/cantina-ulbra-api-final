exports.up = async function (knex) {
    await knex.schema.createTable("produtos", (table) => {
        table.increments("id").primary();

        table.string("nome", 80).notNullable().unique();

        table.string("categoria", 30).notNullable();

        table.decimal("preco", 8, 2).notNullable();

        table.integer("estoque").notNullable();

        table.boolean("ativo").notNullable().defaultTo(true);
    });

    await knex.schema.raw(`
        CREATE TRIGGER validar_produto_insert
        BEFORE INSERT ON produtos
        WHEN NEW.estoque < 0 OR NEW.preco < 0
        BEGIN
            SELECT RAISE(ABORT, 'Estoque e preco nao podem ser negativos');
        END;
    `);

    await knex.schema.raw(`
        CREATE TRIGGER validar_produto_update
        BEFORE UPDATE ON produtos
        WHEN NEW.estoque < 0 OR NEW.preco < 0
        BEGIN
            SELECT RAISE(ABORT, 'Estoque e preco nao podem ser negativos');
        END;
    `);
};

exports.down = async function (knex) {
    await knex.schema.dropTableIfExists("produtos");
};
