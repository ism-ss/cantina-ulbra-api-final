exports.up = async function (knex) {
    await knex.schema.createTable("pedidos", (table) => {
        table.increments("id").primary();

        table.string("aluno_nome", 100).notNullable();

        table.integer("produto_id")
            .notNullable()
            .references("id")
            .inTable("produtos")
            .onDelete("RESTRICT");

        table.integer("quantidade").notNullable();

        table.decimal("valor_total", 8, 2).notNullable();

        table.timestamps(true, true);
    });

    await knex.schema.raw(`
        CREATE TRIGGER validar_pedido_insert
        BEFORE INSERT ON pedidos
        WHEN NEW.quantidade < 1 OR NEW.valor_total < 0
        BEGIN
            SELECT RAISE(ABORT, 'Pedido possui valores invalidos');
        END;
    `);

    await knex.schema.raw(`
        CREATE TRIGGER validar_pedido_update
        BEFORE UPDATE ON pedidos
        WHEN NEW.quantidade < 1 OR NEW.valor_total < 0
        BEGIN
            SELECT RAISE(ABORT, 'Pedido possui valores invalidos');
        END;
    `);
};

exports.down = async function (knex) {
    await knex.schema.dropTableIfExists("pedidos");
};
