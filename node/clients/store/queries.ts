export const itemsWithSimulation = `
query itemsWithSimulation($items: [ItemInput], $regionId: String) {
  itemsWithSimulation(items: $items, regionId: $regionId) {
    itemId
    sellers {
      commertialOffer {
        AvailableQuantity
        Price
        ListPrice
        PriceValidUntil
        PriceWithoutDiscount
        discountHighlights {
          name
        }
        teasers {
          name
        }
        Installments {
        	Value
          InterestRate
          TotalValuePlusInterestRate
          NumberOfInstallments
          Name
          PaymentSystemName
      	}
      }
    }
  }
}
`
