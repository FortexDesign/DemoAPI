import {
    BaseEntity,
    Column,
    Entity,
    JoinTable,
    ManyToMany,
    OneToMany,
    PrimaryGeneratedColumn
} from 'typeorm'
import { Form_Is_Type } from './Form_Is_Type'
import { Template } from './Template'

@Entity({
    name: `FORM`
})
export class Form extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({
        name: `Setting`,
        type: `jsonb`
    })
    setting: JSON
    
    @OneToMany(() => Form_Is_Type, (formType) => formType.formId)
    formsAreTypesIds: Form_Is_Type[]

    @ManyToMany(() => Template, (template) => template.formCategorizesTemplate)
    @JoinTable({
        name: `FORM_categorizes_TEMPLATE`,
        joinColumn: {
            name: `FORM_id`,
            referencedColumnName: `id`
        },
        inverseJoinColumn: {
            name: `TEMPLATE_id`,
            referencedColumnName: `id`
        }
    })
    formCategorizesTemplate: Template[]
    
}