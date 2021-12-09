import {
  queries as searchQueries,
} from './search'

import { queries as statsQueries } from './stats'

export const resolvers = {
  Query: {
    ...searchQueries,
    ...statsQueries
  },
}
