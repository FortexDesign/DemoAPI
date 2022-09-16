import { Router } from 'express'
import {
    CreatePersonTypeValidation,
    CreatePersonValidation,
    EditPersonTypeValidation,
    EditPersonValidation,
    ManagePermissionToPersonValidation,
    Validate
} from '../middleware/validations_data';
import PeopleController from '../controllers/people_controller'
import PeopleTypeController from "../controllers/people_type_controller";

const router = Router()

// Route to get a list with the attributes of the people types from the database
router.get('/type/all', PeopleTypeController.ListAllPeopleTypes)

//route to get the person type items with pagintaion
router.get('/type', PeopleTypeController.ListPeopleTypesPaginated)
// Route to get a list with the names of the people types
router.get('/type/names', PeopleTypeController.ListPeopleTypesByName)
//route to create a new person type
router.post('/type', Validate(CreatePersonTypeValidation.data), PeopleTypeController.CreatePersonType)
//route to change the status of a person type
router.post('/type/status', PeopleTypeController.ChangeStatus)
//route to edit a person type
router.patch('/type', Validate(EditPersonTypeValidation.data), PeopleTypeController.EditPersonType)
//reoute to delete a person type
router.delete('/type', PeopleTypeController.DeletePersonType)
// Route to get a list with the attributes of the people using pagination
router.get('', PeopleController.ListPeoplePaginated)
// Route to get information about a single person
router.get('/selectOne', PeopleController.GetPersonInfo)
// Route to create a new person along with its relations
router.post('/', Validate(CreatePersonValidation.data), PeopleController.CreatePerson)
// Route to edit the attributes of a person
router.patch('/', Validate(EditPersonValidation.data), PeopleController.EditPerson)
// Route to edit only the person type of a person
router.patch('/:id/person_type', PeopleController.ModifyPersonType)
//route to get the person type items with pagintaion
router.get('/invited', PeopleController.ListInvitedPeoplePaginated)
// Route to assign a permission to a person
router.post('/assign-permission', Validate(ManagePermissionToPersonValidation.data), PeopleController.PermissionAssignToPerson)
// Route to remove a permission from a person
router.delete('/revoke-permission', Validate(ManagePermissionToPersonValidation.data), PeopleController.PermissionUnassignToPerson)
// Route to assign a role to a person
router.post('/link-role', PeopleController.RoleAssignToPerson)
// Route to unassign a role to a person
router.delete('/unlink-role', PeopleController.RoleUnassignFromPerson)

export default router