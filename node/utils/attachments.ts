import { all, propEq } from 'ramda'

export const CHOICE_TYPES = {
  MULTIPLE: 'MULTIPLE',
  SINGLE: 'SINGLE',
  TOGGLE: 'TOGGLE',
}

const isParentOptionSingleChoice = ({ composition }: AssemblyOption) => {
  if (!composition) {
    return false
  }

  const { minQuantity, maxQuantity } = composition

  return minQuantity === 1 && maxQuantity === 1
}

const isParentOptionToggleChoice = ({ composition }: AssemblyOption) => {
  if (!composition) {
    return false
  }

  const { items } = composition

  return all(propEq('maxQuantity', 1))(items)
}

export const getItemChoiceType = (childAssemblyData?: AssemblyOption) => {
  if (!childAssemblyData) {
    return CHOICE_TYPES.MULTIPLE
  }

  const isSingle = isParentOptionSingleChoice(childAssemblyData!)

  if (isSingle) {
    return CHOICE_TYPES.SINGLE
  }

  const isToggle = isParentOptionToggleChoice(childAssemblyData)

  if (isToggle) {
    return CHOICE_TYPES.TOGGLE
  }

  return CHOICE_TYPES.MULTIPLE
}
