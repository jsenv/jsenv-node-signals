export const firstOperationMatching = ({ array, start, predicate }) => {
  if (typeof array !== "object") throw new TypeError(createArrayErrorMessage({ array }))
  if (typeof start !== "function") throw new TypeError(createStartErrorMessage({ start }))
  if (typeof predicate !== "function")
    throw new TypeError(createPredicateErrorMessage({ predicate }))

  return new Promise((resolve, reject) => {
    const visit = (index) => {
      if (index >= array.length) {
        return resolve()
      }
      const input = array[index]
      const returnValue = start(input)
      return Promise.resolve(returnValue).then((output) => {
        if (predicate(output)) {
          return resolve(output)
        }
        return visit(index + 1)
      }, reject)
    }

    visit(0)
  })
}

const createArrayErrorMessage = ({ array }) => `array must be an object.
array: ${array}`

const createStartErrorMessage = ({ start }) => `start must be a function.
start: ${start}`

const createPredicateErrorMessage = ({ predicate }) => `predicate must be a function.
predicate: ${predicate}`
