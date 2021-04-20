export const resolvers = {
  AssemblyOption: {
    inputValues: (
      { inputValues }: AssemblyOption,
    ): InputValue[] => {
      return Object.keys(inputValues).reduce<InputValue[]>((acc, label) => {
        const inputValue = inputValues[label]
        const type = defineInputValueType(inputValue)

        const maxLength = type === InputValueType.TEXT
          ? inputValue.maximumNumberOfCharacters : undefined

        const domain = type === InputValueType.OPTIONS
          ? inputValue.domain
          : undefined

        const defaultValue = type === InputValueType.OPTIONS
          ? inputValue.domain[0]
          : type === InputValueType.BOOLEAN
            ? stringToBoolean(inputValue.domain[0])
            : ''

        acc.push({
          label,
          type,
          maxLength,
          defaultValue,
          domain,
        })

        return acc
      }, [])
    }
  },
}

function defineInputValueType(inputValue: RawInputValue): InputValueType {
  const {domain} = inputValue

  // If domain is something like ['true', 'false'] or ['false', 'true']
  if (
    domain && domain.length === 2 &&
    domain.indexOf('true') !== -1 && domain.indexOf('false') !== -1
  ) {
    return InputValueType.BOOLEAN
  }

  // If domain is something like ['Sans serif', 'Roman']
  if (domain && domain.length > 0) {
    return InputValueType.OPTIONS
  }

  return InputValueType.TEXT
}

function stringToBoolean(value: string) {
  return value === 'true'
}


interface InputValue {
  label: string
  maxLength?: number
  type: InputValueType
  defaultValue: string|boolean
  domain?: string[]
}

enum InputValueType {
  TEXT = 'TEXT',
  BOOLEAN = 'BOOLEAN',
  OPTIONS = 'OPTIONS',
}