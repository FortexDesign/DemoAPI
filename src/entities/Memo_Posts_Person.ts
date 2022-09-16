import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn
} from 'typeorm'
import { Memo } from './Memo'
import { Person } from './Person'

@Entity({
    name: `MEMO_posts_PERSON`
})
export class Memo_Posts_Person extends BaseEntity {
    
    @PrimaryColumn({
        name: `MEMO_id`
    })
    memoIdRelation: string

    @PrimaryColumn({
        name: `PERSON_id`
    })
    personIdRelation: string

    @Column({
        name: `Owner`,
        default: true
    })
    owner: boolean
    
    @ManyToOne(() => Memo, (group) => group.memoPostsPerson)
    @JoinColumn({
        name: `MEMO_id`,
        referencedColumnName: `id`
    })
    memoId: Memo
    
    @ManyToOne(() => Person, (person) => person.memoPostsPerson)
    @JoinColumn({
        name: `PERSON_id`,
        referencedColumnName: `id`
    })
    personId: Person
    
}