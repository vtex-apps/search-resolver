import { IOClients } from '@vtex/api'

import { Search } from './search'
import { Checkout } from './checkout'
import { Rewriter } from './rewriter'
import { Catalog } from './catalog'

export class Clients extends IOClients {
  public get search() {
    return this.getOrSet('search', Search)
  }
  public get checkout() {
    return this.getOrSet('checkout', Checkout)
  }
  public get rewriter() {
    return this.getOrSet('rewriter', Rewriter)
  }
  public get catalog() {
    return this.getOrSet('catalog', Catalog)
  }
}
