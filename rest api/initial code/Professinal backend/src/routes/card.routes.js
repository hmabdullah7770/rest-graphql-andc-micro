import { Router } from 'express';
import {
    deleteCard,
    getAllCards,
    getCardById,
    publishACard,
    togglePublishStatus,
    updateCard,
} from "../controllers/card.controller.js"
import {VerifyJwt} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"

const router = Router();
router.use(VerifyJwt); // Apply verifyJWT middleware to all routes in this file

router
    .route("/")
    .get(getAllCards)
    .post(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
            
        ]),
        publishACard
    );

router
    .route("/:cardId")
    .get(getCardById)
    .delete(deleteCard)
    .patch(upload.single("thumbnail"), updateCard);

router.route("/toggle/publish/:cardId").patch(togglePublishStatus);

export default router