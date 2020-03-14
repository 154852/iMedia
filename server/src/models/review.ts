import { Model, Column, AllowNull, Unique, Table, ForeignKey, BelongsTo, DataType } from "sequelize-typescript";
import Game from "./game";
import { Activity } from "../security";
import User from "./user";

export interface ReviewCreationOptions {
    title: string;
    gameID: number;
    body: string;
    user: User;
}

export interface ReviewResponse {
    title: string;
    id: number;
    date: string;
    body: string;
    edited: string;
    username: string;
}

@Table(null)
export default class Review extends Model<Review> {
    public static creationActivity: Activity = new Activity(2);

    @AllowNull(false)
    @Unique(true)
    @Column({
       type: DataType.STRING(255)
    })
    public title: string;

    @AllowNull(false)
    @Column(DataType.STRING(255))
    public body: string;

    @AllowNull(false)
    @ForeignKey(() => Game)
    @Column(null)
    public gameID: number;

    @BelongsTo(() => Game)
    public game: Game;

    @AllowNull(false)
    @ForeignKey(() => User)
    @Column(null)
    public userID: number;

    @BelongsTo(() => Game)
    public user: User;

    public getReturnable(): Promise<ReviewResponse> {
        return User.findOne({where: {id: this.userID}}).then((user) => {
            return {
                title: this.title,
                id: this.id,
                date: this.createdAt,
                edited: this.updatedAt,
                body: this.body,
                username: user.username
            };
        })
    }

    public static createReviewFromOptions(options: ReviewCreationOptions): Promise<Review> | string {
        options.title = options.title.trim();
        options.body = options.body.trim();
        
        if (options.title.length < 2) return "Title must be two or more characters long";
        if (options.body.length < 2) return "Body must be two or more characters long";

        return Review.create({
            title: options.title,
            gameID: options.gameID,
            body: options.body,
            userID: options.user.id
        });
    }
}