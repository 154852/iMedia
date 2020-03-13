import { Table, Column, Model, Unique, AllowNull, Default, HasMany } from "sequelize-typescript";
import * as crypto from "crypto";
import * as bcrypt from "bcryptjs";
import SessionKey from "./sessionkey";
import { HasManyRemoveAssociationMixin, HasManyGetAssociationsMixin } from "sequelize/types";
import * as fs from "fs";
import * as path from "path";

interface PasswordStoreOptions {
    hashRounds: number;
    pepper: string;
}

export interface SignUpOptions {
    username: string;
    password: string;
    email: string;
}

export interface LoginOptions {
    password: string;
    email: string;
}

@Table(null)
export default class User extends Model<User> {
    public static psdOptions: PasswordStoreOptions = {
        hashRounds: 10,
        pepper: JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", "..", "..", "secret.json")).toString()).pepper
    };

    @AllowNull(false)
    @Unique(true)
    @Column(null)
    public username: string;

    @AllowNull(false)
    @Column(null)
    public passwordHash: string;

    @AllowNull(false)
    @Unique(true)
    @Column(null)
    public email: string;

    @AllowNull(false)
    @Default(2)
    @Column(null)
    public permissionLevel: number;
    // 2 = Reader, no permissions
    // 1 = Poster, can post and edit own posts
    // 0 = Admin, can do anything

    @HasMany(() => SessionKey)
    public keys: SessionKey[];

    public removeKey: HasManyRemoveAssociationMixin<SessionKey, SessionKey["id"]>;
    public getKeys: HasManyGetAssociationsMixin<SessionKey>;

    public comparePassword(password: string): Promise<boolean> {
        return bcrypt.compare(User.preparePassword(password), this.passwordHash);
    }

    public createSession(): Promise<SessionKey> {
        return SessionKey.createRandom(this.id).save();
    }

    public static preparePassword(password: string): string {
        return crypto.createHash("sha256").update(password).update(User.psdOptions.pepper).digest().toString("hex");
    }

    public static hashPassword(password: string): Promise<string> {
        return bcrypt.hash(User.preparePassword(password), User.psdOptions.hashRounds);
    }

    public static signUpUser(userOps: SignUpOptions): Promise<[User, SessionKey]> {
        return new Promise<[User, SessionKey]>((resolve, error) => {
            User.hashPassword(userOps.password).then(async (password: string) => {
                try {
                    (await User.create({
                        username: userOps.username,
                        passwordHash: password,
                        email: userOps.email
                    })).save().then((user) => {
                        user.createSession().then((key) => {
                            resolve([user, key]);
                        });
                    }).error(error);
                } catch (exc) {
                    error(exc);
                }
            });
        });
    }

    public static loginUser(options: LoginOptions): Promise<[User, SessionKey]> {
        return new Promise<[User, SessionKey]>((resolve, error) => {
            User.findOne({
                where: {
                    email: options.email
                }
            }).then(async (user) => {
                if (user == null) return resolve([null, null]);
                if (!(await user.comparePassword(options.password))) return resolve([null, null]);

                user.createSession().then((key) => {
                    resolve([user, key]);
                });
            });
        });
    }

    public static getFromKey(key: string): Promise<User> {
        return new Promise<User>((resolve, error) => {
            if (key == null) return resolve(null);

            SessionKey.findOne({
                where: {
                    stringValue: key
                },
                include: [User]
            }).then((key: SessionKey) => {
                return resolve(key == null? null:key.user);
            }).error(error);
        })
    }

    public static logoutUser(key: string): Promise<User> {
        return User.getFromKey(key).then((user) => {
            if (user == null) return null;
            return user.getKeys().then((keys) => {
                const sessionKey: SessionKey = keys.find((k) => k.stringValue == key);
                if (sessionKey == null) return null;
                return SessionKey.destroy({
                    where: { id: sessionKey.id }
                }).thenReturn(user);
            });
        });
    }
}