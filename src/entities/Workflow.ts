import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn
} from 'typeorm'
import { Form_Is_Type } from './Form_Is_Type'
import { Process } from './Process'
import { Project_Class } from './Project_Class'
import { Workspace } from './Workspace'

@Entity({
    name: `WORKFLOW`
})
export class Workflow extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @ManyToOne(() => Project_Class, (projectClass) => projectClass.workflowsIds)
    @JoinColumn({
        name: `PROJECT_CLASS_id`,
        referencedColumnName: `id`
    })
    projectClassId: Project_Class

    @ManyToOne(() => Workspace, (workspace) => workspace.workflowsIds)
    @JoinColumn({
        name: `WORKSPACE_id`,
        referencedColumnName: `id`
    })
    workspaceId: Workspace

    @Column({
        name: `Name`,
        length: 50
    })
    name: string

    @Column({
        name: `Description`,
        type: `text`
    })
    description: string

    @Column({
        name: `Bpmn`,
        type: `jsonb`,
        nullable: true
    })
    bpmn: JSON

    @Column({
        name: `Version`
    })
    version: number

    @Column({
        name: `Active`
    })
    active: boolean

    @OneToMany(() => Process, (process) => process.workflowId)
    processesIds: Process[]

    @OneToMany(() => Form_Is_Type, (formType) => formType.workflowId)
    formsAreTypesIds: Form_Is_Type[]

}