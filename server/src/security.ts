import User from "./models/user";
import SessionKey from "./models/sessionkey";

interface UserInfo {
    key: string;
}

export class Activity {
    public requiredPermission: number;
    // 3 = Not logged in
    // 2 = Reader, no permissions
    // 1 = Poster, can post and edit own posts
    // 0 = Admin, can do anything

    public constructor(permission: number = 0) {
        this.requiredPermission = permission;
    }

    public doesAllowUserInfo(info: UserInfo): Promise<boolean> {
        if (this.requiredPermission >= 3 && info.key == null) return new Promise<boolean>((resolve) => resolve(true));

        return new Promise<boolean>((resolve, error) => {
            User.getFromKey(info.key).then((user) => {
                if (user == null) return error("Session key does not exist");
                if (this.requiredPermission >= user.permissionLevel) return resolve(true);
                return resolve(false);
            });
        });
    }

    public doesAllowUserInfoWithUserReturn(info: UserInfo): Promise<[boolean, User]> {
        if (this.requiredPermission >= 3 && info.key == null) return new Promise<[boolean, User]>((resolve) => resolve([true, null]));

        return new Promise<[boolean, User]>((resolve, error) => {
            User.getFromKey(info.key).then((user) => {
                if (user == null) return error("Session key does not exist");
                if (this.requiredPermission >= user.permissionLevel) return resolve([true, user]);
                return resolve([false, user]);
            });
        });
    }
}