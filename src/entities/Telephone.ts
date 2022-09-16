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
    name: `TELEPHONE`
})
export class Telephone extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({
        name: `Number`,
        type: 'character varying',
        length: 14
    })
    number: Number

    @Column({
        name: `Extension`,
        type: 'character varying',
        length: 4,
        nullable: true
    })
    extension: Number

    @ManyToOne(() => Person, (person) => person.telephonesIds)
    @JoinColumn({
        name: `PERSON_id`,
        referencedColumnName: `id`
    })
    personId: Person
    
}