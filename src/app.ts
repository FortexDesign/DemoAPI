import 'reflect-metadata'
import { AppDataSource } from './database/connection'
import express from 'express'
import morgan from 'morgan'
import cors from 'cors'
import router from './routes/router'
import peopleRouter from './routes/people_router'
import formRouter from './routes/form_router'
import userRouter from './routes/user_router'
import organizationRouter from './routes/organization_router'
import groupRouter from './routes/group_router'
import roleRouter from './routes/role_router'
import workspaceRouter from './routes/workspace_router'
import permissionRouter from './routes/permission_router'
import testRouter from './routes/test_router'
import cookieParser from 'cookie-parser'
import { IsAuthenticated } from './middleware/is_authenticated'
import bodyParser from 'body-parser'

 
// Check Database connection
AppDataSource.initialize().then(function(value) {
    console.log(`Database connected`)
  }, function(reason) {
    console.log(reason)
  })

// Setup of the Express server
const app = express()

// Settings
app.set('port', process.env.PORT || `3000`)
app.set('view engine', 'ejs')
app.engine('html',require('ejs').renderFile)

// Middlewares
app.use(morgan('dev'))
app.use(express.static('public'))
app.use(cors())
app.use(express.urlencoded({ extended: true,limit: '25mb' }))
app.use(express.json({limit: '25mb'}));
app.use(cookieParser())


// Routes
app.use('/', router)

//people routes
app.use('/people', IsAuthenticated, peopleRouter)

//user routes
app.use('/user', IsAuthenticated, userRouter)

//form routes
app.use('/form', IsAuthenticated, formRouter)

// Organization Routes
app.use('/organization', IsAuthenticated, organizationRouter)

// Group Routes
app.use('/group', IsAuthenticated, groupRouter)

// Role Routes
app.use('/role', IsAuthenticated, roleRouter)

// Workspaces Routes
app.use('/workspace', workspaceRouter)

// Permission Routes
app.use('/permission', IsAuthenticated, permissionRouter)

app.use('/test', testRouter)

// Delete the cache after logout
app.use(function (req, res, next) {
    if (!req.body.user) res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    next()
})

// Server listening verification
app.listen(app.get('port'),'0.0.0.0', () => {
    console.log(`Server is listening on port`, 3000)
})
