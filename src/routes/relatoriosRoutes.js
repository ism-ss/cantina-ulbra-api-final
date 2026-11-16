const express = require("express");
const router = express.Router();

const relatoriosController = require("../controllers/relatoriosController");

router.get(
    "/vendas-por-categoria",
    relatoriosController.vendasPorCategoria
);

router.get(
    "/top-produtos",
    relatoriosController.topProdutos
);

router.get(
    "/faturamento",
    relatoriosController.faturamento
);

module.exports = router;
