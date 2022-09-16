import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn
} from 'typeorm'
import { Log_Type } from './Log_Type'
import { Person } from './Person'

@Entity({
    name: `LOG`
})
export class Log extends BaseEntity {

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

    @ManyToOne(() => Log_Type, (logType) => logType.logsIds)
    @JoinColumn({
        name: `LOG_TYPE_id`,
        referencedColumnName: `id`
    })
    logTypeId: Log_Type

    @ManyToOne(() => Person, (person) => person.logsIds)
    @JoinColumn({
        name: `PERSON_id`,
        referencedColumnName: `id`
    })
    personId: Person
    
}