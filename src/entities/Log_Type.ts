import {
    BaseEntity,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn
} from 'typeorm'
import { Log } from './Log'
import { Process } from './Process'
import { Project } from './Project'
import { Task } from './Task'

@Entity({
    name: `LOG_TYPE`
})
export class Log_Type extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @ManyToOne(() => Task, (task) => task.logTypesIds)
    @JoinColumn({
        name: `TASK_id`,
        referencedColumnName: `id`
    })
    taskId: Task

    @ManyToOne(() => Project, (project) => project.logTypesIds)
    @JoinColumn({
        name: `PROJECT_id`,
        referencedColumnName: `id`
    })
    projectId: Project

    @ManyToOne(() => Process, (process) => process.logTypesIds)
    @JoinColumn({
        name: `PROCESS_id`,
        referencedColumnName: `id`
    })
    processId: Process

    @OneToMany(() => Log, (log) => log.logTypeId)
    logsIds: Log[]

}