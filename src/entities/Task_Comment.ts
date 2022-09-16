import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn
} from 'typeorm'
import { Person } from './Person'
import { Task } from './Task'

@Entity({
    name: `TASK_COMMENT`
})
export class Task_Comment extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({
        name: `Description`,
        type: `text`
    })
    description: string

    @Column({
        name: `Date`,
        length: 30
    })
    date: string

    @ManyToOne(() => Task, (task) => task.taskCommentsIds)
    @JoinColumn({
        name: `TASK_id`,
        referencedColumnName: `id`
    })
    taskId: Task

    @ManyToOne(() => Person, (person) => person.taskCommentsIds)
    @JoinColumn({
        name: `PERSON_id`,
        referencedColumnName: `id`
    })
    personId: Person

    @ManyToOne(() => Task_Comment, (subTaskComment) => subTaskComment.subTaskCommentsIds)
    @JoinColumn({
        name: `TASK_COMMENT_id`,
        referencedColumnName: `id`
    })
    taskCommentId: Task_Comment

    @OneToMany(() => Task_Comment, (parentTaskComment) => parentTaskComment.taskCommentId)
    subTaskCommentsIds: Task_Comment[]
    
}