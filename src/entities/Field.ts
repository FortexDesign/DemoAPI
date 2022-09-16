import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn
} from 'typeorm'

@Entity({
    name: `FIELD`
})
export class Field extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({
        name: `Name`,
        length: 20
    })
    name: string

    @Column({
        name: `Setting`,
        type: `jsonb`
    })
    setting: JSON

    @ManyToOne(() => Field, (parentField) => parentField.id)
    @JoinColumn({
        name: `FIELD_id`,
        referencedColumnName: `id`
    })
    fieldId: Field

    @OneToMany(() => Field, (subField) => subField.id)
    subFieldsIds: Field[]
    
}