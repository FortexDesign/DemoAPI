import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn
} from 'typeorm'
import { Group } from './Group'
import { Invited } from './Invited'
import { Project_Class } from './Project_Class'
import { Role } from './Role'
import { Subscription } from './Subscription'
import { Task_Type } from './Task_Type'
import { Template } from './Template'
import { Workspace } from './Workspace'
import { Person } from './Person'

@Entity({
    name: `ORGANIZATION`
})
export class Organization extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({
        name: `Name`,
        length: 20,
        nullable: true
    })
    name: string

    @Column({
        name: `Duns`,
        length: 20,
        nullable: true
    })
    duns: string

    @Column({
        name: `Domain`,
        length: 50,
        nullable: true
    })
    domain: string

    @Column({
        name: `Logo`,
        length: 100,
        nullable: true
    })
    logo: string

    @Column({
        name: `Official`,
        default: true
    })
    official: boolean

    @Column({
        name: `Public`,
        default: true
    })
    public: boolean

    @Column({
        name: `NAICS`,
        type: `jsonb`,
        nullable: true
    })
    naics: JSON

    @Column({
        name: `Description`,
        nullable: true
    })
    description: string

    @Column({
        name: `Phones`,
        type: `jsonb`,
        nullable: true
    })
    phones: JSON

    @Column({
        name: `Locations`,
        type: `jsonb`,
        nullable: true
    })
    locations: JSON

    @Column({
        name: `Creation`,
        nullable: true
    })
    creation: string

    @Column({
        name: `URL`,
        nullable: true
    })
    url: string

    @Column({
        name: `Licenses`,
        type: `jsonb`,
        nullable: true
    })
    licenses: JSON

    @Column({
        name: `InsuranceCertifications`,
        type: `jsonb`,
        nullable: true
    })
    insuranceCertifications: JSON
    
    @Column({
        name: `LossRunReports`,
        type: `jsonb`,
        nullable: true
    })
    lossRunReports: JSON
    
    @Column({
        name: `BusinessRegistration`,
        type: `jsonb`,
        nullable: true
    })
    businessRegistration: JSON

    @ManyToOne(() => Organization, (parentOrganization) => parentOrganization.subOrganizationsIds)
    @JoinColumn({
        name: `ORGANIZATION_id`,
        referencedColumnName: `id`
    })
    organizationId: Organization

    @OneToMany(() => Organization, (subOrganization) => subOrganization.organizationId)
    subOrganizationsIds: Organization[]

    @OneToMany(() => Group, (group) => group.organizationId)
    groupsIds: Group[]

    @OneToMany(() => Invited, (invited) => invited.organizationId)
    invitedIds: Invited[]

    @OneToMany(() => Person, (person) => person.organizationId)
    peopleIds: Person[]
    
    @OneToMany(() => Project_Class, (projectClass) => projectClass.organizationId)
    projectClassesIds: Project_Class[]

    @OneToMany(() => Role, (role) => role.organizationId)
    rolesIds: Role[]

    @OneToMany(() => Task_Type, (taskType) => taskType.organizationId)
    taskTypesIds: Task_Type[]

    @OneToMany(() => Template, (template) => template.organizationId)
    templatesIds: Template[]
    
    @OneToMany(() => Workspace, (workspace) => workspace.organizationId)
    workspacesIds: Workspace[]

    @ManyToMany(() => Subscription, (subscription) => subscription.organizationPurchasesSubscription)
    @JoinTable({
        name: `ORGANIZATION_purchases_SUBSCRIPTION`,
        joinColumn: {
            name: `ORGANIZATION_id`,
            referencedColumnName: `id`
        },
        inverseJoinColumn: {
            name: `SUBSCRIPTION_id`,
            referencedColumnName: `id`
        }
    })
    organizationPurchasesSubscription: Subscription[]
    
}