import { Model, Column, AllowNull, Unique, HasMany, Table, getModels, DataType } from "sequelize-typescript";
import Review, { ReviewResponse } from "./review";
import { Activity } from "../security";
import { Sequelize } from "sequelize";
import * as FuzzySearch from "fuzzy-search";
import User from "./user";
import * as fs from "fs";
import * as https from "https";
import * as path from "path";
import * as jimp from"jimp";
import {Transform} from "stream";

export interface GameCreationOptions {
    name: string;
    description: string;
    images: string[];
    rating: number;

}

export interface GamePreviewResponse {
    name: string;
    logoImage: string;
    id: number;
}

export interface GameResponse {
    name: string;
    description: string;
    images: string[];
    rating: number;
    reviews: ReviewResponse[];
    id: number;
}

@Table(null)
export default class Game extends Model<Game> {
    public static creationActivity: Activity = new Activity(1);

    @AllowNull(false)
    @Unique(true)
    @Column(null)
    public name: string;

    @AllowNull(false)
    @Column({
       type: DataType.STRING(255) 
    })
    public description: string;

    @AllowNull(false)
    @Column(null)
    public rating: number;

    @AllowNull(false)
    @Column({
       type: DataType.STRING(255) 
    })
    public logoImage: string;

    @AllowNull(false)
    @Column({
       type: DataType.STRING(255) 
    })
    public image1: string;
    @AllowNull(false)
    @Column({
       type: DataType.STRING(255) 
    })
    public image2: string;
    @AllowNull(false)
    @Column({
       type: DataType.STRING(255) 
    })
    public image3: string;

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
                images: [this.logoImage, this.image1, this.image2, this.image3],
                rating: this.rating,
                id: this.id
            };
        });
    }

    public getPreview(): GamePreviewResponse {
        return {
            name: this.name,
            logoImage: this.logoImage,
            id: this.id
        };
    }

    public static createGameFromOptions(options: GameCreationOptions, imageStore: string, imageStorePublic: string): Promise<Game> | string {
        options.name = options.name.trim();
        options.description = options.description.trim();
        if (options.name.length < 2) return "Game name must be at least two characters in length";
        if (options.description.length < 2) return "Game description must be at least two characters in length";

        options.images.forEach(async (uri, idx) => {
            https.get(uri, (response) => {
                const stream: Transform = new Transform();
                response.on("data", (chunk) => stream.push(chunk));
                response.on("close", () => {
                    jimp.read(stream.read() as Buffer).then((image) => {
                        let imSize: number = idx == 0? 700:256;
                        image.resize(imSize, image.getHeight() * (imSize / image.getWidth())).write(path.join(imageStore, options.name + "-" + idx + ".jpg"));
                    });
                })
            });
        });
        
        return Game.create({
            name: options.name,
            description: options.description,
            logoImage: path.join(imageStorePublic, options.name + "-0.jpg"),
            image1: path.join(imageStorePublic, options.name + "-1.jpg"),
            image2: path.join(imageStorePublic, options.name + "-2.jpg"),
            image3: path.join(imageStorePublic, options.name + "-3.jpg"),
            rating: options.rating
        });
    }

    public static list(): Promise<GamePreviewResponse[]> {
        return Game.findAll({
            where: {},
            limit: 10
        }).map((game: Game) => game.getPreview()).all();
    }

    public static search(query: string): Promise<GamePreviewResponse[]> {
        return Game.findAll({
            where: {}
        }).map((game: Game) => game.getPreview()).all().then((games) => {
            return new FuzzySearch(games, ["name", "description"], {sort: true}).search(query).slice(0, 100);
        });
    }

    public static details(id: number): Promise<GameResponse> {
        return Game.findOne({
            where: { id },
            include: [Review]
        }).then((game) => {
            if (game == null) return null;
            return game.getResponse(30);
        });
    }
}