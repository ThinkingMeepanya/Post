import { EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { Box, Flex, IconButton, Link } from '@chakra-ui/react';
import React from 'react';
import NextLink from "next/link";
import { useMeQuery, useDeletePostMutation } from '../generated/graphql';

interface IEditDeletePostButtonsProps{
    id: number,
    creatorId: number,
}

export const EditDeletePostButtons: React.FC<IEditDeletePostButtonsProps> = ({ id, creatorId }) => {

    const { data: meData } = useMeQuery();
    const [deletePost] = useDeletePostMutation();

    if (meData?.me?.id !== creatorId) {
        return null;
    }

    return (
        <Box>
            <NextLink href="/post/edit/[id]" as={`/post/edit/${id}`}>
                <IconButton as={Link} mr={4} icon={<EditIcon/>} aria-label="Edit Post"/>
            </NextLink>
            
            <Flex align="center">
                <IconButton variantcolor="red" icon={<DeleteIcon/>} aria-label="Delete Post" onClick={ async () => {
                    await deletePost({
                        variables: { id },
                        update: (cache: any) => {
                            cache.evict({ id: "Post:" + id});
                        }
                    });
                }}/>
            </Flex>
        </Box>
    );
}