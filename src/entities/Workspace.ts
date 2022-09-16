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
import { Dataset } from './Dataset'
import { Group } from './Group'
import { Layer } from './Layer'
import { Organization } from './Organization'
import { Permission } from './Permission'
import { Person } from './Person'
import { Process } from './Process'
import { Project_Class } from './Project_Class'
import { Task } from './Task'
import { Template } from './Template'
import { Workflow } from './Workflow'

@Entity({
    name: `WORKSPACE`
})
export class Workspace extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @ManyToOne(() => Organization, (organization) => organization.workspacesIds)
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
        name: `Icon`,
        nullable: true
    })
    icon: string

    @Column({
        name: `Color`,
        length: 30,
        nullable: true
    })
    color: string

    @Column({
        name: `Description`,
        length: 50,
        nullable: true
    })
    description: string

    @Column({
        name: `Status`
    })
    status: number
    
    @ManyToOne(() => Workspace, (parentWorkspace) => parentWorkspace.id)
    @JoinColumn({
        name: `WORKSPACE_id`,
        referencedColumnName: `id`
    })
    workspaceId: Workspace

    @OneToMany(() => Workspace, (subWorkspace) => subWorkspace.id)
    subWorkspacesIds: Workspace[]
    
    @OneToMany(() => Dataset, (dataset) => dataset.workspaceId)
    datasetsIds: Dataset[]
    
    @OneToMany(() => Layer, (layer) => layer.workspaceId)
    layersIds: Layer[]

    @OneToMany(() => Permission, (permission) => permission.workspaceId)
    permissionsIds: Permission[]
    
    @OneToMany(() => Process, (process) => process.workspaceId)
    processesIds: Process[]
    
    @OneToMany(() => Project_Class, (projectClass) => projectClass.workspaceId)
    projectClassesIds: Project_Class[]
    
    @OneToMany(() => Task, (task) => task.workspaceId)
    tasksIds: Task[]
    
    @OneToMany(() => Workflow, (workflow) => workflow.workspaceId)
    workflowsIds: Workflow[]

    @ManyToMany(() => Person, (person) => person.workspaceInvolvesPerson)
    @JoinTable({
        name: `WORKSPACE_involves_PERSON`,
        joinColumn: {
            name: `WORKSPACE_id`,
            referencedColumnName: `id`
        },
        inverseJoinColumn: {
            name: `PERSON_id`,
            referencedColumnName: `id`
        }
    })
    workspaceInvolvesPerson: Person[]

    @ManyToMany(() => Template, (template) => template.workspaceUtilizesTemplate)
    @JoinTable({
        name: `WORKSPACE_utilizes_TEMPLATE`,
        joinColumn: {
            name: `WORKSPACE_id`,
            referencedColumnName: `id`
        },
        inverseJoinColumn: {
            name: `TEMPLATE_id`,
            referencedColumnName: `id`
        }
    })
    workspaceUtilizesTemplate: Template[]

    @ManyToMany(() => Group , (group) => group.groupSharesWorkspace)
    groupSharesWorkspace: Group[]
    
}