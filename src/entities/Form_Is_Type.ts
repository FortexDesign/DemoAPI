import {
    BaseEntity,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn
} from 'typeorm'
import { Form } from './Form'
import { Person_Type } from './Person_Type'
import { Project_Class } from './Project_Class'
import { Task } from './Task'
import { Workflow } from './Workflow'

@Entity({
    name: `FORM_is_TYPE`
})
export class Form_Is_Type extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @ManyToOne(() => Form, (form) => form.formsAreTypesIds)
    @JoinColumn({
        name: `FORM_id`,
        referencedColumnName: `id`
    })
    formId: Form

    @ManyToOne(() => Project_Class, (projectClass) => projectClass.formsAreTypesIds)
    @JoinColumn({
        name: `PROJECT_CLASS_id`,
        referencedColumnName: `id`
    })
    projectClassId: Project_Class

    @ManyToOne(() => Workflow, (workflow) => workflow.formsAreTypesIds)
    @JoinColumn({
        name: `WORKFLOW_id`,
        referencedColumnName: `id`
    })
    workflowId: Workflow

    @ManyToOne(() => Person_Type, (personType) => personType.formsAreTypesIds, {eager: true})
    @JoinColumn({
        name: `PERSON_TYPE_id`,
        referencedColumnName: `id`
    })
    personTypeId: Person_Type

    @ManyToOne(() => Task, (task) => task.formsAreTypesIds)
    @JoinColumn({
        name: `TASK_id`,
        referencedColumnName: `id`
    })
    taskId: Task
    
}