import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn
} from 'typeorm'
import { Log_Type } from './Log_Type'
import { Project } from './Project'
import { Task } from './Task'
import { Workflow } from './Workflow'
import { Workspace } from './Workspace'

@Entity({
    name: `PROCESS`
})
export class Process extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @ManyToOne(() => Workflow, (workflow) => workflow.processesIds)
    @JoinColumn({
        name: `WORKFLOW_id`,
        referencedColumnName: `id`
    })
    workflowId: Workflow

    @ManyToOne(() => Workspace, (workspace) => workspace.processesIds)
    @JoinColumn({
        name: `WORKSPACE_id`,
        referencedColumnName: `id`
    })
    workspaceId: Workspace

    @ManyToOne(() => Project, (project) => project.processesIds)
    @JoinColumn({
        name: `PROJECT_id`,
        referencedColumnName: `id`
    })
    projectId: Project

    @Column({
        name: `Data`,
        type: `jsonb`,
        nullable: true
    })
    data: JSON

    @Column({
        name: `Version`
    })
    version: number

    @Column({
        name: `Bpmn`,
        type: `jsonb`,
        nullable: true
    })
    bpmn: JSON

    @ManyToOne(() => Task, (task) => task.processesIds)
    @JoinColumn({
        name: `TASK_id`,
        referencedColumnName: `id`
    })
    taskId: Task

    @OneToMany(() => Log_Type, (logType) => logType.processId)
    logTypesIds: Log_Type[]

    @OneToMany(() => Task, (task) => task.processId)
    tasksIds: Task[]

}