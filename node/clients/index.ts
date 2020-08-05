import { IOClients } from '@vtex/api'

import { Search } from './search'
import { Checkout } from './checkout'
import { BiggySearchClient } from './biggy-search'

export class Clients extends IOClients {
  public get search() {
    return this.getOrSet('search', Search)
  }
  public get checkout() {
    return this.getOrSet('checkout', Checkout)
  }
  public get biggySearch() {
    return this.getOrSet('biggySearch', BiggySearchClient)
  }
}
