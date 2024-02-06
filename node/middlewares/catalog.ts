/* eslint-disable no-console */
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
    console.log('Broadcaster => ', body)
    if (body?.HasStockKeepingUnitModified && body?.IdSku) {
      const sku = await catalog.skuStockKeepingUnitById(body.IdSku)
      const [searchSku] = await search.productBySku(body.IdSku)
      // console.log('SKU => ', sku)
      // console.log('searchSku => ', searchSku)
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
      const algoliaResponse = await algolia.saveObject(algoliaBody)

      // console.log('algoliaBody => ', algoliaBody)
      console.log('algoliaResponse => ', algoliaResponse)
    }
  } catch (err) {
    console.log('Error =>', err)
    logger.warn({
      error: 'Algolia Search Resolver Error',
      message: err,
    })

    return
  }

  await next()
}
