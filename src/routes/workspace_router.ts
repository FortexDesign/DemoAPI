import { Router } from 'express'
import WorkspaceController from '../controllers/workspace_controller'

const router = Router()
//Route to list all the workspaces
router.get('/',WorkspaceController.ListWorkspaces)
//Route to create a new workspace
router.post('/create',WorkspaceController.CreateWorkspace)
//Route to update an existing workspace
router.patch('/update',WorkspaceController.EditWorkspace)
//Route to delete an existing workspace
router.delete('/delete',WorkspaceController.DeleteWorkspace)
//Route to change de color and icon of a workspace
router.post('/color',WorkspaceController.ChangeColorAndIcon)
//Route to return a single workspace
router.get('/single',WorkspaceController.WorkspaceInfo)
//Route to return a single workspace
router.patch('/status',WorkspaceController.ChangeStatus)

export default router