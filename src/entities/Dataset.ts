import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn
} from 'typeorm'
import { Workspace } from './Workspace'

@Entity({
    name: `DATASET`
})
export class Dataset extends BaseEntity {
    
    @PrimaryGeneratedColumn('uuid')
    id: string

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
        name: `Classification`,
        length: 20,
        nullable: true
    })
    classification: string

    @Column({
        name: `Columns`,
        type: `text`,
        array: true
    })
    columns: string[]

    @Column({
        name: `Values`,
        type: `text`,
        array: true,
        nullable: true
    })
    values: string[][]

    @ManyToOne(() => Workspace, (workspace) => workspace.datasetsIds)
    @JoinColumn({
        name: `WORKSPACE_id`,
        referencedColumnName: `id`
    })
    workspaceId: Workspace

}