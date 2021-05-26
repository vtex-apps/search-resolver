import { distinct } from '../utils/object'
import unescape from 'unescape'
import { Checkout } from '../clients/checkout'
import { groupBy, prop, indexBy, mergeAll } from 'ramda'
import { removeDiacriticsFromURL } from '../utils/string'

const ALLOWED_TEASER_TYPES = ["Catalog", "Profiler", "ConditionalPrice"]

export enum IndexingType {
  API = 'API',
  XML = 'XML',
}

interface OrderFormItemBySellerById {
  [skuId: string]: OrderFormItemBySeller
}

interface OrderFormItemBySeller {
  [sellerId: string]: OrderFormItem & { paymentData: PaymentData, ratesAndBenefitsData: RatesAndBenefitsData }
}

export const convertBiggyProduct = async (
  product: BiggySearchProduct,
  checkout: Checkout,
  simulationBehavior: 'skip' | 'default' | null,
  segment?: SegmentData,
  tradePolicy?: string,
  regionId?: string | null,
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

  const specificationGroups = product.specificationGroups ? JSON.parse(product.specificationGroups) : {}

  const allSpecificationsGroups = [...Object.keys(specificationGroups)]

  const brandId = product.brandId ? Number(product.brandId) : -1

  const selectedProperties = product.split && [
    {
      key: product.split.labelKey,
      value: product.split.labelValue,
    },
  ]

  const specificationAttributes = product.textAttributes?.filter(attribute => attribute.isSku) ?? []

  const allSpecifications = specificationAttributes.map(specification => specification.labelKey)

  const specificationsByKey = specificationAttributes.reduce((specsByKey: {[key: string]: BiggyTextAttribute[]}, spec) => {
    // the joinedKey has the format text@@@key@@@labelKey@@@originalKey@@@originalLabelKey
    const value = spec.joinedKey.split('@@@')[3]
    specsByKey[value] = (specsByKey[value] || []).concat(spec)

    return specsByKey
  }, {})

  const specKeys = Object.keys(specificationsByKey)

  const skuSpecifications = specKeys.map((key) => {
    const originalFieldName = specificationsByKey[key][0].joinedKey.split('@@@')[4]

    return {
      field: {
        name: specificationsByKey[key][0].labelKey,
        originalName: originalFieldName,
      },
      values: specificationsByKey[key].map((specification) => {
        return {
          name: specification.labelValue,
          originalName: specification.joinedValue.split('@@@')[1],
        }
      })
    }
  })

  const numberAttributes = product.numberAttributes ?? []

  const numberSpecificationsByKey = numberAttributes.reduce((specsByKey: {[key: string]: BiggyTextAttribute[]}, spec) => {
    const value = spec.labelKey
    specsByKey[value] = (specsByKey[value] || []).concat(spec)

    return specsByKey
  }, {})

  const numberSpecKeys = Object.keys(numberSpecificationsByKey)

  const skuNumberSpecifications = numberSpecKeys.map((key) => {
    const originalFieldName = numberSpecificationsByKey[key][0].labelKey

    const values = numberSpecificationsByKey[key].map((specification) => {
      return {
        name: specification.value.toString(),
        originalName: specification.value.toString(),
      }
    })

    values.sort((x, y) => Number(x.name) - Number(y.name))

    return {
      field: {
        name: originalFieldName.toString(),
        originalName: originalFieldName.toString(),
      },
      values
    }
  }).filter(specification => allSpecifications.includes(specification.field.name))

  const allSkuSpecification = skuSpecifications.concat(skuNumberSpecifications)

  const convertedProduct: SearchProduct & { cacheId?: string, [key: string]: any } = {
    categories,
    categoriesIds,
    productId: product.id,
    cacheId: `sp-${product.id}`,
    productName: product.name,
    productReference: product.reference,
    linkText: product.link,
    brand: product.brand || '',
    brandId,
    link: product.url,
    description: product.description,
    items: skus,
    allSpecifications,
    categoryId: product.categoryIds?.slice(-1)[0],
    productTitle: "",
    metaTagDescription: "",
    clusterHighlights: product.clusterHighlights,
    productClusters: {},
    searchableClusters: {},
    titleTag: "",
    Specifications: [],
    allSpecificationsGroups,
    itemMetadata: {
      items: []
    },
    selectedProperties,
    skuSpecifications: allSkuSpecification,
    // This field is only maintained for backwards compatibility reasons, it shouldn't exist.
    skus: skus.find(sku => sku.sellers && sku.sellers.length > 0),
  }

  if (simulationBehavior === 'default') {
    const payloadItems = getSimulationPayloads(convertedProduct)

    const simulationPayloads: SimulationPayload[] = payloadItems.map((item) => {
      return {
        priceTables: segment?.priceTables ? [segment?.priceTables] : undefined,
        items: [item],
        shippingData: { logisticsInfo: [{ regionId }] },
        marketingData: getMarketingData(segment)
      }
    })

    const simulationPromises = simulationPayloads.map((payload) => {
      return checkout.simulation(payload, tradePolicy)
    })

    const simulationItems = (await Promise.all(simulationPromises.map(promise => promise.catch(() => undefined)))).filter((x) => x != undefined).map((x) => {
     const orderForm = x as OrderForm

     return orderForm.items.map(item => ({ ...item, paymentData: orderForm.paymentData, ratesAndBenefitsData: orderForm.ratesAndBenefitsData }))
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
      if(!convertedProduct[specification]){
        const attributes = product.textAttributes.filter((attribute) => attribute.labelKey == specification)

        convertedProduct[specification] = attributes.map((attribute) => {
          return attribute.labelValue
        })
      }
    })

    product.textAttributes.filter((attribute) => attribute.labelKey === "productClusterNames").forEach((attribute) => {
      if (attribute.valueId) {
        convertedProduct.productClusters[attribute.valueId] = attribute.labelValue
      }
    })
  }

  allSpecificationsGroups.forEach((specificationGroup) => {
    convertedProduct[specificationGroup] = convertedProduct[specificationGroup] ?? specificationGroups[specificationGroup]
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
      const unitMultiplier = orderFormItem.unitMultiplier ? orderFormItem.unitMultiplier : 1
      const { listPrice, price, priceValidUntil, sellingPrice } = orderFormItem

      seller.commertialOffer.AvailableQuantity = orderFormItem?.availability === 'available' ? 10000 : 0
      seller.commertialOffer.Price = sellingPrice
        ? Number((sellingPrice / (unitMultiplier * 100)).toFixed(2))
        : price / 100
      seller.commertialOffer.PriceValidUntil = priceValidUntil
      seller.commertialOffer.ListPrice = listPrice / 100
      seller.commertialOffer.PriceWithoutDiscount = price / 100
      seller.commertialOffer.Teasers = getTeasers(orderFormItem.ratesAndBenefitsData)
      seller.commertialOffer.DiscountHighLight = getDiscountHighLights(orderFormItem.ratesAndBenefitsData)


      const installmentOptions = orderFormItem?.paymentData?.installmentOptions || []

      const [installmentOption] = installmentOptions

      if (!installmentOption) {
        return
      }

      const { installments } = installmentOption

      if (!installments || installments.length === 0) {
        return
      }

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

const buildCommertialOffer = (
  price: number,
  oldPrice: number,
  stock: number,
  teasers: object[],
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

  const availableQuantity = stock && stock > 0 ? 10000 : 0

  return {
    DeliverySlaSamplesPerRegion: {},
    DeliverySlaSamples: [],
    AvailableQuantity: availableQuantity,
    DiscountHighLight: [],
    Teasers: teasers,
    Installments: installments,
    Price: price,
    ListPrice: oldPrice,
    PriceWithoutDiscount: oldPrice,
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

const getMarketingData = (segment?: SegmentData) => {
  if (!segment || !segment.utm_campaign || !segment.utm_source) {
    return
  }

  return {
    utmCampaign: segment.utm_campaign,
    utmSource: segment.utm_source,
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

    const stock = seller.stock || sku.stock || product.stock
    const teasers = seller.teasers ?? [];

    const commertialOffer = buildCommertialOffer(price, oldPrice, stock, teasers, installment, seller.tax)

    return {
      sellerId: seller.id,
      sellerName: seller.name,
      addToCartLink: "",
      sellerDefault: seller.default ?? false,
      commertialOffer,
    }
  })
}

const getSellersIndexedByXML = (product: BiggySearchProduct): Seller[] => {
  const price = product.price
  const oldPrice = product.oldPrice
  const installment = product.installment

  const stock = product.stock

  const commertialOffer = buildCommertialOffer(price, oldPrice, stock, [], installment, product.tax)

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
  const images = convertImages(sku.images ?? product.images, indexingType)

  const sellers =
    indexingType === IndexingType.XML
      ? getSellersIndexedByXML(product)
      : getSellersIndexedByApi(product, sku, tradePolicy)

  const variations = getVariations(sku)

  const item: SearchItem & { [key: string]: any } = {
    sellers,
    images,
    itemId: sku.id,
    name: sku.name,
    nameComplete: sku.nameComplete,
    complementName: sku.complementName ?? '',
    referenceId: [
      {
        Key: 'RefId',
        Value: sku.reference,
      },
    ],
    measurementUnit: sku.measurementUnit || product.measurementUnit,
    unitMultiplier: sku.unitMultiplier || product.unitMultiplier,
    variations,
    ean: sku.ean ?? '',
    modalType: '',
    Videos: sku.videos ?? [],
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
export const convertOrderBy = (orderBy?: string | null): string => {
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
          attributeKey: attribute.originalKey,
        })
      }
    })
  })

  const selectedFacetsValues = selectedFacets.map(
    selectedFacet => selectedFacet.value
  )
  activeValues.sort((a, b) =>
    selectedFacetsValues.indexOf(a.originalKey ?? a.key) < selectedFacetsValues.indexOf(b.originalKey ?? b.key)
      ? -1
      : 1
  )

  const hiddenActiveValues = ["trade-policy", "private-seller", "activeprivatesellers"]
  activeValues.filter(x => !hiddenActiveValues.includes(x.attributeKey.toLowerCase())).forEach(value => {
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

    breadcrumb.push({
      name: unescape(value.label),
      href: `/${pivotValue.join('/')}?map=${pivotMap.join(',')}`,
    })
  })

  return breadcrumb
}

