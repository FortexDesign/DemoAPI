import { Router } from 'express'
import { Validate } from '../middleware/validations_data'
import GroupController from '../controllers/group_controller'

const router = Router()


// Route to get a list with all groups
router.get('/', GroupController.ListGroupsPaginated)

// Route to edit the information about a group
router.patch('/update', GroupController.UpdateGroup)

// Route to create a new group
router.post('/create', GroupController.CreateNewGroup)

// Route to delete an existing group
router.delete('/delete', GroupController.DeleteGroup)

// Route to add or remove roles to a group
router.post('/manage-roles', GroupController.ManageRolesToGroup)

// Route to add or delete members to a gorup
router.post('/manage-members', GroupController.ManageMembersToGroup)


export default router