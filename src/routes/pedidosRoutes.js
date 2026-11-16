const express = require("express");
const router = express.Router();

const pedidosController = require("../controllers/pedidosController");

router.get("/", pedidosController.listar);
router.get("/:id", pedidosController.buscarPorId);
router.post("/", pedidosController.criar);
router.delete("/:id", pedidosController.excluir);

module.exports = router;
