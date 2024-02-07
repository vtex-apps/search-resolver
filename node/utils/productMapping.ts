// The original code snippet is a TypeScript function called `productSuggestions` that takes an array of objects as input and returns a modified array of objects.
// The function filters out objects with a null `productId` and transforms the `categories` property of each object into an array of objects with a `name` property.

// The code snippet also includes a helper function called `stringToArray` that converts a string representing a category path into an array of category names.

function stringToArray(inputString: string): string[] {
  // The `stringToArray` function takes a string as input and converts it into an array of category names.
  // It removes leading and trailing slashes from the input string using the `replace` method and a regular expression.
  // It then splits the string into an array of parts using the `split` method and the slash character as the delimiter.
  // The resulting array is filtered to remove any empty or whitespace-only parts using the `filter` method and a callback function.
  // Finally, the resulting array of category names is returned.
  const resultArray = inputString
    .replace(/^\/|\/$/g, '')
    .split('/')
    .filter((part: string) => part.trim() !== '')
  return resultArray
}

export const productSuggestions = (hits: any[]): any[] => {
  // The `productSuggestions` function takes an array of objects representing product hits as input.
  // It uses the optional chaining operator (`?.`) to filter out objects with a null `productId`.
  // The `filter` method is used to create a new array containing only the objects that pass the filter condition.
  // The filter condition checks if the `productId` property of each object is not null.
  // The resulting array is then mapped to a new array of objects using the `map` method and a callback function.
  // The callback function takes each object as input and transforms it into a new object with the desired properties.
  // If the object has a truthy `categories` property, the `stringToArray` function is called to convert the first category string into an array of objects with a `name` property.
  // The resulting array of category objects is assigned to the `categoryTree` property of the new object.
  // The new object includes other properties from the original object, such as `brand`, `brandId`, `categoryId`, `link`, `linkText`, `productId`, `productName`, `properties`, and `items`.
  // The modified objects are collected into a new array, which is returned as the output of the `productSuggestions` function.
  return hits
    ?.filter(item => item.productId !== null)
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
