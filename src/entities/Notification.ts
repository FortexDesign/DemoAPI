import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn
} from 'typeorm'
import { User } from './User'

@Entity({
    name: `NOTIFICATION`
})
export class Notification extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({
        name: `Title`,
        length: 100
    })
    title: string

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

    @ManyToOne(() => User, (user) => user.notificationsIds)
    @JoinColumn({
        name: `USER_id`,
        referencedColumnName: `id`
    })
    userId: User
    
}