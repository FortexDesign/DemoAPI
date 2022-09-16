import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn
} from 'typeorm'
import { Person } from './Person'
import { Project } from './Project'

@Entity({
    name: `PROJECT_COMMENT`
})
export class Project_Comment extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({
        name: `Description`,
        type: `text`
    })
    description: string

    @Column({
        name: `Date`,
        length: 30
    })
    date: string

    @ManyToOne(() => Project, (project) => project.projectCommentsIds)
    @JoinColumn({
        name: `PROJECT_id`,
        referencedColumnName: `id`
    })
    projectId: Project

    @ManyToOne(() => Person, (person) => person.projectCommentsIds)
    @JoinColumn({
        name: `PERSON_id`,
        referencedColumnName: `id`
    })
    personId: Person

    @ManyToOne(() => Project_Comment, (parentProjectComment) => parentProjectComment.subProjectCommentsIds)
    @JoinColumn({
        name: `PROJECT_COMMENT_id`,
        referencedColumnName: `id`
    })
    projectCommentId: Project_Comment

    @OneToMany(() => Project_Comment, (subProjectComment) => subProjectComment.projectCommentId)
    subProjectCommentsIds: Project_Comment[]
    
}