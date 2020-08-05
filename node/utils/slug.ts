import slugify from 'slugify'
import { toLower } from 'ramda'

export function Slugify(str: any) {
  return slugify(str, { lower: true, remove: /[*+~.()'"!:@]/g })
}

const from =
  'ÁÄÂÀÃÅČÇĆĎÉĚËÈÊẼĔȆÍÌÎÏŇÑÓÖÒÔÕØŘŔŠŤÚŮÜÙÛÝŸŽáäâàãåčçćďéěëèêẽĕȇíìîïňñóöòôõøðřŕšťúůüùûýÿžþÞĐđßÆa·/_,:;'
const to =
  'AAAAAACCCDEEEEEEEEIIIINNOOOOOORRSTUUUUUYYZaaaaaacccdeeeeeeeeiiiinnooooooorrstuuuuuyyzbBDdBAa------'
const removeAccents = (str: string) => {
  let newStr = str.slice(0)
  for (let i = 0; i < from.length; i++) {
    newStr = newStr.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i))
  }
  return newStr
}

// Parameter "S. Coifman" should output "s--coifman"
export function searchSlugify(str: string) {
  // According to Bacelar, the search API uses a legacy method for slugifying strings.
  // replaces special characters with dashes, remove accents and lower cases everything
  // eslint-disable-next-line no-useless-escape
  const noCommas = str.replace(/,/g, '')
  const replaced = noCommas.replace(/[*+~.()'"!:@&\[\]`/ %$#?{}|><=_^]/g, '-')
  return toLower(removeAccents(replaced))
}
