import type { ProgramDocument } from '../types'
import { buildIncrementalProgramSteps } from '../lib/program/buildProgramSteps'
import {
  buildAbsoluteValue,
  buildAddFunction,
  buildAverageTwo,
  buildBubbleSort,
  buildBubbleSortWithThreeFunctions,
  buildCountdown,
  buildEvenOdd,
  buildFactorial,
  buildFibonacci,
  buildGcd,
  buildIsPrime,
  buildLinearSearch,
  buildMax,
  buildMinTwo,
  buildPower,
  buildSumToN,
} from '../lib/algorithms/builders'

export interface AlgorithmDefinition {
  id: string
  name: string
  description: string
  build: () => ProgramDocument
  getSteps: () => ProgramDocument[]
}

export const algorithmCatalog: AlgorithmDefinition[] = [
  {
    id: 'sum-to-n',
    name: 'Sum 1 to N',
    description: 'Adds integers from 1 through N using a for loop',
    build: () => buildSumToN(10),
    getSteps: () => buildIncrementalProgramSteps(buildSumToN(10)),
  },
  {
    id: 'factorial',
    name: 'Factorial',
    description: 'Computes N! iteratively',
    build: () => buildFactorial(5),
    getSteps: () => buildIncrementalProgramSteps(buildFactorial(5)),
  },
  {
    id: 'fibonacci',
    name: 'Fibonacci',
    description: 'Builds the Nth Fibonacci number iteratively',
    build: () => buildFibonacci(9),
    getSteps: () => buildIncrementalProgramSteps(buildFibonacci(9)),
  },
  {
    id: 'gcd',
    name: 'GCD (Euclidean)',
    description: 'Greatest common divisor using the Euclidean algorithm',
    build: () => buildGcd(48, 18),
    getSteps: () => buildIncrementalProgramSteps(buildGcd(48, 18)),
  },
  {
    id: 'bubble-sort',
    name: 'Bubble Sort',
    description: 'Sorts four numbers with adjacent swaps',
    build: () => buildBubbleSort([5, 1, 4, 2]),
    getSteps: () => buildIncrementalProgramSteps(buildBubbleSort([5, 1, 4, 2])),
  },
  {
    id: 'bubble-sort-fns',
    name: 'Bubble Sort (3 Functions)',
    description: 'Bubble sort using isGreater, maxOf, and minOf helpers',
    build: () => buildBubbleSortWithThreeFunctions([5, 1, 4, 2]),
    getSteps: () => buildIncrementalProgramSteps(buildBubbleSortWithThreeFunctions([5, 1, 4, 2])),
  },
  {
    id: 'is-prime',
    name: 'Prime Check',
    description: 'Tests whether a number is prime',
    build: () => buildIsPrime(17),
    getSteps: () => buildIncrementalProgramSteps(buildIsPrime(17)),
  },
  {
    id: 'max-two',
    name: 'Maximum of Two',
    description: 'Finds the larger of two numbers with if/else',
    build: () => buildMax(3, 7),
    getSteps: () => buildIncrementalProgramSteps(buildMax(3, 7)),
  },
  {
    id: 'min-two',
    name: 'Minimum of Two',
    description: 'Finds the smaller of two numbers with if/else',
    build: () => buildMinTwo(3, 7),
    getSteps: () => buildIncrementalProgramSteps(buildMinTwo(3, 7)),
  },
  {
    id: 'linear-search',
    name: 'Linear Search',
    description: 'Searches fixed slots for a target value',
    build: () => buildLinearSearch(),
    getSteps: () => buildIncrementalProgramSteps(buildLinearSearch()),
  },
  {
    id: 'add-function',
    name: 'Function Add',
    description: 'Calls a helper function that returns a + b',
    build: () => buildAddFunction(),
    getSteps: () => buildIncrementalProgramSteps(buildAddFunction()),
  },
  {
    id: 'power',
    name: 'Exponentiation',
    description: 'Raises a base to an exponent with repeated multiplication',
    build: () => buildPower(2, 8),
    getSteps: () => buildIncrementalProgramSteps(buildPower(2, 8)),
  },
  {
    id: 'absolute-value',
    name: 'Absolute Value',
    description: 'Returns the absolute value of a number',
    build: () => buildAbsoluteValue(-42),
    getSteps: () => buildIncrementalProgramSteps(buildAbsoluteValue(-42)),
  },
  {
    id: 'countdown',
    name: 'Countdown Print',
    description: 'Prints a countdown from N to 1',
    build: () => buildCountdown(5),
    getSteps: () => buildIncrementalProgramSteps(buildCountdown(5)),
  },
  {
    id: 'average-two',
    name: 'Average of Two',
    description: 'Computes the average of two numbers',
    build: () => buildAverageTwo(10, 20),
    getSteps: () => buildIncrementalProgramSteps(buildAverageTwo(10, 20)),
  },
  {
    id: 'even-odd',
    name: 'Even or Odd',
    description: 'Determines if a number is even',
    build: () => buildEvenOdd(14),
    getSteps: () => buildIncrementalProgramSteps(buildEvenOdd(14)),
  },
]

export const defaultAlgorithmId = algorithmCatalog[0].id

export function getAlgorithmById(id: string): AlgorithmDefinition | undefined {
  return algorithmCatalog.find((entry) => entry.id === id)
}
