export const itemsWithSimulation = `
query itemsWithSimulation($items: [ItemInput], $regionId: String) {
  itemsWithSimulation(items: $items, regionId: $regionId) {
    itemId
    sellers {
      commertialOffer {
        AvailableQuantity
        Price
        ListPrice
        spotPrice
        PriceValidUntil
        PriceWithoutDiscount
        discountHighlights {
          name
        }
        teasers {
          name
          conditions {
            minimumQuantity
            parameters {
              name
              value
            }
          }
          effects {
            parameters {
              name
              value
            }
          }
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
