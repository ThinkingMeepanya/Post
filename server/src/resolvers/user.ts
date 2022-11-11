import { User } from "../entities/User";
import { MyContext } from "src/types";
import {Resolver, Mutation, Arg, Field, Ctx, ObjectType, Query, FieldResolver, Root} from "type-graphql";
import argon2 from "argon2";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { UsernamePasswordInput } from "../utils/UsernamePasswordInput";
import { validateRegister } from "../utils/validateRegister";
import { sendEmail } from "../utils/sendEmail";
import {v4} from "uuid";
import { getConnection } from "typeorm";

@ObjectType()
class FieldError {
    @Field()
    field: string;
    @Field()
    message: string;
}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], {nullable: true})
    errors?: FieldError[];

    @Field(() => User, {nullable: true})
    user?: User;
}

@Resolver(User)
export class UserResolver{
    
    @FieldResolver(() => String)
    email(@Root() user: User, 
        @Ctx() {req}: MyContext) {
            if (req.session.userId === user.id) {
                return user.email;
            }
            return ""; 
        }

    @Mutation(() => UserResponse)
    async changePassword(
        @Arg("token") token: string,
        @Arg("newPassword") newPassword: string,
        @Ctx() {redis, req}: MyContext
    ): Promise<UserResponse> {
        if (newPassword.length <= 8) {
            return { 
                errors: [ 
                    {
                        field: "newPassword",
                        message: "lenght must be greater than 8",
                    },
                ],
            };
        }

        const key = FORGET_PASSWORD_PREFIX+token;
        const userId = await redis.get(key);
        if (!userId) {
            return {
                errors: [ 
                    {
                        field: "token",
                        message: "token expired",
                    },
                ],
            };
        }

        const userIdNum = parseInt(userId);
        const user = await User.findOne(userIdNum);

        if (!user) {
            return {
                errors: [ 
                    {
                        field: "token",
                        message: "user no longer exists",
                    },
                ],
            };
        }

        user.password = await argon2.hash(newPassword);
        user.updatedAt;
        await User.update({id: userIdNum }, {
            password: await argon2.hash(newPassword),
        })

        await redis.del(key);

        req.session.userId = user.id

        return {user};
    }

    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg("email") email: string,
        @Ctx() {redis}: MyContext
    ) { 
        const user = await User.findOne({where: {email}});
        if (!user) {
            return true;
        }
        const token = v4();
        await redis.set(FORGET_PASSWORD_PREFIX + token, user.id, 'ex', 1000 * 60 * 60 * 24 * 3); // 3 days
        await sendEmail(email,`<a href="http://localhost:3000/${token}">reset password</a>`);
        return true;
    }

    @Query(() => [User])
    users(
    ): Promise<User[]> {
        return User.find({});
    }

    @Query(() => User, {nullable: true})
    async me(
        @Ctx() {req}: MyContext
    ) {
        console.log("session: ", req.session);
        // you are not logged in.
        if (!req.session.userId) {
            return null
        }

        return User.findOne(req.session.userId);
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg("options") options: UsernamePasswordInput,
    ): Promise<UserResponse> {
        const errors = validateRegister(options);
        if(errors) {
            return {errors};
        }
        
        const hashedPassword = await argon2.hash(options.password); 
        let user;
        try {
            const result = await getConnection()
            .createQueryBuilder()
            .insert()
            .into(User)
            .values({
                username: options.username,
                email: options.email,
                password: hashedPassword,
            })
            .returning("*")
            .execute();
            console.log("result: ", result);
            user = result.raw[0];
        } catch (err) {
            console.log("err: ", err);            
            // if (err.code === "23505" || err.detail.includes("already exists")) {
            //     return {
            //         errors: [{
            //             field: "username",
            //             message: "username has already taken.",
            //         }],
            //     };
            // };
        }
        return { user };
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("usernameOrEmail") usernameOrEmail: string,
        @Arg("password") password: string,
        @Ctx() {req}: MyContext
    ): Promise<UserResponse> {
        const user = await User.findOne(usernameOrEmail.includes("@") 
        ? {where: { email: usernameOrEmail}}
        : { where: {username: usernameOrEmail}}
        );
        if(!user) {
            return {
                errors: [{
                    field: "usernameOrEmail",
                    message: "that username doesn't exist",
                }],
            };
        }

        const valid = await argon2.verify(user.password, password);
        if (!valid) {
            return {
                errors: [{
                    field: "username",
                    message: "incorrect passwod",
                }],
            }
        }
        
        //store user id session
        req.session.userId = user.id;

        return {
            user,
        };
    }

    @Mutation(() => Boolean)
    logout(
        @Ctx() {req, res}: MyContext) {
        return new Promise ((resolve) => req.session.destroy((err:any) => {
            res.clearCookie(COOKIE_NAME);
            if (err) {
                console.log(err);
                resolve(false);
            } 
            
            resolve(true);
        }));
    }
}