import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn
} from 'typeorm'
import { Person } from './Person'
import { Task } from './Task'

@Entity({
    name: `PERSON_interacts_TASK`
})
export class Person_Interacts_Task extends BaseEntity {

    @PrimaryColumn({
        name: `PERSON_id`
    })
    personIdRelation: string

    @PrimaryColumn({
        name: `TASK_id`
    })
    taskIdRelation: string

    @Column({
        name: `Role`
    })
    role: string

    @ManyToOne(() => Person, (person) => person.personInteractsTask)
    @JoinColumn({
        name: `PERSON_id`,
        referencedColumnName: `id`
    })
    personId: Person

    @ManyToOne(() => Task, (task) => task.personInteractsTask)
    @JoinColumn({
        name: `TASK_id`,
        referencedColumnName: `id`
    })
    taskId: Task

}