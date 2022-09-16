import { Router } from 'express'
import {
    UpdateUserImageValidation,
    UpdateUserInfoValidation,
    UpdateUserPasswordValidation,
    Validate
} from '../middleware/validations_data'
import UserController  from '../controllers/user_controller'
import { IsAuthenticated } from '../middleware/is_authenticated'

const router = Router()

//update user information
router.post('/user-update', Validate(UpdateUserInfoValidation.data), UserController.ChangeUserInfo)
//update user image
router.post('/user-updateimg', Validate(UpdateUserImageValidation.data), UserController.ChangeUserImage)
//get user info
router.get('/userinfo', UserController.ListUserInfo)
//get user image
router.get('/userimg', UserController.UseUserImage)
//get user image
router.put('/new-password/resetpassword', Validate(UpdateUserPasswordValidation.data), UserController.CreateNewPassword)

router.get('/lessuserinfo',IsAuthenticated, UserController.ListLessUserInfo)

export default router