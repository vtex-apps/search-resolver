export const productInventory = async (
    _: any,
    args: { sku: string; account: string },
    ctx: Context
) => {
    return ctx.clients.inventory.getProductInventoryByAccount(
        args.sku,
        args.account
    )
}