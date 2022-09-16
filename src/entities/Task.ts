import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToMany,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from 'typeorm'
import { Form_Is_Type } from './Form_Is_Type'
import { Group } from './Group'
import { Layer_Ties_Task } from './Layer_Ties_Task'
import { Log_Type } from './Log_Type'
import { Person_Interacts_Task } from './Person_Interacts_Task'
import { Process } from './Process'
import { Project } from './Project'
import { Task_Comment } from './Task_Comment'
import { Task_Type } from './Task_Type'
import { Workspace } from './Workspace'

@Entity({
    name: `TASK`
})
export class Task extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @ManyToOne(() => Task_Type, (taskType) => taskType.tasksIds)
    @JoinColumn({
        name: `TASK_TYPE_id`,
        referencedColumnName: `id`
    })
    taskTypeId: Task_Type

    @ManyToOne(() => Process, (process) => process.tasksIds)
    @JoinColumn({
        name: `PROCESS_id`,
        referencedColumnName: `id`
    })
    processId: Process

    @ManyToOne(() => Project, (project) => project.tasksIds)
    @JoinColumn({
        name: `PROJECT_id`,
        referencedColumnName: `id`
    })
    projectId: Project

    @ManyToOne(() => Workspace, (workspace) => workspace.tasksIds)
    @JoinColumn({
        name: `WORKSPACE_id`,
        referencedColumnName: `id`
    })
    workspaceId: Workspace

    @Column({
        name: `Version`
    })
    version: number

    @Column({
        name: `Data`,
        type: `jsonb`
    })
    data: JSON

    @Column({
        name: `Status`
    })
    status: number

    @CreateDateColumn({
        name: `CreatedAt`
    })
    createdAt: string

    @UpdateDateColumn({
        name: `UpdatedAt`
    })
    updatedAt: string

    @ManyToOne(() => Task, (subTask) => subTask.subTasksIds)
    @JoinColumn({
        name: `TASK_id`,
        referencedColumnName: `id`
    })
    taskId: Task

    @OneToMany(() => Task, (parentTask) => parentTask.taskId)
    subTasksIds: Task[]

    @OneToMany(() => Form_Is_Type, (formType) => formType.taskId)
    formsAreTypesIds: Form_Is_Type[]

    @OneToMany(() => Log_Type, (logType) => logType.taskId)
    logTypesIds: Log_Type[]
    
    @OneToMany(() => Process, (process) => process.taskId)
    processesIds: Process[]
    
    @OneToMany(() => Task_Comment, (taskComment) => taskComment.taskId)
    taskCommentsIds: Task_Comment[]

    @ManyToMany(() => Group, (group) => group.groupWorksTask)
    groupWorksTask: Group[]

    @OneToMany(() => Person_Interacts_Task, (personInteractsTask) => personInteractsTask.taskId)
    personInteractsTask: Person_Interacts_Task[]

    @OneToMany(() => Layer_Ties_Task, (layerTiesTask) => layerTiesTask.taskId)
    layerTiesTask: Layer_Ties_Task[]
    
}