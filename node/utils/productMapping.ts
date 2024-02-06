function stringToArray(inputString: string) {
  const parts = inputString.replace(/^\/|\/$/g, '').split('/')

  const resultArray = parts.filter((part: string) => part.trim() !== '')

  return resultArray
}

export const productSuggestions = (hits: any[]): any[] => {
  return hits
    ?.filter(item => item.producId !== null)
    .map((item: any) => {
      const categoryTree = item?.categories
        ? stringToArray(item?.categories[0])?.map((key: any) => ({
            name: key,
          }))
        : []

      return {
        brand: item.brand,
        brandId: item.brandId,
        categoryTree,
        categoryId: item.categoryId,
        link: item.link,
        linkText: item.linkText,
        productId: item.productId,
        productName: item.productName,
        properties: item.properties,
        items: item.items,
      }
    })
}
