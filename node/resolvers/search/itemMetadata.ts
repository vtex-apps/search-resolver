import type { Segment } from '@vtex/api'
import camelCase from 'camelcase'
import { both, pickBy } from 'ramda'

import { renameKeysWith } from '../../utils'

const isTruthy = (val?: string) => !!val
const isUtm = (_: any, key: string | number) => String(key).startsWith('utm')
const isValidUtm = both(isUtm, isTruthy)

interface Parent {
  items: SearchMetadataItem[]
}

interface SimulationPayload {
  countryCode: string
  marketingData: Record<string, string>
}

const getSimulationPayload = async (
  segment: Segment
): Promise<SimulationPayload> => {
  const segmentData = await segment.getSegment()

  let marketingData: Record<string, string> = {}

  try {
    marketingData = renameKeysWith(
      camelCase,
      pickBy(isValidUtm, segmentData)
    ) as Record<string, string>
  } catch (e) {
    // TODO: Log to Splunk
    console.error(e)
  }

  return {
    countryCode: segmentData.countryCode,
    marketingData,
  }
}

type PriceTableMap = Record<
  string,
  Array<{
    compositionItem: CompositionItem
    simulationPayload: SimulationPayload
    items: SearchMetadataItem[]
    parent: SearchMetadataItem
    assemblyOption: AssemblyOption
  }>
>

export const resolvers = {
  ItemMetadata: {
    priceTable: async (
      { items }: Parent,
      _: any,
      { clients: { segment } }: Context
    ) => {
      const simulationPayload = await getSimulationPayload(segment)

      const itemsWithAssembly = items.filter(
        item => item.assemblyOptions.length > 0
      )

      const priceTableMap: PriceTableMap = itemsWithAssembly.reduce<PriceTableMap>((acc, item) => {
        for (const assemblyOption of item.assemblyOptions) {
          if (!assemblyOption.composition || !assemblyOption.composition.items) {
            continue
          }

          for (const compItem of assemblyOption.composition.items) {
            const currentArray = acc[compItem.priceTable] || []

            currentArray.push({
              compositionItem: compItem,
              simulationPayload,
              items: itemsWithAssembly,
              parent: item,
              assemblyOption,
            })
            acc[compItem.priceTable] = currentArray
          }
        }

        return acc
      }, {})

      return Object.entries(priceTableMap).map(
        ([priceTableName, priceTableValues]) => ({
          type: priceTableName,
          values: priceTableValues,
        })
      )
    },
  },
}
