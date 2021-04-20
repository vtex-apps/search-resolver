import { fieldResolvers as benefitsFieldResolvers } from './benefits'
import {
  fieldResolvers as searchFieldResolvers,
  queries as searchQueries,
} from './search'
import { queries as statsQueries } from './stats'

export const resolvers = {
  ...searchFieldResolvers,
  ...benefitsFieldResolvers,
  Query: {
    ...searchQueries,
    ...statsQueries
  },
}
