import { UsernamePasswordInput } from "./UsernamePasswordInput";

export const validateRegister = (options: UsernamePasswordInput) => {
    if (!options.email.includes("@")) {
        return [{
            field: "email",
            message: "invalid email",
        }];
    };

    if (options.username.length <= 3) {
        return [{
            field: "username",
            message: "lenght must be greater than 3",
        }];
    };

    if (options.username.includes("@")) {
        return [{
            field: "username",
            message: "cannot include @",
        }];
    };

    if (options.password.length <= 8) {
        return [{
            field: "password",
            message: "lenght must be greater than 8",
        }];
    };

    return null;
}