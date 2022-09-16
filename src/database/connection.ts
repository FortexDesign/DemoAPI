import dotenv from 'dotenv'
import { DataSource } from 'typeorm'
import { User } from '../entities/User'
import { Person_Type } from '../entities/Person_Type'
import { Person } from '../entities/Person'
import { Email } from '../entities/Email'
import { Telephone } from '../entities/Telephone'
import { Organization } from '../entities/Organization'
import { Field } from '../entities/Field'
import { Role } from '../entities/Role'
import { Group } from '../entities/Group'
import { Form } from '../entities/Form'
import { List } from '../entities/List'
import { Template } from '../entities/Template'
import { Task_Type } from '../entities/Task_Type'
import { Invited } from '../entities/Invited'
import { Permission } from '../entities/Permission'
import { Subscription } from '../entities/Subscription'
import { Workspace } from '../entities/Workspace'
import { Memo } from '../entities/Memo'
import { Memo_Comment } from '../entities/Memo_Comment'
import { Notification } from '../entities/Notification'
import { Geom_Type } from '../entities/Geom_Type'
import { Layer_Data } from '../entities/Layer_Data'
import { Layer_Style } from '../entities/Layer_Style'
import { Dataset } from '../entities/Dataset'
import { Project_Class } from '../entities/Project_Class'
import { Project } from '../entities/Project'
import { Workflow } from '../entities/Workflow'
import { Project_Comment } from '../entities/Project_Comment'
import { Layer } from '../entities/Layer'
import { Task } from '../entities/Task'
import { Process } from '../entities/Process'
import { Form_Is_Type } from '../entities/Form_Is_Type'
import { Log_Type } from '../entities/Log_Type'
import { Log } from '../entities/Log'
import { Task_Comment } from '../entities/Task_Comment'
import { Group_Forms_Person } from '../entities/Group_Forms_Person'
import { Memo_Posts_Person } from '../entities/Memo_Posts_Person'
import { Layer_Designs_Layer_Style } from '../entities/Layer_Designs_Layer_Style'
import { Project_Ties_Layer } from '../entities/Project_Ties_Layer'
import { Person_Interacts_Task } from '../entities/Person_Interacts_Task'
import { Layer_Ties_Task } from '../entities/Layer_Ties_Task'
import { Permission_Category } from '../entities/Permission_Category'

dotenv.config({ path: '.env' })

// Database settings
export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || ``,
    port: parseInt(process.env.DB_PORT || `0`),
    username: process.env.DB_USER || ``,
    password: process.env.DB_PASS || ``,
    database: process.env.DB_DATABASE || ``,
    entities: [
        User,
        Person_Type,
        Field,
        Organization,
        Group,
        Person,
        Telephone,
        Email,
        Form,
        List,
        Template,
        Task_Type,
        Invited,
        Role,
        Permission,
        Permission_Category,
        Subscription,
        Workspace,
        Memo,
        Memo_Comment,
        Notification,
        Geom_Type,
        Layer_Data,
        Layer_Style,
        Dataset,
        Project_Class,
        Project,
        Workflow,
        Project_Comment,
        Layer,
        Task,
        Process,
        Form_Is_Type,
        Log_Type,
        Log,
        Task_Comment,
        Group_Forms_Person,
        Memo_Posts_Person,
        Layer_Designs_Layer_Style,
        Project_Ties_Layer,
        Person_Interacts_Task,
        Layer_Ties_Task
    ],
    logging: false,
    synchronize: true
})
