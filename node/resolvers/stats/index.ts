export type SORT = 'ASC' | 'DESC'

// searchURLsCount is now a no-op (VBase removal, TIS-902) — kept only because the
// `searchURLsCount` field is still declared in vtex.search-graphql's schema. Don't
// delete this resolver without first removing the field from that schema and
// confirming no consumer still queries it.
export const queries = {
  searchURLsCount: async (
    _: any,
    _args: { limit: number; sort?: SORT },
    _ctx: Context
  ) => {
    return []
  },
}
