import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn
} from 'typeorm'
import { Layer } from './Layer'
import { Project } from './Project'

@Entity({
    name: `PROJECT_ties_LAYER`
})
export class Project_Ties_Layer extends BaseEntity {

    @PrimaryColumn({
        name: `PROJECT_id`
    })
    projectIdRelation: string

    @PrimaryColumn({
        name: `LAYER_id`
    })
    layerIdRelation: string

    @Column({
        name: `Data`,
        type: `jsonb`,
        nullable: true
    })
    data: JSON

    @ManyToOne(() => Project, (project) => project.projectTiesLayer)
    @JoinColumn({
        name: `PROJECT_id`,
        referencedColumnName: `id`
    })
    projectId: Project

    @ManyToOne(() => Layer, (layer) => layer.projectTiesLayer)
    @JoinColumn({
        name: `LAYER_id`,
        referencedColumnName: `id`
    })
    layerId: Layer

}