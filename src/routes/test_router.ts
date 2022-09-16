import { Router } from 'express'
import { caslTest } from '../controllers/casl_test/casl_controller'

const router = Router()

router.get(`/`, caslTest)

export default router