import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToMany,
    ManyToOne,
    PrimaryGeneratedColumn
} from 'typeorm'
import { Permission_Category } from './Permission_Category'
import { ActionsList } from '../controllers/libs/type_definition'
import { Role } from './Role'
import { Group } from './Group'
import { Group_Forms_Person as GroupFormsPerson } from './Group_Forms_Person'
import { Person } from './Person'
import { Workspace } from './Workspace'

@Entity({
    name: `PERMISSION`
})
export class Permission extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({
        name: `Key`,
        unique: true,
        length: 30
    })
    key: string

    @Column({
        name: `Name`,
        length: 30
    })
    name: string

    @Column({
        name: `Action`,
        type: `character varying`,
        array: true,
        length: 6
    })
    action: string[]

    @Column({
        name: `Subject`,
        type: `character varying`,
        array: true,
        length: 30
    })
    subject: string[]

    @Column({
        name: `Fields`,
        type: `character varying`,
        array: true,
        nullable: true
    })
    fields?: string[]

    @Column({
        name: `Conditions`,
        type: `jsonb`,
        nullable: true
    })
    conditions?: JSON

    @Column({
        name: `Inverted`,
        default: false
    })
    inverted: Boolean

    @Column({
        name: `Reason`,
        nullable: true,
        length: 60
    })
    reason?: string

    @ManyToOne(() => Permission_Category, (permissionCategory) => permissionCategory.permissionsIds)
    @JoinColumn({
        name: `PERMISSION_CATEGORY_id`,
        referencedColumnName: `id`
    })
    permissionCategoryId: Permission_Category

    @ManyToOne(() => Workspace, (workspace) => workspace.permissionsIds)
    @JoinColumn({
        name: `WORKSPACE_id`,
        referencedColumnName: `id`
    })
    workspaceId: Workspace

    @ManyToMany(() => Person, (person) => person.personGetsPermission)
    personGetsPermission: Person[]

    @ManyToMany(() => Role, (role) => role.roleCombinesPermission)
    roleCombinesPermission: Role[]

}