interface Installment {
  Value: number
  InterestRate: number
  TotalValuePlusInterestRate: number
  NumberOfInstallments: number
  Name: string
}

interface CommertialOffer {
  AvailableQuantity: number
  discountHighlights: any[]
  teasers: any[]
  Installments: Installment[]
  Price: number
  ListPrice: number
  PriceWithoutDiscount: number
}

class VtexSeller {
  public sellerId: string
  public sellerName: string
  public commertialOffer: CommertialOffer

  public constructor(
    sellerId: string,
    price: number,
    oldPrice: number,
    installment: { value: number; count: number }
  ) {
    this.sellerId = sellerId
    this.sellerName = ''

    this.commertialOffer = {
      AvailableQuantity: 10000,
      discountHighlights: [],
      teasers: [],
      Installments: [],
      Price: price,
      ListPrice: oldPrice,
      PriceWithoutDiscount: price,
    }

    if (installment) {
      this.commertialOffer.Installments.push({
        Value: installment.value,
        InterestRate: 0,
        TotalValuePlusInterestRate: price,
        NumberOfInstallments: installment.count,
        Name: '',
      })
    }
  }
}

export default VtexSeller
