import { Router } from 'express'
import { Validate } from '../middleware/validations_data'
import GroupController from '../controllers/group_controller'

const router = Router()

// Route to get a list with the names of the groups
router.get('/names', GroupController.ListGroupsByName)

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

// Route to assign a role to a group
//router.post('/link-role', GroupController.RoleAssignToGroup)

// Route to unassign a role from a group
//router.delete('/unlink-role', GroupController.RoleUnassignToGroup)

// Route to assign a person to a group
router.post('/add-person', GroupController.PersonAssignToGroup)

// Route to unassign a person to a group
router.delete('/remove-person', GroupController.PersonUnassignToGroup)

// Route to get a list with the permissions available for the user [TEST ONLY]
router.get('/test', GroupController.GetGroupsOfUser)

// Route to get a list with the persons in a group
router.get('/involved', GroupController.ListPersonInGroupPaginated)

// Route to get a list with the persons in a group
router.get('/not-involved', GroupController.ListPeopleNotInGroup)

export default router