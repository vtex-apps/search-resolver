export default function getFirstNonNullable<T>(arr: T[]): T | undefined {
  return arr.find(el => el !== null && typeof el !== 'undefined')
}
