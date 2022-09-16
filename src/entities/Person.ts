import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn
} from 'typeorm'
import { Email } from './Email'
import { Group_Forms_Person } from './Group_Forms_Person'
import { Log } from './Log'
import { Memo_Comment } from './Memo_Comment'
import { Memo_Posts_Person } from './Memo_Posts_Person'
import { Permission } from './Permission'
import { Person_Interacts_Task } from './Person_Interacts_Task'
import { Person_Type } from './Person_Type'
import { Project_Comment } from './Project_Comment'
import { Role } from './Role'
import { Task_Comment } from './Task_Comment'
import { Telephone } from './Telephone'
import { User } from './User'
import { Workspace } from './Workspace'
import { Organization } from './Organization'

// Entity that will hold the attributes for the Person table
@Entity({
    name: `PERSON`
})
export class Person extends BaseEntity {

    // Automatic ID set to any new Person
    @PrimaryGeneratedColumn('uuid')
    id: string

    // A relation for each Person that contains the unique User that was assigned to it
    @OneToOne(() => User)
    @JoinColumn({
        name: `USER_id`,
        referencedColumnName: `id`
    })
    userId: User
    
    // A relation for each Person that have assigned a Person Type
    @ManyToOne(() => Person_Type, (personType) => personType.peopleIds)
    @JoinColumn({
        name: `PERSON_TYPE_id`,
        referencedColumnName: `id`
    })
    personTypeId: Person
    
    // First name of the Person
    @Column({
        name: `FirstName`,
        length: 20,
        nullable: true
    })
    firstName: string

    // Last name of the Person
    @Column({
        name: `LastName`,
        length: 20,
        nullable: true
    })
    lastName: string

    // Additional information about the Person
    @Column({
        name: `Data`,
        type: `jsonb`,
        nullable: true
    })
    data: JSON

    // A relation that holds the organization that the user belongs to
    @ManyToOne(() => Organization, (organization) => organization.peopleIds)
    @JoinColumn({
        name: `ORGANIZATION_id`,
        referencedColumnName: `id`
    })
    organizationId: Organization

    // A relation for each Person that will contain a list of its Contact Emails
    @OneToMany(() => Email, (email) => email.personId)
    emailsIds: Email[]
    
    // A relation for each Person that will contain the Logs that it created
    @OneToMany(() => Log, (log) => log.personId)
    logsIds: Log[]
    
    // A relation for each Person that will contain the Memos' Comments that it submitted
    @OneToMany(() => Memo_Comment, (memoComment) => memoComment.personId)
    memoCommentsIds: Memo_Comment[]
    
    // A relation for each Person that will contain the Projects' Comments that it submitted
    @OneToMany(() => Project_Comment, (projectComment) => projectComment.personId)
    projectCommentsIds: Project_Comment[]
    
    // A relation for each Person that will contain the Tasks' Comments that it submitted
    @OneToMany(() => Task_Comment, (taskComment) => taskComment.personId)
    taskCommentsIds: Task_Comment[]
    
    // A relation for each Person that will contain a list of its Contact Telephone with Extension and Number
    @OneToMany(() => Telephone, (telephone) => telephone.personId)
    telephonesIds: Telephone[]
    
    // A relation that will store multiple People with multiple Roles
    @ManyToMany(() => Role, (role) => role.personAppointsRole)
    @JoinTable({
        name: `PERSON_appoints_ROLE`,
        joinColumn: {
            name: `PERSON_id`,
            referencedColumnName: `id`
        },
        inverseJoinColumn: {
            name: `ROLE_id`,
            referencedColumnName: `id`
        }
    })
    personAppointsRole: Role[]
    
    // A relation that will store multiple People with multiple Permissions
    @ManyToMany(() => Permission, (permission) => permission.personGetsPermission)
    @JoinTable({
        name: `PERSON_gets_PERMISSION`,
        joinColumn: {
            name: `PERSON_id`,
            referencedColumnName: `id`
        },
        inverseJoinColumn: {
            name: `PERMISSION_id`,
            referencedColumnName: `id`
        }
    })
    personGetsPermission: Permission[]

    @ManyToMany(() => Workspace, (workspace) => workspace.workspaceInvolvesPerson)
    workspaceInvolvesPerson: Workspace[]
    
    // A relation for each Person that will contain the Groups linked to it
    @OneToMany(() => Group_Forms_Person, (groupFormsPerson) => groupFormsPerson.personId)
    groupFormsPerson: Group_Forms_Person[]
    
    // A relation for each Person that will contain the Memos that it posted
    @OneToMany(() => Memo_Posts_Person, (memoToPerson) => memoToPerson.personId)
    memoPostsPerson: Memo_Posts_Person[]
    
    // A relation for each Person that will contain its assigned Tasks
    @OneToMany(() => Person_Interacts_Task, (personInteractsTask) => personInteractsTask.personId)
    personInteractsTask: Person_Interacts_Task[]
    length: any
    
}