import { Router } from 'express'
import { IsAuthenticated } from '../middleware/is_authenticated'
import OrganizationController from '../controllers/organization_controller'

const router = Router()

// Route to get a list with the names of the organizations
router.get('/names', OrganizationController.ListOrganizationsByName)

// Route to get a list with the names of the organizations
router.get('/info',IsAuthenticated, OrganizationController.ListOrganizationInfo)

// Route to get a list with the names of the organizations
router.patch('/update',IsAuthenticated, OrganizationController.UpdateOrganization)

// Route to get a list with the names of the organizations
router.post('/new-sub',IsAuthenticated, OrganizationController.CreateNewOrganization)

// Route to get a list with the names of the organizations
router.get('/names-sub', IsAuthenticated,OrganizationController.ListSubOrganizationsPaginated)

// Route to get a list with the names of the organizations
router.get('/names-sub-dom', IsAuthenticated,OrganizationController.ListSubOrganizationsAndOrganizationDomain)

export default router