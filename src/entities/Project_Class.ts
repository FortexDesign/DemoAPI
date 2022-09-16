import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToMany,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn
} from 'typeorm'
import { Form_Is_Type } from './Form_Is_Type'
import { Group } from './Group'
import { Organization } from './Organization'
import { Project } from './Project'
import { Workflow } from './Workflow'
import { Workspace } from './Workspace'

@Entity({
    name: `PROJECT_CLASS`
})
export class Project_Class extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @ManyToOne(() => Organization, (organization) => organization.projectClassesIds)
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

    @ManyToOne(() => Workspace, (workspace) => workspace.projectClassesIds)
    @JoinColumn({
        name: `WORKSPACE_id`,
        referencedColumnName: `id`
    })
    workspaceId: Workspace

    @OneToMany(() => Form_Is_Type, (formType) => formType.projectClassId)
    formsAreTypesIds: Form_Is_Type[]

    @OneToMany(() => Project, (project) => project.projectClassId)
    projectsIds: Project[]

    @OneToMany(() => Workflow, (workflow) => workflow.projectClassId)
    workflowsIds: Workflow[]

    @ManyToMany(() => Group, (group) => group.groupInteractsProjectClass)
    groupInteractsProjectClass: Group[]
    
}