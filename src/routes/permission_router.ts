// Controller Import
import PermissionController from '../controllers/permission_controller'

// Module Import
import { Router } from 'express'
import { CreatePermissionCategoryValidation, CreatePermissionValidation, ManagePermissionActivation, Validate, ValidatePermitAssignation } from '../middleware/validations_data'

const router = Router()

// Route to get a list with all the general permissions grouped by their own categories
router.get('/list-by-category', PermissionController.ListPermissionsGroupedByCategory)

// Route to add a new Category for  the Permissions
router.post('/category/new', Validate(CreatePermissionCategoryValidation.data), PermissionController.CreatePermissionCategory)

// Route to add a new Permission
router.post('/new', Validate(CreatePermissionValidation.data), PermissionController.CreatePermission)

// Route to assign multiple permissions to a person
router.post('/assignation', ValidatePermitAssignation(ManagePermissionActivation.data), PermissionController.PermitAssignation)

// Test Permission Checking
router.get('/test', PermissionController.CheckPermission)

export default router