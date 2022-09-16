import {
    BaseEntity,
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn
} from 'typeorm'
import { Permission } from './Permission'

@Entity({
    name: `PERMISSION_CATEGORY`
})
export class Permission_Category extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({
        name: `Name`,
        length: 30
    })
    name: string

    @OneToMany(() => Permission, (permission) => permission.permissionCategoryId)
    permissionsIds: Permission[]

}