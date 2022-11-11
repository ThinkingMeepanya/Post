import { usePostQuery } from "../generated/graphql";
import { useGetIntId } from "./useGetIntId";

export const useGetPostFromUrl = () => {

    const id = useGetIntId();

    return usePostQuery({
        skip: id === -1,
        variables: {
            id
        },
    });
}