import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from 'typeorm'
import { Notification } from './Notification'

// Entity that will hold the attributes for the User table
@Entity({
    name: `USER`
})
export class User extends BaseEntity {

    // Universally Unique IDentifier for each User
    @PrimaryGeneratedColumn(`uuid`)
    id: string

    // Email of the User
    @Column({
        name: `Email`,
        length: 120,
        unique: true
    })
    email: string

    // Encrypted password of the User
    @Column({
        name: `Password`
    })
    password: string

    // Role image of the User
    @Column({
        name: `Image`,
        length: 100,
        nullable: true
    })
    image: string

    // Role color of the User
    @Column({
        name: `Color`,
        length: 6,
        nullable: true
    })
    color: string

    // Validation token for the User
    @Column({
        name: `ValidationToken`,
        nullable: true
    })
    validationToken: string

    // Reset token for the User
    @Column({
        name: `ResetToken`,
        nullable: true
    })
    resetToken: string

    // Verification status of the User
    @Column({
        name: `IsVerified`,
        default: false
    })
    isVerified: boolean

    // Activity status of the User
    @Column({
        name: `IsActive`,
        default: true
    })
    isActive: boolean

    // Creation date of the User
    @CreateDateColumn({
        name: `CreatedAt`
    })
    createdAt: Date

    // Date of the last update of the properties for the User
    @UpdateDateColumn({
        name: `LastUpdate`
    })
    lastUpdate: Date

    // A relation for each User that contains the Notifications it received
    @OneToMany(() => Notification, (notification) => notification.userId)
    notificationsIds: Notification[]
    
}