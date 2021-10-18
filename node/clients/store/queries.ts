export const itemsWithSimulation = `
query itemsWithSimulation($items: [ItemInput], $regionId: String, $salesChannel: String) {
  itemsWithSimulation(items: $items, regionId: $regionId, salesChannel: $salesChannel) {
    itemId
    sellers {
      sellerId
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
