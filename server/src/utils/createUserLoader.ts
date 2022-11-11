import DataLoader from "dataloader";
import { User } from "../entities/User";

export const createUserLoader = () => new DataLoader<number, User>( async (keys) => {
    const users = await User.findByIds(keys as number[]);
    const userIdToUser: Record<number, User> = {};
    users.forEach(u => {
        userIdToUser[u.id] = u;
    });

    return keys.map((userId) => userIdToUser[userId]);
});