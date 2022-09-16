import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn
} from 'typeorm'
import { Group_Forms_Person } from './Group_Forms_Person'
import { Organization } from './Organization'
import { Project_Class } from './Project_Class'
import { Role } from './Role'
import { Task } from './Task'
import { Workspace } from './Workspace'
import { Permission } from './Permission'
import { Memo } from './Memo'

@Entity({
    name: `GROUP`
})
export class Group extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @ManyToOne(() => Organization, (organization) => organization.groupsIds)
    @JoinColumn({
        name: `ORGANIZATION_id`,
        referencedColumnName: `id`
    })
    organizationId: Organization
    
    @Column({
        name: `Name`,
        length: 20
    })
    name: string

    @Column({
        name: `Description`,
        type: `text`,
        nullable: true
    })
    description: string

    @Column({
        name: `Type`,
        default: true
    })
    type: boolean

    @ManyToMany(() => Role, (role) => role.groupLinksRole)
    @JoinTable({
        name: `GROUP_links_ROLE`,
        joinColumn: {
            name: `GROUP_id`,
            referencedColumnName: `id`
        },
        inverseJoinColumn: {
            name: `ROLE_id`,
            referencedColumnName: `id`
        }
    })
    groupLinksRole: Role[]
    
    @ManyToMany(() => Workspace ,(workspace) => workspace.groupSharesWorkspace)
    @JoinTable({
        name: `GROUP_shares_WORKSPACE`,
        joinColumn: {
            name: `GROUP_id`,
            referencedColumnName: `id`
        },
        inverseJoinColumn: {
            name: `WORKSPACE_id`,
            referencedColumnName: `id`
        }
    })
    groupSharesWorkspace: Workspace[]
    
    @ManyToMany(() => Project_Class, (projectClass) => projectClass.groupInteractsProjectClass)
    @JoinTable({
        name: `GROUP_interacts_PROJECT_CLASS`,
        joinColumn: {
            name: `GROUP_id`,
            referencedColumnName: `id`
        },
        inverseJoinColumn: {
            name: `PROJECT_CLASS_id`,
            referencedColumnName: `id`
        }
    })
    groupInteractsProjectClass: Project_Class[]
    
    @ManyToMany(() => Task, (task) => task.groupWorksTask)
    @JoinTable({
        name: `GROUP_works_TASK`,
        joinColumn: {
            name: `GROUP_id`,
            referencedColumnName: `id`
        },
        inverseJoinColumn: {
            name: `TASK_id`,
            referencedColumnName: `id`
        }
    })
    groupWorksTask: Task[]

    @ManyToMany(() => Memo, (memo) => memo.memoPostsGroup)
    memoPostsGroup: Memo[]
    
    @OneToMany(() => Group_Forms_Person, (groupFormsPerson) => groupFormsPerson.groupId)
    groupFormsPerson: Group_Forms_Person[]
    
}