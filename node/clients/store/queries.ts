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
