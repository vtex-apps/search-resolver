export const itemsWithSimulation = `
query itemsWithSimulation($items: [ItemInput]) {
  itemsWithSimulation(items: $items) {
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
