import {
    BaseEntity,
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn
} from 'typeorm'
import { Layer } from './Layer'

@Entity({
    name: `GEOM_TYPE`
})
export class Geom_Type extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({
        name: `Name`,
        length: 20,
        nullable: true
    })
    name: string

    @OneToMany(() => Layer, (layer) => layer.geomTypeId)
    layersIds: Layer[]
    
}