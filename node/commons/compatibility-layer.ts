import { distinct } from '../utils/object'
import unescape from 'unescape'
import { Checkout } from '../clients/checkout'
import { groupBy, prop, indexBy, mergeAll } from 'ramda'
import { removeDiacriticsFromURL } from '../utils/string'

export enum IndexingType {
  API = 'API',
  XML = 'XML',
}

interface OrderFormItemBySellerById {
  [skuId: string]: OrderFormItemBySeller
}

interface OrderFormItemBySeller {
  [sellerId: string]: OrderFormItem & { paymentData: PaymentData }
}

export const convertBiggyProduct = async (
  product: BiggySearchProduct,
  checkout: Checkout,
  simulationBehavior: 'skip' | 'default' | null,
  tradePolicy?: string,
  priceTable?: string,
  regionId?: string,
  indexingType?: IndexingType,
) => {
  const categories: string[] = []
  const categoriesIds: string[] = []

  product.categoryTrees?.forEach((categoryTree) => {
    categories.push(`/${categoryTree.categoryNames.join('/')}/`)
    categoriesIds.push(`/${categoryTree.categoryIds.join('/')}/`)
  })

  const skus: SearchItem[] = (product.skus || []).map(
    convertSKU(product, indexingType, tradePolicy)
  )

  const allSpecifications = (product.productSpecifications ?? []).concat(getSKUSpecifications(product))

  const specificationGroups = product.specificationGroups ? JSON.parse(product.specificationGroups) : {}

  const allSpecificationsGroups = [...Object.keys(specificationGroups)]

  const brandId = product.brandId ? Number(product.brandId) : -1

  const selectedProperties = product.split && [
    {
      key: product.split.labelKey,
      value: product.split.labelValue,
    },
  ]

  const convertedProduct: SearchProduct & { cacheId?: string, [key: string]: any } = {
    categories,
    categoriesIds,
    productId: product.id,
    cacheId: `sp-${product.id}`,
    productName: product.name,
    productReference: product.reference || product.product || product.id,
    linkText: product.link,
    brand: product.brand || '',
    brandId,
    link: product.url,
    description: product.description,
    items: skus,
    allSpecifications,
    categoryId: product.categoryIds?.[0],
    productTitle: "",
    metaTagDescription: "",
    clusterHighlights: {},
    productClusters: {},
    searchableClusters: {},
    titleTag: "",
    Specifications: [],
    allSpecificationsGroups,
    itemMetadata: {
      items: []
    },
    selectedProperties,
    // This field is only maintained for backwards compatibility reasons, it shouldn't exist.
    skus: skus.find(sku => sku.sellers && sku.sellers.length > 0),
  }

  if (simulationBehavior === 'default') {
    const payloadItems = getSimulationPayloads(convertedProduct)

    const simulationPayloads: SimulationPayload[] = payloadItems.map((item) => {
      return {
        priceTables: priceTable ? [priceTable] : undefined,
        items: [item],
        shippingData: { logisticsInfo: [{ regionId }] }
      }
    })

    const simulationPromises = simulationPayloads.map((payload) => {
      return checkout.simulation(payload)
    })

    const simulationItems = (await Promise.all(simulationPromises.map(promise => promise.catch(() => undefined)))).filter((x) => x != undefined).map((x) => {
     const orderForm = x as OrderForm

     return orderForm.items.map(item => ({ ...item, paymentData: orderForm.paymentData }))
    }).reduce((acc, val) => acc.concat(val), [])

    const groupedBySkuId = groupBy(prop("id"), simulationItems)

    const orderItemsBySellerById: OrderFormItemBySellerById = mergeAll(Object.entries(groupedBySkuId).map(([id, items]) => {
      const groupedBySeller = indexBy((prop("seller")), items)

      return { [id]: groupedBySeller }
    }))

    convertedProduct.items.map((item) => {
      fillSearchItemWithSimulation(item, orderItemsBySellerById[item.itemId])
    })
  }

  if (product.extraData) {
    product.extraData.forEach(({ key, value }: BiggyProductExtraData) => {
      convertedProduct.allSpecifications?.push(key)
      convertedProduct[key] = [value]
    })
  }

  if (product.textAttributes) {
    allSpecifications.forEach((specification) => {
      const attributes = product.textAttributes.filter((attribute) => attribute.labelKey == specification)
      convertedProduct[specification] = attributes.map((attribute) => {
        return attribute.labelValue
      })
    })

    product.textAttributes.filter((attribute) => attribute.labelKey === "productClusterNames").forEach((attribute) => {
      if (attribute.valueId) {
        convertedProduct.productClusters[attribute.valueId] = attribute.labelValue
      }
    })
  }

  allSpecificationsGroups.forEach((specificationGroup) => {
    convertedProduct[specificationGroup] = specificationGroups[specificationGroup]
  })

  return convertedProduct
}

