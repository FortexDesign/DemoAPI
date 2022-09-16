import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn
} from 'typeorm'
import { Geom_Type } from './Geom_Type'
import { Layer_Data } from './Layer_Data'
import { Layer_Designs_Layer_Style } from './Layer_Designs_Layer_Style'
import { Layer_Ties_Task } from './Layer_Ties_Task'
import { Project_Ties_Layer } from './Project_Ties_Layer'
import { Workspace } from './Workspace'

@Entity({
    name: `LAYER`
})
export class Layer extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({
        name: `Name`,
        length: 30
    })
    name: string

    @ManyToOne(() => Layer_Data, (layerData) => layerData.layersIds)
    @JoinColumn({
        name: `LAYER_DATA_id`,
        referencedColumnName: `id`
    })
    layerDataId: Layer_Data

    @ManyToOne(() => Geom_Type, (geomType) => geomType.layersIds)
    @JoinColumn({
        name: `GEOM_TYPE_id`,
        referencedColumnName: `id`
    })
    geomTypeId: Geom_Type

    @ManyToOne(() => Workspace, (workspace) => workspace.layersIds)
    @JoinColumn({
        name: `WORKSPACE_id`,
        referencedColumnName: `id`
    })
    workspaceId: Workspace

    @OneToMany(() => Layer_Designs_Layer_Style, (layerDesignsLayerStyle) => layerDesignsLayerStyle.layerId)
    layerDesignsLayerStyle: Layer_Designs_Layer_Style[]

    @OneToMany(() => Project_Ties_Layer, (projectTiesLayer) => projectTiesLayer.layerId)
    projectTiesLayer: Project_Ties_Layer[]

    @OneToMany(() => Layer_Ties_Task, (layerTiesTask) => layerTiesTask.layerId)
    layerTiesTask: Layer_Ties_Task[]
    
}