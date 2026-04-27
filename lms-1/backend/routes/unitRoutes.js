const express = require("express");
const router = express.Router();
const unitController = require("../controllers/unitController");
const upload = require("../middleware/uploadMiddleware");

/* ═══ PROJECT STRUCTURE — must be BEFORE /:id to avoid conflict ═══ */
router.get("/structure/blocks",        unitController.getProjectBlocks);
router.post("/structure/blocks",       unitController.addProjectBlock);
router.put("/structure/blocks/:id",    unitController.updateProjectBlock);
router.delete("/structure/blocks/:id", unitController.deleteProjectBlock);

router.get("/structure/floors",        unitController.getProjectFloors);
router.post("/structure/floors",       unitController.addProjectFloor);
router.put("/structure/floors/:id",    unitController.updateProjectFloor);
router.delete("/structure/floors/:id", unitController.deleteProjectFloor);

/* ═══ UNIT CRUD ════════════════════════════════════════════════════ */
router.get("/",       unitController.getUnits);
router.post("/",      upload.array('images', 5), unitController.createUnit);
router.get("/:id",    unitController.getUnitById);
router.put("/:id",    upload.array('images', 5), unitController.updateUnit);
router.delete("/:id", unitController.deleteUnit);

module.exports = router;
