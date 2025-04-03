import {mergeTypeDefs} from "@graphql-tools/merge"

import { usersGQLSchema } from "./user.schema.js"
// import { productsGQLSchema } from "./products"

export const mergedGQLSchema = mergeTypeDefs([usersGQLSchema])