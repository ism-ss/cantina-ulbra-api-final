const express = require("express");

const produtosRoutes = require("./routes/produtosRoutes");
const pedidosRoutes = require("./routes/pedidosRoutes");
const relatoriosRoutes = require("./routes/relatoriosRoutes");

const app = express();
const PORT = 3000;

app.use(express.json());

// Rotas da API
app.use("/api/produtos", produtosRoutes);
app.use("/api/pedidos", pedidosRoutes);
app.use("/api/relatorios", relatoriosRoutes);

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
