import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn
} from 'typeorm'
import { Person } from './Person'

@Entity({
    name: `EMAIL`
})
export class Email extends BaseEntity {
    
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({
        name: `Email`,
        length: 120
    })
    email: string

    @ManyToOne(() => Person, (person) => person.emailsIds)
    @JoinColumn({
        name: `PERSON_id`,
        referencedColumnName: `id`
    })
    personId: Person

}