const fillSearchItemWithSimulation = (searchItem: SearchItem, orderFormItems: OrderFormItemBySeller) => {
  if (orderFormItems) {
    searchItem.sellers.forEach((seller) => {
      const orderFormItem = orderFormItems[seller.sellerId]

      if (orderFormItem == null) {
        console.warn(`Product ${searchItem.itemId} is unavailable for seller ${seller.sellerId}`)
        return
      }

      seller.commertialOffer.AvailableQuantity = orderFormItem?.availability === 'withoutPriceFulfillment' ? 0 : seller.commertialOffer.AvailableQuantity
      seller.commertialOffer.Price = orderFormItem.sellingPrice ? orderFormItem.sellingPrice / 100 : orderFormItem.price / 100
      seller.commertialOffer.PriceValidUntil = orderFormItem.priceValidUntil
      seller.commertialOffer.ListPrice = orderFormItem.listPrice / 100

      const installmentOptions = orderFormItem?.paymentData?.installmentOptions || []

      const [installmentOption] = installmentOptions

      if (!installmentOption) {
        return
      }

      const { installments } = installmentOption
      const correctInstallment = installments.reduce((previous, current) => {
        if (previous.hasInterestRate && !current.hasInterestRate) {
          return current
        }

        if ((previous.hasInterestRate === current.hasInterestRate) && current.count > previous.count) {
          return current
        }

        return previous
      })

      seller.commertialOffer.Installments = [{
        Value: correctInstallment.value / 100,
        InterestRate: correctInstallment.interestRate,
        TotalValuePlusInterestRate: correctInstallment.total / 100,
        NumberOfInstallments: correctInstallment.count,
        Name: '',
        PaymentSystemName: '',
        PaymentSystemGroupName: '',
      }]
    })
  }

  return searchItem
}

const getSimulationPayloads = (product: SearchProduct) => {
  return product.items.map((item) => {
    return item.sellers.map((seller) => {
      return {
        id: item.itemId,
        quantity: 1,
        seller: seller.sellerId
      } as PayloadItem
    })
  }).reduce((acc, val) => acc.concat(val), []).filter(distinct)
}

const getVariations = (sku: BiggySearchSKU): string[] => {
  return sku.attributes.map((attribute) => attribute.key)
}

const getSKUSpecifications = (product: BiggySearchProduct): string[] => {
  return product.skus.map((sku) => sku.attributes.map((attribute) => attribute.key)).reduce((acc, val) => acc.concat(val), []).filter(distinct)
}

