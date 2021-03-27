export interface IProductInventoryByAccount extends IProductInventory {
    account: string
}
export interface IProductInventory {
    skuId: string
    balance: IBalance[]
}
export interface IBalance {
    warehouseId: string
    warehouseName: string
    totalQuantity: number
    reservedQuantity: number
    hasUnlimitedQuantity: boolean
    timeToRefill: string | null
    dateOfSupplyUtc: string | null
}
export interface IProductInventoryUpdate {
    account: string
    skuId: string
    warehouseId: string
    unlimitedQuantity: boolean
    quantity: number
}