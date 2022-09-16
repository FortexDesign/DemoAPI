import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    PrimaryColumn
} from 'typeorm'
import { Group } from './Group'
import { Person } from './Person'
import { Permission } from './Permission'

@Entity({
    name: `GROUP_forms_PERSON`
})
export class Group_Forms_Person extends BaseEntity {

    @PrimaryColumn({
        name: `GROUP_id`
    })
    groupIdRelation: string

    @PrimaryColumn({
        name: `PERSON_id`
    })
    personIdRelation: string

    @Column({
        name: `Status`,
        default: true
    })
    status: boolean
    
    @ManyToOne(() => Group, (group) => group.groupFormsPerson)
    @JoinColumn({
        name: `GROUP_id`,
        referencedColumnName: `id`
    })
    groupId: Group
    
    @ManyToOne(() => Person, (person) => person.groupFormsPerson)
    @JoinColumn({
        name: `PERSON_id`,
        referencedColumnName: `id`
    })
    personId: Person

}