import { Router } from 'express'
import RoleController from '../controllers/role_controller'

const router = Router()

// Route to get a list with the names of the roles
router.get('/names', RoleController.ListRolesByName)
// Route to create a new role
router.post('/new', RoleController.CreateRole)
// Route to edit a existing role
router.put('/edit', RoleController.EditRole)
// Route to delete an unassigned role
router.delete('/delete', RoleController.DeleteRole)
// Route to add a permission to a role
router.post('/add-permission', RoleController.AddPermissionToRole)
// Route to revoke a permission from a role
router.delete('/revoke-permission', RoleController.RevokePermissionToRole)
// Route to get available people and groups to assign to a role
router.get('/get-assignments', RoleController.GetPossibleAssignsForRole)

export default router