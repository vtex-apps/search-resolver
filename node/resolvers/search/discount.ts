import { has, prop } from 'ramda'

export const resolvers = {
  Discount: {
    name: (discount: any) =>
      has('name', discount)
        ? prop('name', discount)
        : prop('<Name>k__BackingField', discount),
  },
  Teaser: {
    name: (teaser: any) =>
      has('name', teaser)
        ? prop('name', teaser)
        : prop('<Name>k__BackingField', teaser),

    conditions: (teaser: any) =>
      has('conditions', teaser)
        ? prop('conditions', teaser)
        : prop('<Conditions>k__BackingField', teaser),

    effects: (teaser: any) =>
      has('effects', teaser)
        ? prop('effects', teaser)
        : prop('<Effects>k__BackingField', teaser),
  },
  TeaserCondition: {
    minimumQuantity: (teaserCondition: any) =>
      has('minimumQuantity', teaserCondition)
        ? prop('minimumQuantity', teaserCondition)
        : prop('<MinimumQuantity>k__BackingField', teaserCondition),

    parameters: (teaserCondition: any) =>
      has('parameters', teaserCondition)
        ? prop('parameters', teaserCondition)
        : prop('<Parameters>k__BackingField', teaserCondition),
  },
  TeaserEffects: {
    parameters: (teaserEffects: any) =>
      has('parameters', teaserEffects)
        ? prop('parameters', teaserEffects)
        : prop('<Parameters>k__BackingField', teaserEffects),
  },
  TeaserValue: {
    name: (teaserValue: any) =>
      has('name', teaserValue)
        ? prop('name', teaserValue)
        : prop('<Name>k__BackingField', teaserValue),

    value: (teaserValue: any) =>
      has('value', teaserValue)
        ? prop('value', teaserValue)
        : prop('<Value>k__BackingField', teaserValue),
  },
}
