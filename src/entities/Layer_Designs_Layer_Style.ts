import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn
} from 'typeorm'
import { Layer } from './Layer'
import { Layer_Style } from './Layer_Style'

@Entity({
    name: `LAYER_designs_LAYER_STYLE`
})
export class Layer_Designs_Layer_Style extends BaseEntity {
    
    @PrimaryColumn({
        name: `LAYER_id`
    })
    layerIdRelation: string

    @PrimaryColumn({
        name: `LAYER_STYLE_id`
    })
    layerStyleIdRelation: string

    @Column({
        name: `Value`,
        length: 50,
        nullable: true
    })
    value: string

    @ManyToOne(() => Layer, (layer) => layer.layerDesignsLayerStyle)
    @JoinColumn({
        name: `LAYER_id`,
        referencedColumnName: `id`
    })
    layerId: Layer

    @ManyToOne(() => Layer_Style, (layerStyle) => layerStyle.layerDesignsLayerStyle)
    @JoinColumn({
        name: `LAYER_STYLE_id`,
        referencedColumnName: `id`
    })
    layerStyleId: Layer_Style

}