const buildCommertialOffer = (
  price: number,
  oldPrice: number,
  installment?: BiggyInstallment,
  tax?: number,
): CommertialOffer => {
  const installments: SearchInstallment[] = installment ? [{
    Value: installment.value,
    InterestRate: 0,
    TotalValuePlusInterestRate: price,
    NumberOfInstallments: installment.count,
    Name: '',
    PaymentSystemName: '',
    PaymentSystemGroupName: '',
  }] : [];

  return {
    DeliverySlaSamplesPerRegion: {},
    DeliverySlaSamples: [],
    AvailableQuantity: 10000,
    DiscountHighLight: [],
    Teasers: [],
    Installments: installments,
    Price: price,
    ListPrice: oldPrice,
    PriceWithoutDiscount: price,
    Tax: tax || 0,
    GiftSkuIds: [],
    BuyTogether: [],
    ItemMetadataAttachment: [],
    RewardValue: 0,
    PriceValidUntil: '',
    GetInfoErrorMessage: null,
    CacheVersionUsedToCallCheckout: '',
  }
}

const getSellersIndexedByApi = (
  product: BiggySearchProduct,
  sku: BiggySearchSKU,
  tradePolicy?: string
): Seller[] => {
  const selectedPolicy = tradePolicy
    ? sku.policies.find((policy: BiggyPolicy) => policy.id === tradePolicy)
    : sku.policies[0]

  const biggySellers = (selectedPolicy && selectedPolicy.sellers) || []

  return biggySellers.map((seller: BiggySeller): Seller => {
    const price = seller.price || sku.price || product.price
    const oldPrice = seller.oldPrice || sku.oldPrice || product.oldPrice
    const installment = seller.installment || product.installment
    const commertialOffer = buildCommertialOffer(price, oldPrice, installment, seller.tax)

    return {
      sellerId: seller.id,
      sellerName: seller.name,
      addToCartLink: "",
      sellerDefault: false,
      commertialOffer,
    }
  })
}

const getSellersIndexedByXML = (product: BiggySearchProduct): Seller[] => {
  const price = product.price
  const oldPrice = product.oldPrice
  const installment = product.installment
  const commertialOffer = buildCommertialOffer(price, oldPrice, installment, product.tax)

  return [{
    sellerId: '1',
    sellerName: '',
    addToCartLink: "",
    sellerDefault: false,
    commertialOffer,
  }]
}

const getImageId = (imageUrl: string) => {
  const baseUrlRegex = new RegExp(/.+ids\/(\d+)/)
  return baseUrlRegex.test(imageUrl)
    ? baseUrlRegex.exec(imageUrl)![1]
    : undefined
}

const elasticImageToSearchImage = (image: ElasticImage, imageId: string): SearchImage => {
  return {
    imageId,
    imageTag: "",
    imageLabel: image.name,
    imageText: image.name,
    imageUrl: image.value,
  }
}

const convertImages = (images: ElasticImage[], indexingType?: IndexingType) => {
  const vtexImages: SearchImage[] = []

  if (indexingType && indexingType === IndexingType.XML) {
    const selectedImage: ElasticImage = images[0]
    const imageId = getImageId(selectedImage.value)

    return imageId ? [elasticImageToSearchImage(selectedImage, imageId)] : []
  }

  images.forEach(image => {
    const imageId = getImageId(image.value)
    imageId ? vtexImages.push(elasticImageToSearchImage(image, imageId)) : []
  })

  return vtexImages
}

const convertSKU = (
  product: BiggySearchProduct,
  indexingType?: IndexingType,
  tradePolicy?: string
) => (sku: BiggySearchSKU): SearchItem & { [key: string]: any } => {
  const images = convertImages(product.images, indexingType)

  const sellers =
    indexingType === IndexingType.XML
      ? getSellersIndexedByXML(product)
      : getSellersIndexedByApi(product, sku, tradePolicy)

  const variations = getVariations(sku)

  const item: SearchItem & { [key: string]: any } = {
    sellers,
    images,
    itemId: sku.id,
    name: product.name,
    nameComplete: product.name,
    complementName: product.name,
    referenceId: [
      {
        Key: 'RefId',
        Value: sku.reference,
      },
    ],
    measurementUnit: sku.measurementUnit || product.measurementUnit,
    unitMultiplier: sku.unitMultiplier || product.unitMultiplier,
    variations,
    ean: '',
    modalType: '',
    Videos: [],
    attachments: [],
    isKit: false,
  }

  variations.forEach((variation) => {
    const attribute = sku.attributes.find((attribute) => attribute.key == variation)
    item[variation] = attribute != null ? [attribute.value] : []
  })

  return item
}

