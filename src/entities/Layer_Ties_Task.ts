import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn
} from 'typeorm'
import { Layer } from './Layer'
import { Task } from './Task'

@Entity({
    name: `LAYER_ties_TASK`
})
export class Layer_Ties_Task extends BaseEntity {

    @PrimaryColumn({
        name: `LAYER_id`
    })
    layerIdRelation: string

    @PrimaryColumn({
        name: `TASK_id`
    })
    taskIdRelation: string

    @Column({
        name: `Data`,
        type: `jsonb`
    })
    data: JSON

    @ManyToOne(() => Layer, (layer) => layer.layerTiesTask)
    @JoinColumn({
        name: `LAYER_id`,
        referencedColumnName: `id`
    })
    layerId: Layer

    @ManyToOne(() => Task, (task) => task.layerTiesTask)
    @JoinColumn({
        name: `TASK_id`,
        referencedColumnName: `id`
    })
    taskId: Task

}