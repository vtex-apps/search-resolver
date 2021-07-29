const BUCKET = 'workspace-search-params'
const MASTER = 'master'

function disableCache(ctx: Context) {
    ctx.set('Cache-control', 'no-cache,no-store')
}

export async function getWorkspaceSearchParamsFromStorage(ctx: Context) {   
    const masterParams = await ctx.clients.vbase.getJSON<object>(BUCKET, MASTER, true)
    if (ctx.vtex.workspace == MASTER) return masterParams
    const filePath = ctx.vtex.workspace
    const params = await ctx.clients.vbase.getJSON<object>(BUCKET, filePath, true)
    // Logic: workspaces inherit params from master, and can override as desired
    return {
        ...masterParams,
        ...params
    }
}

export async function getWorkspaceSearchParams(ctx: Context, next: () => Promise<object>) {
    const data = await getWorkspaceSearchParamsFromStorage(ctx)
    disableCache(ctx)
    ctx.body = data
    ctx.status = 200
    await next()
}

export async function setWorkspaceSearchParams(ctx: Context, next: () => Promise<object>) {
    const filePath = ctx.vtex.workspace
    await ctx.clients.vbase.saveJSON<object>(BUCKET, filePath, ctx.query)
    disableCache(ctx)
    ctx.body = ctx.query
    ctx.status = 200
    await next()
}
