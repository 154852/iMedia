import { Model, Column, AllowNull, Unique, Table, ForeignKey, BelongsTo, DataType } from "sequelize-typescript";
import Game from "./game";
import { Activity } from "../security";

export interface ReviewCreationOptions {
    title: string;
    gameID: number;
    body: string;
}

export interface ReviewResponse {
    title: string;
    id: number;
    date: string;
    body: string;
    edited: string;
}

@Table(null)
export default class Review extends Model<Review> {
    public static creationActivity: Activity = new Activity(2);

    @AllowNull(false)
    @Unique(true)
    @Column(null)
    public title: string;

    @AllowNull(false)
    @Column(DataType.STRING(32))
    public body: string;

    @AllowNull(false)
    @ForeignKey(() => Game)
    @Column(null)
    public gameID: number;

    @BelongsTo(() => Game)
    public game: Game;

    public getReturnable(): ReviewResponse {
        return {
            title: this.title,
            id: this.id,
            date: this.createdAt,
            edited: this.updatedAt,
            body: this.body
        };
    }

    public static createReviewFromOptions(options: ReviewCreationOptions): Promise<Review> | string {
        options.title = options.title.trim();
        options.body = options.body.trim();
        
        if (options.title.length < 2) return "Title must be two or more characters long";
        if (options.body.length < 2) return "Body must be two or more characters long";

        return Review.create({
            title: options.title,
            gameID: options.gameID,
            body: options.body
        });
    }

    public static read(id: number): Promise<ReviewResponse> {
        return Review.findOne({
            where: { id },
            include: [Game]
        }).then((review) => {
            return review.getReturnable();
        });
    }
}