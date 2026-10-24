// Checks on a new run before it's sent (spec FR-13, FR-14, FR-17). The API checks the same things and has the
// final say; these only spare the player a round trip.
import type { FieldErrors } from '../forms/fieldErrors.ts'
import { isGameId } from '../games/games.ts'

export const maximumRunNameLength = 60

export type NewRunField = 'name' | 'gameId'

export function validateNewRun({ name, gameId }: { name: string; gameId: string | null }): FieldErrors<NewRunField> {
  const errors: FieldErrors<NewRunField> = {}
  const trimmed = name.trim()
  if (!trimmed) errors.name = 'Give your run a name.'
  else if (trimmed.length > maximumRunNameLength) {
    errors.name = `Keep the name to ${maximumRunNameLength} characters or fewer.`
  }
  if (!isGameId(gameId)) errors.gameId = 'Choose a game.'
  return errors
}
