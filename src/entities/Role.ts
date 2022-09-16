import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    PrimaryGeneratedColumn
} from 'typeorm'
import { Group } from './Group'
import { Organization } from './Organization'
import { Permission } from './Permission'
import { Person } from './Person'

@Entity({
    name: `ROLE`
})
export class Role extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @ManyToOne(() => Organization, (organization) => organization.rolesIds)
    @JoinColumn({
        name: `ORGANIZATION_id`,
        referencedColumnName: `id`
    })
    organizationId: Organization

    @Column({
        name: `Name`,
        length: 20
    })
    name: string

    @Column({
        name: `Description`,
        length: 200,
        nullable: true
    })
    description: string

    @Column({
        name: `Status`,
        default: true
    })
    status: Boolean

    @ManyToMany(() => Permission, (permission) => permission.roleCombinesPermission)
    @JoinTable({
        name: `ROLE_combines_PERMISSION`,
        joinColumn: {
            name: `ROLE_id`,
            referencedColumnName: `id`
        },
        inverseJoinColumn: {
            name: `PERMISSION_id`,
            referencedColumnName: `id`
        }
    })
    roleCombinesPermission: Permission[]

    @ManyToMany(() => Person, (person) => person.personAppointsRole)
    personAppointsRole: Person[]

    @ManyToMany(() => Group, (group) => group.groupLinksRole)
    groupLinksRole: Group[]
    
}