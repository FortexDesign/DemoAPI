import {
    BaseEntity,
    Column,
    Entity,
    ManyToMany,
    PrimaryGeneratedColumn
} from 'typeorm'
import { Organization } from './Organization'

@Entity({
    name: `SUBSCRIPTION`
})
export class Subscription extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({
        name: `Name`,
        length: 30
    })
    name: string

    @Column({
        name: `Description`,
        length: 50,
        nullable: true
    })
    description: string

    @ManyToMany(() => Organization, (organization) => organization.organizationPurchasesSubscription)
    organizationPurchasesSubscription: Organization[]
    
}