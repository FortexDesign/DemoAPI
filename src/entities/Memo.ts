import {
    BaseEntity,
    Column,
    Entity,
    JoinTable,
    ManyToMany,
    OneToMany,
    PrimaryGeneratedColumn
} from 'typeorm'
import { Group } from './Group'
import { Memo_Posts_Person } from './Memo_Posts_Person'
import { Memo_Comment } from './Memo_Comment'

@Entity({
    name: `MEMO`
})
export class Memo extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({
        name: `Title`,
        length: 100
    })
    title: string

    @Column({
        name: `Body`,
        type: `text`
    })
    body: string

    @Column({
        name: `Date`,
        length: 30
    })
    date: string

    @OneToMany(() => Memo_Comment, (memoComment) => memoComment.memoId)
    memoCommentsIds: Memo_Comment[]

    @ManyToMany(() => Group, (group) => group.memoPostsGroup)
    @JoinTable({
        name: `MEMO_posts_GROUP`,
        joinColumn: {
            name: `MEMO_id`,
            referencedColumnName: `id`
        },
        inverseJoinColumn: {
            name: `GROUP_id`,
            referencedColumnName: `id`
        }
    })
    memoPostsGroup: Group[]

    @OneToMany(() => Memo_Posts_Person, (memoToPerson) => memoToPerson.memoId)
    memoPostsPerson: Memo_Posts_Person[]
    
}