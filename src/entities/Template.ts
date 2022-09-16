import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToMany,
    ManyToOne,
    PrimaryGeneratedColumn
} from 'typeorm'
import { Form } from './Form'
import { Organization } from './Organization'
import { Workspace } from './Workspace'

@Entity({
    name: `TEMPLATE`
})
export class Template extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({
        name: `Description`,
        length: 35
    })
    description: string

    @ManyToOne(() => Organization, (organization) => organization.templatesIds)
    @JoinColumn({
        name: `ORGANIZATION_id`,
        referencedColumnName: `id`
    })
    organizationId: Organization

    @ManyToMany(() => Form, (form) => form.formCategorizesTemplate)
    formCategorizesTemplate: Form[]

    @ManyToMany(() => Workspace, (workspace) => workspace.workspaceUtilizesTemplate)
    workspaceUtilizesTemplate: Workspace[]

}