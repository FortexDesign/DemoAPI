import {
    BaseEntity,
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn
} from 'typeorm'
import { Layer_Designs_Layer_Style } from './Layer_Designs_Layer_Style'

@Entity({
    name: `LAYER_STYLE`
})
export class Layer_Style extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({
        name: `StyleName`,
        length: 20,
        nullable: true
    })
    styleName: string

    @OneToMany(() => Layer_Designs_Layer_Style, (layerDesignsLayerStyle) => layerDesignsLayerStyle.layerStyleId)
    layerDesignsLayerStyle: Layer_Designs_Layer_Style[]

}