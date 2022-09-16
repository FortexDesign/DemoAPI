import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn
} from 'typeorm'
import { Memo } from './Memo'
import { Person } from './Person'

@Entity({
    name: `MEMO_COMMENT`
})
export class Memo_Comment extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({
        name: `Comment`,
        type: `text`
    })
    comment: string

    @Column({
        name: `Date`,
        length: 30
    })
    date: string

    @ManyToOne(() => Person, (person) => person.memoCommentsIds)
    @JoinColumn({
        name: `PERSON_id`,
        referencedColumnName: `id`
    })
    personId: Person

    @ManyToOne(() => Memo, (memo) => memo.memoCommentsIds)
    @JoinColumn({
        name: `MEMO_id`,
        referencedColumnName: `id`
    })
    memoId: Memo
    
}