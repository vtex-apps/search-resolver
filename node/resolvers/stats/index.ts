export type SORT = 'ASC' | 'DESC'

export const queries = {
  searchURLsCount: async (
    _: any,
    _args: { limit: number; sort?: SORT },
    _ctx: Context
  ) => {
    return []
  },
}
