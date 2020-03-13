import { Table, Model, AllowNull, Unique, Column, ForeignKey, BelongsTo } from "sequelize-typescript";
import * as crypto from "crypto";
import User from "./user";

@Table(null)
export default class SessionKey extends Model<SessionKey> {
    @AllowNull(false)
    @Unique(true)
    @Column(null)
    public stringValue: string;

    @ForeignKey(() => User)
    @Column(null)
    public userID: number;

    @BelongsTo(() => User)
    public user: User;

    public static createRandom(userID: number): SessionKey {
        return new SessionKey({
            stringValue: crypto.randomBytes(32).toString("hex"),
            userID: userID
        });
    }
}