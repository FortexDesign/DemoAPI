import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn
} from 'typeorm'
import { Organization } from './Organization'
import { Task } from './Task'

@Entity({
    name: `TASK_TYPE`
})
export class Task_Type extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({
        name: `Name`,
        length: 40
    })
    name: string

    @ManyToOne(() => Organization, (organization) => organization.taskTypesIds)
    @JoinColumn({
        name: `ORGANIZATION_id`,
        referencedColumnName: `id`
    })
    organizationId: Organization

    @OneToMany(() => Task, (task) => task.taskTypeId)
    tasksIds: Task[]

}