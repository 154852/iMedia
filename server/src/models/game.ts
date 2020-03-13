import { Model, Column, AllowNull, Unique, HasMany, Table, getModels } from "sequelize-typescript";
import Review, { ReviewResponse } from "./review";
import { Activity } from "../security";
import { Sequelize } from "sequelize";

export interface GameCreationOptions {
    name: string;
    description: string;
    imageURL: string;
}

export interface GameResponse {
    name: string;
    description: string;
    imageURL: string;
    reviews: ReviewResponse[];
    id: number;
}

@Table({indexes: [{
    fields: ["name", "description"],
    type: "FULLTEXT"
}]})
export default class Game extends Model<Game> {
    public static creationActivity: Activity = new Activity(1);

    @AllowNull(false)
    @Unique(true)
    @Column(null)
    public name: string;

    @AllowNull(false)
    @Column(null)
    public description: string;

    @AllowNull(false)
    @Column(null)
    public imageURL: string;

    @HasMany(() => Review)
    public reviews: Review[];

    public getResponse(maxReviews: number): Promise<GameResponse> {
        return Promise.all(
            this.reviews.sort((a, b) => b.createdAt - a.createdAt).slice(0, maxReviews).map((review) => review.getReturnable())
        ).then((responses) => {
            return {
                name: this.name,
                description: this.description,
                reviews: responses,
                imageURL: this.imageURL,
                id: this.id
            };
        });
    }

    public static createGameFromOptions(options: GameCreationOptions): Promise<Game> | string {
        options.name = options.name.trim();
        options.description = options.description.trim();
        if (options.name.length < 2) return "Game name must be at least two characters in length";
        if (options.description.length < 2) return "Game description must be at least two characters in length";
        
        return Game.create(options);
    }

    public static list(): Promise<GameResponse[]> {
        return Game.findAll({
            where: {},
            include: [Review],
            limit: 10
        }).map((game: Game) => game.getResponse(0)).all();
    }

    public static search(query: string): Promise<GameResponse[]> {
        return Game.findAll({
            where: Sequelize.literal("match(name, description) against (:query)"),
            replacements: { query },
            include: [Review]
        }).map((game: Game) => game.getResponse(0)).all();
    }

    public static details(id: number): Promise<GameResponse> {
        return Game.findOne({
            where: { id },
            include: [Review]
        }).then((game) => {
            if (game == null) return null;
            return game.getResponse(20);
        });
    }
}