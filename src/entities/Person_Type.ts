import {
    BaseEntity,
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn
} from 'typeorm'
import { Form_Is_Type } from './Form_Is_Type'
import { Person } from './Person'

// Entity that will hold the attributes for the Person Type table
@Entity({
    name: `PERSON_TYPE`
})
export class Person_Type extends BaseEntity {

    // Automatic ID set to any new Person Type
    @PrimaryGeneratedColumn('uuid')
    id: string

    // Name of the Person Type
    @Column({
        name: `Name`,
        length: 20
    })
    name: string
    
    // A small description for the Person Type
    @Column({
        name: `Description`,
        type: `text`,
        nullable: true
    })
    description: string

    // Status of the Person Type
    @Column({
        name: `Status`,
        default: true
    })
    status: boolean

    // A relation for each Person Type that contains the Form Types related to it
    @OneToMany(() => Form_Is_Type, (formType) => formType.personTypeId)
    formsAreTypesIds: Form_Is_Type[]

    // A relation for each Person Type that contains the People that were assigned to it
    @OneToMany(() => Person, (person) => person.personTypeId)
    peopleIds: Person[]
    
}