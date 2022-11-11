import { Box, Button } from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import { NextPage } from 'next';
import React, { useState } from 'react';
import { InputField } from '../../components/InputField';
import { Wrapper } from '../../components/Wrapper';
import { toErrorMap } from '../../utils/toErrorMap';
import { MeDocument, MeQuery, useChangePasswordMutation } from "../../generated/graphql";
import { useRouter } from 'next/router';
import { withApollo } from '../../utils/withApollo';

export const ChangePassword: NextPage = () => {
    const router = useRouter();
    const [changePassword] = useChangePasswordMutation();
    const [tokenError, setTokenError] = useState("");

        return (
    <Wrapper variant="small">
        <Formik 
            initialValues={{newPassword: ""}}
            onSubmit={async (values, {setErrors}) => {
                const response = await changePassword({
                    variables: {
                        newPassword: values.newPassword,
                        token: typeof router.query.token === "string" ? router.query.token : "",
                    },
                    update: (cache, {data}) => {
                        cache.writeQuery<MeQuery>({
                            query: MeDocument,
                            data: {
                                __typename: "Query",
                                me: data?.changePassword.user,
                            },
                        })
                        cache.evict({ fieldName: "posts:{}"});
                    },
                });
                if (response.data?.changePassword.errors) {
                    const errorMap: any = setErrors(toErrorMap(response.data.changePassword.errors));
                    if ("token" in errorMap) {
                        setTokenError(errorMap.token);
                    } else {
                        setErrors(errorMap);
                    }
                } else if (response.data?.changePassword.user) {
                    router.push("/");
                }
            }}>
            {({isSubmitting}) => (
                <Form>
                    <InputField
                    name="newPassword" 
                    placeholder="new password"
                    label="New Password"
                    type="password">
                    </InputField>

                    {tokenError ? <Box color="red">{tokenError}</Box> : null};

                    <Button
                        mt={4}
                        colorScheme="teal"
                        isLoading={isSubmitting}
                        type="submit"
                    > ChangePassword
                    </Button>
                </Form>
            )}
        </Formik>
    </Wrapper>);
};

export default withApollo({ssr: false})(ChangePassword);