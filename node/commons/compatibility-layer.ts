import { distinct } from '../utils/object'
import unescape from 'unescape'

export enum IndexingType {
  API = 'API',
  XML = 'XML',
}

export const convertBiggyProduct = (
  product: BiggySearchProduct,
  tradePolicy?: string,
  indexingType?: IndexingType
) => {
  const categories: string[] = product.categories
    ? product.categories.map((_: any, index: number) => {
        const subArray = product.categories.slice(0, index)
        return `/${subArray.join('/')}/`
      })
    : []


  const categoriesIds: string[] = product.categoryIds
  ? product.categoryIds.map((_: any, index: number) => {
      const subArray = product.categoryIds.slice(0, index + 1)
      return `/${subArray.join('/')}/`
    }).reverse()
  : []

  const skus: SearchItem[] = (product.skus || []).map(
    convertSKU(product, indexingType, tradePolicy)
  )

  const allSpecifications = product.productSpecifications.concat(getSKUSpecifications(product))

  const specificationGroups = product.specificationGroups ? JSON.parse(product.specificationGroups) : {}

  const allSpecificationsGroups = [ ...Object.keys(specificationGroups) ]

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
    // This field is only maintaned for backwards compatibility reasons, it shouldnt exist.
    skus: skus.find(sku => sku.sellers && sku.sellers.length > 0),
  }

  if (product.extraData) {
    product.extraData.forEach(({ key, value }: BiggyProductExtraData) => {
      convertedProduct.allSpecifications?.push(key)
      convertedProduct[key] = [value]
    })
  }

  allSpecifications.forEach((specification) => {
    const attributes = product.textAttributes.filter((attribute) => attribute.labelKey == specification)
    convertedProduct[specification] = attributes.map((attribute) => {
      attribute.labelValue
    })
  })

  allSpecificationsGroups.forEach((specificationGroup) => {
    convertedProduct[specificationGroup] = specificationGroups[specificationGroup]
  })

  return convertedProduct
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
          ? `${attributePath}${facet.key}/${facet.value.replace(/ |%20/, '-')}/`
          : attributePath
      }, '')
    : ''
}
