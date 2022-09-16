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
import { Process } from './Process'
import { Project_Class } from './Project_Class'
import { Project_Comment } from './Project_Comment'
import { Project_Ties_Layer } from './Project_Ties_Layer'
import { Task } from './Task'

@Entity({
    name: `PROJECT`
})
export class Project extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @ManyToOne(() => Project_Class, (projectClass) => projectClass.projectsIds)
    @JoinColumn({
        name: `PROJECT_CLASS_id`,
        referencedColumnName: `id`
    })
    projectClassId: Project_Class

    @Column({
        name: `Files`,
        length: 300,
        nullable: true
    })
    files: string

    @Column({
        name: `Data`,
        type: `jsonb`
    })
    data: JSON

    @OneToMany(() => Log_Type, (logType) => logType.projectId)
    logTypesIds: Log_Type[]

    @OneToMany(() => Process, (process) => process.projectId)
    processesIds: Process[]

    @OneToMany(() => Project_Comment, (projectComment) => projectComment.projectId)
    projectCommentsIds: Project_Comment[]

    @OneToMany(() => Task, (task) => task.projectId)
    tasksIds: Task[]

    @OneToMany(() => Project_Ties_Layer, (projectTiesLayer) => projectTiesLayer.projectId)
    projectTiesLayer: Project_Ties_Layer[]
    
}