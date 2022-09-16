import { Router } from 'express'
import FormController from '../controllers/form_controller'

const router = Router()
//autosave form configuration
router.post('/autosave',FormController.AutoSaveForm)
//retrive form configuration
router.get('/retrieve',FormController.RetieveForm)


export default router