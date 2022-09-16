import {
    BaseEntity,
    Column,
    Entity,
    PrimaryGeneratedColumn
} from 'typeorm'

@Entity({
    name: `LIST`
})
export class List extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({
        name: `Setting`,
        type: `jsonb`
    })
    setting: JSON

}