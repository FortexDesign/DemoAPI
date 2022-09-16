import {
    BaseEntity,
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn
} from 'typeorm'
import { Layer } from './Layer'

@Entity({
    name: `LAYER_DATA`
})
export class Layer_Data extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({
        name: `Columns`,
        type: `text`,
        array: true,
        nullable: true
    })
    columns: string[]

    @OneToMany(() => Layer, (layer) => layer.layerDataId)
    layersIds: Layer[]

}