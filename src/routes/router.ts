// Controller Import
import AuthController from '../controllers/auth_controller'

// Middlewares Import
import { IsAuthenticated } from '../middleware/is_authenticated'
import {
    LoginUserValidation,
    NewPasswordValidation,
    RegisterUserValidation,
    SendRecoveryEmailValidation,
    Validate
} from '../middleware/validations_data'

// Module Import
import { Router } from 'express'

// Initialize an object that it's an instance of the Router method
const router = Router()

// Create a user with the values of the form over the Registration interface
// router.post('/register', Validate(RegisterUserValidation.data), AuthController.RegisterUser)

// // Verify an account through the link that it's received by email
// router.get('/api/v1/verify-email/:id', AuthController.VerifyAccount)

// Login 
router.post('/login', AuthController.LoginUser)

// Logout
router.get('/logout', IsAuthenticated, AuthController.Logout)

// // Reset password 
// router.put('/reset-password', Validate(SendRecoveryEmailValidation.data), AuthController.ResetPassword)

// // New password 
// router.put('/new-password', Validate(NewPasswordValidation.data), AuthController.CreateNewPassword)

export default router