/**
 * Convert from VTEX OrderBy into Biggy's sort.
 *
 * @export
 * @param {OrderBy} orderBy VTEX OrderBy.
 * @returns {string} Biggy's sort.
 */
export const convertOrderBy = (orderBy?: string): string => {
  switch (orderBy) {
    case 'OrderByPriceDESC':
      return 'price:desc'
    case 'OrderByPriceASC':
      return 'price:asc'
    case 'OrderByTopSaleDESC':
      return 'orders:desc'
    case 'OrderByReviewRateDESC':
      return '' // TODO: Not Supported
    case 'OrderByNameDESC':
      return 'name:desc'
    case 'OrderByNameASC':
      return 'name:asc'
    case 'OrderByReleaseDateDESC':
      return 'release:desc'
    case 'OrderByBestDiscountDESC':
      return 'discount:desc'
    case 'OrderByScoreDESC':
      return ''
    default:
      return orderBy || ''
  }
}

export const buildBreadcrumb = (
  attributes: ElasticAttribute[],
  fullText: string,
  selectedFacets: SelectedFacet[]
) => {
  const pivotValue: string[] = []
  const pivotMap: string[] = []

  const breadcrumb: Breadcrumb[] = []

  if (fullText) {
    pivotValue.push(fullText)
    pivotMap.push('ft')

    breadcrumb.push({
      name: fullText,
      href: `/${pivotValue.join('/')}?map=${pivotMap.join(',')}`,
    })
  }

  const activeAttributes = attributes.filter(attribute => attribute.active)
  const activeValues: (ElasticAttributeValue & {
    visible: boolean
    attributeKey: string
  })[] = []

  activeAttributes.forEach(attribute => {
    attribute.values.forEach(value => {
      if (value.active) {
        activeValues.push({
          ...value,
          visible: attribute.visible,
          attributeKey: attribute.key,
        })
      }
    })
  })

  const selectedFacetsValues = selectedFacets.map(
    selectedFacet => selectedFacet.value
  )
  activeValues.sort((a, b) =>
    selectedFacetsValues.indexOf(a.key) < selectedFacetsValues.indexOf(b.key)
      ? -1
      : 1
  )

  activeValues.forEach(value => {
    pivotValue.push(value.key)
    pivotMap.push(value.attributeKey)

    if (value.attributeKey === "productClusterIds") {
      const clusterName = attributes
        .find(attribute => attribute.key === "productclusternames")
        ?.values
        .find(attrValue => attrValue.id === value.key)
        ?.label

      if (clusterName) {
        breadcrumb.push({
          name: unescape(clusterName),
          href: `/${pivotValue.join('/')}?map=${pivotMap.join(',')}`,
        })
      }

      return
    }

    if (!value.visible) {
      return
    }

    breadcrumb.push({
      name: unescape(value.label),
      href: `/${pivotValue.join('/')}?map=${pivotMap.join(',')}`,
    })
  })

  return breadcrumb
}

export const buildAttributePath = (selectedFacets: SelectedFacet[]) => {
  return selectedFacets
    ? selectedFacets.reduce((attributePath, facet) => {
      if (facet.key === 'priceRange') {
        facet.key = 'price'
        facet.value = facet.value.replace(` TO `, ':')
      }

      return facet.key !== 'ft'
        ? `${attributePath}${facet.key}/${removeDiacriticsFromURL(facet.value).replace(/ |%20/, '-')}/`
        : attributePath
    }, '')
    : ''
}
