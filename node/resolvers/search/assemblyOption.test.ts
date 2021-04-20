import { resolvers } from './assemblyOption'

test('should return a TEXT type', async () => {
  const inputValues: InputValues = {
    'Line 1': {
      maximumNumberOfCharacters: 20,
      domain: []
    }
  }

  const result = await resolvers.AssemblyOption.inputValues(
    { inputValues } as AssemblyOption
  )

  expect(result).toHaveLength(1)
  expect(result[0].label).toBe('Line 1')
  expect(result[0].type).toBe('TEXT')
  expect(result[0].maxLength).toBe(20)
  expect(result[0].domain).not.toBeDefined()
  expect(result[0].defaultValue).toBe('')
})

test('should return an OPTIONS type', async () => {
  const inputValues: InputValues = {
    'Line 1': {
      maximumNumberOfCharacters: 10,
      domain: ['One option']
    },
    'Line 2': {
      maximumNumberOfCharacters: 7,
      domain: ['Two', 'Options']
    },
  }

  const result = await resolvers.AssemblyOption.inputValues(
    { inputValues } as AssemblyOption
  )

  expect(result).toHaveLength(2)

  const [line1, line2] = result

  expect(line1.label).toBe('Line 1')
  expect(line1.type).toBe('OPTIONS')
  expect(line1.maxLength).toBeUndefined()
  expect(line1.domain).toHaveLength(1)
  expect(line1.domain![0]).toBe('One option')
  expect(line1.defaultValue).toBe('One option')

  expect(line2.label).toBe('Line 2')
  expect(line2.type).toBe('OPTIONS')
  expect(line2.maxLength).toBeUndefined()
  expect(line2.domain).toHaveLength(2)
  expect(line2.defaultValue).toBe('Two')
})

test('should return a BOOLEAN type', async () => {
  const inputValues: InputValues = {
    'Use thing A': {
      maximumNumberOfCharacters: 5,
      domain: ['true', 'false']
    },
    'Use thing B': {
      maximumNumberOfCharacters: 5,
      domain: ['false', 'true']
    },
  }

  const result = await resolvers.AssemblyOption.inputValues(
    { inputValues } as AssemblyOption
  )

  expect(result).toHaveLength(2)

  const [thingA, thingB] = result

  expect(thingA.label).toBe('Use thing A')
  expect(thingA.type).toBe('BOOLEAN')
  expect(thingA.maxLength).toBeUndefined()
  expect(thingA.domain).not.toBeDefined()
  expect(thingA.defaultValue).toBe(true)

  expect(thingB.label).toBe('Use thing B')
  expect(thingB.type).toBe('BOOLEAN')
  expect(thingB.maxLength).toBeUndefined()
  expect(thingB.domain).not.toBeDefined()
  expect(thingB.defaultValue).toBe(false)
})
