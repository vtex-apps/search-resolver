/**
 * This code snippet defines an async function called `catalogHandler` that takes in an `EventContext` object and a `next` function as parameters.
 * It handles catalog-related events and performs operations on the `ctx` object.
 *
 * The function first extracts the necessary properties from the `ctx` object, including the logger, catalog, algolia, search clients, and the request body.
 *
 * Inside a try-catch block, the function checks if the `HasStockKeepingUnitModified` and `IdSku` properties exist in the request body.
 * If they do, it retrieves the stock-keeping unit (SKU) information using the `catalog.skuStockKeepingUnitById` method and the product information using the `search.productBySku` method.
 *
 * It then creates an `algoliaBody` object that contains the relevant SKU and product information, including the SKU ID, categories, brand, and various flags.
 * The `searchSlugify` function is used to slugify the category names and brand name before assigning them to the `categoriesSlug` and `brandSlug` properties of `algoliaBody`.
 *
 * Finally, the `algolia.saveObject` method is called to save the `algoliaBody` object to Algolia for further processing.
 *
 * If any error occurs during the process, it is caught in the catch block and logged using the logger.
 *
 * The function then calls the `next` function to proceed with the next middleware in the chain.
 */
import { EventContext } from '@vtex/api'
import { searchSlugify } from '../utils/slug'

export async function catalogHandler(
  ctx: EventContext<any>,
  next: () => Promise<any>
) {
  const {
    vtex: { logger },
    clients: { catalog, algolia, search },
    body,
  } = ctx

  try {
    if (body?.HasStockKeepingUnitModified && body?.IdSku) {
      const sku = await catalog.skuStockKeepingUnitById(body.IdSku)
      const [searchSku] = await search.productBySku(body.IdSku)
      const arrCategories = Object.keys(sku.ProductCategories)
      const algoliaBody = {
        ...searchSku,
        objectID: `${sku.ProductId}_${sku.Id}`,
        categoriesSlug: arrCategories.map(id =>
          searchSlugify(sku.ProductCategories[id])
        ),
        brandSlug: searchSlugify(sku.BrandName),
        isActive: sku.IsActive,
        isInventoried: sku.IsInventoried,
        isBrandActive: sku.IsBrandActive,
      }
      await algolia.saveObject(algoliaBody)
    }
  } catch (err) {
    logger.warn({
      error: 'Algolia Search Resolver Error',
      message: err,
    })
    return
  }

  await next()
}
