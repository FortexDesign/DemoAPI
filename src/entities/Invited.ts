import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn
} from 'typeorm'
import { Organization } from './Organization'

@Entity({
    name: `INVITED`
})
export class Invited extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({
        name: `FirstName`,
        length: 20
    })
    firstName: string

    @Column({
        name: `LastName`,
        length: 20
    })
    lastName: string

    @Column({
        name: `Email`,
        length: 120
    })
    email: string

    @ManyToOne(() => Organization, (organization) => organization.invitedIds)
    @JoinColumn({
        name: `ORGANIZATION_id`,
        referencedColumnName: `id`
    })
    organizationId: Organization
    
}