const encodeSafeURI = (uri: string) => encodeURI(decodeURI(uri))

export const buildAttributePath = (selectedFacets: SelectedFacet[]) => {
  return selectedFacets
    ? selectedFacets.reduce((attributePath, facet) => {
      if (facet.key === 'priceRange') {
        facet.key = 'price'
        facet.value = facet.value.replace(` TO `, ':')
      }

      return facet.key !== 'ft'
        ? `${attributePath}${encodeSafeURI(facet.key)}/${removeDiacriticsFromURL(encodeSafeURI(facet.value)).replace(/ |%20/, '-')}/`
        : attributePath
    }, '')
    : ''
}

const getTeasers = (ratesAndBenefitsData: RatesAndBenefitsData) => {
  if (!ratesAndBenefitsData) {
    return []
  }

  return ratesAndBenefitsData.teaser
    .filter(teaser => ALLOWED_TEASER_TYPES.includes(teaser.teaserType))
}


const getDiscountHighLights = (ratesAndBenefitsData: RatesAndBenefitsData) => {
  if (!ratesAndBenefitsData) {
    return []
  }

  return ratesAndBenefitsData.rateAndBenefitsIdentifiers
    .filter(rateAndBenefitsIdentifier => rateAndBenefitsIdentifier.featured)
}
